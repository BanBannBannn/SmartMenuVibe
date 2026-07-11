"use client"

import { Loader2, Save } from "lucide-react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"

export function SaveButton({
	idleLabel = "Lưu thay đổi",
	pendingLabel = "Đang lưu...",
}: {
	idleLabel?: string
	pendingLabel?: string
}) {
	const { pending } = useFormStatus()
	return (
		<Button type="submit" disabled={pending} className="min-w-36">
			{pending ? (
				<Loader2 className="h-4 w-4 animate-spin" />
			) : (
				<Save className="h-4 w-4" />
			)}
			{pending ? pendingLabel : idleLabel}
		</Button>
	)
}
