import Link from "next/link"
import {
	ArrowRight,
	ChefHat,
	Clock3,
	QrCode,
	Sparkles,
	UtensilsCrossed,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
	{
		icon: QrCode,
		title: "Quét QR, xem ngay",
		desc: "Khách mở menu tức thì, không cần tải ứng dụng.",
	},
	{
		icon: UtensilsCrossed,
		title: "Đặt món trong 4 chạm",
		desc: "Chọn món, ghi chú và gửi đơn ngay tại bàn.",
	},
	{
		icon: Sparkles,
		title: "Gợi ý thông minh",
		desc: "Đề xuất theo thời gian, thời tiết và món bán chạy.",
	},
	{
		icon: ChefHat,
		title: "Bếp luôn đồng bộ",
		desc: "Đơn mới xuất hiện realtime trên màn hình bếp.",
	},
]

export default function HomePage() {
	return (
		<main className="min-h-screen overflow-hidden bg-[#fffaf6]">
			<header className="container flex items-center justify-between py-5">
				<Link href="/" className="flex items-center gap-3">
					<span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-white shadow-lg shadow-orange-200">
						<UtensilsCrossed className="h-5 w-5" />
					</span>
					<div>
						<p className="font-bold leading-none">SmartMenu</p>
						<p className="mt-1 text-xs text-muted-foreground">Restaurant OS</p>
					</div>
				</Link>
				<div className="flex gap-2">
					<Link href="/login">
						<Button variant="ghost">Đăng nhập</Button>
					</Link>
					<Link href="/register">
						<Button>Dùng thử miễn phí</Button>
					</Link>
				</div>
			</header>

			<section className="container grid items-center gap-12 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
				<div>
					<div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm">
						<Sparkles className="h-4 w-4" />
						Vận hành nhà hàng trong một màn hình
					</div>
					<h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">
						Menu đẹp hơn.
						<br />
						<span className="text-primary">Phục vụ nhanh hơn.</span>
					</h1>
					<p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
						Tạo menu số có hình ảnh, nhận đơn tại bàn và kết nối trực tiếp với
						bếp — không cần khách tải app.
					</p>
					<div className="mt-8 flex flex-wrap gap-3">
						<Link href="/register">
							<Button size="lg">
								Bắt đầu miễn phí <ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
						{/* <Link href="/demo/ban-1">
							<Button size="lg" variant="outline" className="bg-white">
								Xem menu demo
							</Button>
						</Link> */}
					</div>
					<div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-600">
						<span className="flex items-center gap-2">
							<Clock3 className="h-4 w-4 text-primary" />
							Thiết lập nhanh chóng
						</span>
						<span>✓ Không cần thẻ thanh toán</span>
					</div>
				</div>
				<div className="relative">
					<div className="absolute -inset-8 -z-10 rounded-full bg-orange-200/50 blur-3xl" />
					<img
						src="/images/landing-hero.svg"
						alt="Giao diện menu món ăn SmartMenu"
						className="w-full drop-shadow-2xl"
					/>
				</div>
			</section>

			<section className="container pb-20">
				<div className="mb-8 text-center">
					<p className="text-sm font-semibold uppercase tracking-widest text-primary">
						Đủ đơn giản để dùng mỗi ngày
					</p>
					<h2 className="mt-2 text-3xl font-bold">
						Mọi người trong quán đều dễ sử dụng
					</h2>
				</div>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{features.map((feature) => (
						<article
							key={feature.title}
							className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
						>
							<span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-primary">
								<feature.icon className="h-6 w-6" />
							</span>
							<h3 className="mt-5 font-bold">{feature.title}</h3>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">
								{feature.desc}
							</p>
						</article>
					))}
				</div>
			</section>

			<footer className="border-t border-orange-100 bg-white py-8 text-center text-sm text-muted-foreground">
				© {new Date().getFullYear()} SmartMenu · Menu số · Đặt món · Realtime
			</footer>
		</main>
	)
}
