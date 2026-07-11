"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
	ShoppingCart,
	Plus,
	Minus,
	Sparkles,
	X,
	UtensilsCrossed,
	StickyNote,
} from "lucide-react"
import type { PublicMenu, PublicItem, PublicVariant } from "@/lib/data/guest"
import { useCart, getDeviceToken } from "@/lib/stores/cart"
import { formatVnd, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FaceConsent } from "./face-consent"
import { OrderTracker } from "./order-tracker"

// ---------------------------------------------------------------------------
// Motion configs are declared as flat, single-brace consts and referenced with
// a single brace in JSX. This is intentional: inline double-brace props are
// avoided across the whole file.
// ---------------------------------------------------------------------------
const cardVariants = {
	hidden: { opacity: 0, y: 24 },
	show: { opacity: 1, y: 0 },
}
const cardHover = { y: -6 }
const tapScale = { scale: 0.95 }
const viewportOnce = { once: true, margin: "-40px" }

const sectionInitial = { opacity: 0, y: 16 }
const sectionShow = { opacity: 1, y: 0 }

const overlayHidden = { opacity: 0 }
const overlayShow = { opacity: 1 }
const sheetHidden = { y: "100%" }
const sheetShow = { y: 0 }
const sheetSpring = { type: "spring", damping: 32, stiffness: 320 }

const barHidden = { y: 96, opacity: 0 }
const barShow = { y: 0, opacity: 1 }
const countPop = { scale: 1.6 }
const countRest = { scale: 1 }

// ---------------------------------------------------------------------------
// Badge catalogue. Item tags (from the DB) map to eye-catching labels.
// ---------------------------------------------------------------------------
type BadgeDef = { label: string; icon: string; className: string }
const BADGES: Record<string, BadgeDef> = {
	hot: { label: "Món Hot", icon: "🔥", className: "bg-red-500/95 text-white" },
	best_seller: {
		label: "Best Seller",
		icon: "👑",
		className: "bg-amber-500/95 text-white",
	},
	new: { label: "Mới", icon: "✨", className: "bg-sky-500/95 text-white" },
	spicy: { label: "Cay", icon: "🌶️", className: "bg-orange-600/95 text-white" },
	vegetarian: {
		label: "Chay",
		icon: "🥬",
		className: "bg-green-600/95 text-white",
	},
	combo: { label: "Combo", icon: "🍱", className: "bg-pink-600/95 text-white" },
	recommended: {
		label: "Đề xuất",
		icon: "⭐",
		className: "bg-violet-600/95 text-white",
	},
}

function badgesFor(item: PublicItem, recommended: boolean): BadgeDef[] {
	const out: BadgeDef[] = []
	for (const tag of item.tags) {
		const def = BADGES[tag]
		if (def) out.push(def)
	}
	if (recommended && !item.tags.includes("recommended")) {
		out.push(BADGES.recommended)
	}
	return out.slice(0, 2)
}

function categoryIcon(name: string): string {
	const n = name.toLowerCase()
	if (/combo|set/.test(n)) return "🍱"
	if (/uống|drink|nước|cà phê|coffee|trà|tea|bia|beer|sinh tố|juice/.test(n))
		return "🥤"
	if (/tráng miệng|dessert|ngọt|bánh|kem/.test(n)) return "🍰"
	if (/khai vị|appetizer|salad|gỏi/.test(n)) return "🥗"
	if (/lẩu|nướng|bbq|hotpot|grill/.test(n)) return "🍲"
	return "🍽️"
}

// Deterministic soft gradient for items without a photo, so the grid still
// looks polished. Keyed off the item id so it stays stable between renders.
const PLACEHOLDER_GRADIENTS = [
	"from-orange-200 to-rose-200",
	"from-amber-200 to-yellow-200",
	"from-emerald-200 to-teal-200",
	"from-sky-200 to-indigo-200",
	"from-fuchsia-200 to-pink-200",
]
function gradientFor(id: string): string {
	let h = 0
	for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
	return PLACEHOLDER_GRADIENTS[h % PLACEHOLDER_GRADIENTS.length]
}

