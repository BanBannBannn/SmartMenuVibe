// =============================================================================
// SmartMenu - Shared canvas renderer
// -----------------------------------------------------------------------------
// One renderer, three surfaces: the builder canvas, the dashboard preview and
// the public board all mount these components with the same layout document.
// If it looks right while editing, it looks identical on the TV. That property
// only holds because nothing here is duplicated per-surface.
//
// All sizes are "design pixels"; the parent scales the whole canvas with a CSS
// transform, so a 1280x720 design fills a 55" screen without re-layout.
// =============================================================================

import type { CSSProperties } from "react"
import {
	backgroundById,
	badgesForTags,
	blockColumnWidth,
	categoryBlockHeight,
	categoryHeaderHeight,
	categoryRowCapacity,
	CATEGORY_HEADER_GAP,
	fontStack,
	skinRowHeight,
	themeById,
	type BlockMetrics,
	type MenuTheme,
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

export type RenderItem = {
	id: string
	name: string
	description: string | null
	base_price: number
	images: string[]
	tags: string[]
}

export type RenderCategory = {
	id: string
	name: string
	items: RenderItem[]
}

export type RenderData = {
	items: Map<string, RenderItem>
	categories: Map<string, RenderCategory>
}

export function buildRenderData(categories: RenderCategory[]): RenderData {
	const items = new Map<string, RenderItem>()
	const cats = new Map<string, RenderCategory>()
	for (const cat of categories) {
		cats.set(cat.id, cat)
		for (const item of cat.items) items.set(item.id, item)
	}
	return { items, categories: cats }
}

const NO_IMAGE = "/no-image.svg"

/** Compact price for signage: "45.000đ" reads faster than "45.000 ₫". */
export function priceText(amount: number): string {
	return `${new Intl.NumberFormat("vi-VN").format(Math.round(amount))}đ`
}

function clampFont(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, Math.round(value)))
}

// ---------------------------------------------------------------------------
// Item cards
// ---------------------------------------------------------------------------

type CardProps = {
	item: RenderItem
	theme: MenuTheme
	width: number
	height: number
	showDescription?: boolean
	showBadges?: boolean
	badgeNumber?: string
}

function Badges({ item, scale = 1 }: { item: RenderItem; scale?: number }) {
	const badges = badgesForTags(item.tags)
	if (badges.length === 0) return null
	return (
		<div
			className="absolute left-0 top-0 flex flex-col items-start"
			style={{ gap: 4 * scale, left: 10 * scale, top: 10 * scale }}
		>
			{badges.map((b) => (
				<span
					key={b.label}
					style={{
						background: b.bg,
						color: b.fg,
						fontSize: clampFont(11 * scale, 9, 22),
						padding: `${3 * scale}px ${8 * scale}px`,
						borderRadius: 999,
						fontWeight: 800,
						lineHeight: 1.2,
						whiteSpace: "nowrap",
						boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
					}}
				>
					{b.icon} {b.label}
				</span>
			))}
		</div>
	)
}

function itemName(item: RenderItem, theme: MenuTheme): string {
	return theme.uppercaseNames ? item.name.toUpperCase() : item.name
}

