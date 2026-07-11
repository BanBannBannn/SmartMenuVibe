import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
	{
		title: "Menu số đẹp, tải nhanh",
		desc: "Khách quét QR là xem menu ngay, không cần tải app hay đăng nhập.",
	},
	{
		title: "Đặt món ≤ 4 chạm",
		desc: "Thêm giỏ, gửi đơn, theo dõi trạng thái realtime trên điện thoại.",
	},
	{
		title: "Gợi ý món thông minh",
		desc: "Theo giờ trong ngày, thời tiết, món bán chạy và luật do quán cấu hình.",
	},
	{
		title: "Kitchen Dashboard",
		desc: "Bếp thấy đơn mới ngay lập tức, cập nhật trạng thái kiểu Kanban.",
	},
]

export default function HomePage() {
	return (
		<main className="min-h-screen">
			<header className="container flex items-center justify-between py-6">
				<span className="text-xl font-bold text-primary">SmartMenu</span>
				<div className="flex gap-2">
					<Link href="/login">
						<Button variant="ghost">Đăng nhập</Button>
					</Link>
					<Link href="/register">
						<Button>Dùng thử miễn phí</Button>
					</Link>
				</div>
			</header>

			<section className="container py-16 text-center">
				<h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
					Menu số, đặt món và gợi ý thông minh cho nhà hàng của bạn
				</h1>
				<p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
					Tạo menu đẹp trong 15 phút, nhận đơn từ khách không cần app, quản lý
					doanh thu và giợi ý món theo ngữ cảnh.
				</p>
				<div className="mt-8 flex justify-center gap-3">
					<Link href="/register">
						<Button size="lg">Bắt đầu ngay</Button>
					</Link>
					<Link href="/demo/ban-1">
						<Button size="lg" variant="outline">
							Xem menu demo
						</Button>
					</Link>
				</div>
			</section>

			<section className="container grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
				{features.map((f) => (
					<Card key={f.title}>
						<CardHeader>
							<CardTitle className="text-base">{f.title}</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							{f.desc}
						</CardContent>
					</Card>
				))}
			</section>

			<footer className="border-t py-8 text-center text-sm text-muted-foreground">
				© {new Date().getFullYear()} SmartMenu. Thanh toán tại quầy · Menu số · Realtime.
			</footer>
		</main>
	)
}
