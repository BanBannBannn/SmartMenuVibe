// =============================================================================
// SmartMenu - Menu layout schema (v2)
// -----------------------------------------------------------------------------
// A layout is a free-form canvas document stored in `menus.layout`. It is the
// single source of truth for the builder AND the public board, which is what
// makes the editor genuinely WYSIWYG.
//
// v1 (the old `{ template, positions }` shape) is migrated on read, so existing
// restaurants keep their arrangement without any database backfill.
// =============================================================================

import {
	canvasPresetById,
	cardSkinById,
	categoryBlockHeight,
	categoryRowCapacity,
	themeById,
	type BlockMetrics,
	type CanvasPresetId,
	type CardSkinId,
} from "@/lib/menu-design"

// ---------------------------------------------------------------------------
// Element types
// ---------------------------------------------------------------------------

export type ElementBase = {
	id: string
	x: number
	y: number
	w: number
	h: number
	/** Paint order; higher is on top. */
	z: number
	rotation?: number
	opacity?: number
	/** Locked elements cannot be dragged or resized in the builder. */
	locked?: boolean
}

export type ItemElement = ElementBase & {
	type: "item"
	itemId: string
	skin?: CardSkinId
	showDescription?: boolean
	showBadges?: boolean
	/** Combo/queue number printed by the `ticket` skin. */
	badgeNumber?: string
}

export type TextElement = ElementBase & {
	type: "text"
	text: string
	fontId?: string
	fontSize: number
	weight?: number
	align?: "left" | "center" | "right"
	color?: string
	uppercase?: boolean
	letterSpacing?: number
	lineHeight?: number
}

export type ShapeElement = ElementBase & {
	type: "shape"
	shape: "rect" | "ellipse" | "line"
	fill?: string
	stroke?: string
	strokeWidth?: number
	radius?: number
}

export type ImageElement = ElementBase & {
	type: "image"
	url: string
	fit?: "cover" | "contain"
	radius?: number
}

/**
 * A whole category rendered as one auto-flowing block: header + its items in a
 * grid. This is what real menu boards are made of - the owner drops one block
 * and every new dish added later appears automatically.
 */
export type CategoryElement = ElementBase & {
	type: "category"
	categoryId: string
	skin?: CardSkinId
	showHeader?: boolean
	columns?: number
	gap?: number
	/** Cap the number of items drawn (0 / undefined = all). */
	limit?: number
}

export type MenuElement =
	ItemElement | TextElement | ShapeElement | ImageElement | CategoryElement

