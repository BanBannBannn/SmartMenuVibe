import { NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"
import { geminiGenerate } from "@/lib/llm/gemini"
import { aiErrorResponse } from "@/lib/ai/http"
import { signalsFrom, suggestTemplates } from "@/lib/design-suggest"
import {
	TONES,
	cleanDescription,
	descriptionsJsonSchema,
	descriptionsResponseSchema,
	descriptionsSystem,
} from "@/lib/ai/descriptions"

export const maxDuration = 60

const bodySchema = z.object({ restaurantId: z.string().uuid() })
const BATCH = 40
const DAILY_LIMIT = 5

/**
 * POST { restaurantId } -> description drafts for up to 40 dishes that have
 * none yet. Nothing is saved here; the owner reviews and saves.
 * Only dish and category names are sent to the model.
 */
export async function POST(request: Request) {
	const user = await getSessionUser()
	if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

	const parsed = bodySchema.safeParse(await request.json().catch(() => null))
	if (!parsed.success)
		return NextResponse.json({ error: "VALIDATION" }, { status: 422 })
	const { restaurantId } = parsed.data

	// RLS: only returns rows for restaurants this user manages.
	const supabase = await createClient()
	const [{ data: items }, { data: categories }] = await Promise.all([
		supabase
			.from("menu_items")
			.select("id, name, description, category_id, images, base_price")
			.eq("restaurant_id", restaurantId)
			.order("sort_order"),
		supabase
			.from("menu_categories")
			.select("id, name")
			.eq("restaurant_id", restaurantId),
	])
	const all = (items ?? []).map((i) => ({ ...i, images: (i.images ?? []) as string[] }))
	const todo = all.filter((i) => !i.description?.trim()).slice(0, BATCH)
	if (todo.length === 0) return NextResponse.json({ suggestions: [] })

	const limit = await rateLimit(`ai-desc:${user.id}`, DAILY_LIMIT, 86_400_000)
	if (!limit.allowed)
		return NextResponse.json({ error: "DAILY_LIMIT" }, { status: 429 })

	const catName = new Map((categories ?? []).map((c) => [c.id, c.name]))
	const style = suggestTemplates(signalsFrom(categories ?? [], all))[0]?.templateId
	const tone = TONES[style ?? ""] ?? TONES["photo-grid"]

	try {
		const { text } = await geminiGenerate({
			system: descriptionsSystem(tone),
			parts: [
				JSON.stringify(
					todo.map((i) => ({
						id: i.id,
						ten_mon: i.name,
						danh_muc: catName.get(i.category_id) ?? "",
					})),
				),
			],
			jsonSchema: descriptionsJsonSchema,
			maxOutputTokens: 8_000,
			timeoutMs: 55_000,
		})

		let raw: unknown
		try {
			raw = JSON.parse(text)
		} catch {
			return NextResponse.json({ error: "BAD_OUTPUT" }, { status: 502 })
		}
		const out = descriptionsResponseSchema.safeParse(raw)
		if (!out.success)
			return NextResponse.json({ error: "BAD_OUTPUT" }, { status: 502 })

		const byId = new Map(todo.map((i) => [i.id, i]))
		const suggestions = out.data.items.flatMap((s) => {
			const item = byId.get(s.id) // ignore ids the model invented
			const description = cleanDescription(s.description)
			return item && description ? [{ id: item.id, name: item.name, description }] : []
		})
		return NextResponse.json({
			suggestions,
			pending: all.filter((i) => !i.description?.trim()).length - todo.length,
			remaining: limit.remaining,
		})
	} catch (err) {
		return aiErrorResponse(err, "descriptions")
	}
}
