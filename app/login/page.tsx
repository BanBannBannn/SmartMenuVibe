"use client"

import { Suspense, useActionState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AlertCircle, ArrowRight, Loader2, Mail } from "lucide-react"
import { signIn, type AuthState } from "@/app/(auth)/actions"
import { AuthShell } from "@/components/auth/auth-shell"
import { PasswordField } from "@/components/auth/password-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function LoginForm() {
	const params = useSearchParams()
	const redirectTo = params.get("redirect") ?? "/dashboard"
	const [state, action, pending] = useActionState<AuthState, FormData>(
		signIn,
		undefined,
	)

	return (
		<AuthShell
			title="Chào mừng trở lại"
			description="Đăng nhập để tiếp tục quản lý nhà hàng và các đơn hàng của bạn."
		>
			<div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-xl shadow-orange-100/50 sm:p-8">
				<form action={action} className="space-y-5">
					<input type="hidden" name="redirect" value={redirectTo} />
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

					<PasswordField autoComplete="current-password" />

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
						{pending ? "Đang đăng nhập..." : "Đăng nhập"}
					</Button>
				</form>

				<div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
					<span className="h-px flex-1 bg-border" />
					Tài khoản dành cho chủ quán và nhân viên
					<span className="h-px flex-1 bg-border" />
				</div>

				<p className="text-center text-sm text-muted-foreground">
					Chưa có tài khoản?{" "}
					<Link
						href="/register"
						className="font-semibold text-primary hover:underline"
					>
						Đăng ký miễn phí
					</Link>
				</p>
			</div>
			<p className="mt-5 text-center text-xs text-muted-foreground">
				Bằng cách tiếp tục, bạn đồng ý sử dụng SmartMenu cho hoạt động nhà hàng
				hợp pháp.
			</p>
		</AuthShell>
	)
}

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className="grid min-h-screen place-items-center bg-[#fffaf6]">
					<Loader2 className="h-7 w-7 animate-spin text-primary" />
				</div>
			}
		>
			<LoginForm />
		</Suspense>
	)
}
