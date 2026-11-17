"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles, Upload, X } from "lucide-react"
import { importMenuDraft } from "@/app/(owner)/actions"
import type { MenuDraft } from "@/lib/ai/menu-import"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { aiErrorMessage } from "./ai-errors"

type EditItem = MenuDraft["categories"][number]["items"][number] & {
	include: boolean
}
type EditCategory = { name: string; items: EditItem[] }


const vnd = (n: number) => n.toLocaleString("vi-VN") + "đ"

/**
 * Downscale photos in the browser: phone photos are 3-8 MB, the API accepts
 * ~4 MB total, and 1800 px on the long side is plenty to read a menu.
 */
async function prepareFile(file: File): Promise<File> {
	if (!file.type.startsWith("image/")) return file
	try {
		const bitmap = await createImageBitmap(file)
		const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height))
		const canvas = document.createElement("canvas")
		canvas.width = Math.round(bitmap.width * scale)
		canvas.height = Math.round(bitmap.height * scale)
		canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
		const blob = await new Promise<Blob | null>((r) =>
			canvas.toBlob(r, "image/jpeg", 0.85),
		)
		return blob ? new File([blob], "menu.jpg", { type: "image/jpeg" }) : file
	} catch {
		return file // browser could not decode (e.g. HEIC on Chrome): send as-is
	}
}

function hasPrice(item: EditItem) {
	return (item.price ?? 0) > 0 || item.variants.length > 0
}

