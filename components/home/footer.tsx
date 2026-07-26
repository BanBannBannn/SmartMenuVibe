import Link from "next/link"
import { FeedbackModal } from "@/components/home/feedback-modal"

export function Footer() {
	return (
		<footer className="border-t border-orange-100 bg-white py-10">
			<div className="container flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
				<div>
					<p className="text-sm font-semibold text-slate-900">
						SmartMenu · Open Source Showcase
					</p>
					<p className="mt-1 text-xs text-muted-foreground">
						Phát triển bởi <span className="font-medium text-slate-700">Trần Văn Gia Bân</span> (BanBannBannn) · Tham khảo mã nguồn & Kiến trúc.
					</p>
				</div>
				<div className="flex flex-wrap items-center justify-center sm:justify-end gap-6 text-xs text-muted-foreground">
					<Link href="/privacy" className="hover:text-primary transition">
						Chính sách bảo mật
					</Link>
					<Link href="/terms" className="hover:text-primary transition">
						Điều khoản sử dụng
					</Link>
					<FeedbackModal />
				</div>
			</div>
		</footer>
	)
}
