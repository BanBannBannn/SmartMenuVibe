/**
 * Pure order pricing logic. Kept dependency-free so it can be unit-tested
 * (Plan section 11.3) and reused on both client (cart preview) and server
 * (authoritative total before insert).
 */

export type CartLine = {
	menuItemId: string
	name: string
	basePrice: number
	quantity: number
	variantPriceDelta?: number
	note?: string
}

export type PricedLine = CartLine & { unitPrice: number; lineTotal: number }

export type PricedCart = {
	lines: PricedLine[]
	subtotal: number
	total: number
	itemCount: number
}

/** Unit price of a single line = base price + variant delta (never negative). */
export function unitPrice(line: CartLine): number {
	const price = line.basePrice + (line.variantPriceDelta ?? 0)
	return Math.max(0, Math.round(price))
}

/** Compute the fully-priced cart. Total currently equals subtotal (no tax/fees
 * at MVP - payment is at the counter, Plan section 14). */
export function priceCart(lines: CartLine[]): PricedCart {
	const priced: PricedLine[] = lines.map((line) => {
		const u = unitPrice(line)
		return { ...line, unitPrice: u, lineTotal: u * line.quantity }
	})
	const subtotal = priced.reduce((sum, l) => sum + l.lineTotal, 0)
	const itemCount = priced.reduce((sum, l) => sum + l.quantity, 0)
	return { lines: priced, subtotal, total: subtotal, itemCount }
}