export type MenuLayout = {
	version: 2
	canvas: CanvasPresetId
	theme: string
	/** Overrides the theme background when set. */
	background?: string | null
	elements: MenuElement[]
	// Kept from v1 so other surfaces that only read a headline still work.
	title?: string | null
	subtitle?: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let idCounter = 0
export function newElementId(prefix = "el"): string {
	idCounter += 1
	return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`
}

export function emptyLayout(
	canvas: CanvasPresetId = "tv",
	theme = "fastfood",
): MenuLayout {
	return { version: 2, canvas, theme, background: null, elements: [] }
}

export function topZ(elements: MenuElement[]): number {
	return elements.reduce((max, el) => Math.max(max, el.z ?? 0), 0)
}

// ---------------------------------------------------------------------------
// Parsing / migration
// ---------------------------------------------------------------------------

type V1Layout = {
	template?: string
	positions?: Record<string, { x: number; y: number; w: number }>
	title?: string | null
	subtitle?: string | null
	background?: string | null
}

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v)
}

function num(v: unknown, fallback: number): number {
	return typeof v === "number" && Number.isFinite(v) ? v : fallback
}

/** Rough rendered height a v1 card had, so migrated designs keep their shape. */
function v1CardHeight(w: number): number {
	return w >= 380 ? 128 : Math.round(w * 0.75) + 96
}

function parseElement(raw: unknown, index: number): MenuElement | null {
	if (!isRecord(raw)) return null
	const type = raw.type
	const base: ElementBase = {
		id: typeof raw.id === "string" ? raw.id : `el_${index}`,
		x: num(raw.x, 0),
		y: num(raw.y, 0),
		w: num(raw.w, 200),
		h: num(raw.h, 200),
		z: num(raw.z, index),
		rotation: typeof raw.rotation === "number" ? raw.rotation : undefined,
		opacity: typeof raw.opacity === "number" ? raw.opacity : undefined,
		locked: raw.locked === true,
	}

	switch (type) {
		case "item":
			if (typeof raw.itemId !== "string") return null
			return {
				...base,
				type: "item",
				itemId: raw.itemId,
				skin:
					typeof raw.skin === "string" ? (raw.skin as CardSkinId) : undefined,
				showDescription: raw.showDescription !== false,
				showBadges: raw.showBadges !== false,
				badgeNumber:
					typeof raw.badgeNumber === "string" ? raw.badgeNumber : undefined,
			}
		case "text":
			return {
				...base,
				type: "text",
				text: typeof raw.text === "string" ? raw.text : "",
				fontId: typeof raw.fontId === "string" ? raw.fontId : undefined,
				fontSize: num(raw.fontSize, 32),
				weight: typeof raw.weight === "number" ? raw.weight : undefined,
				align:
					raw.align === "center" || raw.align === "right"
						? raw.align
						: raw.align === "left"
							? "left"
							: undefined,
				color: typeof raw.color === "string" ? raw.color : undefined,
				uppercase: raw.uppercase === true,
				letterSpacing:
					typeof raw.letterSpacing === "number" ? raw.letterSpacing : undefined,
				lineHeight:
					typeof raw.lineHeight === "number" ? raw.lineHeight : undefined,
			}
		case "shape":
			return {
				...base,
				type: "shape",
				shape:
					raw.shape === "ellipse" || raw.shape === "line" ? raw.shape : "rect",
				fill: typeof raw.fill === "string" ? raw.fill : undefined,
				stroke: typeof raw.stroke === "string" ? raw.stroke : undefined,
				strokeWidth:
					typeof raw.strokeWidth === "number" ? raw.strokeWidth : undefined,
				radius: typeof raw.radius === "number" ? raw.radius : undefined,
			}
		case "image":
			if (typeof raw.url !== "string") return null
			return {
				...base,
				type: "image",
				url: raw.url,
				fit: raw.fit === "contain" ? "contain" : "cover",
				radius: typeof raw.radius === "number" ? raw.radius : undefined,
			}
		case "category":
			if (typeof raw.categoryId !== "string") return null
			return {
				...base,
				type: "category",
				categoryId: raw.categoryId,
				skin:
					typeof raw.skin === "string" ? (raw.skin as CardSkinId) : undefined,
				showHeader: raw.showHeader !== false,
				columns: num(raw.columns, 1),
				gap: num(raw.gap, 12),
				limit: typeof raw.limit === "number" ? raw.limit : undefined,
			}
		default:
			return null
	}
}

function migrateV1(v1: V1Layout): MenuLayout {
	const positions = v1.positions ?? {}
	const elements: MenuElement[] = Object.entries(positions).map(
		([itemId, p], i) => ({
			id: `item_${itemId}`,
			type: "item" as const,
			itemId,
			x: num(p?.x, 8),
			y: num(p?.y, 8),
			w: num(p?.w, 200),
			h: v1CardHeight(num(p?.w, 200)),
			z: i + 1,
			skin:
				num(p?.w, 200) >= 380 ? ("row" as CardSkinId) : ("photo" as CardSkinId),
		}),
	)

	// v1 canvas was a fixed 640px-wide portrait sheet; A4 is the closest preset
	// and keeps the same reading order.
	return {
		version: 2,
		canvas: "a4",
		theme: v1.background === "midnight" ? "board" : "vietnam",
		background: v1.background ?? null,
		title: v1.title ?? null,
		subtitle: v1.subtitle ?? null,
		elements,
	}
}

/** Parse whatever is stored in `menus.layout` into a valid v2 document. */
export function parseLayout(raw: unknown): MenuLayout | null {
	if (!isRecord(raw)) return null

	if (Array.isArray(raw.elements)) {
		const canvas = canvasPresetById(
			typeof raw.canvas === "string" ? raw.canvas : null,
		).id
		return {
			version: 2,
			canvas,
			theme: themeById(typeof raw.theme === "string" ? raw.theme : null).id,
			background: typeof raw.background === "string" ? raw.background : null,
			title: typeof raw.title === "string" ? raw.title : null,
			subtitle: typeof raw.subtitle === "string" ? raw.subtitle : null,
			elements: raw.elements
				.map(parseElement)
				.filter((e): e is MenuElement => e !== null)
				.sort((a, b) => a.z - b.z),
		}
	}

	// v1 document, or an empty `{}` default.
	const v1 = raw as V1Layout
	if (v1.positions && Object.keys(v1.positions).length > 0) return migrateV1(v1)
	if (v1.title || v1.subtitle || v1.background) {
		return {
			...emptyLayout("a4", "vietnam"),
			title: v1.title ?? null,
			subtitle: v1.subtitle ?? null,
			background: v1.background ?? null,
		}
	}
	return null
}

/** Drop item/category elements whose target row no longer exists. */
export function pruneLayout(
	layout: MenuLayout,
	itemIds: Set<string>,
	categoryIds: Set<string>,
): MenuLayout {
	return {
		...layout,
		elements: layout.elements.filter((el) => {
			if (el.type === "item") return itemIds.has(el.itemId)
			if (el.type === "category") return categoryIds.has(el.categoryId)
			return true
		}),
	}
}

// ---------------------------------------------------------------------------
// Template generators
// ---------------------------------------------------------------------------
// Every template produces a complete, presentable design from the restaurant's
// real data - the owner never starts from a blank page.

export type TemplateContext = {
	restaurantName: string
	subtitle?: string | null
	categories: { id: string; name: string; itemIds: string[] }[]
}

export type LayoutTemplate = {
	id: string
	label: string
	hint: string
	theme: string
	canvas: CanvasPresetId
	build: (ctx: TemplateContext) => MenuElement[]
}

// Distributes over the union so each variant keeps its own required fields;
// a plain `Omit<MenuElement, ...>` would collapse them to the shared keys.
type ElementDraft<T = MenuElement> = T extends MenuElement
	? Omit<T, "id" | "z"> & { id?: string }
	: never

type Builder = {
	push: (el: ElementDraft) => void
	elements: MenuElement[]
}

function builder(): Builder {
	const elements: MenuElement[] = []
	return {
		elements,
		push(el) {
			elements.push({
				...(el as MenuElement),
				id: el.id ?? newElementId(el.type),
				z: elements.length + 1,
			})
		},
	}
}

function text(
	partial: Omit<TextElement, "id" | "z" | "type">,
): ElementDraft<TextElement> {
	return { type: "text", ...partial }
}

/** Split categories into `n` roughly equal columns by item count. */
function balanceColumns(
	categories: TemplateContext["categories"],
	n: number,
): TemplateContext["categories"][] {
	const cols: TemplateContext["categories"][] = Array.from(
		{ length: n },
		() => [],
	)
	const load = new Array(n).fill(0)
	for (const cat of categories) {
		let target = 0
		for (let i = 1; i < n; i++) if (load[i] < load[target]) target = i
		cols[target].push(cat)
		load[target] += cat.itemIds.length + 1.6 // header costs ~1.6 rows
	}
	return cols
}

type FlowOptions = {
	x: number
	y: number
	w: number
	h: number
	/** Number of side-by-side category columns. */
	columns: number
	columnGap: number
	/** Vertical gap between stacked blocks in the same column. */
	rowGap: number
	skin: CardSkinId
	/** Item columns inside each block. */
	itemColumns: number
	itemGap: number
	/**
	 * "clip" keeps everything inside `h` - required for a wall screen, which
	 * cannot scroll. "grow" lets the page run past `h`, which is what a printed
	 * A4 menu or a scrolling poster wants.
	 */
	overflow: "clip" | "grow"
}

/**
 * Lay category blocks into columns.
 *
 * In "clip" mode each column is given a row budget and shares it between its
 * categories in proportion to how many dishes they have, dropping trailing
 * categories that cannot fit at all. That is what guarantees a TV board fills
 * exactly one screen instead of being silently shrunk to fit.
 */
function flowCategoryBlocks(
	categories: TemplateContext["categories"],
	opts: FlowOptions,
): ElementDraft<CategoryElement>[] {
	const usable = categories.filter((c) => c.itemIds.length > 0)
	if (usable.length === 0) return []

	const colW = (opts.w - opts.columnGap * (opts.columns - 1)) / opts.columns
	const metrics: BlockMetrics = {
		skin: opts.skin,
		width: colW,
		columns: opts.itemColumns,
		gap: opts.itemGap,
		showHeader: true,
	}
	const out: ElementDraft<CategoryElement>[] = []

	const mkBlock = (
		cat: TemplateContext["categories"][number],
		ci: number,
		y: number,
		rows: number,
	): ElementDraft<CategoryElement> => ({
		type: "category",
		categoryId: cat.id,
		x: opts.x + ci * (colW + opts.columnGap),
		y,
		w: colW,
		h: categoryBlockHeight(metrics, rows),
		skin: opts.skin,
		showHeader: true,
		columns: opts.itemColumns,
		gap: opts.itemGap,
	})

	if (opts.overflow === "grow") {
		const columns = balanceColumns(usable, opts.columns)
		columns.forEach((col, ci) => {
			let y = opts.y
			for (const cat of col) {
				const rows = Math.ceil(cat.itemIds.length / opts.itemColumns)
				const block = mkBlock(cat, ci, y, rows)
				out.push(block)
				y += block.h + opts.rowGap
			}
		})
		return out
	}

	const columns = balanceColumns(usable, opts.columns)
	columns.forEach((col, ci) => {
		let members = [...col]

		// Shed trailing categories until the column can give every remaining one
		// at least one row.
		let budget = 0
		while (members.length > 0) {
			const headerCost =
				categoryBlockHeight(metrics, 0) * members.length +
				opts.rowGap * (members.length - 1)
			budget = categoryRowCapacity(
				{ ...metrics, showHeader: false },
				opts.h - headerCost,
			)
			if (budget >= members.length) break
			members = members.slice(0, -1)
		}
		if (members.length === 0) return

		// Share the row budget in proportion to dish counts, one row minimum.
		const wanted = members.map((c) =>
			Math.ceil(c.itemIds.length / opts.itemColumns),
		)
		const totalWanted = wanted.reduce((a, b) => a + b, 0)
		const rows = wanted.map((wantedRows) =>
			Math.max(
				1,
				Math.min(
					wantedRows,
					Math.floor((wantedRows / totalWanted) * budget) || 1,
				),
			),
		)
		// Hand any rows left over to the categories that still want more.
		let spare = budget - rows.reduce((a, b) => a + b, 0)
		while (spare > 0) {
			const i = rows.findIndex((r, idx) => r < wanted[idx])
			if (i === -1) break
			rows[i] += 1
			spare -= 1
		}

		let y = opts.y
		members.forEach((cat, mi) => {
			const block = mkBlock(cat, ci, y, rows[mi])
			out.push(block)
			y += block.h + opts.rowGap
		})
	})

	return out
}

// -- 1. Fast-food menu board (KFC / Lotteria) -------------------------------
// Wall screens cannot scroll, so this design is budgeted to land inside
// 1280x720 exactly: a header strip, three hero combos, then price columns.
const fastfoodBoard: LayoutTemplate = {
	id: "fastfood-board",
	label: "Bảng gà rán (KFC)",
	hint: "TV ngang · combo lớn phía trên, bảng giá phía dưới",
	theme: "fastfood",
	canvas: "tv",
	build: (ctx) => {
		const b = builder()
		const t = themeById("fastfood")

		b.push({
			type: "shape",
			shape: "rect",
			x: 0,
			y: 0,
			w: 1280,
			h: 92,
			fill: "rgba(0,0,0,0.38)",
			radius: 0,
		})
		b.push(
			text({
				x: 40,
				y: 16,
				w: 760,
				h: 44,
				text: ctx.restaurantName,
				fontId: t.headingFont,
				fontSize: 40,
				weight: 900,
				color: t.heading,
				uppercase: true,
				letterSpacing: 1,
			}),
		)
		b.push(
			text({
				x: 40,
				y: 60,
				w: 760,
				h: 24,
				text: ctx.subtitle || "Giòn rụm · Nóng hổi · Phục vụ cả ngày",
				fontId: t.bodyFont,
				fontSize: 17,
				color: "rgba(255,255,255,0.75)",
			}),
		)
		b.push(
			text({
				x: 900,
				y: 28,
				w: 340,
				h: 38,
				text: "COMBO TIẾT KIỆM",
				fontId: t.headingFont,
				fontSize: 26,
				weight: 800,
				align: "right",
				color: "#ffffff",
			}),
		)

		// Three hero combos from the first category.
		const heroSource = ctx.categories.find((c) => c.itemIds.length > 0)
		const heroIds = (heroSource?.itemIds ?? []).slice(0, 3)
		heroIds.forEach((itemId, i) => {
			b.push({
				type: "item",
				itemId,
				x: 40 + i * 404,
				y: 108,
				w: 376,
				h: 248,
				skin: "hero",
				showDescription: true,
				showBadges: true,
			})
		})

		// Everything else becomes price columns in the remaining 348px.
		const rest = heroSource
			? ctx.categories.filter((c) => c.id !== heroSource.id)
			: ctx.categories
		for (const block of flowCategoryBlocks(rest, {
			x: 40,
			y: heroIds.length > 0 ? 372 : 112,
			w: 1200,
			h: heroIds.length > 0 ? 324 : 584,
			columns: 4,
			columnGap: 24,
			rowGap: 18,
			skin: "board",
			itemColumns: 1,
			itemGap: 4,
			overflow: "clip",
		})) {
			b.push(block)
		}

		return b.elements
	},
}

// -- 2. Convenience store board (Circle K / 7-Eleven) -----------------------
const convenienceGrid: LayoutTemplate = {
	id: "convenience-grid",
	label: "Quầy tiện lợi (Circle K)",
	hint: "TV ngang · nền sáng, thẻ giá vàng + bảng giá 5 cột",
	theme: "convenience",
	canvas: "tv",
	build: (ctx) => {
		const b = builder()
		const t = themeById("convenience")

		b.push({
			type: "shape",
			shape: "rect",
			x: 0,
			y: 0,
			w: 1280,
			h: 84,
			fill: "#f97316",
			radius: 0,
		})
		b.push({
			type: "shape",
			shape: "rect",
			x: 0,
			y: 84,
			w: 1280,
			h: 8,
			fill: "#16a34a",
			radius: 0,
		})
		b.push(
			text({
				x: 32,
				y: 18,
				w: 700,
				h: 48,
				text: ctx.restaurantName,
				fontId: t.headingFont,
				fontSize: 38,
				weight: 900,
				color: "#ffffff",
				uppercase: true,
			}),
		)
		b.push(
			text({
				x: 700,
				y: 28,
				w: 548,
				h: 34,
				text: ctx.subtitle || "MỞ CỬA 24/7 · GIÁ ĐÃ GỒM VAT",
				fontId: t.priceFont,
				fontSize: 24,
				align: "right",
				color: "#fff7ed",
			}),
		)

		// One shelf-tag hero per category across the top.
		const featured = ctx.categories
			.filter((c) => c.itemIds.length > 0)
			.slice(0, 4)
		featured.forEach((cat, i) => {
			b.push({
				type: "item",
				itemId: cat.itemIds[0],
				x: 32 + i * 306,
				y: 104,
				w: 290,
				h: 212,
				skin: "tag",
				showBadges: true,
			})
		})

		for (const block of flowCategoryBlocks(ctx.categories, {
			x: 32,
			y: 336,
			w: 1216,
			h: 360,
			columns: 5,
			columnGap: 16,
			rowGap: 16,
			skin: "board",
			itemColumns: 1,
			itemGap: 4,
			overflow: "clip",
		})) {
			b.push(block)
		}

		return b.elements
	},
}

// -- 3. Cafe chalkboard -----------------------------------------------------
const cafeChalkboard: LayoutTemplate = {
	id: "cafe-chalkboard",
	label: "Bảng phấn cà phê",
	hint: "Poster dọc · hai cột viết tay, ấm cúng",
	theme: "chalkboard",
	canvas: "poster",
	build: (ctx) => {
		const b = builder()
		const t = themeById("chalkboard")

		b.push({
			type: "shape",
			shape: "rect",
			x: 28,
			y: 28,
			w: 744,
			h: 1144,
			fill: "transparent",
			stroke: "rgba(255,255,255,0.28)",
			strokeWidth: 3,
			radius: 12,
		})
		b.push(
			text({
				x: 60,
				y: 66,
				w: 680,
				h: 76,
				text: ctx.restaurantName,
				fontId: t.headingFont,
				fontSize: 58,
				align: "center",
				color: t.heading,
			}),
		)
		b.push(
			text({
				x: 60,
				y: 150,
				w: 680,
				h: 32,
				text: ctx.subtitle || "~ Rang xay mỗi sáng ~",
				fontId: t.bodyFont,
				fontSize: 20,
				align: "center",
				color: t.textMuted,
			}),
		)
		b.push({
			type: "shape",
			shape: "line",
			x: 240,
			y: 198,
			w: 320,
			h: 2,
			fill: "rgba(255,255,255,0.35)",
		})

		for (const block of flowCategoryBlocks(ctx.categories, {
			x: 60,
			y: 232,
			w: 680,
			h: 908,
			columns: 2,
			columnGap: 30,
			rowGap: 26,
			skin: "board",
			itemColumns: 1,
			itemGap: 4,
			overflow: "clip",
		})) {
			b.push(block)
		}

		return b.elements
	},
}

// -- 4. Fine dining A4 ------------------------------------------------------
// A printed sheet may legitimately run onto a second page, so this one grows.
const fineDiningSheet: LayoutTemplate = {
	id: "finedining-a4",
	label: "Fine dining (A4)",
	hint: "Menu giấy để bàn · serif, in ra được",
	theme: "finedining",
	canvas: "a4",
	build: (ctx) => {
		const b = builder()
		const t = themeById("finedining")

		b.push({
			type: "shape",
			shape: "rect",
			x: 40,
			y: 40,
			w: 714,
			h: 1043,
			fill: "transparent",
			stroke: t.surfaceBorder,
			strokeWidth: 1,
			radius: 2,
		})
		b.push(
			text({
				x: 80,
				y: 84,
				w: 634,
				h: 26,
				text: "T H Ự C   Đ Ơ N",
				fontId: t.bodyFont,
				fontSize: 15,
				align: "center",
				color: t.textMuted,
				letterSpacing: 4,
			}),
		)
		b.push(
			text({
				x: 80,
				y: 116,
				w: 634,
				h: 62,
				text: ctx.restaurantName,
				fontId: t.headingFont,
				fontSize: 46,
				align: "center",
				color: t.heading,
			}),
		)
		b.push({
			type: "shape",
			shape: "line",
			x: 320,
			y: 194,
			w: 154,
			h: 1,
			fill: t.accent,
		})
		if (ctx.subtitle) {
			b.push(
				text({
					x: 80,
					y: 208,
					w: 634,
					h: 28,
					text: ctx.subtitle,
					fontId: t.bodyFont,
					fontSize: 17,
					align: "center",
					color: t.textMuted,
				}),
			)
		}

		for (const block of flowCategoryBlocks(ctx.categories, {
			x: 80,
			y: 258,
			w: 634,
			h: 800,
			columns: 1,
			columnGap: 0,
			rowGap: 30,
			skin: "board",
			itemColumns: 1,
			itemGap: 8,
			overflow: "grow",
		})) {
			b.push(block)
		}

		return b.elements
	},
}

// -- 5. Bubble tea poster ---------------------------------------------------
const bubbleTeaPoster: LayoutTemplate = {
	id: "bubbletea-poster",
	label: "Trà sữa pastel",
	hint: "Poster dọc · thẻ ảnh bo tròn, trẻ trung",
	theme: "bubbletea",
	canvas: "poster",
	build: (ctx) => {
		const b = builder()
		const t = themeById("bubbletea")

		b.push({
			type: "shape",
			shape: "ellipse",
			x: -120,
			y: -140,
			w: 420,
			h: 420,
			fill: "rgba(219,39,119,0.14)",
		})
		b.push({
			type: "shape",
			shape: "ellipse",
			x: 560,
			y: 980,
			w: 360,
			h: 360,
			fill: "rgba(139,92,246,0.16)",
		})
		b.push(
			text({
				x: 60,
				y: 72,
				w: 680,
				h: 72,
				text: ctx.restaurantName,
				fontId: t.headingFont,
				fontSize: 54,
				weight: 900,
				align: "center",
				color: t.heading,
			}),
		)
		b.push(
			text({
				x: 60,
				y: 152,
				w: 680,
				h: 30,
				text: ctx.subtitle || "Topping thả ga · Mua 2 tặng 1 mỗi thứ Tư",
				fontId: t.bodyFont,
				fontSize: 19,
				align: "center",
				color: t.textMuted,
			}),
		)

		for (const block of flowCategoryBlocks(ctx.categories, {
			x: 56,
			y: 212,
			w: 688,
			h: 1012,
			columns: 1,
			columnGap: 0,
			rowGap: 26,
			skin: "photo",
			itemColumns: 3,
			itemGap: 16,
			overflow: "grow",
		})) {
			b.push(block)
		}

		return b.elements
	},
}

// -- 6. Vietnamese eatery A4 ------------------------------------------------
const vietnamSheet: LayoutTemplate = {
	id: "vietnam-a4",
	label: "Quán Việt (A4)",
	hint: "A4 dọc · ảnh hàng ngang, dễ đọc khi gọi món",
	theme: "vietnam",
	canvas: "a4",
	build: (ctx) => {
		const b = builder()
		const t = themeById("vietnam")

		b.push({
			type: "shape",
			shape: "rect",
			x: 0,
			y: 0,
			w: 794,
			h: 150,
			fill: "#ea580c",
			radius: 0,
		})
		b.push(
			text({
				x: 48,
				y: 38,
				w: 698,
				h: 58,
				text: ctx.restaurantName,
				fontId: t.headingFont,
				fontSize: 44,
				align: "center",
				color: "#ffffff",
			}),
		)
		b.push(
			text({
				x: 48,
				y: 100,
				w: 698,
				h: 30,
				text: ctx.subtitle || "Cơm nhà · Nóng sốt · Phục vụ tận bàn",
				fontId: t.bodyFont,
				fontSize: 18,
				align: "center",
				color: "rgba(255,255,255,0.85)",
			}),
		)

		for (const block of flowCategoryBlocks(ctx.categories, {
			x: 48,
			y: 186,
			w: 698,
			h: 880,
			columns: 1,
			columnGap: 0,
			rowGap: 26,
			skin: "row",
			itemColumns: 1,
			itemGap: 12,
			overflow: "grow",
		})) {
			b.push(block)
		}

		return b.elements
	},
}

// -- 7. Plain photo grid (neutral starting point) ---------------------------
const photoGrid: LayoutTemplate = {
	id: "photo-grid",
	label: "Lưới ảnh cơ bản",
	hint: "TV ngang · lưới ảnh đều, hợp mọi loại quán",
	theme: "board",
	canvas: "tv",
	build: (ctx) => {
		const b = builder()
		const t = themeById("board")

		b.push(
			text({
				x: 40,
				y: 28,
				w: 1200,
				h: 54,
				text: ctx.restaurantName,
				fontId: t.headingFont,
				fontSize: 44,
				align: "center",
				color: t.heading,
				uppercase: true,
			}),
		)

		for (const block of flowCategoryBlocks(ctx.categories, {
			x: 40,
			y: 100,
			w: 1200,
			h: 596,
			columns: 2,
			columnGap: 24,
			rowGap: 20,
			skin: "photo",
			itemColumns: 3,
			itemGap: 16,
			overflow: "clip",
		})) {
			b.push(block)
		}

		return b.elements
	},
}

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
	fastfoodBoard,
	convenienceGrid,
	cafeChalkboard,
	bubbleTeaPoster,
	vietnamSheet,
	fineDiningSheet,
	photoGrid,
]

export function templateById(id: string): LayoutTemplate | undefined {
	return LAYOUT_TEMPLATES.find((t) => t.id === id)
}

/** Build a complete layout document from a template id. */
export function buildFromTemplate(
	templateId: string,
	ctx: TemplateContext,
): MenuLayout {
	const tpl = templateById(templateId) ?? LAYOUT_TEMPLATES[0]
	return {
		version: 2,
		canvas: tpl.canvas,
		theme: tpl.theme,
		background: null,
		title: ctx.restaurantName,
		subtitle: ctx.subtitle ?? null,
		elements: tpl.build(ctx),
	}
}

/**
 * Pick a sensible template for a restaurant that has never opened the builder,
 * so the public board is never blank or ugly by default.
 */
export function autoTemplateFor(ctx: TemplateContext): string {
	const names = ctx.categories.map((c) => c.name.toLowerCase()).join(" ")
	if (/gà rán|burger|combo|fast|pizza|khoai tây/.test(names))
		return "fastfood-board"
	if (/tiện lợi|snack|mì ly|nước ngọt|đồ hộp|cơm hộp/.test(names))
		return "convenience-grid"
	if (/trà sữa|topping|milk tea|đá xay/.test(names)) return "bubbletea-poster"
	if (/cà phê|coffee|espresso|bánh ngọt/.test(names)) return "cafe-chalkboard"
	if (/phở|bún|cơm|lẩu|nướng|gỏi/.test(names)) return "vietnam-a4"
	return "photo-grid"
}

/** Estimated content height, used to grow a scrolling board past the canvas. */
export function contentHeight(layout: MenuLayout): number {
	return layout.elements.reduce((max, el) => Math.max(max, el.y + el.h), 0)
}
