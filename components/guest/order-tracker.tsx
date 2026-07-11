"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Clock, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { orderStatusLabel } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { formatVnd } from "@/lib/utils"

const STEPS = ["pending", "confirmed", "preparing", "ready", "served", "completed"]

/** Realtime order status for the guest (Plan section 3.5). Subscribes to the
 * order row; falls back to polling if Realtime is unavailable. */
export function OrderTracker({
	orderId,
	restaurantName,
	onNewOrder,
}: {
	orderId: string
	restaurantName: string
	onNewOrder: () => void
}) {
	const [status, setStatus] = useState<string>("pending")
	const [total, setTotal] = useState<number>(0)

	useEffect(() => {
		let active = true
		const supabase = createClient()

		async function fetchOnce() {
			const res = await fetch(`/api/orders/${orderId}`)
			if (res.ok && active) {
				const d = await res.json()
				setStatus(d.status)
				setTotal(d.total)
			}
		}
		fetchOnce()

		const channel = supabase
			.channel(`order-${orderId}`)
			.on(
				"postgres_changes",
				{ event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
				(payload) => {
					const next = payload.new as { status: string; total: number }
					setStatus(next.status)
					setTotal(next.total)
				},
			)
			.subscribe()

		// Polling fallback every 15s.
		const poll = setInterval(fetchOnce, 15_000)
		return () => {
			active = false
			clearInterval(poll)
			supabase.removeChannel(channel)
		}
	}, [orderId])

	const currentStep = STEPS.indexOf(status)

	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
			<div className="rounded-full bg-primary/10 p-4">
				{status === "completed" ? (
					<CheckCircle2 className="h-10 w-10 text-primary" />
				) : status === "ready" ? (
					<CheckCircle2 className="h-10 w-10 text-green-600" />
				) : (
					<Loader2 className="h-10 w-10 animate-spin text-primary" />
				)}
			</div>
			<div>
				<h1 className="text-xl font-semibold">Đã gửeri đơn tới {restaurantName}</h1>
				<p className="mt-1 text-muted-foreground">
					Trạng thái: <b>{orderStatusLabel[status] ?? status}</b>
				</p>
				<p className="text-sm text-muted-foreground">Tổng: {formatVnd(total)}</p>
			</div>

			<ol className="w-full max-w-xs space-y-2 text-left">
				{STEPS.slice(0, 5).map((step, i) => (
					<li
						key={step}
						className={`flex items-center gap-2 ${i <= currentStep ? "text-foreground" : "text-muted-foreground/50"}`}
					>
						{i < currentStep ? (
							<CheckCircle2 className="h-4 w-4 text-green-600" />
						) : (
							<Clock className="h-4 w-4" />
						)}
						{orderStatusLabel[step]}
					</li>
				))}
			</ol>

			<Button variant="outline" onClick={onNewOrder}>
				Đặt thêm món
			</Button>
		</main>
	)
}
