"use client"

import { useActionState } from "react"
import Link from "next/link"
import {
	AlertCircle,
	ArrowRight,
	CheckCircle2,
	Loader2,
	Mail,
	UserRound,
} from "lucide-react"
import { signUp, type AuthState } from "@/app/(auth)/actions"
import { AuthShell } from "@/components/auth/auth-shell"
import { PasswordField } from "@/components/auth/password-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
	const [state, action, pending] = useActionState<AuthState, FormData>(
		signUp,
		undefined,
	)

	return (
		<AuthShell
			title="Bắt đầu với SmartMenu"
			description="Tạo tài khoản chủ quán và đưa menu của bạn lên online trong vài phút."
		>
			<div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-xl shadow-orange-100/50 sm:p-8">
				<form action={action} className="space-y-5">
					<div className="space-y-2">
						<Label htmlFor="full_name">Họ và tên</Label>
						<div className="relative">
							<UserRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
							<Input
								id="full_name"
								name="full_name"
								autoComplete="name"
								placeholder="Nguyễn Văn An"
								className="h-11 pl-10"
								maxLength={120}
								required
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<div className="relative">
							<Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
							<Input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								placeholder="ban@nhahang.vn"
								className="h-11 pl-10"
								required
							/>
						</div>
					</div>

					<PasswordField
						label="Mật khẩu (tối thiểu 8 ký tự)"
						minLength={8}
						autoComplete="new-password"
					/>

					<div className="grid gap-2 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 sm:grid-cols-2">
						<Benefit text="Tạo nhiều nhà hàng" />
						<Benefit text="Menu QR miễn phí" />
						<Benefit text="Quản lý đơn realtime" />
						<Benefit text="Không cần thẻ thanh toán" />
					</div>

					{state?.error && (
						<div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
							<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
							{state.error}
						</div>
					)}

					<Button type="submit" size="lg" className="w-full" disabled={pending}>
						{pending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<ArrowRight className="h-4 w-4" />
						)}
						{pending ? "Đang tạo tài khoản..." : "Tạo tài khoản miễn phí"}
					</Button>
				</form>

				<p className="mt-6 text-center text-sm text-muted-foreground">
					Đã có tài khoản?{" "}
					<Link
						href="/login"
						className="font-semibold text-primary hover:underline"
					>
						Đăng nhập
					</Link>
				</p>
			</div>
			<p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
				Khi đăng ký, bạn xác nhận đồng ý sử dụng SmartMenu cho hoạt động nhà
				hàng hợp pháp.
			</p>
		</AuthShell>
	)
}

function Benefit({ text }: { text: string }) {
	return (
		<span className="flex items-center gap-2">
			<CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
			{text}
		</span>
	)
}
