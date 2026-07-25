"use client"

import type { ReactNode } from "react"
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	ArrowDown,
	ArrowUp,
	Copy,
	Lock,
	Trash2,
	Unlock,
} from "lucide-react"
import {
	CARD_SKINS,
	CANVAS_PRESETS,
	MENU_BACKGROUNDS,
	MENU_FONTS,
	MENU_THEMES,
	BACKGROUND_GROUPS,
} from "@/lib/menu-design"
import type {
	CategoryElement,
	ImageElement,
	ItemElement,
	MenuElement,
	MenuLayout,
	ShapeElement,
	TextElement,
} from "@/lib/menu-layout"
import { LAYOUT_TEMPLATES } from "@/lib/menu-layout"
import { cn } from "@/lib/utils"

// =============================================================================
// Right-hand properties panel. Nothing selected -> the design itself (template,
// theme, canvas). Something selected -> that element's properties.
// =============================================================================

export type InspectorItem = { id: string; name: string; categoryId: string }
export type InspectorCategory = { id: string; name: string }

function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<label className="block space-y-1">
			<span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</span>
			{children}
		</label>
	)
}

const inputCls =
	"h-9 w-full rounded-lg border bg-background px-2 text-sm outline-none focus:border-primary"

function NumberField({
	label,
	value,
	onChange,
	step = 1,
	min,
	max,
}: {
	label: string
	value: number
	onChange: (v: number) => void
	step?: number
	min?: number
	max?: number
}) {
	return (
		<Field label={label}>
			<input
				type="number"
				className={inputCls}
				value={Math.round(value * 100) / 100}
				step={step}
				min={min}
				max={max}
				onChange={(e) => {
					const n = Number(e.target.value)
					if (Number.isFinite(n)) onChange(n)
				}}
			/>
		</Field>
	)
}

function ColorField({
	label,
	value,
	onChange,
	fallback = "#000000",
}: {
	label: string
	value: string | undefined
	onChange: (v: string) => void
	fallback?: string
}) {
	// `type=color` cannot express rgba(), so the text input stays authoritative.
	const swatch = value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
	return (
		<Field label={label}>
			<div className="flex gap-1.5">
				<input
					type="color"
					value={swatch}
					onChange={(e) => onChange(e.target.value)}
					className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border bg-background"
				/>
				<input
					className={inputCls}
					value={value ?? ""}
					placeholder="theo chủ đề"
					onChange={(e) => onChange(e.target.value)}
				/>
			</div>
		</Field>
	)
}

function Toggle({
	label,
	checked,
	onChange,
}: {
	label: string
	checked: boolean
	onChange: (v: boolean) => void
}) {
	return (
		<label className="flex cursor-pointer items-center justify-between gap-2 py-1">
			<span className="text-sm">{label}</span>
			<input
				type="checkbox"
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				className="h-4 w-4 accent-primary"
			/>
		</label>
	)
}

function SectionTitle({ children }: { children: ReactNode }) {
	return (
		<h3 className="border-b pb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
			{children}
		</h3>
	)
}

// ---------------------------------------------------------------------------
// Design (nothing selected)
// ---------------------------------------------------------------------------

