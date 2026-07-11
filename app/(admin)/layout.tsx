import { redirect } from "next/navigation"
import Link from "next/link"
import { getSessionUser } from "@/lib/auth"
import { signOut } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"

const nav = [
	{ href: "/admin", label: "Nhà hàng" },
	{ href: "/admin/users", label: "Tài khoản" },
	{ href: "/admin/audit", label: "Nhật ký" },
]

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const user = await getSessionUser()
	if (!user) redirect("/login?redirect=/admin")
	// Only platform super admins may access this area (Plan section 3.7).
	if (user.role !== "super_admin") redirect("/dashboard")

	return (
		<div className="min-h-screen">
			<header className="flex items-center justify-between border-b px-6 py-3">
				<div className="flex items-center gap-6">
					<span className="font-bold text-primary">SmartMenu Admin</span>
					<nav className="flex gap-4 text-sm">
						{nav.map((n) => (
							<Link key={n.href} href={n.href} className="hover:text-primary">
								{n.label}
							</Link>
						))}
					</nav>
				</div>
				<form action={signOut}>
					<Button variant="ghost" size="sm">
						Đăng xuất
					</Button>
				</form>
			</header>
			<div className="p-6">{children}</div>
		</div>
	)
}
