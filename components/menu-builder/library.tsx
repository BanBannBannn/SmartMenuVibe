"use client"

import { useMemo, useState } from "react"
import {
	Circle,
	Image as ImageIcon,
	Layers,
	Minus,
	PlusCircle,
	Search,
	Square,
	Type,
	UtensilsCrossed,
	LayoutList,
	Lock,
} from "lucide-react"
import type { MenuElement } from "@/lib/menu-layout"
import { formatVnd, cn } from "@/lib/utils"

// =============================================================================
// Left rail: what you can drop onto the canvas, plus the layer stack.
// =============================================================================

export type LibraryItem = {
	id: string
	name: string
	base_price: number
	images: string[]
	categoryId: string
}
export type LibraryCategory = { id: string; name: string }

export type AddRequest =
	| { kind: "item"; itemId: string }
	| { kind: "category"; categoryId: string }
	| { kind: "text"; preset: "heading" | "subheading" | "body" }
	| { kind: "shape"; shape: "rect" | "ellipse" | "line" }
	| { kind: "image" }

const blockCls =
	"flex flex-col items-center justify-center gap-1 rounded-xl border bg-background px-2 py-3 text-[11px] font-medium transition hover:border-primary hover:bg-primary/5"

function elementLabel(el: MenuElement, lookup: Map<string, string>): string {
	switch (el.type) {
		case "text":
			return el.text.slice(0, 28) || "(chữ trống)"
		case "item":
			return lookup.get(el.itemId) ?? "Món đã xoá"
		case "category":
			return `Khối: ${lookup.get(el.categoryId) ?? "danh mục đã xoá"}`
		case "shape":
			return el.shape === "line"
				? "Đường kẻ"
				: el.shape === "ellipse"
					? "Hình tròn"
					: "Hình chữ nhật"
		case "image":
			return "Ảnh"
	}
}

function ElementIcon({ el }: { el: MenuElement }) {
	const cls = "h-3.5 w-3.5 shrink-0 text-muted-foreground"
	switch (el.type) {
		case "text":
			return <Type className={cls} />
		case "item":
			return <UtensilsCrossed className={cls} />
		case "category":
			return <LayoutList className={cls} />
		case "image":
			return <ImageIcon className={cls} />
		case "shape":
			return el.shape === "ellipse" ? (
				<Circle className={cls} />
			) : el.shape === "line" ? (
				<Minus className={cls} />
			) : (
				<Square className={cls} />
			)
	}
}