export function AiMenuImport({
	restaurantId,
	menuId,
}: {
	restaurantId: string
	menuId: string
}) {
	const router = useRouter()
	const inputRef = useRef<HTMLInputElement>(null)
	const [busy, setBusy] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)
	const [draft, setDraft] = useState<EditCategory[] | null>(null)

	async function read(fileList: FileList | null) {
		const files = Array.from(fileList ?? []).slice(0, 3)
		if (!files.length) return
		setBusy(true)
		setError(null)
		setNotice(null)
		try {
			const form = new FormData()
			for (const f of await Promise.all(files.map(prepareFile)))
				form.append("files", f)
			const res = await fetch("/api/ai/menu-import", { method: "POST", body: form })
			const data = await res.json().catch(() => ({}))
			if (!res.ok) {
				setError(
					data.error === "BAD_OUTPUT"
						? "AI đọc menu không thành công. Thử ảnh rõ hơn, chụp thẳng và đủ sáng."
						: aiErrorMessage(data.error),
				)
				return
			}
			const cats = (data.draft as MenuDraft).categories
			if (!cats.length) {
				setError("Không tìm thấy món nào trong ảnh. Ảnh có đúng là menu không?")
				return
			}
			setDraft(
				cats.map((c) => ({
					name: c.name,
					items: c.items.map((i) => ({ ...i, include: true })),
				})),
			)
			if (typeof data.remaining === "number")
				setNotice(`Còn ${data.remaining} lượt hôm nay.`)
		} catch {
			setError("Không gửi được ảnh. Kiểm tra kết nối mạng.")
		} finally {
			setBusy(false)
			if (inputRef.current) inputRef.current.value = ""
		}
	}

	function updateItem(ci: number, ii: number, patch: Partial<EditItem>) {
		setDraft((d) =>
			d?.map((c, i) =>
				i !== ci
					? c
					: { ...c, items: c.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) },
			) ?? null,
		)
	}

	const included = draft?.flatMap((c) => c.items.filter((i) => i.include)) ?? []
	const missingPrice = included.filter((i) => !hasPrice(i)).length

	async function save() {
		if (!draft) return
		setSaving(true)
		setError(null)
		const payload: MenuDraft = {
			categories: draft
				.map((c) => ({
					name: c.name.trim() || "Khác",
					items: c.items
						.filter((i) => i.include)
						.map(({ include: _include, ...item }) => ({
							...item,
							name: item.name.trim(),
							price: item.price && item.price > 0 ? item.price : null,
						})),
				}))
				.filter((c) => c.items.length > 0),
		}
		const res = await importMenuDraft(restaurantId, menuId, payload)
		setSaving(false)
		if (!res.ok) {
			setError("Lưu không thành công. Kiểm tra lại tên món và giá.")
			return
		}
		setDraft(null)
		setNotice(
			`Đã thêm ${res.items} món` +
				(res.categories ? `, ${res.categories} danh mục mới` : "") +
				(res.skipped ? `. Bỏ qua ${res.skipped} món đã có.` : "."),
		)
		router.refresh()
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Sparkles className="h-4 w-4 text-primary" />
					Nhập menu từ ảnh (AI)
				</CardTitle>
				<p className="text-sm text-muted-foreground">
					Chụp menu giấy hoặc tải PDF, AI sẽ đọc tên món và giá. Bạn kiểm tra lại trước
					khi lưu. Tối đa 3 ảnh mỗi lần, 5 lần mỗi ngày.
				</p>
			</CardHeader>
			<CardContent className="space-y-4">
				<input
					ref={inputRef}
					type="file"
					accept="image/jpeg,image/png,image/webp,application/pdf"
					multiple
					hidden
					onChange={(e) => read(e.target.files)}
				/>
				{!draft && (
					<Button
						type="button"
						variant="outline"
						disabled={busy}
						onClick={() => inputRef.current?.click()}
					>
						{busy ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								AI đang đọc menu… (khoảng 10-40 giây)
							</>
						) : (
							<>
								<Upload className="mr-2 h-4 w-4" />
								Chọn ảnh hoặc PDF menu
							</>
						)}
					</Button>
				)}

				{error && <p className="text-sm text-destructive">{error}</p>}
				{notice && <p className="text-sm text-muted-foreground">{notice}</p>}

				{draft && (
					<div className="space-y-4">
						<p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
							AI có thể đọc nhầm. Hãy kiểm tra <strong>tên món và giá</strong> trước khi
							lưu. Bỏ chọn những dòng không phải món ăn.
						</p>

						{draft.map((cat, ci) => (
							<div key={ci} className="space-y-2 rounded-lg border p-3">
								<Input
									value={cat.name}
									aria-label="Tên danh mục"
									className="font-semibold"
									onChange={(e) =>
										setDraft((d) =>
											d?.map((c, i) => (i === ci ? { ...c, name: e.target.value } : c)) ?? null,
										)
									}
								/>
								<ul className="space-y-2">
									{cat.items.map((item, ii) => (
										<li
											key={ii}
											className={cn(
												"grid grid-cols-[auto_1fr] gap-2 sm:grid-cols-[auto_1fr_8rem]",
												!item.include && "opacity-50",
											)}
										>
											<input
												type="checkbox"
												className="mt-3 h-4 w-4"
												checked={item.include}
												aria-label={`Thêm ${item.name}`}
												onChange={(e) => updateItem(ci, ii, { include: e.target.checked })}
											/>
											<div className="space-y-1">
												<Input
													value={item.name}
													aria-label="Tên món"
													onChange={(e) => updateItem(ci, ii, { name: e.target.value })}
												/>
												{item.description && (
													<p className="text-xs text-muted-foreground">{item.description}</p>
												)}
												{item.variants.length > 0 && (
													<div className="flex flex-wrap gap-1">
														{item.variants.map((v, vi) => (
															<span
																key={vi}
																className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
															>
																{v.name} · {vnd(v.price)}
																<button
																	type="button"
																	aria-label={`Bỏ lựa chọn ${v.name}`}
																	onClick={() =>
																		updateItem(ci, ii, {
																			variants: item.variants.filter((_, k) => k !== vi),
																		})
																	}
																>
																	<X className="h-3 w-3" />
																</button>
															</span>
														))}
													</div>
												)}
											</div>
											<Input
												type="number"
												inputMode="numeric"
												min={0}
												step={1000}
												placeholder="Giá (đ)"
												aria-label="Giá"
												value={item.price ?? ""}
												className={cn(
													"col-start-2 sm:col-start-auto",
													item.include && !hasPrice(item) && "border-destructive",
												)}
												onChange={(e) =>
													updateItem(ci, ii, {
														price: e.target.value === "" ? null : Math.round(Number(e.target.value)),
													})
												}
											/>
										</li>
									))}
								</ul>
							</div>
						))}

						<div className="flex flex-wrap items-center gap-2">
							<Button
								type="button"
								disabled={saving || included.length === 0 || missingPrice > 0}
								onClick={save}
							>
								{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Lưu {included.length} món vào menu
							</Button>
							<Button type="button" variant="ghost" disabled={saving} onClick={() => setDraft(null)}>
								Huỷ
							</Button>
							{missingPrice > 0 && (
								<span className="text-sm text-destructive">
									{missingPrice} món chưa có giá
								</span>
							)}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