export function GuestMenu({ menu }: { menu: PublicMenu }) {
	const cart = useCart()
	const [cartOpen, setCartOpen] = useState(false)
	const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)
	const [submitting, setSubmitting] = useState(false)
	const [recommendedIds, setRecommendedIds] = useState<string[]>([])
	const [reasons, setReasons] = useState<Record<string, string>>({})
	const [showFace, setShowFace] = useState(menu.restaurant.face_enabled)
	const [activeItem, setActiveItem] = useState<PublicItem | null>(null)

	const nonEmptyCategories = useMemo(
		() => menu.categories.filter((c) => c.items.length > 0),
		[menu.categories],
	)
	const allItems = useMemo(
		() => menu.categories.flatMap((c) => c.items),
		[menu.categories],
	)
	const recommendedSet = useMemo(
		() => new Set(recommendedIds),
		[recommendedIds],
	)

	// Fetch context-based recommendations (time + weather + best sellers).
	useEffect(() => {
		fetch(`/api/recommendations?restaurantId=${menu.restaurant.id}`)
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => {
				if (d) {
					setRecommendedIds(d.itemIds ?? [])
					setReasons(d.reasons ?? {})
				}
			})
			.catch(() => undefined)
	}, [menu.restaurant.id])

	const recommended = recommendedIds
		.map((id) => allItems.find((i) => i.id === id))
		.filter((i): i is PublicItem => Boolean(i))

	const totals = cart.totals()

	function scrollToCat(id: string) {
		const el = document.getElementById(`cat-${id}`)
		if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
	}

	async function submitOrder() {
		if (!cart.items.length) return
		setSubmitting(true)
		try {
			const res = await fetch("/api/orders", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					restaurantId: menu.restaurant.id,
					tableId: menu.table?.id ?? null,
					deviceToken: getDeviceToken(),
					lines: cart.items.map((i) => ({
						menuItemId: i.menuItemId,
						name: i.name,
						basePrice: i.basePrice,
						quantity: i.quantity,
						variantId: i.variantId,
						note: i.note,
					})),
				}),
			})
			if (res.ok) {
				const data = await res.json()
				setPlacedOrderId(data.orderId)
				cart.clear()
				setCartOpen(false)
			}
		} finally {
			setSubmitting(false)
		}
	}

	if (placedOrderId) {
		return (
			<OrderTracker
				orderId={placedOrderId}
				restaurantName={menu.restaurant.name}
				onNewOrder={() => setPlacedOrderId(null)}
			/>
		)
	}

	const hasCover = Boolean(menu.restaurant.cover_url)

	return (
		<main className="min-h-screen bg-gradient-to-b from-muted/40 to-background pb-28 text-foreground">
			{/* ---- Hero ---- */}
			<header className="relative">
				<div className="relative h-52 w-full overflow-hidden">
					{hasCover ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={menu.restaurant.cover_url as string}
							alt=""
							className="h-full w-full object-cover"
						/>
					) : (
						<div className="h-full w-full bg-gradient-to-br from-primary/80 via-primary to-primary/60" />
					)}
					<div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
				</div>

				<div className="container relative -mt-14 flex items-end gap-4">
					<div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-lg">
						{menu.restaurant.logo_url ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={menu.restaurant.logo_url}
								alt={menu.restaurant.name}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center text-3xl">
								🍜
							</div>
						)}
					</div>
					<div className="pb-2">
						<motion.h1
							initial={sectionInitial}
							animate={sectionShow}
							className="font-display text-2xl font-bold leading-tight"
						>
							{menu.restaurant.name}
						</motion.h1>
						<p className="text-sm text-muted-foreground">
							{menu.table
								? `Bàn ${menu.table.table_number} · Quét & gọi món`
								: "Thực đơn điện tử"}
						</p>
					</div>
				</div>
			</header>

			{/* ---- Sticky category nav ---- */}
			{nonEmptyCategories.length > 0 && (
				<nav className="sticky top-0 z-30 mt-5 border-b bg-background/80 backdrop-blur">
					<div className="no-scrollbar container flex gap-2 overflow-x-auto py-3">
						{recommended.length > 0 && (
							<button
								onClick={() => scrollToCat("recommended")}
								className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
							>
								<Sparkles className="h-3.5 w-3.5" /> Gợi ý
							</button>
						)}
						{nonEmptyCategories.map((cat) => (
							<button
								key={cat.id}
								onClick={() => scrollToCat(cat.id)}
								className="shrink-0 rounded-full border bg-card px-4 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
							>
								{categoryIcon(cat.name)} {cat.name}
							</button>
						))}
					</div>
				</nav>
			)}

			<div className="container mt-6 space-y-10">
				{showFace && (
					<FaceConsent
						restaurantId={menu.restaurant.id}
						onDone={() => setShowFace(false)}
					/>
				)}

				{/* ---- Recommendations ---- */}
				{recommended.length > 0 && (
					<section id="cat-recommended">
						<div className="mb-3 flex items-center gap-2">
							<Sparkles className="h-5 w-5 text-primary" />
							<h2 className="font-display text-xl font-bold">Gợi ý cho bạn</h2>
						</div>
						<div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
							{recommended.map((item) => (
								<div key={item.id} className="w-44 shrink-0">
									<MenuCard
										item={item}
										reason={reasons[item.id]}
										recommended
										compact
										onOpen={setActiveItem}
									/>
								</div>
							))}
						</div>
					</section>
				)}

				{/* ---- Category sections ---- */}
				{nonEmptyCategories.map((cat) => (
					<section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-20">
						<div className="mb-4 flex items-center gap-2">
							<span className="text-2xl">{categoryIcon(cat.name)}</span>
							<h2 className="font-display text-xl font-bold">{cat.name}</h2>
							<span className="text-sm text-muted-foreground">
								{cat.items.length} món
							</span>
						</div>
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
							{cat.items.map((item) => (
								<MenuCard
									key={item.id}
									item={item}
									reason={reasons[item.id]}
									recommended={recommendedSet.has(item.id)}
									onOpen={setActiveItem}
								/>
							))}
						</div>
					</section>
				))}

				{nonEmptyCategories.length === 0 && (
					<div className="py-20 text-center text-muted-foreground">
						<UtensilsCrossed className="mx-auto mb-3 h-10 w-10 opacity-40" />
						Thực đơn đang được cập nhật. Vui lòng quay lại sau nhé!
					</div>
				)}
			</div>

			{/* ---- Floating cart bar ---- */}
			<AnimatePresence>
				{totals.itemCount > 0 && !cartOpen && !activeItem && (
					<motion.button
						initial={barHidden}
						animate={barShow}
						exit={barHidden}
						whileTap={tapScale}
						onClick={() => setCartOpen(true)}
						className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-xl shadow-primary/30"
					>
						<span className="flex items-center gap-2 font-semibold">
							<span className="relative flex h-6 w-6 items-center justify-center">
								<ShoppingCart className="h-5 w-5" />
							</span>
							<AnimatePresence mode="popLayout">
								<motion.span
									key={totals.itemCount}
									initial={countPop}
									animate={countRest}
								>
									{totals.itemCount} món
								</motion.span>
							</AnimatePresence>
						</span>
						<span className="font-bold">{formatVnd(totals.total)}</span>
					</motion.button>
				)}
			</AnimatePresence>

			{/* ---- Item detail sheet ---- */}
			<AnimatePresence>
				{activeItem && (
					<ItemDetailSheet
						item={activeItem}
						recommended={recommendedSet.has(activeItem.id)}
						reason={reasons[activeItem.id]}
						onClose={() => setActiveItem(null)}
					/>
				)}
			</AnimatePresence>

			{/* ---- Cart sheet ---- */}
			<AnimatePresence>
				{cartOpen && (
					<motion.div
						initial={overlayHidden}
						animate={overlayShow}
						exit={overlayHidden}
						className="fixed inset-0 z-50 flex items-end bg-black/50"
						onClick={() => setCartOpen(false)}
					>
						<motion.div
							initial={sheetHidden}
							animate={sheetShow}
							exit={sheetHidden}
							transition={sheetSpring}
							onClick={(e) => e.stopPropagation()}
							className="max-h-[82vh] w-full overflow-y-auto rounded-t-3xl bg-background p-5"
						>
							<div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
							<div className="mb-4 flex items-center justify-between">
								<h3 className="text-lg font-bold">Giỏ hàng</h3>
								<button onClick={() => setCartOpen(false)}>
									<X className="h-5 w-5 text-muted-foreground" />
								</button>
							</div>
							{cart.items.length === 0 ? (
								<p className="py-8 text-center text-muted-foreground">
									Giỏ hàng đang trống.
								</p>
							) : (
								<ul className="space-y-3">
									{cart.items.map((line, idx) => (
										<li
											key={idx}
											className="flex items-center justify-between gap-3 rounded-xl border p-3"
										>
											<div className="min-w-0">
												<p className="truncate font-medium">{line.name}</p>
												{line.variantName && (
													<p className="text-xs text-muted-foreground">
														{line.variantName}
													</p>
												)}
												{line.note && (
													<p className="truncate text-xs text-muted-foreground">
														📝 {line.note}
													</p>
												)}
												<p className="mt-1 text-sm font-semibold text-primary">
													{formatVnd(
														(line.basePrice + (line.variantPriceDelta ?? 0)) *
															line.quantity,
													)}
												</p>
											</div>
											<div className="flex items-center gap-2">
												<Button
													size="icon"
													variant="outline"
													className="h-8 w-8 rounded-full"
													onClick={() => cart.setQty(idx, line.quantity - 1)}
												>
													<Minus className="h-4 w-4" />
												</Button>
												<span className="w-6 text-center font-medium">
													{line.quantity}
												</span>
												<Button
													size="icon"
													variant="outline"
													className="h-8 w-8 rounded-full"
													onClick={() => cart.setQty(idx, line.quantity + 1)}
												>
													<Plus className="h-4 w-4" />
												</Button>
											</div>
										</li>
									))}
								</ul>
							)}
							<div className="mt-5 flex items-center justify-between border-t pt-4">
								<span className="text-muted-foreground">Tổng cộng</span>
								<span className="text-xl font-bold text-primary">
									{formatVnd(totals.total)}
								</span>
							</div>
							<Button
								className="mt-4 w-full"
								size="lg"
								disabled={submitting || cart.items.length === 0}
								onClick={submitOrder}
							>
								{submitting ? "Đang gửi..." : "Gửi đơn hàng"}
							</Button>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</main>
	)
}

