"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, PenLine } from "lucide-react"
import { saveDescriptions } from "@/app/(owner)/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { aiErrorMessage } from "./ai-errors"

type Suggestion = { id: string; name: string; description: string; keep: boolean }

/** Draft descriptions for dishes that have none, review, then save in one go. */
export function AiDescriptions({
	restaurantId,
	missingCount,
}: {
	restaurantId: string
	missingCount: number
}) {
	const router = useRouter()
	const [busy, setBusy] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)
	const [list, setList] = useState<Suggestion[] | null>(null)

	if (missingCount === 0 && !list && !notice) return null

	async function generate() {
		setBusy(true)
		setError(null)
		setNotice(null)
		try {
			const res = await fetch("/api/ai/descriptions", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ restaurantId }),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok) return setError(aiErrorMessage(data.error))
			const suggestions = (data.suggestions ?? []) as Omit<Suggestion, "keep">[]
			if (!suggestions.length)
				return setError("AI chưa viết được mô tả nào. Thử lại sau nhé.")
			setList(suggestions.map((s) => ({ ...s, keep: true })))
		} catch {
			setError("Không kết nối được. Kiểm tra mạng.")
		} finally {
			setBusy(false)
		}
	}

	async function save() {
		if (!list) return
		setSaving(true)
		const updates = list
			.filter((s) => s.keep && s.description.trim())
			.map(({ id, description }) => ({ id, description }))
		const res = await saveDescriptions(restaurantId, updates)
		setSaving(false)
		setList(null)
		setNotice(`Đã lưu mô tả cho ${res.saved} món.`)
		router.refresh()
	}

	const update = (i: number, patch: Partial<Suggestion>) =>
		setList((l) => l?.map((s, j) => (j === i ? { ...s, ...patch } : s)) ?? null)

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<PenLine className="h-4 w-4 text-primary" />
					Viết mô tả món (AI)
				</CardTitle>
				<p className="text-sm text-muted-foreground">
					Câu ngắn, nói rõ nguyên liệu và cách làm, không dùng lời quảng cáo sáo
					rỗng. Bạn sửa lại trước khi lưu.
				</p>
			</CardHeader>
			<CardContent className="space-y-3">
				{!list && missingCount > 0 && (
					<Button type="button" variant="outline" disabled={busy} onClick={generate}>
						{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{busy
							? "AI đang viết…"
							: `Viết mô tả cho ${Math.min(missingCount, 40)} món chưa có mô tả`}
					</Button>
				)}
				{error && <p className="text-sm text-destructive">{error}</p>}
				{notice && <p className="text-sm text-muted-foreground">{notice}</p>}

				{list && (
					<>
						<ul className="space-y-3">
							{list.map((s, i) => (
								<li
									key={s.id}
									className={cn("grid grid-cols-[auto_1fr] gap-2", !s.keep && "opacity-50")}
								>
									<input
										type="checkbox"
										className="mt-1 h-4 w-4"
										checked={s.keep}
										aria-label={`Giữ mô tả cho ${s.name}`}
										onChange={(e) => update(i, { keep: e.target.checked })}
									/>
									<div className="space-y-1">
										<p className="text-sm font-medium">{s.name}</p>
										<Textarea
											rows={2}
											value={s.description}
											aria-label={`Mô tả ${s.name}`}
											onChange={(e) => update(i, { description: e.target.value })}
										/>
									</div>
								</li>
							))}
						</ul>
						<div className="flex gap-2">
							<Button type="button" disabled={saving} onClick={save}>
								{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Lưu {list.filter((s) => s.keep).length} mô tả
							</Button>
							<Button type="button" variant="ghost" disabled={saving} onClick={() => setList(null)}>
								Huỷ
							</Button>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	)
}