function DesignPanel({
	layout,
	onLayoutChange,
	onApplyTemplate,
}: {
	layout: MenuLayout
	onLayoutChange: (patch: Partial<MenuLayout>) => void
	onApplyTemplate: (templateId: string) => void
}) {
	return (
		<div className="space-y-5">
			<div className="space-y-2">
				<SectionTitle>Mẫu dựng sẵn</SectionTitle>
				<p className="text-xs text-muted-foreground">
					Dựng lại toàn bộ trang từ món ăn thật của bạn. Thao tác này thay thế
					thiết kế hiện tại (có thể hoàn tác bằng Ctrl+Z).
				</p>
				<div className="space-y-1.5">
					{LAYOUT_TEMPLATES.map((tpl) => (
						<button
							key={tpl.id}
							type="button"
							onClick={() => onApplyTemplate(tpl.id)}
							className="w-full rounded-lg border px-3 py-2 text-left transition hover:border-primary hover:bg-primary/5"
						>
							<span className="block text-sm font-semibold">{tpl.label}</span>
							<span className="block text-xs text-muted-foreground">
								{tpl.hint}
							</span>
						</button>
					))}
				</div>
			</div>

			<div className="space-y-2">
				<SectionTitle>Chủ đề màu &amp; font</SectionTitle>
				<div className="grid grid-cols-2 gap-1.5">
					{MENU_THEMES.map((t) => (
						<button
							key={t.id}
							type="button"
							onClick={() => onLayoutChange({ theme: t.id })}
							className={cn(
								"rounded-lg border px-2 py-1.5 text-left text-xs transition hover:border-primary",
								layout.theme === t.id && "border-primary bg-primary/10",
							)}
						>
							<span className="block font-semibold">{t.label}</span>
							<span className="block text-[10px] text-muted-foreground">
								{t.hint}
							</span>
						</button>
					))}
				</div>
			</div>

			<div className="space-y-2">
				<SectionTitle>Khổ giấy / màn hình</SectionTitle>
				<Field label="Kích thước">
					<select
						className={inputCls}
						value={layout.canvas}
						onChange={(e) =>
							onLayoutChange({ canvas: e.target.value as MenuLayout["canvas"] })
						}
					>
						{CANVAS_PRESETS.map((p) => (
							<option key={p.id} value={p.id}>
								{p.label} — {p.hint}
							</option>
						))}
					</select>
				</Field>
			</div>

			<div className="space-y-2">
				<SectionTitle>Nền</SectionTitle>
				<Field label="Ảnh nền / màu nền">
					<select
						className={inputCls}
						value={layout.background ?? ""}
						onChange={(e) =>
							onLayoutChange({ background: e.target.value || null })
						}
					>
						<option value="">Theo chủ đề</option>
						{BACKGROUND_GROUPS.map((group) => (
							<optgroup key={group} label={group}>
								{MENU_BACKGROUNDS.filter((b) => b.group === group).map((b) => (
									<option key={b.id} value={b.id}>
										{b.label}
									</option>
								))}
							</optgroup>
						))}
					</select>
				</Field>
				<div className="grid grid-cols-6 gap-1.5 pt-1">
					{MENU_BACKGROUNDS.map((b) => (
						<button
							key={b.id}
							type="button"
							title={b.label}
							onClick={() => onLayoutChange({ background: b.id })}
							className={cn(
								"h-8 rounded-md border",
								layout.background === b.id && "ring-2 ring-primary",
							)}
							style={{ background: b.css }}
						/>
					))}
				</div>
			</div>
		</div>
	)
}

// ---------------------------------------------------------------------------
// Element panels
// ---------------------------------------------------------------------------

