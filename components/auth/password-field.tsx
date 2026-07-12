"use client"

import { useState } from "react"
import { Eye, EyeOff, LockKeyhole } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PasswordField({
	label = "Mật khẩu",
	minLength,
	autoComplete,
}: {
	label?: string
	minLength?: number
	autoComplete: "current-password" | "new-password"
}) {
	const [visible, setVisible] = useState(false)
	return (
		<div className="space-y-2">
			<Label htmlFor="password">{label}</Label>
			<div className="relative">
				<LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
				<Input
					id="password"
					name="password"
					type={visible ? "text" : "password"}
					autoComplete={autoComplete}
					minLength={minLength}
					className="h-11 pl-10 pr-11"
					required
				/>
				<button
					type="button"
					onClick={() => setVisible((current) => !current)}
					className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
					aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
				>
					{visible ? (
						<EyeOff className="h-4 w-4" />
					) : (
						<Eye className="h-4 w-4" />
					)}
				</button>
			</div>
		</div>
	)
}