// ---------------------------------------------------------------------------
// Menu card
// ---------------------------------------------------------------------------
function MenuCard({
	item,
	reason,
	recommended,
	compact,
	onOpen,
}: {
	item: PublicItem
	reason?: string
	recommended?: boolean
	compact?: boolean
	onOpen: (item: PublicItem) => void
}) {
	const badges = badgesFor(item, Boolean(recommended))
	const image = item.images[0] || "/no-image.svg"
	return (
		<motion.button
			type="button"
			variants={cardVariants}
			initial="hidden"
			whileInView="show"
			viewport={viewportOnce}
			whileHover={cardHover}
			whileTap={tapScale}
			onClick={() => onOpen(item)}
			className="group flex w-full flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-shadow hover:shadow-lg"
		>
			<div className="relative aspect-[4/3] w-full overflow-hidden">
				{image ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={image}
						alt={item.name}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
					/>
				) : (
					<div
						className={cn(
							"flex h-full w-full items-center justify-center bg-gradient-to-br text-4xl",
							gradientFor(item.id),
						)}
					>
						🍽️
					</div>
				)}
				{badges.length > 0 && (
					<div className="absolute left-2 top-2 flex flex-col items-start gap-1">
						{badges.map((b) => (
							<span
								key={b.label}
								className={cn(
									"rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm backdrop-blur",
									b.className,
								)}
							>
								{b.icon} {b.label}
							</span>
						))}
					</div>
				)}
			</div>
			<div className="flex flex-1 flex-col gap-1 p-3">
				<p className="font-semibold leading-tight">{item.name}</p>
				{reason && (
					<p className="text-[11px] font-medium text-primary">{reason}</p>
				)}
				{!compact && item.description && (
					<p className="line-clamp-2 text-xs text-muted-foreground">
						{item.description}
					</p>
				)}
				<div className="mt-auto flex items-center justify-between pt-2">
					<span className="font-bold text-primary">
						{formatVnd(item.base_price)}
					</span>
					<span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-110">
						<Plus className="h-4 w-4" />
					</span>
				</div>
			</div>
		</motion.button>
	)
}

