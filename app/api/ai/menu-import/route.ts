import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import { GeminiError, geminiGenerate } from "@/lib/llm/gemini"
import {
	MENU_IMPORT_SYSTEM,
	menuDraftJsonSchema,
	menuDraftSchema,
} from "@/lib/ai/menu-import"

// Reading a full menu can take a while on the free tier.
export const maxDuration = 60

const MAX_FILES = 3
// Vercel caps request bodies at 4.5 MB; the browser downsizes photos first.
const MAX_TOTAL_BYTES = 4 * 1024 * 1024
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"])
const DAILY_LIMIT = 5

/**
 * POST multipart/form-data with 1-3 `files` (menu photos or a PDF).
 * Returns an unsaved draft for the owner to review. Nothing is stored: the
 * files are forwarded to Gemini and dropped when the request ends.
 */
export async function POST(request: Request) {
	const user = await getSessionUser()
	if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

	const form = await request.formData().catch(() => null)
	const files = (form?.getAll("files") ?? []).filter(
		(f): f is File => f instanceof File && f.size > 0,
	)
	if (files.length === 0 || files.length > MAX_FILES)
		return NextResponse.json({ error: "FILE_COUNT" }, { status: 422 })
	if (files.some((f) => !ALLOWED.has(f.type)))
		return NextResponse.json({ error: "FILE_TYPE" }, { status: 422 })
	if (files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_BYTES)
		return NextResponse.json({ error: "FILE_SIZE" }, { status: 413 })

	// Counted per user per day, before the model call, so failed attempts
	// still count - the free quota is spent either way.
	const limit = await rateLimit(`ai-import:${user.id}`, DAILY_LIMIT, 86_400_000)
	if (!limit.allowed)
		return NextResponse.json({ error: "DAILY_LIMIT" }, { status: 429 })

	const fileParts = await Promise.all(
		files.map(async (f) => ({
			inlineData: {
				mimeType: f.type,
				data: Buffer.from(await f.arrayBuffer()).toString("base64"),
			},
		})),
	)

	try {
		const { text, model } = await geminiGenerate({
			system: MENU_IMPORT_SYSTEM,
			parts: [...fileParts, "Đọc toàn bộ menu trong các ảnh/tệp trên."],
			jsonSchema: menuDraftJsonSchema,
			maxOutputTokens: 16_000,
			timeoutMs: 55_000,
		})

		let raw: unknown
		try {
			raw = normalizePrices(JSON.parse(text))
		} catch {
			return NextResponse.json({ error: "BAD_OUTPUT" }, { status: 502 })
		}
		const parsed = menuDraftSchema.safeParse(raw)
		if (!parsed.success) {
			console.warn("[menu-import] invalid draft", parsed.error.issues.slice(0, 3))
			return NextResponse.json({ error: "BAD_OUTPUT" }, { status: 502 })
		}
		const categories = parsed.data.categories.filter((c) => c.items.length > 0)
		return NextResponse.json({
			draft: { categories },
			model,
			remaining: limit.remaining,
		})
	} catch (err) {
		if (err instanceof GeminiError) {
			const status = err.code === "DISABLED" ? 503 : err.code === "QUOTA" ? 429 : 502
			const error =
				err.code === "DISABLED" ? "AI_DISABLED" : err.code === "QUOTA" ? "AI_QUOTA" : "AI_UNAVAILABLE"
			return NextResponse.json({ error }, { status })
		}
		console.error("[menu-import]", err)
		return NextResponse.json({ error: "AI_UNAVAILABLE" }, { status: 502 })
	}
}

/** Models occasionally return 35000.0 or "35000"; coerce price fields to ints. */
function normalizePrices(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(normalizePrices)
	if (value && typeof value === "object") {
		const out: Record<string, unknown> = {}
		for (const [k, v] of Object.entries(value)) {
			if (k === "price" && v != null) {
				// VND has no decimals and "35.000" uses the dot as a thousands separator.
				const n = typeof v === "string" ? Number(v.replace(/[^\d]/g, "")) : Number(v)
				out[k] = Number.isFinite(n) ? Math.round(n) : null
			} else out[k] = normalizePrices(v)
		}
		// A size whose price could not be read is useless: drop it rather than
		// rejecting the whole draft.
		if (Array.isArray(out.variants))
			out.variants = out.variants.filter(
				(v) => v && typeof (v as { price?: unknown }).price === "number",
			)
		return out
	}
	return value
}
