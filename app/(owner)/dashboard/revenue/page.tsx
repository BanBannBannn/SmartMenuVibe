import { getPrimaryRestaurant, getRevenueSeries } from "@/lib/data/owner"
import { RevenueChart } from "@/components/owner/revenue-chart"
import { formatVnd } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function RevenuePage() {
	const restaurant = await getPrimaryRestaurant()
	if (!restaurant) return <p>Chưa có nhà hàng.</p>
	const series = await getRevenueSeries(restaurant.id, 14)
	const totalRevenue = series.reduce(
		(s, d) => s + Number(d.total_revenue ?? 0),
		0,
	)
	const totalOrders = series.reduce(
		(s, d) => s + Number(d.total_orders ?? 0),
		0,
	)
	const avg = totalOrders > 0 ? totalRevenue / totalOrders : 0

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Doanh thu</h1>
				<p className="text-sm text-muted-foreground">14 ngày gần nhất</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-muted-foreground">
							Tổng doanh thu
						</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-bold text-primary">
						{formatVnd(totalRevenue)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-muted-foreground">
							Tổng đơn
						</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-bold">
						{totalOrders}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-muted-foreground">
							Giá trị TB/đơn
						</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-bold">
						{formatVnd(avg)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Biểu đồ doanh thu</CardTitle>
				</CardHeader>
				<CardContent>
					{series.length === 0 ? (
						<p className="py-10 text-center text-sm text-muted-foreground">
							Chưa có dữ liệu doanh thu.
						</p>
					) : (
						<RevenueChart
							data={series.map((d) => ({
								date: String(d.date),
								revenue: Number(d.total_revenue ?? 0),
								orders: Number(d.total_orders ?? 0),
							}))}
						/>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