function TextPanel({
	el,
	patch,
}: {
	el: TextElement
	patch: (p: Partial<TextElement>) => void
}) {
	return (
		<>
			<Field label="Nội dung">
				<textarea
					className="min-h-20 w-full rounded-lg border bg-background p-2 text-sm outline-none focus:border-primary"
					value={el.text}
					onChange={(e) => patch({ text: e.target.value })}
				/>
			</Field>
			<Field label="Kiểu chữ">
				<select
					className={inputCls}
					value={el.fontId ?? ""}
					onChange={(e) => patch({ fontId: e.target.value || undefined })}
				>
					<option value="">Theo chủ đề</option>
					{MENU_FONTS.map((f) => (
						<option key={f.id} value={f.id}>
							{f.label}
						</option>
					))}
				</select>
			</Field>
			<div className="grid grid-cols-2 gap-2">
				<NumberField
					label="Cỡ chữ"
					value={el.fontSize}
					min={8}
					max={240}
					onChange={(v) => patch({ fontSize: v })}
				/>
				<Field label="Độ đậm">
					<select
						className={inputCls}
						value={el.weight ?? 700}
						onChange={(e) => patch({ weight: Number(e.target.value) })}
					>
						{[400, 500, 600, 700, 800, 900].map((w) => (
							<option key={w} value={w}>
								{w}
							</option>
						))}
					</select>
				</Field>
			</div>
			<Field label="Căn lề">
				<div className="flex gap-1">
					{(
						[
							["left", AlignLeft],
							["center", AlignCenter],
							["right", AlignRight],
						] as const
					).map(([value, Icon]) => (
						<button
							key={value}
							type="button"
							onClick={() => patch({ align: value })}
							className={cn(
								"flex h-9 flex-1 items-center justify-center rounded-lg border",
								(el.align ?? "left") === value &&
									"border-primary bg-primary/10 text-primary",
							)}
						>
							<Icon className="h-4 w-4" />
						</button>
					))}
				</div>
			</Field>
			<ColorField
				label="Màu chữ"
				value={el.color}
				onChange={(v) => patch({ color: v })}
				fallback="#ffffff"
			/>
			<NumberField
				label="Giãn chữ"
				value={el.letterSpacing ?? 0}
				step={0.5}
				onChange={(v) => patch({ letterSpacing: v })}
			/>
			<Toggle
				label="VIẾT HOA"
				checked={Boolean(el.uppercase)}
				onChange={(v) => patch({ uppercase: v })}
			/>
		</>
	)
}

function ShapePanel({
	el,
	patch,
}: {
	el: ShapeElement
	patch: (p: Partial<ShapeElement>) => void
}) {
	return (
		<>
			<Field label="Hình">
				<select
					className={inputCls}
					value={el.shape}
					onChange={(e) =>
						patch({ shape: e.target.value as ShapeElement["shape"] })
					}
				>
					<option value="rect">Chữ nhật</option>
					<option value="ellipse">Hình tròn / bầu dục</option>
					<option value="line">Đường kẻ</option>
				</select>
			</Field>
			<ColorField
				label="Màu nền"
				value={el.fill}
				onChange={(v) => patch({ fill: v })}
			/>
			<ColorField
				label="Màu viền"
				value={el.stroke}
				onChange={(v) => patch({ stroke: v })}
			/>
			<div className="grid grid-cols-2 gap-2">
				<NumberField
					label="Dày viền"
					value={el.strokeWidth ?? 0}
					min={0}
					max={24}
					onChange={(v) => patch({ strokeWidth: v })}
				/>
				<NumberField
					label="Bo góc"
					value={el.radius ?? 0}
					min={0}
					max={200}
					onChange={(v) => patch({ radius: v })}
				/>
			</div>
		</>
	)
}

function ImagePanel({
	el,
	patch,
}: {
	el: ImageElement
	patch: (p: Partial<ImageElement>) => void
}) {
	return (
		<>
			<Field label="Đường dẫn ảnh">
				<input
					className={inputCls}
					value={el.url}
					placeholder="https://..."
					onChange={(e) => patch({ url: e.target.value })}
				/>
			</Field>
			<Field label="Cách hiển thị">
				<select
					className={inputCls}
					value={el.fit ?? "cover"}
					onChange={(e) =>
						patch({ fit: e.target.value as ImageElement["fit"] })
					}
				>
					<option value="cover">Lấp đầy khung (cắt bớt)</option>
					<option value="contain">Hiện trọn ảnh</option>
				</select>
			</Field>
			<NumberField
				label="Bo góc"
				value={el.radius ?? 0}
				min={0}
				max={400}
				onChange={(v) => patch({ radius: v })}
			/>
		</>
	)
}

