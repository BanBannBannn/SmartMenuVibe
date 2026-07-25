import Link from "next/link"
import { ArrowLeft, ShieldCheck, UtensilsCrossed } from "lucide-react"

export const metadata = {
	title: "Chính sách bảo mật | SmartMenu",
	description: "Chính sách bảo mật thông tin và bảo vệ quyền riêng tư người dùng của SmartMenu.",
}

export default function PrivacyPage() {
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
					<div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700">
						<ShieldCheck className="h-4 w-4" /> An toàn & Bảo mật Dữ liệu
					</div>

					<h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
						Chính sách bảo mật & Quyền riêng tư
					</h1>
					<p className="mt-2 text-sm text-slate-500">
						Cập nhật lần cuối: Tháng 7, 2026 · Áp dụng cho hệ thống SmartMenu Restaurant OS
					</p>

					<div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700">
						<section>
							<h2 className="text-lg font-bold text-slate-900">1. Giới thiệu</h2>
							<p className="mt-2">
								SmartMenu cam kết tôn trọng và bảo vệ quyền riêng tư của quý khách hàng, chủ nhà hàng cũng như thực khách sử dụng dịch vụ xem menu và đặt món số qua mã QR. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo mật dữ liệu.
							</p>
						</section>

						<section>
							<h2 className="text-lg font-bold text-slate-900">2. Thu thập dữ liệu thực khách (QR Guest Order)</h2>
							<p className="mt-2">
								Khi thực khách quét mã QR để gọi món tại bàn:
							</p>
							<ul className="mt-2 list-disc space-y-1.5 pl-5">
								<li>Không yêu cầu tạo tài khoản hay đăng nhập.</li>
								<li>Chúng tôi thu thập thông tin đơn hàng (danh sách món, ghi chú, số bàn, thời gian tạo đơn) để chuyển tới màn hình Bếp.</li>
								<li>Dữ liệu giỏ hàng tạm thời được lưu trong trình duyệt (`localStorage`) của thực khách để duy trì trạng thái gọi món.</li>
							</ul>
						</section>

						<section>
							<h2 className="text-lg font-bold text-slate-900">3. Bảo mật Dữ liệu Sinh trắc học & Camera (Azure Face API)</h2>
							<p className="mt-2">
								Đối với các tính năng thử nghiệm quét khuôn mặt nhận diện thực khách thân thiết:
							</p>
							<ul className="mt-2 list-disc space-y-1.5 pl-5">
								<li>
									<strong>Đồng ý rõ ràng (Consent):</strong> Hệ thống chỉ tiến hành quét khi nhận được sự đồng ý chủ động của người dùng.
								</li>
								<li>
									<strong>Không lưu trữ hình ảnh gốc:</strong> Hình ảnh khuôn mặt từ camera chỉ được xử lý tạm thời để trích xuất vector khuôn mặt mã hoá (face vector/embedding), hình ảnh gốc sẽ được hủy ngay lập tức.
								</li>
								<li>
									<strong>Tự động xoá dữ liệu (Auto-expiry):</strong> Các nhật ký quét khuôn mặt (`face_scan_logs`) tự động được hệ thống xóa bỏ hoàn toàn sau 30 ngày.
								</li>
							</ul>
						</section>

						<section>
							<h2 className="text-lg font-bold text-slate-900">4. Lưu trữ & An toàn dữ liệu</h2>
							<p className="mt-2">
								Mọi dữ liệu hệ thống được lưu trữ trên hạ tầng điện toán đám mây Supabase (PostgreSQL) với cơ chế phân quyền bảo mật hàng RLS (Row Level Security) nghiêm ngặt, đảm bảo dữ liệu giữa các nhà hàng được cô lập hoàn toàn.
							</p>
						</section>

						<section>
							<h2 className="text-lg font-bold text-slate-900">5. Liên hệ & Hỗ trợ</h2>
							<p className="mt-2">
								Nếu bạn có bất kỳ câu hỏi hoặc thắc mắc nào liên quan đến chính sách bảo mật, vui lòng liên hệ tác giả dự án tại kho lưu trữ GitHub công khai:{" "}
								<a
									href="https://github.com/BanBannBannn/SmartMenuVibe"
									target="_blank"
									rel="noreferrer"
									className="font-medium text-primary hover:underline"
								>
									BanBannBannn/SmartMenuVibe
								</a>.
							</p>
						</section>
					</div>
				</div>
			</main>
		</div>
	)
}
