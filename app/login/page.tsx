"use client"

import { useActionState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { signIn, type AuthState } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
	const params = useSearchParams()
	const redirectTo = params.get("redirect") ?? "/dashboard"
	const [state, action, pending] = useActionState<AuthState, FormData>(
		signIn,
		undefined,
	)
	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Đăng nhập SmartMenu</CardTitle>
				</CardHeader>
				<CardContent>
					<form action={action} className="space-y-4">
						<input type="hidden" name="redirect" value={redirectTo} />
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" name="email" type="email" required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Mật khẩu</Label>
							<Input id="password" name="password" type="password" required />
						</div>
						{state?.error && (
							<p className="text-sm text-destructive">{state.error}</p>
						)}
						<Button type="submit" className="w-full" disabled={pending}>
							{pending ? "Đang đăng nhập..." : "Đăng nhập"}
						</Button>
					</form>
					<p className="mt-4 text-center text-sm text-muted-foreground">
						Chưa có tài khoản?{" "}
						<Link href="/register" className="text-primary underline">
							Đăng ký
						</Link>
					</p>
				</CardContent>
			</Card>
		</main>
	)
}
