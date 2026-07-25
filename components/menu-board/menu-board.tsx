"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { backgroundById, canvasPresetById, themeById } from "@/lib/menu-design"
import { contentHeight, type MenuLayout } from "@/lib/menu-layout"
import {
	buildRenderData,
	ElementView,
	elementBoxStyle,
	type RenderCategory,
} from "@/components/menu-canvas/renderer"

/**
 * Public renderer for a saved menu design.
 *
 * The design is authored at a fixed pixel size (see CANVAS_PRESETS) and scaled
 * with a single CSS transform, so the same document fills a 55" TV, a laptop
 * preview and a phone screen without any responsive re-layout - and therefore
 * without ever drifting from what the owner saw in the builder.
 */
export function MenuBoard({
	layout,
	categories,
	fit = "auto",
	className,
}: {
	layout: MenuLayout
	categories: RenderCategory[]
	/** "contain" letterboxes the whole design; "width" scales to width and scrolls. */
	fit?: "auto" | "contain" | "width"
	className?: string
}) {
	const preset = canvasPresetById(layout.canvas)
	const designW = preset.width
	// A design may legitimately overflow its preset (long price lists); grow the
	// surface so nothing is silently cut off.
	const designH = Math.max(preset.height, Math.ceil(contentHeight(layout)) + 24)

	const mode =
		fit === "auto" ? (preset.width >= preset.height ? "contain" : "width") : fit

	const containerRef = useRef<HTMLDivElement>(null)
	const [box, setBox] = useState({ w: 0, h: 0 })

	const measure = useCallback(() => {
		const el = containerRef.current
		if (el) setBox({ w: el.clientWidth, h: el.clientHeight })
	}, [])

	useEffect(() => {
		measure()
		const el = containerRef.current
		if (!el || typeof ResizeObserver === "undefined") {
			window.addEventListener("resize", measure)
			return () => window.removeEventListener("resize", measure)
		}
		const ro = new ResizeObserver(measure)
		ro.observe(el)
		return () => ro.disconnect()
	}, [measure])

	const scale =
		box.w === 0
			? 0
			: mode === "contain" && box.h > 0
				? Math.min(box.w / designW, box.h / designH)
				: box.w / designW

	const theme = themeById(layout.theme)
	const bg = backgroundById(layout.background || theme.background)
	const data = buildRenderData(categories)

	return (
		<div
			ref={containerRef}
			className={className}
			style={{
				background: bg.css,
				width: "100%",
				height: mode === "contain" ? "100%" : undefined,
				overflow: "hidden",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			{/* Reserves the scaled footprint so the page flows correctly. */}
			<div
				style={{
					width: designW * scale,
					height: designH * scale,
					position: "relative",
				}}
			>
				<div
					style={{
						width: designW,
						height: designH,
						position: "absolute",
						top: 0,
						left: 0,
						transform: `scale(${scale})`,
						transformOrigin: "top left",
						background: bg.css,
						// Hidden until measured, otherwise the first paint flashes at 1:1.
						visibility: scale > 0 ? "visible" : "hidden",
					}}
				>
					{layout.elements.map((el) => (
						<div key={el.id} style={elementBoxStyle(el)}>
							<ElementView el={el} theme={theme} data={data} />
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
