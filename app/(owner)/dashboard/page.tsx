import { getPrimaryRestaurant, getDashboardStats } from "@/lib/data/owner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatVnd } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
	const restaurant = await getPrimaryRestaurant()
	if (!restaurant) {
		return (
			<div className="mx-auto max-w-md text-center">
				<h1 className="text-xl font-semibold">Chào mừng đến SmartMenu 👋</h1>
				<p className="mt-2 text-muted-foreground">
					Bạn chưa có nhà hàng nào. Tạo nhà hàng đầu tiên để bắt đầu.
				</p>
				<Link href="/dashboard/restaurants">
					<Button className="mt-4">Tạo nhà hàng</Button>
				</Link>
			</div>
		)
	}
	const stats = await getDashboardStats(restaurant.id)
	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">{restaurant.name}</h1>
			<div className="grid gap-4 sm:grid-cols-3">
				<Stat title="Đơn hôm nay" value={String(stats.todayOrders)} />
				<Stat title="Doanh thu hôm nay" value={formatVnd(stats.todayRevenue)} />
				<Stat title="Đơn đang mở" value={String(stats.openOrders)} />
			</div>
			<div className="flex flex-wrap gap-2">
				<Link href="/dashboard/kitchen">
					<Button>Mở màn hình bếp</Button>
				</Link>
				<Link href="/dashboard/menu">
					<Button variant="outline">Quản lý menu</Button>
				</Link>
				<Link href="/dashboard/showcase">
					<Button variant="outline">Màn hình trưng bày</Button>
				</Link>
			</div>
		</div>
	)
}

function Stat({ title, value }: { title: string; value: string }) {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-2xl font-bold">{value}</p>
			</CardContent>
		</Card>
	)
}
