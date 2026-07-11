import { redirect } from "next/navigation"
import Link from "next/link"
import { getSessionUser } from "@/lib/auth"
import { getPrimaryRestaurant } from "@/lib/data/owner"
import { signOut } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"

const nav = [
	{ href: "/dashboard", label: "Tổng quan" },
	{ href: "/dashboard/restaurants", label: "Nhà hàng" },
	{ href: "/dashboard/menu", label: "Menu" },
	{ href: "/dashboard/builder", label: "Thiết kế menu" },
	{ href: "/dashboard/showcase", label: "Màn hình trưng bày" },
	{ href: "/dashboard/kitchen", label: "Bếp" },
	{ href: "/dashboard/tables", label: "Bàn & QR" },
	{ href: "/dashboard/recommendations", label: "Gợi ý món" },
	{ href: "/dashboard/revenue", label: "Doanh thu" },
	{ href: "/dashboard/settings", label: "Cài đặt" },
]

export default async function OwnerLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const user = await getSessionUser()
	if (!user) redirect("/login?redirect=/dashboard")
	if (user.role === "super_admin") redirect("/admin")
	const restaurant = await getPrimaryRestaurant()

	return (
		<div className="flex min-h-screen">
			<aside className="hidden w-56 shrink-0 border-r bg-muted/30 p-4 sm:block">
				<div className="mb-6 text-lg font-bold text-primary">SmartMenu</div>
				<nav className="space-y-1">
					{nav.map((n) => (
						<Link
							key={n.href}
							href={n.href}
							className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
						>
							{n.label}
						</Link>
					))}
				</nav>
			</aside>
			<div className="flex-1">
				<header className="flex items-center justify-between border-b px-6 py-3">
					<Link
						href="/dashboard/restaurants"
						className="flex items-center gap-2 text-sm"
					>
						<span className="text-muted-foreground">Nhà hàng:</span>
						<span className="font-semibold">
							{restaurant ? restaurant.name : "Chưa có"}
						</span>
						<span className="text-xs text-primary">đổi ▾</span>
					</Link>
					<div className="flex items-center gap-4">
						<span className="hidden text-sm text-muted-foreground sm:inline">
							{user.fullName ?? user.email}
						</span>
						<form action={signOut}>
							<Button variant="ghost" size="sm">
								Đăng xuất
							</Button>
						</form>
					</div>
				</header>
				<div className="p-6">{children}</div>
			</div>
		</div>
	)
}