function ItemPanel({
	el,
	patch,
	items,
}: {
	el: ItemElement
	patch: (p: Partial<ItemElement>) => void
	items: InspectorItem[]
}) {
	return (
		<>
			<Field label="Món ăn">
				<select
					className={inputCls}
					value={el.itemId}
					onChange={(e) => patch({ itemId: e.target.value })}
				>
					{items.map((i) => (
						<option key={i.id} value={i.id}>
							{i.name}
						</option>
					))}
				</select>
			</Field>
			<Field label="Kiểu thẻ">
				<select
					className={inputCls}
					value={el.skin ?? ""}
					onChange={(e) =>
						patch({
							skin: (e.target.value || undefined) as ItemElement["skin"],
						})
					}
				>
					<option value="">Theo chủ đề</option>
					{CARD_SKINS.map((s) => (
						<option key={s.id} value={s.id}>
							{s.label} — {s.hint}
						</option>
					))}
				</select>
			</Field>
			<Toggle
				label="Hiện mô tả"
				checked={el.showDescription !== false}
				onChange={(v) => patch({ showDescription: v })}
			/>
			<Toggle
				label="Hiện nhãn (Hot / Bán chạy…)"
				checked={el.showBadges !== false}
				onChange={(v) => patch({ showBadges: v })}
			/>
			{el.skin === "ticket" && (
				<Field label="Số combo">
					<input
						className={inputCls}
						value={el.badgeNumber ?? ""}
						onChange={(e) => patch({ badgeNumber: e.target.value })}
					/>
				</Field>
			)}
		</>
	)
}

function CategoryPanel({
	el,
	patch,
	categories,
}: {
	el: CategoryElement
	patch: (p: Partial<CategoryElement>) => void
	categories: InspectorCategory[]
}) {
	return (
		<>
			<Field label="Danh mục">
				<select
					className={inputCls}
					value={el.categoryId}
					onChange={(e) => patch({ categoryId: e.target.value })}
				>
					{categories.map((c) => (
						<option key={c.id} value={c.id}>
							{c.name}
						</option>
					))}
				</select>
			</Field>
			<p className="rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground">
				Khối này tự lấy toàn bộ món trong danh mục. Thêm món mới ở trang Menu là
				bảng tự cập nhật, không cần thiết kế lại.
			</p>
			<Field label="Kiểu thẻ">
				<select
					className={inputCls}
					value={el.skin ?? ""}
					onChange={(e) =>
						patch({
							skin: (e.target.value || undefined) as CategoryElement["skin"],
						})
					}
				>
					<option value="">Theo chủ đề</option>
					{CARD_SKINS.map((s) => (
						<option key={s.id} value={s.id}>
							{s.label} — {s.hint}
						</option>
					))}
				</select>
			</Field>
			<div className="grid grid-cols-2 gap-2">
				<NumberField
					label="Số cột"
					value={el.columns ?? 1}
					min={1}
					max={8}
					onChange={(v) => patch({ columns: Math.round(v) })}
				/>
				<NumberField
					label="Khoảng cách"
					value={el.gap ?? 12}
					min={0}
					max={64}
					onChange={(v) => patch({ gap: Math.round(v) })}
				/>
			</div>
			<NumberField
				label="Giới hạn số món (0 = tất cả)"
				value={el.limit ?? 0}
				min={0}
				max={60}
				onChange={(v) => patch({ limit: Math.round(v) })}
			/>
			<Toggle
				label="Hiện tên danh mục"
				checked={el.showHeader !== false}
				onChange={(v) => patch({ showHeader: v })}
			/>
		</>
	)
}

// ---------------------------------------------------------------------------

