"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Calls /api/ai/description to draft a Vietnamese dish description. Gracefully
 * disables itself when the AI feature is off (no LLM key configured). */
export function AiDescriptionButton({
	getName,
	onResult,
}: {
	getName: () => string
	onResult: (text: string) => void
}) {
	const [busy, setBusy] = useState(false)
	const [disabled, setDisabled] = useState(false)

	async function run() {
		const name = getName().trim()
		if (!name) return
		setBusy(true)
		try {
			const res = await fetch("/api/ai/description", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ name }),
			})
			const data = await res.json()
			if (data.aiEnabled === false) setDisabled(true)
			if (data.text) onResult(data.text)
		} finally {
			setBusy(false)
		}
	}

	return (
		<Button
			type="button"
			variant="outline"
			size="icon"
			title={disabled ? "Chưa cấu hình LLM key" : "Gợi ý mô tả bằng AI"}
			disabled={busy || disabled}
			onClick={run}
		>
			<Sparkles className="h-4 w-4" />
		</Button>
	)
}