/** Photo on top, name + price underneath. The safe default. */
function PhotoCard({
	item,
	theme,
	width,
	height,
	showDescription,
	showBadges,
}: CardProps) {
	const scale = Math.max(0.7, Math.min(1.8, width / 240))
	const imageH = Math.round(height * 0.58)
	const nameSize = clampFont(17 * scale, 12, 40)
	const priceSize = clampFont(21 * scale, 14, 52)

	return (
		<div
			style={{
				width,
				height,
				background: theme.surface,
				border: `1px solid ${theme.surfaceBorder}`,
				borderRadius: theme.radius,
				overflow: "hidden",
				display: "flex",
				flexDirection: "column",
				boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
			}}
		>
			<div
				style={{
					height: imageH,
					position: "relative",
					background: "#00000018",
				}}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={item.images[0] || NO_IMAGE}
					alt={item.name}
					style={{ width: "100%", height: "100%", objectFit: "cover" }}
					draggable={false}
				/>
				{showBadges !== false && <Badges item={item} scale={scale} />}
			</div>
			<div
				style={{
					flex: 1,
					minHeight: 0,
					padding: 12 * scale,
					display: "flex",
					flexDirection: "column",
					gap: 3 * scale,
				}}
			>
				<p
					style={{
						fontFamily: fontStack(theme.bodyFont),
						fontSize: nameSize,
						fontWeight: 700,
						color: theme.text,
						lineHeight: 1.2,
						margin: 0,
						overflow: "hidden",
						display: "-webkit-box",
						WebkitLineClamp: 2,
						WebkitBoxOrient: "vertical",
					}}
				>
					{itemName(item, theme)}
				</p>
				{showDescription !== false && item.description && (
					<p
						style={{
							fontFamily: fontStack(theme.bodyFont),
							fontSize: clampFont(12 * scale, 9, 22),
							color: theme.textMuted,
							lineHeight: 1.3,
							margin: 0,
							overflow: "hidden",
							display: "-webkit-box",
							WebkitLineClamp: 2,
							WebkitBoxOrient: "vertical",
						}}
					>
						{item.description}
					</p>
				)}
				<span
					style={{
						marginTop: "auto",
						fontFamily: fontStack(theme.priceFont),
						fontSize: priceSize,
						fontWeight: 900,
						color: theme.accent,
						lineHeight: 1.1,
					}}
				>
					{priceText(item.base_price)}
				</span>
			</div>
		</div>
	)
}

/** Full-bleed photo, gradient scrim, oversized price. For combo heroes. */
function HeroCard({
	item,
	theme,
	width,
	height,
	showDescription,
	showBadges,
}: CardProps) {
	const scale = Math.max(0.8, Math.min(2.2, width / 380))
	return (
		<div
			style={{
				width,
				height,
				borderRadius: theme.radius,
				overflow: "hidden",
				position: "relative",
				border: `1px solid ${theme.surfaceBorder}`,
				boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
			}}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={item.images[0] || NO_IMAGE}
				alt={item.name}
				style={{ width: "100%", height: "100%", objectFit: "cover" }}
				draggable={false}
			/>
			<div
				style={{
					position: "absolute",
					inset: 0,
					background:
						"linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.82) 100%)",
				}}
			/>
			{showBadges !== false && <Badges item={item} scale={scale} />}
			<div
				style={{
					position: "absolute",
					left: 16 * scale,
					right: 16 * scale,
					bottom: 14 * scale,
					display: "flex",
					alignItems: "flex-end",
					justifyContent: "space-between",
					gap: 10 * scale,
				}}
			>
				<div style={{ minWidth: 0 }}>
					<p
						style={{
							fontFamily: fontStack(theme.headingFont),
							fontSize: clampFont(24 * scale, 15, 58),
							fontWeight: 900,
							color: "#ffffff",
							lineHeight: 1.1,
							margin: 0,
							textShadow: "0 2px 10px rgba(0,0,0,0.5)",
						}}
					>
						{itemName(item, theme)}
					</p>
					{showDescription !== false && item.description && (
						<p
							style={{
								fontFamily: fontStack(theme.bodyFont),
								fontSize: clampFont(13 * scale, 10, 24),
								color: "rgba(255,255,255,0.8)",
								margin: `${4 * scale}px 0 0`,
								lineHeight: 1.3,
								overflow: "hidden",
								display: "-webkit-box",
								WebkitLineClamp: 2,
								WebkitBoxOrient: "vertical",
							}}
						>
							{item.description}
						</p>
					)}
				</div>
				<span
					style={{
						flexShrink: 0,
						background: theme.accent,
						color: theme.accentText,
						fontFamily: fontStack(theme.priceFont),
						fontSize: clampFont(24 * scale, 15, 56),
						fontWeight: 900,
						padding: `${6 * scale}px ${14 * scale}px`,
						borderRadius: 999,
						lineHeight: 1.1,
						boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
					}}
				>
					{priceText(item.base_price)}
				</span>
			</div>
		</div>
	)
}

