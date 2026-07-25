"use client"

import { useState } from "react"
import Link from "next/link"
import {
	ChefHat,
	ExternalLink,
	QrCode,
	Sparkles,
	Store,
	UtensilsCrossed,
	X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const DEMO_STORES = [
	{
		slug: "ga-ran-sai-gon",
		name: "Gà Rán Sài Gòn",
		badge: "Bảng Tivi Điện Tử",
		badgeColor: "bg-red-100 text-red-700 border-red-200",
		template: "Fast Food Board",
		icon: ChefHat,
		desc: "Thực đơn gà rán, burger, nước giải khát & combo nhóm. Tối ưu hiển thị trên màn hình Tivi lớn tại quầy.",
		showcaseUrl: "/ga-ran-sai-gon/showcase",
		guestUrl: "/ga-ran-sai-gon/demogaransaigon01",
	},
	{
		slug: "circle-ban-mart",
		name: "Circle Bân Mart",
		badge: "Cửa Hàng Tiện Lợi 24/7",
		badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
		template: "Convenience Grid",
		icon: Store,
		desc: "Menu dạng lưới hiện đại cho siêu thị mini, cơm hộp, mì ly, bánh mì & đồ uống nóng lạnh tại quầy.",
		showcaseUrl: "/circle-ban-mart/showcase",
		guestUrl: "/circle-ban-mart/democirclebanmart01",
	},
	{
		slug: "quan-ban-ban",
		name: "Quán Bân Bân",
		badge: "Mẫu In Khổ A4",
		badgeColor: "bg-orange-100 text-orange-700 border-orange-200",
		template: "Vietnamese A4 Print",
		icon: UtensilsCrossed,
		desc: "Quán ăn gia đình Việt Nam: phở, bún, cơm phần, lẩu & nướng. Trải nghiệm đặt món ngay tại bàn ăn.",
		showcaseUrl: "/quan-ban-ban/showcase",
		guestUrl: "/quan-ban-ban/demoquanbanban01",
	},
]

export function DemoSelectorModal({
	children,
}: {
	children?: React.ReactNode
}) {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<>
			<div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
				{children || (
					<Button size="lg" variant="outline" className="bg-white">
						<Sparkles className="mr-1 h-4 w-4 text-primary" />
						Xem 3 Menu Demo
					</Button>
				)}
			</div>

			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-2xl sm:p-8">
						<button
							onClick={() => setIsOpen(false)}
							className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition"
							aria-label="Đóng"
						>
							<X className="h-5 w-5" />
						</button>

						<div className="mb-6">
							<div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-primary">
								<Sparkles className="h-3.5 w-3.5" /> Trải nghiệm thực tế
							</div>
							<h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
								Chọn Mẫu Demo Bạn Muốn Xem
							</h3>
							<p className="mt-1 text-sm text-slate-600">
								Hệ thống hỗ trợ nhiều kiểu dáng thiết kế thực đơn phù hợp với từng mô hình nhà hàng khác nhau.
							</p>
						</div>

						<div className="grid gap-4 sm:grid-cols-3">
							{DEMO_STORES.map((store) => {
								const Icon = store.icon
								return (
									<div
										key={store.slug}
										className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 transition hover:border-orange-300 hover:bg-white hover:shadow-md"
									>
										<div>
											<div className="flex items-center justify-between">
												<span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-primary">
													<Icon className="h-5 w-5" />
												</span>
												<span
													className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${store.badgeColor}`}
												>
													{store.badge}
												</span>
											</div>

											<h4 className="mt-4 font-bold text-slate-900">{store.name}</h4>
											<p className="mt-1 text-xs text-slate-500 font-mono">{store.template}</p>
											<p className="mt-2 text-xs leading-relaxed text-slate-600">
												{store.desc}
											</p>
										</div>

										<div className="mt-5 space-y-2 pt-2 border-t border-slate-100">
											<Link
												href={store.showcaseUrl}
												onClick={() => setIsOpen(false)}
												className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 transition"
											>
												<ExternalLink className="h-3.5 w-3.5" />
												Xem Màn Hình Menu
											</Link>
											<Link
												href={store.guestUrl}
												onClick={() => setIsOpen(false)}
												className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition"
											>
												<QrCode className="h-3.5 w-3.5 text-slate-400" />
												Thử Đặt Món Tại Bàn
											</Link>
										</div>
									</div>
								)
							})}
						</div>

						<div className="mt-6 flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
							<span>
								💡 Mẹo: Mọi dữ liệu đặt món trên demo đều đồng bộ realtime tới màn hình Bếp.
							</span>
							<button
								onClick={() => setIsOpen(false)}
								className="font-medium text-primary hover:underline"
							>
								Đóng lại
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
