"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatVnd } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type OrderRow = {
	id: string
	status: string
	total: number
	note: string | null
	table_id: string | null
	created_at: string
}

const COLUMNS: { status: string; label: string; next?: string }[] = [
	{ status: "pending", label: "Chờ xác nhận", next: "confirmed" },
	{ status: "confirmed", label: "Đã xác nhận", next: "preparing" },
	{ status: "preparing", label: "Đang làm", next: "ready" },
	{ status: "ready", label: "Sẵn sàng", next: "served" },
]

/**
 * Realtime Kitchen Dashboard (Plan section 3.5). Subscribes to the restaurant's
 * orders via Supabase Realtime and lets staff advance order status Kanban-style.
 */
export function KitchenBoard({ restaurantId }: { restaurantId: string }) {
	const [orders, setOrders] = useState<OrderRow[]>([])
	const supabase = createClient()

	async function load() {
		const { data } = await supabase
			.from("orders")
			.select("id, status, total, note, table_id, created_at")
			.eq("restaurant_id", restaurantId)
			.in("status", ["pending", "confirmed", "preparing", "ready"])
			.order("created_at")
		setOrders((data as OrderRow[]) ?? [])
	}

	useEffect(() => {
		load()
		const channel = supabase
			.channel(`kitchen-${restaurantId}`)
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
				() => load(),
			)
			.subscribe()
		return () => {
			supabase.removeChannel(channel)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [restaurantId])

	async function advance(order: OrderRow, next: string) {
		setOrders((prev) =>
			prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)),
		)
		await supabase.from("orders").update({ status: next as any }).eq("id", order.id)
	}

	return (
		<div className="grid gap-4 lg:grid-cols-4">
			{COLUMNS.map((col) => {
				const list = orders.filter((o) => o.status === col.status)
				return (
					<div key={col.status} className="rounded-lg bg-muted/40 p-3">
						<div className="mb-3 flex items-center justify-between">
							<h3 className="font-medium">{col.label}</h3>
							<Badge variant="secondary">{list.length}</Badge>
						</div>
						<div className="space-y-2">
							{list.map((o) => (
								<div key={o.id} className="rounded-md border bg-background p-3 text-sm">
									<div className="flex justify-between font-medium">
										<span>#{o.id.slice(0, 6)}</span>
										<span>{formatVnd(o.total)}</span>
									</div>
									{o.note && (
										<p className="mt-1 text-xs text-muted-foreground">{o.note}</p>
									)}
									{col.next && (
										<Button
											size="sm"
											className="mt-2 w-full"
											onClick={() => advance(o, col.next!)}
										>
											Chuyển tiếp
										</Button>
									)}
								</div>
							))}
							{list.length === 0 && (
								<p className="py-6 text-center text-xs text-muted-foreground">
									Không có đơn
								</p>
							)}
						</div>
					</div>
				)
			})}
		</div>
	)
}