/** Square thumbnail left, text right. Reads well on paper menus. */
function RowCard({
	item,
	theme,
	width,
	height,
	showDescription,
	showBadges,
}: CardProps) {
	const scale = Math.max(0.75, Math.min(1.8, height / 120))
	const thumb = height
	return (
		<div
			style={{
				width,
				height,
				background: theme.surface,
				border: `1px solid ${theme.surfaceBorder}`,
				borderRadius: theme.radius,
				overflow: "hidden",
				display: "flex",
				boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
			}}
		>
			<div
				style={{
					width: thumb,
					flexShrink: 0,
					position: "relative",
					background: "#00000018",
				}}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={item.images[0] || NO_IMAGE}
					alt={item.name}
					style={{ width: "100%", height: "100%", objectFit: "cover" }}
					draggable={false}
				/>
				{showBadges !== false && <Badges item={item} scale={scale * 0.85} />}
			</div>
			<div
				style={{
					flex: 1,
					minWidth: 0,
					padding: 12 * scale,
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					gap: 3 * scale,
				}}
			>
				<p
					style={{
						fontFamily: fontStack(theme.bodyFont),
						fontSize: clampFont(18 * scale, 13, 38),
						fontWeight: 700,
						color: theme.text,
						margin: 0,
						lineHeight: 1.2,
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{itemName(item, theme)}
				</p>
				{showDescription !== false && item.description && (
					<p
						style={{
							fontFamily: fontStack(theme.bodyFont),
							fontSize: clampFont(12.5 * scale, 10, 22),
							color: theme.textMuted,
							margin: 0,
							lineHeight: 1.35,
							overflow: "hidden",
							display: "-webkit-box",
							WebkitLineClamp: 2,
							WebkitBoxOrient: "vertical",
						}}
					>
						{item.description}
					</p>
				)}
				<span
					style={{
						fontFamily: fontStack(theme.priceFont),
						fontSize: clampFont(19 * scale, 13, 40),
						fontWeight: 900,
						color: theme.accent,
						lineHeight: 1.2,
					}}
				>
					{priceText(item.base_price)}
				</span>
			</div>
		</div>
	)
}

/** "Name ······ price" - the classic price-list line, no photo needed. */
function BoardCard({ item, theme, width, height, showDescription }: CardProps) {
	const nameSize = clampFont(height * 0.42, 12, 44)
	const withDesc = showDescription !== false && Boolean(item.description)
	return (
		<div
			style={{
				width,
				height,
				display: "flex",
				alignItems: withDesc ? "flex-start" : "center",
				gap: 10,
				overflow: "hidden",
			}}
		>
			{/* `flex: 0 1 auto` + hidden overflow lets a long dish name ellipsis
			    instead of running underneath the price. */}
			<div style={{ minWidth: 0, flex: "0 1 auto", overflow: "hidden" }}>
				<span
					style={{
						display: "block",
						fontFamily: fontStack(theme.bodyFont),
						fontSize: nameSize,
						fontWeight: 700,
						color: theme.text,
						lineHeight: 1.25,
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{itemName(item, theme)}
				</span>
				{withDesc && (
					<p
						style={{
							fontFamily: fontStack(theme.bodyFont),
							fontSize: clampFont(nameSize * 0.62, 9, 22),
							color: theme.textMuted,
							margin: "1px 0 0",
							lineHeight: 1.25,
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
						}}
					>
						{item.description}
					</p>
				)}
			</div>
			<div
				style={{
					flex: "1 1 auto",
					minWidth: 8,
					alignSelf: withDesc ? "flex-start" : "auto",
					marginTop: withDesc ? nameSize * 0.85 : 0,
					borderBottom: `2px dotted ${theme.textMuted}`,
					opacity: 0.55,
				}}
			/>
			<span
				style={{
					flexShrink: 0,
					fontFamily: fontStack(theme.priceFont),
					fontSize: nameSize,
					fontWeight: 900,
					color: theme.accent,
					lineHeight: 1.25,
					whiteSpace: "nowrap",
				}}
			>
				{priceText(item.base_price)}
			</span>
		</div>
	)
}

/** Convenience-store shelf card: photo plus a stuck-on yellow price tag. */
function TagCard({ item, theme, width, height, showBadges }: CardProps) {
	const scale = Math.max(0.65, Math.min(1.6, width / 220))
	const imageH = Math.round(height * 0.7)
	return (
		<div
			style={{
				width,
				height,
				background: theme.surface,
				border: `1px solid ${theme.surfaceBorder}`,
				borderRadius: theme.radius,
				overflow: "hidden",
				position: "relative",
				display: "flex",
				flexDirection: "column",
				boxShadow: "0 4px 14px rgba(15,23,42,0.10)",
			}}
		>
			<div
				style={{
					height: imageH,
					position: "relative",
					background: "#0f172a10",
				}}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={item.images[0] || NO_IMAGE}
					alt={item.name}
					style={{ width: "100%", height: "100%", objectFit: "cover" }}
					draggable={false}
				/>
				{showBadges !== false && <Badges item={item} scale={scale * 0.9} />}
			</div>
			<div
				style={{
					flex: 1,
					minHeight: 0,
					padding: `${10 * scale}px ${10 * scale}px ${8 * scale}px`,
				}}
			>
				<p
					style={{
						fontFamily: fontStack(theme.bodyFont),
						fontSize: clampFont(14 * scale, 10, 28),
						fontWeight: 600,
						color: theme.text,
						margin: 0,
						lineHeight: 1.25,
						overflow: "hidden",
						display: "-webkit-box",
						WebkitLineClamp: 2,
						WebkitBoxOrient: "vertical",
					}}
				>
					{itemName(item, theme)}
				</p>
			</div>
			{/* Price tag, deliberately overlapping the photo edge. */}
			<span
				style={{
					position: "absolute",
					right: 8 * scale,
					top: imageH - 18 * scale,
					background: theme.accent,
					color: theme.accentText,
					fontFamily: fontStack(theme.priceFont),
					fontSize: clampFont(19 * scale, 13, 38),
					fontWeight: 900,
					padding: `${4 * scale}px ${11 * scale}px`,
					borderRadius: 6,
					transform: "rotate(-3deg)",
					boxShadow: "0 4px 12px rgba(0,0,0,0.28)",
					lineHeight: 1.15,
					whiteSpace: "nowrap",
				}}
			>
				{priceText(item.base_price)}
			</span>
		</div>
	)
}

/** Numbered combo ticket, the fast-food "COMBO 3" strip. */
function TicketCard({
	item,
	theme,
	width,
	height,
	badgeNumber,
	showDescription,
}: CardProps) {
	const scale = Math.max(0.7, Math.min(1.8, width / 300))
	const thumb = Math.round(height * 0.7)
	return (
		<div
			style={{
				width,
				height,
				background: theme.surface,
				border: `2px dashed ${theme.surfaceBorder}`,
				borderRadius: theme.radius,
				display: "flex",
				alignItems: "center",
				gap: 10 * scale,
				padding: 10 * scale,
				overflow: "hidden",
			}}
		>
			<div
				style={{
					width: thumb,
					height: thumb,
					flexShrink: 0,
					borderRadius: theme.radius * 0.7,
					overflow: "hidden",
					position: "relative",
				}}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={item.images[0] || NO_IMAGE}
					alt={item.name}
					style={{ width: "100%", height: "100%", objectFit: "cover" }}
					draggable={false}
				/>
			</div>
			<div style={{ flex: 1, minWidth: 0 }}>
				{badgeNumber && (
					<span
						style={{
							display: "inline-block",
							background: theme.accent,
							color: theme.accentText,
							fontFamily: fontStack(theme.headingFont),
							fontSize: clampFont(12 * scale, 9, 22),
							fontWeight: 900,
							padding: `${2 * scale}px ${8 * scale}px`,
							borderRadius: 4,
							marginBottom: 4 * scale,
							letterSpacing: 1,
						}}
					>
						COMBO {badgeNumber}
					</span>
				)}
				<p
					style={{
						fontFamily: fontStack(theme.headingFont),
						fontSize: clampFont(18 * scale, 12, 36),
						fontWeight: 900,
						color: theme.text,
						margin: 0,
						lineHeight: 1.15,
						overflow: "hidden",
						display: "-webkit-box",
						WebkitLineClamp: 2,
						WebkitBoxOrient: "vertical",
					}}
				>
					{itemName(item, theme)}
				</p>
				{showDescription !== false && item.description && (
					<p
						style={{
							fontFamily: fontStack(theme.bodyFont),
							fontSize: clampFont(11.5 * scale, 9, 20),
							color: theme.textMuted,
							margin: `${2 * scale}px 0 0`,
							lineHeight: 1.25,
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
						}}
					>
						{item.description}
					</p>
				)}
			</div>
			<span
				style={{
					flexShrink: 0,
					fontFamily: fontStack(theme.priceFont),
					fontSize: clampFont(22 * scale, 14, 44),
					fontWeight: 900,
					color: theme.accent,
					lineHeight: 1.1,
				}}
			>
				{priceText(item.base_price)}
			</span>
		</div>
	)
}

export function ItemCard(props: CardProps & { skin: string }) {
	switch (props.skin) {
		case "hero":
			return <HeroCard {...props} />
		case "row":
			return <RowCard {...props} />
		case "board":
			return <BoardCard {...props} />
		case "tag":
			return <TagCard {...props} />
		case "ticket":
			return <TicketCard {...props} />
		default:
			return <PhotoCard {...props} />
	}
}

// ---------------------------------------------------------------------------
// Element views
// ---------------------------------------------------------------------------

function MissingBox({ w, h, label }: { w: number; h: number; label: string }) {
	return (
		<div
			style={{
				width: w,
				height: h,
				border: "2px dashed rgba(148,163,184,0.6)",
				borderRadius: 10,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				color: "rgba(148,163,184,0.9)",
				fontSize: 13,
				textAlign: "center",
				padding: 8,
			}}
		>
			{label}
		</div>
	)
}

function TextView({ el, theme }: { el: TextElement; theme: MenuTheme }) {
	return (
		<div
			style={{
				width: el.w,
				height: el.h,
				display: "flex",
				alignItems: "flex-start",
				justifyContent:
					el.align === "center"
						? "center"
						: el.align === "right"
							? "flex-end"
							: "flex-start",
			}}
		>
			<span
				style={{
					fontFamily: fontStack(el.fontId ?? theme.headingFont),
					fontSize: el.fontSize,
					fontWeight: el.weight ?? 700,
					color: el.color ?? theme.heading,
					textAlign: el.align ?? "left",
					letterSpacing: el.letterSpacing ?? 0,
					lineHeight: el.lineHeight ?? 1.15,
					textTransform: el.uppercase ? "uppercase" : "none",
					width: "100%",
					whiteSpace: "pre-wrap",
					wordBreak: "break-word",
				}}
			>
				{el.text}
			</span>
		</div>
	)
}

function ShapeView({ el, theme }: { el: ShapeElement; theme: MenuTheme }) {
	if (el.shape === "line") {
		return (
			<div
				style={{
					width: el.w,
					height: Math.max(1, el.h),
					background: el.fill ?? theme.accent,
					borderRadius: 999,
				}}
			/>
		)
	}
	return (
		<div
			style={{
				width: el.w,
				height: el.h,
				background: el.fill ?? theme.surface,
				border: el.stroke
					? `${el.strokeWidth ?? 2}px solid ${el.stroke}`
					: undefined,
				borderRadius:
					el.shape === "ellipse" ? "50%" : (el.radius ?? theme.radius),
			}}
		/>
	)
}

function ImageView({ el }: { el: ImageElement }) {
	return (
		// eslint-disable-next-line @next/next/no-img-element
		<img
			src={el.url}
			alt=""
			draggable={false}
			style={{
				width: el.w,
				height: el.h,
				objectFit: el.fit ?? "cover",
				borderRadius: el.radius ?? 0,
			}}
		/>
	)
}

function ItemView({
	el,
	theme,
	data,
}: {
	el: ItemElement
	theme: MenuTheme
	data: RenderData
}) {
	const item = data.items.get(el.itemId)
	if (!item)
		return <MissingBox w={el.w} h={el.h} label="Món đã bị xoá hoặc ẩn" />
	return (
		<ItemCard
			skin={el.skin ?? theme.skin}
			item={item}
			theme={theme}
			width={el.w}
			height={el.h}
			showDescription={el.showDescription}
			showBadges={el.showBadges}
			badgeNumber={el.badgeNumber}
		/>
	)
}

/**
 * Auto-flowing category block. The owner sizes the box; the block fits as many
 * items as it can, so adding a dish on the Menu page updates the board with no
 * re-design needed.
 */
function CategoryView({
	el,
	theme,
	data,
}: {
	el: CategoryElement
	theme: MenuTheme
	data: RenderData
}) {
	const cat = data.categories.get(el.categoryId)
	if (!cat) return <MissingBox w={el.w} h={el.h} label="Danh mục đã bị xoá" />

	const skin = el.skin ?? theme.skin
	const cols = Math.max(1, el.columns ?? 1)
	const gap = el.gap ?? 12
	const showHeader = el.showHeader !== false
	const metrics: BlockMetrics = {
		skin,
		width: el.w,
		columns: cols,
		gap,
		showHeader,
	}
	const headerH = showHeader ? categoryHeaderHeight(el.w) : 0
	const colW = blockColumnWidth(metrics)
	const rowH = skinRowHeight(skin, colW)

	const capacity = categoryRowCapacity(metrics, el.h) * cols
	const limit =
		el.limit && el.limit > 0 ? Math.min(el.limit, capacity) : capacity
	const visible = cat.items.slice(0, limit)
	const hidden = cat.items.length - visible.length
	// A dotted price line needs room for the description; in a narrow column
	// there isn't any, so drop it rather than clip it.
	const showItemDescription =
		skin === "board" ? colW >= 340 : skin !== "photo" && skin !== "tag"

	return (
		<div
			style={{
				width: el.w,
				height: el.h,
				display: "flex",
				flexDirection: "column",
				position: "relative",
			}}
		>
			{showHeader && (
				<div
					style={{
						height: headerH,
						display: "flex",
						alignItems: "center",
						gap: 10,
						borderBottom: `2px solid ${theme.accent}`,
						marginBottom: CATEGORY_HEADER_GAP,
					}}
				>
					<span
						style={{
							fontFamily: fontStack(theme.headingFont),
							fontSize: clampFont(headerH * 0.62, 14, 42),
							fontWeight: 800,
							color: theme.heading,
							textTransform: theme.uppercaseNames ? "uppercase" : "none",
							letterSpacing: theme.uppercaseNames ? 1 : 0,
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
						}}
					>
						{cat.name}
					</span>
				</div>
			)}
			<div
				style={{
					flex: 1,
					minHeight: 0,
					display: "grid",
					gridTemplateColumns: `repeat(${cols}, ${colW}px)`,
					gap,
					alignContent: "start",
					overflow: "hidden",
				}}
			>
				{visible.map((item, i) => (
					<ItemCard
						key={item.id}
						skin={skin}
						item={item}
						theme={theme}
						width={colW}
						height={rowH}
						showDescription={showItemDescription}
						badgeNumber={skin === "ticket" ? String(i + 1) : undefined}
					/>
				))}
			</div>
			{hidden > 0 && (
				// Absolute so the hint can never steal a row's worth of height and
				// clip the very items it is reporting on.
				<span
					style={{
						position: "absolute",
						right: 0,
						bottom: -16,
						fontFamily: fontStack(theme.bodyFont),
						fontSize: 12,
						color: theme.textMuted,
						whiteSpace: "nowrap",
					}}
				>
					+{hidden} món nữa — phóng to khung để hiện thêm
				</span>
			)}
		</div>
	)
}

export function ElementView({
	el,
	theme,
	data,
}: {
	el: MenuElement
	theme: MenuTheme
	data: RenderData
}) {
	switch (el.type) {
		case "text":
			return <TextView el={el} theme={theme} />
		case "shape":
			return <ShapeView el={el} theme={theme} />
		case "image":
			return <ImageView el={el} />
		case "item":
			return <ItemView el={el} theme={theme} data={data} />
		case "category":
			return <CategoryView el={el} theme={theme} data={data} />
	}
}

/** Absolute wrapper shared by the builder and the public board. */
export function elementBoxStyle(el: MenuElement): CSSProperties {
	return {
		position: "absolute",
		left: el.x,
		top: el.y,
		width: el.w,
		height: el.h,
		zIndex: el.z,
		opacity: el.opacity ?? 1,
		transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
		transformOrigin: "center center",
	}
}
