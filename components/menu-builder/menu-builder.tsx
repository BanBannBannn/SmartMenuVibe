"use client"

import { useMemo, useRef, useState } from "react"
import {
	DndContext,
	useDraggable,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core"
import {
	GripVertical,
	Minus,
	Plus,
	LayoutGrid,
	Rows3,
	Newspaper,
	Move,
} from "lucide-react"
import type { AdminCategory, AdminItem, AdminMenu } from "@/lib/data/menu-admin"
import { saveMenuLayout } from "@/app/(owner)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatVnd, cn } from "@/lib/utils"
import { MENU_BACKGROUNDS, backgroundById } from "@/lib/menu-style"

type TemplateId = "grid" | "list" | "magazine" | "free"
type Pos = { x: number; y: number; w: number }
type Positions = Record<string, Pos>

// Fixed design surface, roughly an A4 page in portrait.
const CANVAS_W = 640
const WIDTHS = [160, 200, 260, 308, 420, 624]

const NO_IMAGE = "/no-image.svg"

const TAG_BADGES: Record<
	string,
	{ label: string; icon: string; className: string }
> = {
	hot: { label: "Món Hot", icon: "🔥", className: "bg-red-500 text-white" },
	best_seller: {
		label: "Best Seller",
		icon: "👑",
		className: "bg-amber-500 text-white",
	},
	new: { label: "Mới", icon: "✨", className: "bg-sky-500 text-white" },
	recommended: {
		label: "Đề xuất",
		icon: "⭐",
		className: "bg-violet-600 text-white",
	},
}

const TEMPLATES: { id: TemplateId; label: string; icon: typeof LayoutGrid }[] =
	[
		{ id: "grid", label: "Lưới", icon: LayoutGrid },
		{ id: "list", label: "Danh sách", icon: Rows3 },
		{ id: "magazine", label: "Tạp chí", icon: Newspaper },
		{ id: "free", label: "Tự do", icon: Move },
	]

function clamp(v: number, min: number, max: number) {
	return Math.max(min, Math.min(max, v))
}

// Estimated rendered height of a card so templates can space rows without
// overlap. Wide cards render as a horizontal row; narrow ones as tall cards.
function estHeight(w: number) {
	return w >= 380 ? 128 : Math.round(w * 0.75) + 96
}

// Auto-arrange the ordered item ids into a tidy layout for the chosen template.
function arrange(template: TemplateId, ids: string[]): Positions {
	const pos: Positions = {}
	if (template === "list") {
		ids.forEach((id, i) => {
			pos[id] = { x: 8, y: 8 + i * 140, w: 624 }
		})
	} else if (template === "magazine") {
		ids.forEach((id, i) => {
			if (i === 0) {
				pos[id] = { x: 8, y: 8, w: 624 }
			} else {
				const j = i - 1
				const col = j % 2
				const row = Math.floor(j / 2)
				pos[id] = { x: 8 + col * 316, y: 156 + row * 340, w: 308 }
			}
		})
	} else {
		// grid (also the default starting point for "free")
		ids.forEach((id, i) => {
			const col = i % 3
			const row = Math.floor(i / 3)
			pos[id] = { x: 8 + col * 208, y: 8 + row * 272, w: 200 }
		})
	}
	return pos
}

function canvasHeight(positions: Positions) {
	let bottom = 600
	for (const p of Object.values(positions)) {
		bottom = Math.max(bottom, p.y + estHeight(p.w) + 40)
	}
	return bottom
}

export function MenuBuilder({
	menu,
	categories,
	items,
}: {
	menu: AdminMenu
	categories: AdminCategory[]
	items: AdminItem[]
}) {
	const orderedIds = useMemo(() => items.map((i) => i.id), [items])
	const itemMap = useMemo(() => {
		const m: Record<string, AdminItem> = {}
		for (const it of items) m[it.id] = it
		return m
	}, [items])

	const initial = useMemo<{
		template: TemplateId
		positions: Positions
	}>(() => {
		const saved = menu.layout
		if (saved && saved.positions && Object.keys(saved.positions).length > 0) {
			const positions: Positions = {}
			// Ensure every current item has a position (new items fall back to grid).
			const fallback = arrange("grid", orderedIds)
			for (const id of orderedIds) {
				positions[id] = saved.positions[id] ?? fallback[id]
			}
			return { template: (saved.template as TemplateId) ?? "free", positions }
		}
		return { template: "grid", positions: arrange("grid", orderedIds) }
	}, [menu.layout, orderedIds])

	const [template, setTemplate] = useState<TemplateId>(initial.template)
	const [positions, setPositions] = useState<Positions>(initial.positions)
	const [title, setTitle] = useState(menu.layout?.title ?? "")
	const [subtitle, setSubtitle] = useState(menu.layout?.subtitle ?? "")
	const [background, setBackground] = useState(
		menu.layout?.background ?? "none",
	)
	const [dirty, setDirty] = useState(false)
	const [saving, setSaving] = useState(false)
	const canvasRef = useRef<HTMLDivElement>(null)

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
	)

	function applyTemplate(t: TemplateId) {
		setTemplate(t)
		if (t !== "free") {
			setPositions(arrange(t, orderedIds))
			setDirty(true)
		}
	}

	function handleDragEnd(e: DragEndEvent) {
		const id = String(e.active.id)
		setPositions((prev) => {
			const cur = prev[id]
			if (!cur) return prev
			const nx = clamp(cur.x + e.delta.x, 0, CANVAS_W - cur.w)
			const ny = Math.max(0, cur.y + e.delta.y)
			return { ...prev, [id]: { ...cur, x: Math.round(nx), y: Math.round(ny) } }
		})
		// Any manual drag switches the design into free mode.
		setTemplate("free")
		setDirty(true)
	}

	function stepWidth(id: string, dir: 1 | -1) {
		setPositions((prev) => {
			const cur = prev[id]
			if (!cur) return prev
			const idx = WIDTHS.reduce(
				(best, w, i) =>
					Math.abs(w - cur.w) < Math.abs(WIDTHS[best] - cur.w) ? i : best,
				0,
			)
			const nextIdx = clamp(idx + dir, 0, WIDTHS.length - 1)
			const w = WIDTHS[nextIdx]
			const x = clamp(cur.x, 0, CANVAS_W - w)
			return { ...prev, [id]: { ...cur, w, x } }
		})
		setTemplate("free")
		setDirty(true)
	}

	async function save() {
		setSaving(true)
		try {
			// Derive guest sort order per category by reading the canvas
			// top-to-bottom, then left-to-right.
			const reading = [...orderedIds].sort((a, b) => {
				const pa = positions[a]
				const pb = positions[b]
				if (!pa || !pb) return 0
				if (Math.abs(pa.y - pb.y) > 40) return pa.y - pb.y
				return pa.x - pb.x
			})
			const perCat: Record<string, number> = {}
			const order = reading.map((id) => {
				const it = itemMap[id]
				const n = perCat[it.category_id] ?? 0
				perCat[it.category_id] = n + 1
				return { id, sort_order: n, category_id: it.category_id }
			})
			await saveMenuLayout(
				menu.id,
				{
					template,
					positions,
					title: title.trim() || null,
					subtitle: subtitle.trim() || null,
					background,
				},
				order,
			)
			setDirty(false)
		} finally {
			setSaving(false)
		}
	}

	const height = canvasHeight(positions)
	const bg = backgroundById(background)
	const catName = (id: string) =>
		categories.find((c) => c.id === id)?.name ?? ""

	return (
		<div className="space-y-4">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-sm font-medium text-muted-foreground">
						Bố cục mẫu:
					</span>
					{TEMPLATES.map((t) => {
						const Icon = t.icon
						const active = template === t.id
						return (
							<button
								key={t.id}
								type="button"
								onClick={() => applyTemplate(t.id)}
								className={cn(
									"flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm",
									active
										? "border-primary bg-primary/10 font-semibold text-primary"
										: "bg-background hover:border-primary",
								)}
							>
								<Icon className="h-4 w-4" /> {t.label}
							</button>
						)
					})}
				</div>
				<Button onClick={save} disabled={!dirty || saving}>
					{saving ? "Đang lưu..." : "Lưu bố cục"}
				</Button>
			</div>

			{/* Decoration: title / subtitle / background */}
			<div className="grid gap-3 rounded-xl border bg-muted/30 p-3 sm:grid-cols-3">
				<div className="space-y-1">
					<label className="text-xs font-medium text-muted-foreground">
						Tiêu đề menu
					</label>
					<Input
						value={title}
						placeholder="VD: Thực đơn đặc biệt"
						onChange={(e) => {
							setTitle(e.target.value)
							setDirty(true)
						}}
					/>
				</div>
				<div className="space-y-1">
					<label className="text-xs font-medium text-muted-foreground">
						Phụ đề
					</label>
					<Input
						value={subtitle}
						placeholder="VD: Tươi ngon mỗi ngày"
						onChange={(e) => {
							setSubtitle(e.target.value)
							setDirty(true)
						}}
					/>
				</div>
				<div className="space-y-1">
					<label className="text-xs font-medium text-muted-foreground">
						Nền menu
					</label>
					<select
						value={background}
						onChange={(e) => {
							setBackground(e.target.value)
							setDirty(true)
						}}
						className="h-10 w-full rounded-md border bg-background px-2 text-sm"
					>
						{MENU_BACKGROUNDS.map((b) => (
							<option key={b.id} value={b.id}>
								{b.label}
							</option>
						))}
					</select>
				</div>
			</div>

			<p className="text-xs text-muted-foreground">
				Mẹo: kéo biểu tượng <GripVertical className="inline h-3 w-3" /> để di
				chuyển món; dùng nút − / + để phóng to thu nhỏ thẻ.
			</p>

			{/* A4 design canvas */}
			<div className="overflow-x-auto">
				<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
					<div
						style={frameStyle()}
						className={cn(
							"mx-auto overflow-hidden rounded-2xl border shadow-inner",
							bg.className,
						)}
					>
						{(title || subtitle) && (
							<div
								className={cn(
									"px-6 pb-2 pt-6 text-center",
									bg.dark ? "text-white" : "text-foreground",
								)}
							>
								{title && (
									<h2 className="text-2xl font-extrabold tracking-tight">
										{title}
									</h2>
								)}
								{subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
							</div>
						)}
						<div
							ref={canvasRef}
							style={canvasStyle(height)}
							className="relative"
						>
							{items.length === 0 && (
								<p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
									Chưa có món nào. Hãy thêm món ở trang Menu.
								</p>
							)}
							{items.map((item) => (
								<DraggableCard
									key={item.id}
									item={item}
									pos={positions[item.id] ?? { x: 8, y: 8, w: 200 }}
									categoryName={catName(item.category_id)}
									onWider={() => stepWidth(item.id, 1)}
									onNarrower={() => stepWidth(item.id, -1)}
								/>
							))}
						</div>
					</div>
				</DndContext>
			</div>
		</div>
	)
}

function frameStyle(): React.CSSProperties {
	return { width: CANVAS_W, minWidth: CANVAS_W }
}

function canvasStyle(height: number): React.CSSProperties {
	return { width: CANVAS_W, height }
}

function DraggableCard({
	item,
	pos,
	categoryName,
	onWider,
	onNarrower,
}: {
	item: AdminItem
	pos: Pos
	categoryName: string
	onWider: () => void
	onNarrower: () => void
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: item.id,
		})
	const horizontal = pos.w >= 380
	const style = cardWrapperStyle(pos, transform, isDragging)
	const image = item.images[0] || NO_IMAGE
	const badges = item.tags
		.map((t) => TAG_BADGES[t])
		.filter(Boolean)
		.slice(0, 2)

	return (
		<div ref={setNodeRef} style={style} className="group touch-none">
			<div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
				{/* control bar */}
				<div className="flex items-center justify-between bg-muted/60 px-2 py-1">
					<button
						type="button"
						className="cursor-grab text-muted-foreground active:cursor-grabbing"
						{...listeners}
						{...attributes}
					>
						<GripVertical className="h-4 w-4" />
					</button>
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={onNarrower}
							className="flex h-5 w-5 items-center justify-center rounded border bg-background"
						>
							<Minus className="h-3 w-3" />
						</button>
						<button
							type="button"
							onClick={onWider}
							className="flex h-5 w-5 items-center justify-center rounded border bg-background"
						>
							<Plus className="h-3 w-3" />
						</button>
					</div>
				</div>

				{/* card body (guest-style) */}
				<div className={cn("flex", horizontal ? "flex-row" : "flex-col")}>
					<div
						className={cn(
							"relative shrink-0 overflow-hidden bg-muted",
							horizontal ? "aspect-square w-32" : "aspect-[4/3] w-full",
						)}
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={image}
							alt={item.name}
							className="h-full w-full object-cover"
							draggable={false}
						/>
						{badges.length > 0 && (
							<div className="absolute left-1.5 top-1.5 flex flex-col items-start gap-1">
								{badges.map((b) => (
									<span
										key={b.label}
										className={cn(
											"rounded-full px-1.5 py-0.5 text-[9px] font-bold shadow",
											b.className,
										)}
									>
										{b.icon} {b.label}
									</span>
								))}
							</div>
						)}
					</div>
					<div className="flex flex-1 flex-col gap-1 p-2.5">
						{categoryName && (
							<span className="text-[10px] uppercase tracking-wide text-muted-foreground">
								{categoryName}
							</span>
						)}
						<p className="font-semibold leading-tight">{item.name}</p>
						{horizontal && item.description && (
							<p className="line-clamp-2 text-xs text-muted-foreground">
								{item.description}
							</p>
						)}
						<span className="mt-auto font-bold text-primary">
							{formatVnd(item.base_price)}
						</span>
					</div>
				</div>
			</div>
		</div>
	)
}

function cardWrapperStyle(
	pos: Pos,
	transform: { x: number; y: number } | null,
	isDragging: boolean,
): React.CSSProperties {
	const t = transform
		? `translate3d(${transform.x}px, ${transform.y}px, 0)`
		: undefined
	return {
		position: "absolute",
		left: pos.x,
		top: pos.y,
		width: pos.w,
		transform: t,
		zIndex: isDragging ? 50 : 1,
		opacity: isDragging ? 0.9 : 1,
	}
}
