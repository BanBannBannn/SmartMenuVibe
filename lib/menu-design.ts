// =============================================================================
// SmartMenu - Menu design system
// -----------------------------------------------------------------------------
// Design tokens shared by three surfaces that MUST look identical:
//   1. the owner's drag & drop builder canvas,
//   2. the public big-screen board (/[slug]/showcase),
//   3. the dashboard preview.
//
// Everything here is expressed as plain CSS values (not Tailwind classes) so a
// renderer can draw an element at any scale factor, inside any container, and
// on a server-rendered page - Tailwind's JIT never sees a dynamic class here.
// =============================================================================

// ---------------------------------------------------------------------------
// Canvas presets
// ---------------------------------------------------------------------------
// Coordinates in a layout are "design pixels" on one of these fixed surfaces.
// The renderer scales the whole surface to fit its container, so a design made
// on a laptop looks the same on a 55" TV.

export type CanvasPresetId = "a4" | "tv" | "poster" | "square" | "tv-portrait"

export type CanvasPreset = {
	id: CanvasPresetId
	label: string
	hint: string
	width: number
	height: number
}

export const CANVAS_PRESETS: CanvasPreset[] = [
	{
		id: "tv",
		label: "Màn hình TV 16:9",
		hint: "Menu board treo tường (KFC, Circle K)",
		width: 1280,
		height: 720,
	},
	{
		id: "tv-portrait",
		label: "Màn hình dọc 9:16",
		hint: "Màn hình đứng cạnh quầy",
		width: 720,
		height: 1280,
	},
	{
		id: "a4",
		label: "A4 dọc",
		hint: "Menu giấy để bàn, in ra được",
		width: 794,
		height: 1123,
	},
	{
		id: "poster",
		label: "Poster 2:3",
		hint: "Standee, poster dán tường",
		width: 800,
		height: 1200,
	},
	{
		id: "square",
		label: "Vuông 1:1",
		hint: "Đăng Facebook / Instagram",
		width: 1000,
		height: 1000,
	},
]

export function canvasPresetById(id?: string | null): CanvasPreset {
	return CANVAS_PRESETS.find((p) => p.id === id) ?? CANVAS_PRESETS[0]
}

// ---------------------------------------------------------------------------
// Backgrounds
// ---------------------------------------------------------------------------
// `css` goes straight into `style.background`. `dark` tells renderers whether
// default text on top should be light.

export type BackgroundDef = {
	id: string
	label: string
	group: string
	css: string
	dark: boolean
}