// ---------------------------------------------------------------------------
// Item detail bottom sheet (variant + note + quantity)
// ---------------------------------------------------------------------------
function ItemDetailSheet({
	item,
	recommended,
	reason,
	onClose,
}: {
	item: PublicItem
	recommended: boolean
	reason?: string
	onClose: () => void
}) {
	const add = useCart((s) => s.add)
	const [variant, setVariant] = useState<PublicVariant | null>(
		item.variants[0] ?? null,
	)
	const [qty, setQty] = useState(1)
	const [note, setNote] = useState("")
	const badges = badgesFor(item, recommended)
	const unit = item.base_price + (variant?.price_delta ?? 0)
	const image = item.images[0] || "/no-image.svg"

	function addToCart() {
		add({
			menuItemId: item.id,
			name: item.name,
			basePrice: item.base_price,
			quantity: qty,
			variantId: variant?.id,
			variantName: variant?.name,
			variantPriceDelta: variant?.price_delta ?? 0,
			note: note.trim() || undefined,
		})
		onClose()
	}

	return (
		<motion.div
			initial={overlayHidden}
			animate={overlayShow}
			exit={overlayHidden}
			className="fixed inset-0 z-50 flex items-end bg-black/50"
			onClick={onClose}
		>
			<motion.div
				initial={sheetHidden}
				animate={sheetShow}
				exit={sheetHidden}
				transition={sheetSpring}
				onClick={(e) => e.stopPropagation()}
				className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-background"
			>
				<div className="relative aspect-[16/10] w-full overflow-hidden">
					{image ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={image}
							alt={item.name}
							className="h-full w-full object-cover"
						/>
					) : (
						<div
							className={cn(
								"flex h-full w-full items-center justify-center bg-gradient-to-br text-6xl",
								gradientFor(item.id),
							)}
						>
							🍽️
						</div>
					)}
					<button
						onClick={onClose}
						className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="space-y-4 p-5">
					{badges.length > 0 && (
						<div className="flex flex-wrap gap-1.5">
							{badges.map((b) => (
								<span
									key={b.label}
									className={cn(
										"rounded-full px-2.5 py-0.5 text-xs font-bold",
										b.className,
									)}
								>
									{b.icon} {b.label}
								</span>
							))}
						</div>
					)}
					<div>
						<h3 className="font-display text-2xl font-bold">{item.name}</h3>
						{reason && (
							<p className="mt-0.5 text-sm font-medium text-primary">
								{reason}
							</p>
						)}
						{item.description && (
							<p className="mt-1 text-sm text-muted-foreground">
								{item.description}
							</p>
						)}
					</div>

					{item.variants.length > 0 && (
						<div className="space-y-2">
							<p className="text-sm font-semibold">Tuỳ chọn</p>
							<div className="flex flex-wrap gap-2">
								{item.variants.map((v) => (
									<button
										key={v.id}
										onClick={() => setVariant(v)}
										className={cn(
											"rounded-full border px-3 py-1.5 text-sm",
											variant?.id === v.id
												? "border-primary bg-primary/10 font-semibold text-primary"
												: "border-input",
										)}
									>
										{v.name}
										{v.price_delta ? ` +${formatVnd(v.price_delta)}` : ""}
									</button>
								))}
							</div>
						</div>
					)}

					<div className="space-y-2">
						<label className="flex items-center gap-1.5 text-sm font-semibold">
							<StickyNote className="h-4 w-4" /> Ghi chú
						</label>
						<input
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder="Ví dụ: ít cay, không hành..."
							className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
						/>
					</div>

					<div className="flex items-center justify-between">
						<span className="text-sm font-semibold">Số lượng</span>
						<div className="flex items-center gap-3">
							<Button
								size="icon"
								variant="outline"
								className="h-9 w-9 rounded-full"
								onClick={() => setQty((q) => Math.max(1, q - 1))}
							>
								<Minus className="h-4 w-4" />
							</Button>
							<span className="w-6 text-center text-lg font-semibold">
								{qty}
							</span>
							<Button
								size="icon"
								variant="outline"
								className="h-9 w-9 rounded-full"
								onClick={() => setQty((q) => q + 1)}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>

					<Button className="w-full" size="lg" onClick={addToCart}>
						Thêm {qty} · {formatVnd(unit * qty)}
					</Button>
				</div>
			</motion.div>
		</motion.div>
	)
}
