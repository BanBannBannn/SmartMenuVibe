"use client"

import { useEffect, useMemo, useState } from "react"
import type { CSSProperties } from "react"
import { motion } from "framer-motion"
import type { PublicMenu, PublicItem } from "@/lib/data/guest"
import { backgroundById } from "@/lib/menu-style"
import { formatVnd, cn } from "@/lib/utils"

// A big-screen "trung bày" menu: guests look at a large display and order by
// voice. No cart / no buttons. Items are shown at varied sizes with animated
// colour + scale so the screen feels lively.

const FEATURED_TAGS = ["hot", "best_seller", "recommended"]
const NO_IMAGE = "/no-image.svg"

type ShowSize = "large" | "medium" | "small"

const TAG_LABELS: Record<string, string> = {
	hot: "🔥 Hot",
	best_seller: "👑 Bán chạy",
	recommended: "⭐ Đề xuất",
	new: "✨ Mới",
}

const TITLE_STYLE: CSSProperties = { backgroundSize: "200% 100%" }
const TITLE_ANIMATE = { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }
const TITLE_TRANSITION = { duration: 12, repeat: Infinity, ease: "linear" }
const VIEWPORT = { once: true, amount: 0.1 }
const SPRING = { type: "spring" as const, stiffness: 200, damping: 18 }
const STAGGER = { staggerChildren: 0.08 }

const containerVariants = { hidden: {}, show: { transition: STAGGER } }
const cardVariants = {
	hidden: { opacity: 0, y: 24, scale: 0.96 },
	show: { opacity: 1, y: 0, scale: 1 },
}

function sizeOf(item: PublicItem, indexInCategory: number): ShowSize {
	const featured = item.tags.some((t) => FEATURED_TAGS.includes(t))
	if (featured || indexInCategory === 0) return "large"
	if (indexInCategory % 3 === 1) return "medium"
	return "small"
}

export function ShowcaseMenu({ menu }: { menu: PublicMenu }) {
	const bg = backgroundById(menu.display.background ?? "midnight")
	const dark = bg.dark
	const title = menu.display.title || menu.restaurant.name
	const subtitle = menu.display.subtitle

	const allItems = useMemo(
		() => menu.categories.flatMap((c) => c.items),
		[menu.categories],
	)
	const [spotlight, setSpotlight] = useState(0)
	useEffect(() => {
		if (allItems.length < 2) return
		const id = setInterval(() => {
			setSpotlight((s) => (s + 1) % allItems.length)
		}, 3200)
		return () => clearInterval(id)
	}, [allItems.length])
	const spotlightId = allItems[spotlight]?.id

	const text = dark ? "text-white" : "text-slate-900"
	const muted = dark ? "text-white/70" : "text-slate-600"

	return (
		<div className={cn("min-h-screen w-full", bg.className)}>
			<div className="mx-auto max-w-7xl px-6 py-10">
				<header className="mb-10 text-center">
					<motion.h1
						className="bg-gradient-to-r from-amber-200 via-white to-amber-200 bg-clip-text text-5xl font-black tracking-tight text-transparent drop-shadow-lg sm:text-6xl"
						style={TITLE_STYLE}
						animate={TITLE_ANIMATE}
						transition={TITLE_TRANSITION}
					>
						{title}
					</motion.h1>
					{subtitle && (
						<p className={cn("mt-3 text-lg sm:text-xl", muted)}>{subtitle}</p>
					)}
				</header>

				{menu.categories.map((cat) => (
					<section key={cat.id} className="mb-12">
						<h2
							className={cn(
								"mb-5 border-b pb-2 text-2xl font-bold",
								text,
								dark ? "border-white/20" : "border-slate-300",
							)}
						>
							{cat.name}
						</h2>
						<motion.div
							variants={containerVariants}
							initial="hidden"
							whileInView="show"
							viewport={VIEWPORT}
							className="grid auto-rows-min grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4"
						>
							{cat.items.map((item, i) => (
								<ShowcaseCard
									key={item.id}
									item={item}
									size={sizeOf(item, i)}
									dark={dark}
									spotlight={item.id === spotlightId}
								/>
							))}
							{cat.items.length === 0 && (
								<p className={cn("col-span-full text-sm", muted)}>
									Chưa có món trong danh mục này.
								</p>
							)}
						</motion.div>
					</section>
				))}

				{allItems.length === 0 && (
					<p className={cn("text-center text-lg", muted)}>
						Chưa có món ăn nào để hiển thị.
					</p>
				)}
			</div>
		</div>
	)
}

function ShowcaseCard({
	item,
	size,
	dark,
	spotlight,
}: {
	item: PublicItem
	size: ShowSize
	dark: boolean
	spotlight: boolean
}) {
	const image = item.images[0] || NO_IMAGE
	const span = size === "large" ? "col-span-2 row-span-2" : "col-span-1"
	const nameSize =
		size === "large"
			? "text-2xl sm:text-3xl"
			: size === "medium"
				? "text-xl"
				: "text-lg"
	const imageAspect = size === "large" ? "aspect-[16/10]" : "aspect-[4/3]"
	const shell = dark
		? "bg-white/10 border-white/20 text-white"
		: "bg-white border-slate-200 text-slate-900"
	const priceColor = spotlight
		? "text-amber-300"
		: dark
			? "text-amber-200"
			: "text-orange-600"
	const tag = item.tags.find((t) => TAG_LABELS[t])
	const cardAnimate = { scale: spotlight ? 1.04 : 1 }
	const priceAnimate = { scale: spotlight ? 1.12 : 1 }

	return (
		<motion.div
			variants={cardVariants}
			animate={cardAnimate}
			transition={SPRING}
			className={cn(
				"overflow-hidden rounded-3xl border shadow-xl backdrop-blur-md",
				span,
				shell,
				spotlight && "ring-4 ring-amber-300/70",
			)}
		>
			<div className={cn("relative w-full overflow-hidden", imageAspect)}>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={image}
					alt={item.name}
					className="h-full w-full object-cover"
				/>
				{tag && (
					<span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-sm font-bold text-white shadow">
						{TAG_LABELS[tag]}
					</span>
				)}
			</div>
			<div className="space-y-1 p-4">
				<p className={cn("font-extrabold leading-tight", nameSize)}>
					{item.name}
				</p>
				{size === "large" && item.description && (
					<p
						className={cn(
							"line-clamp-2 text-sm",
							dark ? "text-white/70" : "text-slate-600",
						)}
					>
						{item.description}
					</p>
				)}
				<motion.p
					animate={priceAnimate}
					transition={SPRING}
					className={cn(
						"pt-1 font-black",
						size === "large" ? "text-2xl" : "text-xl",
						priceColor,
					)}
				>
					{formatVnd(item.base_price)}
				</motion.p>
			</div>
		</motion.div>
	)
}