export const MENU_BACKGROUNDS: BackgroundDef[] = [
	// -- Plain / paper ------------------------------------------------------
	{
		id: "none",
		label: "Trắng trơn",
		group: "Đơn giản",
		css: "#ffffff",
		dark: false,
	},
	{
		id: "cream",
		label: "Kem nhẹ",
		group: "Đơn giản",
		css: "linear-gradient(180deg, #fffbeb 0%, #ffedd5 100%)",
		dark: false,
	},
	{
		id: "kraft",
		label: "Giấy kraft",
		group: "Đơn giản",
		css: "linear-gradient(135deg, #e7d3b3 0%, #d8bd93 50%, #e7d3b3 100%)",
		dark: false,
	},
	{
		id: "linen",
		label: "Vải lanh",
		group: "Đơn giản",
		css: "repeating-linear-gradient(45deg, #faf7f2 0 3px, #f3ede2 3px 6px)",
		dark: false,
	},

	// -- Fast food ----------------------------------------------------------
	{
		id: "fastfood-red",
		label: "Đỏ gà rán",
		group: "Fast food",
		css: "radial-gradient(120% 90% at 50% 0%, #dc2626 0%, #991b1b 55%, #450a0a 100%)",
		dark: true,
	},
	{
		id: "fastfood-stripe",
		label: "Sọc đỏ trắng",
		group: "Fast food",
		css: "repeating-linear-gradient(115deg, #dc2626 0 60px, #b91c1c 60px 120px)",
		dark: true,
	},
	{
		id: "burger-charcoal",
		label: "Bảng đen quầy",
		group: "Fast food",
		css: "linear-gradient(180deg, #1f2937 0%, #111827 60%, #030712 100%)",
		dark: true,
	},

	// -- Convenience store --------------------------------------------------
	{
		id: "store-clean",
		label: "Siêu thị sáng",
		group: "Cửa hàng tiện lợi",
		css: "linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)",
		dark: false,
	},
	{
		id: "store-711",
		label: "Cam - xanh - đỏ",
		group: "Cửa hàng tiện lợi",
		css: "linear-gradient(180deg, #f97316 0%, #f97316 22%, #ffffff 22%, #ffffff 74%, #16a34a 74%, #16a34a 88%, #dc2626 88%, #dc2626 100%)",
		dark: false,
	},
	{
		id: "store-cool",
		label: "Tủ mát",
		group: "Cửa hàng tiện lợi",
		css: "linear-gradient(160deg, #0ea5e9 0%, #0284c7 45%, #075985 100%)",
		dark: true,
	},

	// -- Cafe ---------------------------------------------------------------
	{
		id: "chalkboard",
		label: "Bảng phấn",
		group: "Cà phê",
		css: "radial-gradient(120% 100% at 30% 10%, #1f3a30 0%, #12241d 55%, #0a1611 100%)",
		dark: true,
	},
	{
		id: "latte",
		label: "Latte",
		group: "Cà phê",
		css: "linear-gradient(160deg, #f5ede3 0%, #e2cdb6 60%, #c8a888 100%)",
		dark: false,
	},

	// -- Vivid --------------------------------------------------------------
	{
		id: "sunset",
		label: "Hoàng hôn",
		group: "Rực rỡ",
		css: "linear-gradient(135deg, #f97316 0%, #f43f5e 50%, #9333ea 100%)",
		dark: true,
	},
	{
		id: "ocean",
		label: "Đại dương",
		group: "Rực rỡ",
		css: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 45%, #1d4ed8 100%)",
		dark: true,
	},
	{
		id: "forest",
		label: "Rừng xanh",
		group: "Rực rỡ",
		css: "linear-gradient(135deg, #10b981 0%, #16a34a 45%, #0f766e 100%)",
		dark: true,
	},
	{
		id: "berry",
		label: "Berry",
		group: "Rực rỡ",
		css: "linear-gradient(135deg, #c026d3 0%, #db2777 50%, #e11d48 100%)",
		dark: true,
	},
	{
		id: "bubble",
		label: "Trà sữa pastel",
		group: "Rực rỡ",
		css: "linear-gradient(160deg, #fce7f3 0%, #fbcfe8 45%, #ddd6fe 100%)",
		dark: false,
	},

	// -- Dark / premium -----------------------------------------------------
	{
		id: "midnight",
		label: "Nửa đêm",
		group: "Sang trọng",
		css: "linear-gradient(135deg, #1e293b 0%, #111827 55%, #000000 100%)",
		dark: true,
	},
	{
		id: "gold",
		label: "Sang trọng",
		group: "Sang trọng",
		css: "linear-gradient(135deg, #fbbf24 0%, #eab308 45%, #ea580c 100%)",
		dark: true,
	},
	{
		id: "noir-gold",
		label: "Đen - vàng kim",
		group: "Sang trọng",
		css: "radial-gradient(110% 80% at 50% 0%, #292524 0%, #1c1917 50%, #0c0a09 100%)",
		dark: true,
	},
	{
		id: "wine",
		label: "Rượu vang",
		group: "Sang trọng",
		css: "radial-gradient(110% 90% at 50% 0%, #7f1d1d 0%, #4c0519 55%, #1c0208 100%)",
		dark: true,
	},
]

export function backgroundById(id?: string | null): BackgroundDef {
	return MENU_BACKGROUNDS.find((b) => b.id === id) ?? MENU_BACKGROUNDS[0]
}

export const BACKGROUND_GROUPS = Array.from(
	new Set(MENU_BACKGROUNDS.map((b) => b.group)),
)

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------
// Only fonts with a Vietnamese subset - a menu full of broken diacritics is
// worse than a boring font. The CSS variables are registered in app/layout.tsx.