export function Inspector({
	layout,
	selected,
	items,
	categories,
	onLayoutChange,
	onApplyTemplate,
	onPatchElement,
	onDelete,
	onDuplicate,
	onReorder,
}: {
	layout: MenuLayout
	selected: MenuElement[]
	items: InspectorItem[]
	categories: InspectorCategory[]
	onLayoutChange: (patch: Partial<MenuLayout>) => void
	onApplyTemplate: (templateId: string) => void
	onPatchElement: (id: string, patch: Partial<MenuElement>) => void
	onDelete: () => void
	onDuplicate: () => void
	onReorder: (direction: "front" | "back") => void
}) {
	if (selected.length === 0) {
		return (
			<DesignPanel
				layout={layout}
				onLayoutChange={onLayoutChange}
				onApplyTemplate={onApplyTemplate}
			/>
		)
	}

	if (selected.length > 1) {
		return (
			<div className="space-y-3">
				<SectionTitle>{selected.length} phần tử được chọn</SectionTitle>
				<p className="text-xs text-muted-foreground">
					Kéo để di chuyển cả nhóm. Chọn một phần tử duy nhất để chỉnh chi tiết.
				</p>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={onDuplicate}
						className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border text-sm hover:border-primary"
					>
						<Copy className="h-4 w-4" /> Nhân bản
					</button>
					<button
						type="button"
						onClick={onDelete}
						className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50"
					>
						<Trash2 className="h-4 w-4" /> Xoá
					</button>
				</div>
			</div>
		)
	}

	const el = selected[0]
	const patch = (p: Partial<MenuElement>) => onPatchElement(el.id, p)

	return (
		<div className="space-y-4">
			<SectionTitle>
				{el.type === "item"
					? "Món ăn"
					: el.type === "category"
						? "Khối danh mục"
						: el.type === "text"
							? "Chữ"
							: el.type === "shape"
								? "Hình khối"
								: "Ảnh"}
			</SectionTitle>

			<div className="flex gap-1.5">
				<button
					type="button"
					onClick={() => onReorder("front")}
					title="Đưa lên trên cùng"
					className="flex h-9 flex-1 items-center justify-center rounded-lg border hover:border-primary"
				>
					<ArrowUp className="h-4 w-4" />
				</button>
				<button
					type="button"
					onClick={() => onReorder("back")}
					title="Đưa xuống dưới cùng"
					className="flex h-9 flex-1 items-center justify-center rounded-lg border hover:border-primary"
				>
					<ArrowDown className="h-4 w-4" />
				</button>
				<button
					type="button"
					onClick={() => patch({ locked: !el.locked })}
					title={el.locked ? "Mở khoá" : "Khoá vị trí"}
					className={cn(
						"flex h-9 flex-1 items-center justify-center rounded-lg border hover:border-primary",
						el.locked && "border-primary bg-primary/10 text-primary",
					)}
				>
					{el.locked ? (
						<Lock className="h-4 w-4" />
					) : (
						<Unlock className="h-4 w-4" />
					)}
				</button>
				<button
					type="button"
					onClick={onDuplicate}
					title="Nhân bản"
					className="flex h-9 flex-1 items-center justify-center rounded-lg border hover:border-primary"
				>
					<Copy className="h-4 w-4" />
				</button>
				<button
					type="button"
					onClick={onDelete}
					title="Xoá"
					className="flex h-9 flex-1 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
				>
					<Trash2 className="h-4 w-4" />
				</button>
			</div>

			{el.type === "text" && <TextPanel el={el} patch={patch} />}
			{el.type === "shape" && <ShapePanel el={el} patch={patch} />}
			{el.type === "image" && <ImagePanel el={el} patch={patch} />}
			{el.type === "item" && <ItemPanel el={el} patch={patch} items={items} />}
			{el.type === "category" && (
				<CategoryPanel el={el} patch={patch} categories={categories} />
			)}

			<div className="space-y-2 border-t pt-3">
				<SectionTitle>Vị trí &amp; kích thước</SectionTitle>
				<div className="grid grid-cols-2 gap-2">
					<NumberField
						label="X"
						value={el.x}
						onChange={(v) => patch({ x: v })}
					/>
					<NumberField
						label="Y"
						value={el.y}
						onChange={(v) => patch({ y: v })}
					/>
					<NumberField
						label="Rộng"
						value={el.w}
						min={8}
						onChange={(v) => patch({ w: v })}
					/>
					<NumberField
						label="Cao"
						value={el.h}
						min={8}
						onChange={(v) => patch({ h: v })}
					/>
					<NumberField
						label="Xoay (°)"
						value={el.rotation ?? 0}
						min={-180}
						max={180}
						onChange={(v) => patch({ rotation: v })}
					/>
					<NumberField
						label="Độ mờ"
						value={el.opacity ?? 1}
						min={0}
						max={1}
						step={0.05}
						onChange={(v) => patch({ opacity: v })}
					/>
				</div>
			</div>
		</div>
	)
}
