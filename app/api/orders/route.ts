import { NextResponse } from "next/server"
import { z } from "zod"
import { createGuestOrder } from "@/lib/data/orders"
import { rateLimit } from "@/lib/rate-limit"

const lineSchema = z.object({
	menuItemId: z.string().uuid(),
	name: z.string().min(1),
	basePrice: z.number().nonnegative(),
	quantity: z.number().int().positive(),
	variantId: z.string().uuid().optional(),
	variantPriceDelta: z.number().optional(),
	note: z.string().max(500).optional(),
})

const bodySchema = z.object({
	restaurantId: z.string().uuid(),
	tableId: z.string().uuid().nullable(),
	deviceToken: z.string().min(6).max(64),
	note: z.string().max(500).optional(),
	lines: z.array(lineSchema).min(1).max(50),
})

export async function POST(request: Request) {
	const ip =
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
	let json: unknown
	try {
		json = await request.json()
	} catch {
		return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 })
	}
	const parsed = bodySchema.safeParse(json)
	if (!parsed.success) {
		return NextResponse.json({ error: "VALIDATION" }, { status: 422 })
	}

	// Rate limit by table + device + IP (Plan section 8.4).
	const key = `order:${parsed.data.tableId ?? "na"}:${parsed.data.deviceToken}:${ip}`
	if (!rateLimit(key, 5, 60_000).allowed) {
		return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 })
	}

	try {
		const result = await createGuestOrder(parsed.data)
		return NextResponse.json(result, { status: 201 })
	} catch (err) {
		const message = err instanceof Error ? err.message : "ORDER_FAILED"
		const status = message === "EMPTY_ORDER" ? 422 : 500
		return NextResponse.json({ error: message }, { status })
	}
}