export type FontDef = { id: string; label: string; stack: string }

export const MENU_FONTS: FontDef[] = [
	{
		id: "sans",
		label: "Hiện đại (Be Vietnam Pro)",
		stack: "var(--font-body), system-ui, sans-serif",
	},
	{
		id: "display",
		label: "Đậm & to (Montserrat)",
		stack: "var(--font-heading), system-ui, sans-serif",
	},
	{
		id: "condensed",
		label: "Bảng giá hẹp (Oswald)",
		stack: "var(--font-condensed), 'Arial Narrow', sans-serif",
	},
	{
		id: "serif",
		label: "Sang trọng (Playfair Display)",
		stack: "var(--font-serif), Georgia, serif",
	},
	{
		id: "script",
		label: "Quán cà phê (Lobster)",
		stack: "var(--font-script), cursive",
	},
]

export function fontStack(id?: string | null): string {
	return (MENU_FONTS.find((f) => f.id === id) ?? MENU_FONTS[0]).stack
}

// ---------------------------------------------------------------------------
// Card skins
// ---------------------------------------------------------------------------
// How a single menu item is drawn. Chosen per-element so one board can mix a
// big hero combo with a dense price list.

export type CardSkinId =
	| "photo" // photo on top, name + price below (default, e-commerce feel)
	| "hero" // full-bleed photo with gradient scrim + huge price
	| "row" // horizontal: square thumbnail left, text right
	| "board" // no photo: name ...... price (classic menu board line)
	| "tag" // photo + yellow price tag (convenience store)
	| "ticket" // fast-food combo ticket: number, name, price burst

export type CardSkinDef = {
	id: CardSkinId
	label: string
	hint: string
	/** Suggested default size in design px when dropped on the canvas. */
	defaultSize: { w: number; h: number }
	needsPhoto: boolean
}

export const CARD_SKINS: CardSkinDef[] = [
	{
		id: "photo",
		label: "Thẻ ảnh",
		hint: "Ảnh trên, tên + giá dưới",
		defaultSize: { w: 240, h: 300 },
		needsPhoto: true,
	},
	{
		id: "hero",
		label: "Ảnh lớn nổi bật",
		hint: "Ảnh tràn viền, giá cực to",
		defaultSize: { w: 480, h: 320 },
		needsPhoto: true,
	},
	{
		id: "row",
		label: "Hàng ngang",
		hint: "Ảnh vuông bên trái, mô tả bên phải",
		defaultSize: { w: 460, h: 130 },
		needsPhoto: true,
	},
	{
		id: "board",
		label: "Dòng bảng giá",
		hint: "Tên ····· giá, không cần ảnh",
		defaultSize: { w: 420, h: 46 },
		needsPhoto: false,
	},
	{
		id: "tag",
		label: "Thẻ giá tiện lợi",
		hint: "Ảnh + nhãn giá vàng góc dưới",
		defaultSize: { w: 220, h: 260 },
		needsPhoto: true,
	},
	{
		id: "ticket",
		label: "Vé combo",
		hint: "Số combo + tên + giá tròn nổi bật",
		defaultSize: { w: 300, h: 170 },
		needsPhoto: true,
	},
]

export function cardSkinById(id?: string | null): CardSkinDef {
	return CARD_SKINS.find((s) => s.id === id) ?? CARD_SKINS[0]
}

// ---------------------------------------------------------------------------
// Category-block metrics
// ---------------------------------------------------------------------------
// The renderer decides how many items fit in a category block; the template
// generators decide how tall to make that block. Both MUST agree, otherwise a
// template reserves space for eight dishes and the renderer draws five - which
// is exactly how you get a board with "+3 món nữa" printed on it.
// These functions are the single source of that arithmetic.

/** Gap between a category header and its item grid. */
export const CATEGORY_HEADER_GAP = 8

export function categoryHeaderHeight(blockWidth: number): number {
	return Math.round(Math.min(56, Math.max(32, blockWidth * 0.08)))
}