export function LibraryPanel({
	items,
	categories,
	elements,
	selectedIds,
	onAdd,
	onSelect,
}: {
	items: LibraryItem[]
	categories: LibraryCategory[]
	elements: MenuElement[]
	selectedIds: string[]
	onAdd: (req: AddRequest) => void
	onSelect: (ids: string[]) => void
}) {
	const [tab, setTab] = useState<"add" | "layers">("add")
	const [query, setQuery] = useState("")

	const lookup = useMemo(() => {
		const m = new Map<string, string>()
		for (const i of items) m.set(i.id, i.name)
		for (const c of categories) m.set(c.id, c.name)
		return m
	}, [items, categories])

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase()
		if (!q) return items
		return items.filter((i) => i.name.toLowerCase().includes(q))
	}, [items, query])

	const grouped = useMemo(() => {
		return categories
			.map((c) => ({
				category: c,
				items: filtered.filter((i) => i.categoryId === c.id),
			}))
			.filter((g) => g.items.length > 0)
	}, [categories, filtered])

	return (
		<div className="flex h-full flex-col">
			<div className="flex gap-1 border-b p-2">
				{(
					[
						["add", "Thêm", PlusCircle],
						["layers", `Lớp (${elements.length})`, Layers],
					] as const
				).map(([id, label, Icon]) => (
					<button
						key={id}
						type="button"
						onClick={() => setTab(id)}
						className={cn(
							"flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium",
							tab === id
								? "bg-primary/10 text-primary"
								: "text-muted-foreground hover:bg-muted",
						)}
					>
						<Icon className="h-4 w-4" /> {label}
					</button>
				))}
			</div>

			{tab === "add" ? (
				<div className="flex-1 space-y-4 overflow-y-auto p-3">
					<div className="grid grid-cols-3 gap-1.5">
						<button
							type="button"
							className={blockCls}
							onClick={() => onAdd({ kind: "text", preset: "heading" })}
						>
							<Type className="h-4 w-4" /> Tiêu đề
						</button>
						<button
							type="button"
							className={blockCls}
							onClick={() => onAdd({ kind: "text", preset: "body" })}
						>
							<Type className="h-3.5 w-3.5" /> Đoạn chữ
						</button>
						<button
							type="button"
							className={blockCls}
							onClick={() => onAdd({ kind: "image" })}
						>
							<ImageIcon className="h-4 w-4" /> Ảnh
						</button>
						<button
							type="button"
							className={blockCls}
							onClick={() => onAdd({ kind: "shape", shape: "rect" })}
						>
							<Square className="h-4 w-4" /> Khối
						</button>
						<button
							type="button"
							className={blockCls}
							onClick={() => onAdd({ kind: "shape", shape: "ellipse" })}
						>
							<Circle className="h-4 w-4" /> Tròn
						</button>
						<button
							type="button"
							className={blockCls}
							onClick={() => onAdd({ kind: "shape", shape: "line" })}
						>
							<Minus className="h-4 w-4" /> Kẻ
						</button>
					</div>

					<div className="space-y-1.5">
						<p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
							Khối danh mục (tự cập nhật)
						</p>
						{categories.map((c) => (
							<button
								key={c.id}
								type="button"
								onClick={() => onAdd({ kind: "category", categoryId: c.id })}
								className="flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition hover:border-primary hover:bg-primary/5"
							>
								<LayoutList className="h-4 w-4 shrink-0 text-muted-foreground" />
								<span className="truncate">{c.name}</span>
							</button>
						))}
						{categories.length === 0 && (
							<p className="text-xs text-muted-foreground">
								Chưa có danh mục nào.
							</p>
						)}
					</div>

					<div className="space-y-2">
						<p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
							Món lẻ
						</p>
						<div className="relative">
							<Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
							<input
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Tìm món..."
								className="h-9 w-full rounded-lg border bg-background pl-7 pr-2 text-sm outline-none focus:border-primary"
							/>
						</div>
						{grouped.map((group) => (
							<div key={group.category.id} className="space-y-1">
								<p className="pt-1 text-[11px] font-semibold text-muted-foreground">
									{group.category.name}
								</p>
								{group.items.map((item) => (
									<button
										key={item.id}
										type="button"
										onClick={() => onAdd({ kind: "item", itemId: item.id })}
										className="flex w-full items-center gap-2 rounded-lg border p-1.5 text-left transition hover:border-primary hover:bg-primary/5"
									>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={item.images[0] || "/no-image.svg"}
											alt=""
											className="h-9 w-9 shrink-0 rounded-md object-cover"
										/>
										<span className="min-w-0 flex-1">
											<span className="block truncate text-xs font-medium">
												{item.name}
											</span>
											<span className="block text-[11px] text-muted-foreground">
												{formatVnd(item.base_price)}
											</span>
										</span>
									</button>
								))}
							</div>
						))}
						{grouped.length === 0 && (
							<p className="text-xs text-muted-foreground">
								Không tìm thấy món nào.
							</p>
						)}
					</div>
				</div>
			) : (
				<div className="flex-1 space-y-1 overflow-y-auto p-2">
					{[...elements]
						.sort((a, b) => b.z - a.z)
						.map((el) => (
							<button
								key={el.id}
								type="button"
								onClick={() => onSelect([el.id])}
								className={cn(
									"flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-muted",
									selectedIds.includes(el.id) &&
										"bg-primary/10 font-semibold text-primary",
								)}
							>
								<ElementIcon el={el} />
								<span className="min-w-0 flex-1 truncate">
									{elementLabel(el, lookup)}
								</span>
								{el.locked && (
									<Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
								)}
							</button>
						))}
					{elements.length === 0 && (
						<p className="p-2 text-xs text-muted-foreground">
							Trang đang trống. Chọn một mẫu dựng sẵn ở panel bên phải.
						</p>
					)}
				</div>
			)}
		</div>
	)
}
