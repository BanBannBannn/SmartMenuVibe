"use client"

import { useActionState } from "react"
import Link from "next/link"
import { signUp, type AuthState } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegisterPage() {
	const [state, action, pending] = useActionState<AuthState, FormData>(
		signUp,
		undefined,
	)
	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Tạo tài khoản chủ quán</CardTitle>
				</CardHeader>
				<CardContent>
					<form action={action} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="full_name">Họ tên</Label>
							<Input id="full_name" name="full_name" required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" name="email" type="email" required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Mật khẩu (≥ 8 ký tự)</Label>
							<Input id="password" name="password" type="password" required />
						</div>
						{state?.error && (
							<p className="text-sm text-destructive">{state.error}</p>
						)}
						<Button type="submit" className="w-full" disabled={pending}>
							{pending ? "Đang tạo..." : "Tạo tài khoản"}
						</Button>
					</form>
					<p className="mt-4 text-center text-sm text-muted-foreground">
						Đã có tài khoản?{" "}
						<Link href="/login" className="text-primary underline">
							Đăng nhập
						</Link>
					</p>
				</CardContent>
			</Card>
		</main>
	)
}