/** Height of one item row for a given skin at a given column width. */
export function skinRowHeight(skin: CardSkinId, columnWidth: number): number {
	switch (skin) {
		case "board":
			return 40
		case "row":
			return Math.round(Math.min(140, Math.max(88, columnWidth * 0.28)))
		case "ticket":
			return Math.round(Math.min(180, Math.max(110, columnWidth * 0.55)))
		case "hero":
			return Math.round(columnWidth * 0.66)
		default:
			return Math.round(columnWidth * 1.18)
	}
}

export type BlockMetrics = {
	skin: CardSkinId
	width: number
	columns: number
	gap: number
	showHeader: boolean
}

export function blockColumnWidth(m: BlockMetrics): number {
	return (m.width - m.gap * (m.columns - 1)) / m.columns
}

function blockHeaderCost(m: BlockMetrics): number {
	return m.showHeader ? categoryHeaderHeight(m.width) + CATEGORY_HEADER_GAP : 0
}

/** Exact height needed to draw `rows` rows of items. */
export function categoryBlockHeight(m: BlockMetrics, rows: number): number {
	if (rows <= 0) return blockHeaderCost(m)
	const rowH = skinRowHeight(m.skin, blockColumnWidth(m))
	return blockHeaderCost(m) + rows * rowH + (rows - 1) * m.gap
}

/** How many item rows actually fit in a block of `height`. */
export function categoryRowCapacity(m: BlockMetrics, height: number): number {
	const rowH = skinRowHeight(m.skin, blockColumnWidth(m))
	const body = height - blockHeaderCost(m)
	if (body < rowH) return 0
	return Math.max(0, Math.floor((body + m.gap) / (rowH + m.gap)))
}

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------
// A theme is a complete look: background + palette + fonts + default skin.
// Applying one restyles every element on the canvas in a single click.

export type MenuTheme = {
	id: string
	label: string
	hint: string
	background: string
	/** Card surface fill (CSS colour, may be translucent). */
	surface: string
	surfaceBorder: string
	/** Main text on a card. */
	text: string
	textMuted: string
	/** Price / highlight colour. */
	accent: string
	/** Text drawn on top of `accent` fills. */
	accentText: string
	/** Heading colour on the canvas background (outside cards). */
	heading: string
	headingFont: string
	bodyFont: string
	priceFont: string
	radius: number
	skin: CardSkinId
	/** Uppercase item names - fast-food boards do, fine dining does not. */
	uppercaseNames: boolean
}

