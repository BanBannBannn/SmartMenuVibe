"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
	BarChart3,
	Building2,
	ChefHat,
	LayoutDashboard,
	Lightbulb,
	MonitorPlay,
	Palette,
	QrCode,
	Settings,
	UtensilsCrossed,
} from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
	{ href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
	{ href: "/dashboard/restaurants", label: "Nhà hàng", icon: Building2 },
	{ href: "/dashboard/menu", label: "Menu", icon: UtensilsCrossed },
	{ href: "/dashboard/builder", label: "Thiết kế", icon: Palette },
	{ href: "/dashboard/showcase", label: "Trưng bày", icon: MonitorPlay },
	{ href: "/dashboard/kitchen", label: "Bếp", icon: ChefHat },
	{ href: "/dashboard/tables", label: "Bàn & QR", icon: QrCode },
	{ href: "/dashboard/recommendations", label: "Gợi ý món", icon: Lightbulb },
	{ href: "/dashboard/revenue", label: "Doanh thu", icon: BarChart3 },
	{ href: "/dashboard/settings", label: "Cài đặt", icon: Settings },
]

function active(pathname: string, href: string) {
	return href === "/dashboard" ? pathname === href : pathname.startsWith(href)
}

export function DashboardNav() {
	const pathname = usePathname()
	return (
		<>
			<aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-white px-4 py-5 sm:flex">
				<Link href="/dashboard" className="mb-7 flex items-center gap-3 px-2">
					<span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-white shadow-lg shadow-orange-200">
						<UtensilsCrossed className="h-5 w-5" />
					</span>
					<div>
						<p className="font-bold">SmartMenu</p>
						<p className="text-xs text-muted-foreground">Restaurant OS</p>
					</div>
				</Link>
				<nav className="space-y-1">
					{items.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
								active(pathname, item.href)
									? "bg-orange-50 text-primary"
									: "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
							)}
						>
							<item.icon className="h-4 w-4" />
							{item.label}
						</Link>
					))}
				</nav>
			</aside>
			<nav className="no-scrollbar sticky top-0 z-20 flex gap-1 overflow-x-auto border-b bg-white/95 px-3 py-2 backdrop-blur sm:hidden">
				{items.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							"flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
							active(pathname, item.href)
								? "bg-primary text-white"
								: "text-slate-600",
						)}
					>
						<item.icon className="h-4 w-4" />
						{item.label}
					</Link>
				))}
			</nav>
		</>
	)
}
