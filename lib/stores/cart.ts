"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { priceCart, type CartLine } from "@/lib/pricing"

export type CartItem = CartLine & { variantId?: string; variantName?: string }

type CartState = {
	items: CartItem[]
	add: (item: CartItem) => void
	remove: (index: number) => void
	setQty: (index: number, qty: number) => void
	clear: () => void
	totals: () => ReturnType<typeof priceCart>
}

/** Local cart state, persisted to localStorage so a guest doesn't lose their
 * cart on refresh. No account required (Plan section 3.3). */
export const useCart = create<CartState>()(
	persist(
		(set, get) => ({
			items: [],
			add: (item) =>
				set((s) => {
					const idx = s.items.findIndex(
						(i) =>
							i.menuItemId === item.menuItemId &&
							i.variantId === item.variantId &&
							(i.note ?? "") === (item.note ?? ""),
					)
					if (idx >= 0) {
						const copy = [...s.items]
						copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + item.quantity }
						return { items: copy }
					}
					return { items: [...s.items, item] }
				}),
			remove: (index) =>
				set((s) => ({ items: s.items.filter((_, i) => i !== index) })),
			setQty: (index, qty) =>
				set((s) => {
					const copy = [...s.items]
					if (qty <= 0) return { items: copy.filter((_, i) => i !== index) }
					copy[index] = { ...copy[index], quantity: qty }
					return { items: copy }
				}),
			clear: () => set({ items: [] }),
			totals: () => priceCart(get().items),
		}),
		{ name: "smartmenu-cart" },
	),
)

/** Stable anonymous device token for rate-limiting + order tracking. */
export function getDeviceToken(): string {
	if (typeof window === "undefined") return "server"
	const KEY = "smartmenu-device"
	let token = localStorage.getItem(KEY)
	if (!token) {
		token = crypto.randomUUID().replace(/-/g, "").slice(0, 24)
		localStorage.setItem(KEY, token)
	}
	return token
}
