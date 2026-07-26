import Link from "next/link"
import { ArrowLeft, FileText, UtensilsCrossed } from "lucide-react"
import { Footer } from "@/components/home/footer"

export const metadata = {
	title: "Điều khoản sử dụng | SmartMenu",
	description: "Điều khoản sử dụng dịch vụ và tuyên bố dự án mã nguồn mở SmartMenu.",
}

export default function TermsPage() {
	return (
		<div className="min-h-screen bg-[#fffaf6] text-slate-800">
			<header className="border-b border-orange-100 bg-white">
				<div className="container flex items-center justify-between py-4">
					<Link href="/" className="flex items-center gap-3">
						<span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white shadow-md shadow-orange-200">
							<UtensilsCrossed className="h-4 w-4" />
						</span>
						<span className="font-bold">SmartMenu</span>
					</Link>
					<Link
						href="/"
						className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-primary transition"
					>
						<ArrowLeft className="h-4 w-4" /> Quay lại trang chủ
					</Link>
				</div>
			</header>

			<main className="container max-w-4xl py-12">
				<div className="rounded-3xl border border-orange-100 bg-white p-8 shadow-sm sm:p-12">
					<div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700">
						<FileText className="h-4 w-4" /> Quy định & Điều khoản
					</div>

					<h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
						Điều khoản sử dụng dịch vụ
					</h1>
					<p className="mt-2 text-sm text-slate-500">
						Cập nhật lần cuối: Tháng 7, 2026 · Nền tảng SmartMenu Restaurant OS
					</p>

					<div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700">
						<section>
							<h2 className="text-lg font-bold text-slate-900">1. Chấp nhận điều khoản</h2>
							<p className="mt-2">
								Khi truy cập, trải nghiệm hệ thống SmartMenu hoặc sử dụng mã nguồn dự án, quý khách đồng ý tuân thủ các quy định được nêu trong Điều khoản dịch vụ này.
							</p>
						</section>

						<section>
							<h2 className="text-lg font-bold text-slate-900">2. Tuyên bố Dự án Mẫu / Open Source Showcase</h2>
							<p className="mt-2">
								SmartMenu là một dự án **Mã nguồn mở (Open Source Showcase)** được phát triển bởi **Trần Văn Gia Bân** nhằm mục đích demo giao diện, thử nghiệm giải pháp menu số cho nhà hàng và chia sẻ tài liệu tham khảo kiến trúc ứng dụng Next.js 16 + Supabase.
							</p>
							<ul className="mt-2 list-disc space-y-1.5 pl-5">
								<li>Dữ liệu trên 3 nhà hàng demo (`Gà Rán Sài Gòn`, `Circle Bân Mart`, `Quán Bân Bân`) là dữ liệu mẫu thử nghiệm.</li>
								<li>Mã nguồn dự án được công khai trên GitHub để cộng đồng developer tham khảo và đóng góp.</li>
							</ul>
						</section>

						<section>
							<h2 className="text-lg font-bold text-slate-900">3. Quyền hạn và trách nhiệm tài khoản Demo</h2>
							<p className="mt-2">
								Người dùng có thể tự do thử nghiệm các chức năng tạo menu, gọi món tại bàn, nhận đơn bếp và xem báo cáo doanh thu. Vui lòng không tải lên nội dung vi phạm pháp luật, thuần phong mỹ tục hoặc chứa mã độc hại.
							</p>
						</section>

						<section>
							<h2 className="text-lg font-bold text-slate-900">4. Miễn trừ trách nhiệm</h2>
							<p className="mt-2">
								Hệ thống được cung cấp dưới dạng "AS IS" (nguyên bản thử nghiệm). Tác giả không chịu trách nhiệm đối với bất kỳ thiệt hại kinh doanh trực tiếp hoặc gián tiếp nào do việc lạm dụng dữ liệu demo hoặc mã nguồn tự triển khai không đúng quy chuẩn.
							</p>
						</section>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	)
}
