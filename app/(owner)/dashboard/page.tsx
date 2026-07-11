import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
	ArrowRight,
	ChefHat,
	CircleDollarSign,
	Clock3,
	Palette,
	QrCode,
	ShoppingBag,
	Sparkles,
	UtensilsCrossed,
} from "lucide-react"
import { getPrimaryRestaurant, getDashboardStats } from "@/lib/data/owner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatVnd } from "@/lib/utils"

const actions = [
	{
		href: "/dashboard/menu",
		title: "Thêm món mới",
		description: "Cập nhật món ăn, giá và hình ảnh",
		icon: UtensilsCrossed,
	},
	{
		href: "/dashboard/builder",
		title: "Thiết kế menu",
		description: "Sắp xếp bố cục theo phong cách quán",
		icon: Palette,
	},
	{
		href: "/dashboard/tables",
		title: "Tạo mã QR",
		description: "Đưa menu đến từng bàn trong vài giây",
		icon: QrCode,
	},
	{
		href: "/dashboard/kitchen",
		title: "Mở màn hình bếp",
		description: "Theo dõi đơn theo thời gian thực",
		icon: ChefHat,
	},
]

export default async function DashboardPage() {
	const restaurant = await getPrimaryRestaurant()
	if (!restaurant) return <EmptyDashboard />

	const stats = await getDashboardStats(restaurant.id)
	return (
		<div className="space-y-7">
			<section className="relative min-h-64 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl shadow-slate-200">
				<img
					src={restaurant.cover_url ?? "/images/dashboard-food.svg"}
					alt=""
					className="absolute inset-0 h-full w-full object-cover opacity-60"
				/>
				<div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/10" />
				<div className="relative flex min-h-64 max-w-2xl flex-col justify-center p-7 sm:p-10">
					<div className="mb-3 flex items-center gap-2 text-sm font-medium text-orange-300">
						<Sparkles className="h-4 w-4" />
						Chúc một ngày kinh doanh thật tốt
					</div>
					<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
						{restaurant.name}
					</h1>
					<p className="mt-3 max-w-lg text-sm leading-6 text-slate-200">
						Menu, đơn hàng và hoạt động của nhà hàng được tập trung tại một nơi.
					</p>
					<div className="mt-6">
						<Link href="/dashboard/menu">
							<Button>
								Quản lý menu <ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
					</div>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				<Stat
					title="Đơn hôm nay"
					value={String(stats.todayOrders)}
					note="Tổng đơn đã ghi nhận"
					icon={ShoppingBag}
					tone="bg-blue-50 text-blue-600"
				/>
				<Stat
					title="Doanh thu hôm nay"
					value={formatVnd(stats.todayRevenue)}
					note="Cập nhật theo đơn hoàn tất"
					icon={CircleDollarSign}
					tone="bg-emerald-50 text-emerald-600"
				/>
				<Stat
					title="Đơn đang xử lý"
					value={String(stats.openOrders)}
					note="Cần nhà hàng theo dõi"
					icon={Clock3}
					tone="bg-orange-50 text-orange-600"
				/>
			</section>

			<section>
				<div className="mb-4">
					<h2 className="text-xl font-bold">Thao tác nhanh</h2>
					<p className="text-sm text-muted-foreground">
						Những việc thường dùng trong một ca làm việc.
					</p>
				</div>
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{actions.map((action) => (
						<Link key={action.href} href={action.href}>
							<Card className="group h-full border-0 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
								<span className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-primary">
									<action.icon className="h-5 w-5" />
								</span>
								<h3 className="font-semibold">{action.title}</h3>
								<p className="mt-1 text-sm text-muted-foreground">
									{action.description}
								</p>
								<span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
									Mở ngay
									<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
								</span>
							</Card>
						</Link>
					))}
				</div>
			</section>
		</div>
	)
}

function Stat({
	title,
	value,
	note,
	icon: Icon,
	tone,
}: {
	title: string
	value: string
	note: string
	icon: LucideIcon
	tone: string
}) {
	return (
		<Card className="border-0 p-5 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-sm text-muted-foreground">{title}</p>
					<p className="mt-2 text-2xl font-bold">{value}</p>
					<p className="mt-2 text-xs text-muted-foreground">{note}</p>
				</div>
				<span
					className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tone}`}
				>
					<Icon className="h-5 w-5" />
				</span>
			</div>
		</Card>
	)
}

function EmptyDashboard() {
	return (
		<div className="mx-auto max-w-xl overflow-hidden rounded-3xl border bg-white shadow-sm">
			<img
				src="/images/empty-restaurant.svg"
				alt=""
				className="h-56 w-full object-cover"
			/>
			<div className="p-8 text-center">
				<h1 className="text-2xl font-bold">Chào mừng đến SmartMenu</h1>
				<p className="mt-2 text-muted-foreground">
					Tạo nhà hàng đầu tiên để xây dựng menu và bắt đầu nhận đơn.
				</p>
				<Link href="/dashboard/restaurants">
					<Button className="mt-6">Tạo nhà hàng đầu tiên</Button>
				</Link>
			</div>
		</div>
	)
}