export const MENU_THEMES: MenuTheme[] = [
	{
		id: "fastfood",
		label: "Gà rán / Fast food",
		hint: "Đỏ - vàng, giá to, kiểu KFC / Lotteria",
		background: "fastfood-red",
		surface: "rgba(255,255,255,0.10)",
		surfaceBorder: "rgba(255,255,255,0.22)",
		text: "#ffffff",
		textMuted: "rgba(255,255,255,0.72)",
		accent: "#facc15",
		accentText: "#7f1d1d",
		heading: "#facc15",
		headingFont: "display",
		bodyFont: "sans",
		priceFont: "display",
		radius: 20,
		skin: "photo",
		uppercaseNames: true,
	},
	{
		id: "convenience",
		label: "Cửa hàng tiện lợi",
		hint: "Nền sáng, thẻ giá vàng, kiểu Circle K / 7-Eleven",
		background: "store-clean",
		surface: "#ffffff",
		surfaceBorder: "#e2e8f0",
		text: "#0f172a",
		textMuted: "#64748b",
		accent: "#f59e0b",
		accentText: "#1c1917",
		heading: "#0f172a",
		headingFont: "display",
		bodyFont: "sans",
		priceFont: "condensed",
		radius: 14,
		skin: "tag",
		uppercaseNames: false,
	},
	{
		id: "board",
		label: "Bảng giá quầy",
		hint: "Nền tối, chữ hẹp, danh sách nhiều món",
		background: "burger-charcoal",
		surface: "rgba(255,255,255,0.04)",
		surfaceBorder: "rgba(255,255,255,0.12)",
		text: "#f8fafc",
		textMuted: "rgba(248,250,252,0.6)",
		accent: "#fb923c",
		accentText: "#0c0a09",
		heading: "#fb923c",
		headingFont: "condensed",
		bodyFont: "condensed",
		priceFont: "condensed",
		radius: 10,
		skin: "board",
		uppercaseNames: true,
	},
	{
		id: "chalkboard",
		label: "Bảng phấn quán cà phê",
		hint: "Xanh đậm, chữ viết tay, ấm cúng",
		background: "chalkboard",
		surface: "rgba(255,255,255,0.05)",
		surfaceBorder: "rgba(255,255,255,0.16)",
		text: "#f8fafc",
		textMuted: "rgba(248,250,252,0.65)",
		accent: "#fcd34d",
		accentText: "#12241d",
		heading: "#fef3c7",
		headingFont: "script",
		bodyFont: "sans",
		priceFont: "script",
		radius: 16,
		skin: "row",
		uppercaseNames: false,
	},
	{
		id: "finedining",
		label: "Fine dining",
		hint: "Đen - vàng kim, serif, nhiều khoảng trắng",
		background: "noir-gold",
		surface: "rgba(255,255,255,0.03)",
		surfaceBorder: "rgba(212,175,55,0.35)",
		text: "#f5f5f4",
		textMuted: "rgba(245,245,244,0.6)",
		accent: "#d4af37",
		accentText: "#1c1917",
		heading: "#d4af37",
		headingFont: "serif",
		bodyFont: "serif",
		priceFont: "serif",
		radius: 4,
		skin: "board",
		uppercaseNames: false,
	},
	{
		id: "bubbletea",
		label: "Trà sữa pastel",
		hint: "Hồng - tím nhạt, bo tròn, trẻ trung",
		background: "bubble",
		surface: "#ffffff",
		surfaceBorder: "#f9a8d4",
		text: "#500724",
		textMuted: "#9d174d",
		accent: "#db2777",
		accentText: "#ffffff",
		heading: "#831843",
		headingFont: "display",
		bodyFont: "sans",
		priceFont: "display",
		radius: 26,
		skin: "photo",
		uppercaseNames: false,
	},
	{
		id: "vietnam",
		label: "Quán Việt ấm cúng",
		hint: "Kem - cam đất, hợp phở / lẩu / cơm",
		background: "cream",
		surface: "#ffffff",
		surfaceBorder: "#fed7aa",
		text: "#431407",
		textMuted: "#9a3412",
		accent: "#ea580c",
		accentText: "#ffffff",
		heading: "#7c2d12",
		headingFont: "serif",
		bodyFont: "sans",
		priceFont: "display",
		radius: 18,
		skin: "row",
		uppercaseNames: false,
	},
]

export function themeById(id?: string | null): MenuTheme {
	return MENU_THEMES.find((t) => t.id === id) ?? MENU_THEMES[0]
}

// ---------------------------------------------------------------------------
// Item tag badges
// ---------------------------------------------------------------------------

export type BadgeDef = { label: string; icon: string; bg: string; fg: string }

export const ITEM_BADGES: Record<string, BadgeDef> = {
	hot: { label: "Món hot", icon: "🔥", bg: "#ef4444", fg: "#ffffff" },
	best_seller: { label: "Bán chạy", icon: "👑", bg: "#f59e0b", fg: "#1c1917" },
	new: { label: "Mới", icon: "✨", bg: "#0ea5e9", fg: "#ffffff" },
	spicy: { label: "Cay", icon: "🌶️", bg: "#ea580c", fg: "#ffffff" },
	vegetarian: { label: "Chay", icon: "🥬", bg: "#16a34a", fg: "#ffffff" },
	combo: { label: "Combo", icon: "🍱", bg: "#db2777", fg: "#ffffff" },
	recommended: { label: "Đề xuất", icon: "⭐", bg: "#7c3aed", fg: "#ffffff" },
}

export function badgesForTags(tags: string[], limit = 2): BadgeDef[] {
	return tags
		.map((t) => ITEM_BADGES[t])
		.filter((b): b is BadgeDef => Boolean(b))
		.slice(0, limit)
}
