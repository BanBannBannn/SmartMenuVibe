import { redirect } from "next/navigation"
import Link from "next/link"
import { Building2, LogOut, UserRound } from "lucide-react"
import { getSessionUser } from "@/lib/auth"
import { getPrimaryRestaurant } from "@/lib/data/owner"
import { signOut } from "@/app/(auth)/actions"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { Button } from "@/components/ui/button"

export default async function OwnerLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const [user, restaurant] = await Promise.all([
		getSessionUser(),
		getPrimaryRestaurant(),
	])
	if (!user) redirect("/login?redirect=/dashboard")
	if (user.role === "super_admin") redirect("/admin")

	return (
		<div className="min-h-screen bg-slate-50/70">
			<DashboardNav />
			<div className="sm:pl-64">
				<header className="flex min-h-16 items-center justify-between border-b bg-white px-4 sm:px-7">
					<Link
						href="/dashboard/restaurants"
						className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50"
					>
						<span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-orange-100 text-primary">
							{restaurant?.logo_url ? (
								<img
									src={restaurant.logo_url}
									alt=""
									className="h-full w-full object-cover"
								/>
							) : (
								<Building2 className="h-4 w-4" />
							)}
						</span>
						<div className="min-w-0">
							<p className="text-xs text-muted-foreground">Đang quản lý</p>
							<p className="truncate text-sm font-semibold">
								{restaurant?.name ?? "Chưa có nhà hàng"}
							</p>
						</div>
					</Link>
					<div className="flex items-center gap-2">
						<div className="hidden items-center gap-2 rounded-full bg-slate-50 px-3 py-2 md:flex">
							<UserRound className="h-4 w-4 text-slate-500" />
							<span className="max-w-40 truncate text-sm">
								{user.fullName ?? user.email}
							</span>
						</div>
						<form action={signOut}>
							<Button variant="ghost" size="icon" title="Đăng xuất">
								<LogOut className="h-4 w-4" />
							</Button>
						</form>
					</div>
				</header>
				<main className="p-4 sm:p-7">{children}</main>
			</div>
		</div>
	)
}
