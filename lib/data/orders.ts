import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { priceCart, type CartLine } from "@/lib/pricing"

export type CreateOrderInput = {
	restaurantId: string
	tableId: string | null
	deviceToken: string
	note?: string
	lines: CartLine[]
}

/**
 * Create a guest order. Prices are recomputed server-side from the current DB
 * item prices (never trust client-supplied prices). Uses the service role
 * because guests are anonymous, but stays strictly scoped to the given
 * restaurant.
 */
export async function createGuestOrder(input: CreateOrderInput) {
	const db = createAdminClient()

	// Re-fetch authoritative prices for the referenced items/variants.
	const itemIds = [...new Set(input.lines.map((l) => l.menuItemId))]
	const { data: items } = await db
		.from("menu_items")
		.select("id, name, base_price, is_available, restaurant_id")
		.in("id", itemIds)
	const { data: variants } = await db
		.from("menu_item_variants")
		.select("id, price_delta, menu_item_id")

	const itemMap = new Map(items?.map((i) => [i.id, i]))
	const variantMap = new Map(variants?.map((v) => [v.id, v]))

	const pricedLines: (CartLine & { variantId?: string })[] = []
	for (const line of input.lines) {
		const item = itemMap.get(line.menuItemId)
		if (!item || item.restaurant_id !== input.restaurantId || !item.is_available)
			continue // silently drop unavailable / cross-tenant items
		const variant = line.variantPriceDelta
			? undefined
			: variantMap.get((line as { variantId?: string }).variantId ?? "")
		pricedLines.push({
			menuItemId: item.id,
			name: item.name,
			basePrice: item.base_price,
			quantity: Math.max(1, Math.floor(line.quantity)),
			variantPriceDelta: variant?.price_delta ?? line.variantPriceDelta ?? 0,
			variantId: (line as { variantId?: string }).variantId,
			note: line.note,
		})
	}

	if (!pricedLines.length) throw new Error("EMPTY_ORDER")
	const priced = priceCart(pricedLines)

	const { data: order, error } = await db
		.from("orders")
		.insert({
			restaurant_id: input.restaurantId,
			table_id: input.tableId,
			device_token: input.deviceToken,
			note: input.note ?? null,
			status: "pending",
			subtotal: priced.subtotal,
			total: priced.total,
		})
		.select("id")
		.single()
	if (error || !order) throw new Error(error?.message ?? "ORDER_INSERT_FAILED")

	const rows = priced.lines.map((l, idx) => ({
		order_id: order.id,
		menu_item_id: l.menuItemId,
		variant_id: pricedLines[idx].variantId ?? null,
		name_snapshot: l.name,
		quantity: l.quantity,
		unit_price: l.unitPrice,
		note: l.note ?? null,
	}))
	await db.from("order_items").insert(rows)

	return { orderId: order.id, total: priced.total }
}

export async function getOrderStatus(orderId: string) {
	const db = createAdminClient()
	const { data } = await db
		.from("orders")
		.select("id, status, total, created_at")
		.eq("id", orderId)
		.maybeSingle()
	return data
}
