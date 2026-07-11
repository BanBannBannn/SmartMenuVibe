"use client"

import { useState } from "react"
import type { AdminCategory, AdminItem } from "@/lib/data/menu-admin"
import {
	createCategory,
	createMenuItem,
	deleteMenuItem,
	toggleItemAvailability,
	updateMenuItem,
} from "@/app/(owner)/actions"
import { AiDescriptionButton } from "@/components/menu/ai-description-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatVnd } from "@/lib/utils"

const NO_IMAGE = "/no-image.svg"

// Image picker with a live preview. Shared by the create and edit forms.
function ImageField({
	name,
	required,
	initialUrl,
}: {
	name: string
	required?: boolean
	initialUrl?: string | null
}) {
	const [preview, setPreview] = useState<string | null>(initialUrl ?? null)
	return (
		<div className="flex items-center gap-3">
			<div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={preview ?? NO_IMAGE}
					alt=""
					className="h-full w-full object-cover"
				/>
			</div>
			<input
				type="file"
				name={name}
				accept="image/*"
				required={required}
				onChange={(e) => {
					const file = e.target.files?.[0]
					setPreview(file ? URL.createObjectURL(file) : (initialUrl ?? null))
				}}
				className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
			/>
		</div>
	)
}

function EditItemForm({
	item,
	restaurantId,
	onDone,
}: {
	item: AdminItem
	restaurantId: string
	onDone: () => void
}) {
	const [saving, setSaving] = useState(false)
	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				setSaving(true)
				try {
					await updateMenuItem(new FormData(e.currentTarget))
					onDone()
				} finally {
					setSaving(false)
				}
			}}
			className="space-y-3 rounded-xl border bg-muted/30 p-3"
		>
			<input type="hidden" name="id" value={item.id} />
			<input type="hidden" name="restaurantId" value={restaurantId} />
			<input type="hidden" name="currentImage" value={item.images[0] ?? ""} />
			<div className="grid gap-2 sm:grid-cols-2">
				<Input
					name="name"
					defaultValue={item.name}
					placeholder="Tên món"
					required
				/>
				<Input
					name="base_price"
					type="number"
					defaultValue={item.base_price}
					placeholder="Giá (VND)"
					required
				/>
			</div>
			<Input
				name="description"
				defaultValue={item.description ?? ""}
				placeholder="Mô tả"
			/>
			<div className="space-y-1">
				<Label className="text-xs text-muted-foreground">
					Đổi ảnh (bỏ trống nếu giữ ảnh hiện tại)
				</Label>
				<ImageField name="image" initialUrl={item.images[0] ?? null} />
			</div>
			<div className="flex gap-2">
				<Button type="submit" size="sm" disabled={saving}>
					{saving ? "Đang lưu..." : "Lưu thay đổi"}
				</Button>
				<Button type="button" size="sm" variant="ghost" onClick={onDone}>
					Huỷ
				</Button>
			</div>
		</form>
	)
}

export function MenuManager({
	restaurantId,
	menuId,
	categories,
	items,
}: {
	restaurantId: string
	menuId: string
	categories: AdminCategory[]
	items: AdminItem[]
}) {
	const [desc, setDesc] = useState("")
	const [editingId, setEditingId] = useState<string | null>(null)
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Thêm danh mục</CardTitle>
				</CardHeader>
				<CardContent>
					<form action={createCategory} className="flex gap-2">
						<input type="hidden" name="menuId" value={menuId} />
						<input type="hidden" name="restaurantId" value={restaurantId} />
						<Input name="name" placeholder="Tên danh mục" required />
						<Button type="submit">Thêm</Button>
					</form>
				</CardContent>
			</Card>

			{categories.map((cat) => (
				<Card key={cat.id}>
					<CardHeader>
						<CardTitle className="text-base">{cat.name}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<ul className="divide-y">
							{items
								.filter((i) => i.category_id === cat.id)
								.map((item) =>
									editingId === item.id ? (
										<li key={item.id} className="py-3">
											<EditItemForm
												item={item}
												restaurantId={restaurantId}
												onDone={() => setEditingId(null)}
											/>
										</li>
									) : (
										<li
											key={item.id}
											className="flex items-center justify-between gap-3 py-2"
										>
											<div className="flex min-w-0 items-center gap-3">
												<div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-muted">
													{/* eslint-disable-next-line @next/next/no-img-element */}
													<img
														src={item.images[0] || NO_IMAGE}
														alt={item.name}
														className="h-full w-full object-cover"
													/>
												</div>
												<div className="min-w-0">
													<p className="truncate font-medium">{item.name}</p>
													<p className="text-sm text-muted-foreground">
														{formatVnd(item.base_price)}
													</p>
												</div>
											</div>
											<div className="flex shrink-0 items-center gap-2">
												<Button
													size="sm"
													variant={item.is_available ? "outline" : "secondary"}
													onClick={() =>
														toggleItemAvailability(item.id, !item.is_available)
													}
												>
													{item.is_available ? "Còn hàng" : "Hết hàng"}
												</Button>
												<Button
													size="sm"
													variant="outline"
													onClick={() => setEditingId(item.id)}
												>
													Sửa
												</Button>
												<Button
													size="sm"
													variant="ghost"
													onClick={() => deleteMenuItem(item.id)}
												>
													Xoá
												</Button>
											</div>
										</li>
									),
								)}
						</ul>

						<form action={createMenuItem} className="grid gap-2 sm:grid-cols-2">
							<input type="hidden" name="categoryId" value={cat.id} />
							<input type="hidden" name="restaurantId" value={restaurantId} />
							<Input
								name="name"
								placeholder="Tên món"
								required
								id={`name-${cat.id}`}
							/>
							<Input
								name="base_price"
								type="number"
								placeholder="Giá (VND)"
								required
							/>
							<div className="sm:col-span-2">
								<div className="flex gap-2">
									<Input
										name="description"
										placeholder="Mô tả"
										value={desc}
										onChange={(e) => setDesc(e.target.value)}
									/>
									<AiDescriptionButton
										getName={() =>
											(
												document.getElementById(
													`name-${cat.id}`,
												) as HTMLInputElement
											)?.value ?? ""
										}
										onResult={setDesc}
									/>
								</div>
							</div>
							<div className="space-y-1 sm:col-span-2">
								<Label className="text-xs text-muted-foreground">
									Ảnh món (bắt buộc)
								</Label>
								<ImageField name="image" required />
							</div>
							<Button type="submit" className="sm:col-span-2">
								Thêm món
							</Button>
						</form>
					</CardContent>
				</Card>
			))}
			{categories.length === 0 && (
				<p className="text-muted-foreground">
					Hãy tạo danh mục đầu tiên ở trên.
				</p>
			)}
		</div>
	)
}
