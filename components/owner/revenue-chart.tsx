"use client"

import { formatVnd } from "@/lib/utils"

type Point = { date: string; revenue: number; orders: number }

// Lightweight dependency-free bar chart (no external chart library needed).
export function RevenueChart({ data }: { data: Point[] }) {
	const max = Math.max(1, ...data.map((d) => d.revenue))
	return (
		<div
			className="flex items-end gap-2 overflow-x-auto pb-2"
			style={chartHeight}
		>
			{data.map((d) => {
				const pct = Math.round((d.revenue / max) * 100)
				const label = d.date.slice(5) // MM-DD
				return (
					<div
						key={d.date}
						className="flex min-w-[36px] flex-1 flex-col items-center gap-1"
					>
						<span className="text-[10px] text-muted-foreground">
							{d.orders > 0 ? d.orders : ""}
						</span>
						<div
							className="w-full rounded-t-md bg-primary/80 transition-all hover:bg-primary"
							style={barStyle(pct)}
							title={formatVnd(d.revenue)}
						/>
						<span className="text-[10px] text-muted-foreground">{label}</span>
					</div>
				)
			})}
		</div>
	)
}

const chartHeight: React.CSSProperties = { height: 220 }

function barStyle(pct: number): React.CSSProperties {
	return { height: `${Math.max(2, pct)}%` }
}
