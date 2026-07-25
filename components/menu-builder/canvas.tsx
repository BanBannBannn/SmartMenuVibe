"use client"

import { useCallback, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { backgroundById, canvasPresetById, themeById } from "@/lib/menu-design"
import {
	contentHeight,
	type MenuElement,
	type MenuLayout,
} from "@/lib/menu-layout"
import {
	ElementView,
	elementBoxStyle,
	type RenderData,
} from "@/components/menu-canvas/renderer"

// =============================================================================
// Interactive design canvas: drag, resize, snap guides, marquee-free selection.
// Pointer events are handled directly (rather than via a drag library) because
// resizing from eight handles and live alignment guides need the raw geometry.
// =============================================================================

const SNAP_TOLERANCE = 6 // in design px, before scaling
const MIN_W = 24
const MIN_H = 18

type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

const HANDLES: { id: Handle; cx: number; cy: number; cursor: string }[] = [
	{ id: "nw", cx: 0, cy: 0, cursor: "nwse-resize" },
	{ id: "n", cx: 0.5, cy: 0, cursor: "ns-resize" },
	{ id: "ne", cx: 1, cy: 0, cursor: "nesw-resize" },
	{ id: "e", cx: 1, cy: 0.5, cursor: "ew-resize" },
	{ id: "se", cx: 1, cy: 1, cursor: "nwse-resize" },
	{ id: "s", cx: 0.5, cy: 1, cursor: "ns-resize" },
	{ id: "sw", cx: 0, cy: 1, cursor: "nesw-resize" },
	{ id: "w", cx: 0, cy: 0.5, cursor: "ew-resize" },
]

type Guide = { axis: "x" | "y"; at: number }

type DragState =
	| {
			kind: "move"
			startX: number
			startY: number
			origins: Map<string, MenuElement>
	  }
	| {
			kind: "resize"
			handle: Handle
			startX: number
			startY: number
			origin: MenuElement
	  }
	| null

/** Alignment candidates: canvas edges/centre plus every unselected element. */
function snapTargets(layout: MenuLayout, exclude: Set<string>) {
	const preset = canvasPresetById(layout.canvas)
	const xs = [0, preset.width / 2, preset.width]
	const ys = [0, preset.height / 2, preset.height]
	for (const el of layout.elements) {
		if (exclude.has(el.id)) continue
		xs.push(el.x, el.x + el.w / 2, el.x + el.w)
		ys.push(el.y, el.y + el.h / 2, el.y + el.h)
	}
	return { xs, ys }
}

/** Nearest snap for any of `values`, returning the delta to apply to all. */
function bestSnap(
	values: number[],
	targets: number[],
	tolerance: number,
): { delta: number; guide: number } | null {
	let best: { delta: number; guide: number; dist: number } | null = null
	for (const value of values) {
		for (const target of targets) {
			const dist = Math.abs(target - value)
			if (dist <= tolerance && (!best || dist < best.dist)) {
				best = { delta: target - value, guide: target, dist }
			}
		}
	}
	return best ? { delta: best.delta, guide: best.guide } : null
}

export function BuilderCanvas({
	layout,
	data,
	selectedIds,
	scale,
	showGrid,
	snapEnabled,
	onSelect,
	onBegin,
	onChange,
	onEnd,
}: {
	layout: MenuLayout
	data: RenderData
	selectedIds: string[]
	scale: number
	showGrid: boolean
	snapEnabled: boolean
	onSelect: (ids: string[]) => void
	onBegin: () => void
	onChange: (layout: MenuLayout) => void
	onEnd: () => void
}) {
	const preset = canvasPresetById(layout.canvas)
	const theme = themeById(layout.theme)
	const bg = backgroundById(layout.background || theme.background)
	const surfaceRef = useRef<HTMLDivElement>(null)
	const dragRef = useRef<DragState>(null)
	const [guides, setGuides] = useState<Guide[]>([])
	const selected = new Set(selectedIds)

	const patch = useCallback(
		(updates: Map<string, Partial<MenuElement>>) => {
			onChange({
				...layout,
				elements: layout.elements.map((el) => {
					const u = updates.get(el.id)
					return u ? ({ ...el, ...u } as MenuElement) : el
				}),
			})
		},
		[layout, onChange],
	)

	const finish = useCallback(() => {
		dragRef.current = null
		setGuides([])
		onEnd()
	}, [onEnd])

	// -- move -----------------------------------------------------------------
	const onElementPointerDown = useCallback(
		(e: ReactPointerEvent, el: MenuElement) => {
			if (el.locked) return
			e.stopPropagation()
			const additive = e.shiftKey || e.metaKey || e.ctrlKey
			const nextIds = additive
				? selected.has(el.id)
					? selectedIds.filter((id) => id !== el.id)
					: [...selectedIds, el.id]
				: selected.has(el.id)
					? selectedIds
					: [el.id]
			onSelect(nextIds)
			if (nextIds.length === 0) return

			const origins = new Map<string, MenuElement>()
			for (const other of layout.elements) {
				if (nextIds.includes(other.id) && !other.locked)
					origins.set(other.id, other)
			}
			dragRef.current = {
				kind: "move",
				startX: e.clientX,
				startY: e.clientY,
				origins,
			}
			;(e.target as Element).setPointerCapture?.(e.pointerId)
			onBegin()
		},
		[layout.elements, onBegin, onSelect, selected, selectedIds],
	)

	// -- resize ---------------------------------------------------------------
	const onHandlePointerDown = useCallback(
		(e: ReactPointerEvent, el: MenuElement, handle: Handle) => {
			e.stopPropagation()
			dragRef.current = {
				kind: "resize",
				handle,
				startX: e.clientX,
				startY: e.clientY,
				origin: el,
			}
			;(e.target as Element).setPointerCapture?.(e.pointerId)
			onBegin()
		},
		[onBegin],
	)

	const onPointerMove = useCallback(
		(e: ReactPointerEvent) => {
			const drag = dragRef.current
			if (!drag) return
			const dx = (e.clientX - drag.startX) / scale
			const dy = (e.clientY - drag.startY) / scale
			const nextGuides: Guide[] = []

			if (drag.kind === "move") {
				const ids = new Set(drag.origins.keys())
				let mx = dx
				let my = dy

				if (snapEnabled) {
					const { xs, ys } = snapTargets(layout, ids)
					const origins = [...drag.origins.values()]
					const left = Math.min(...origins.map((o) => o.x)) + dx
					const right = Math.max(...origins.map((o) => o.x + o.w)) + dx
					const top = Math.min(...origins.map((o) => o.y)) + dy
					const bottom = Math.max(...origins.map((o) => o.y + o.h)) + dy

					const sx = bestSnap(
						[left, (left + right) / 2, right],
						xs,
						SNAP_TOLERANCE,
					)
					const sy = bestSnap(
						[top, (top + bottom) / 2, bottom],
						ys,
						SNAP_TOLERANCE,
					)
					if (sx) {
						mx += sx.delta
						nextGuides.push({ axis: "x", at: sx.guide })
					}
					if (sy) {
						my += sy.delta
						nextGuides.push({ axis: "y", at: sy.guide })
					}
				}

				const updates = new Map<string, Partial<MenuElement>>()
				for (const [id, origin] of drag.origins) {
					updates.set(id, {
						x: Math.round(origin.x + mx),
						y: Math.round(origin.y + my),
					})
				}
				patch(updates)
			} else {
				const { origin, handle } = drag
				let { x, y, w, h } = origin
				const keepAspect = e.shiftKey
				const ratio = origin.w / Math.max(1, origin.h)

				if (handle.includes("e")) w = origin.w + dx
				if (handle.includes("s")) h = origin.h + dy
				if (handle.includes("w")) {
					w = origin.w - dx
					x = origin.x + dx
				}
				if (handle.includes("n")) {
					h = origin.h - dy
					y = origin.y + dy
				}

				if (keepAspect && handle.length === 2) {
					h = w / ratio
					if (handle.includes("n")) y = origin.y + origin.h - h
				}

				if (snapEnabled) {
					const { xs, ys } = snapTargets(layout, new Set([origin.id]))
					if (handle.includes("e")) {
						const s = bestSnap([x + w], xs, SNAP_TOLERANCE)
						if (s) {
							w += s.delta
							nextGuides.push({ axis: "x", at: s.guide })
						}
					}
					if (handle.includes("w")) {
						const s = bestSnap([x], xs, SNAP_TOLERANCE)
						if (s) {
							x += s.delta
							w -= s.delta
							nextGuides.push({ axis: "x", at: s.guide })
						}
					}
					if (handle.includes("s")) {
						const s = bestSnap([y + h], ys, SNAP_TOLERANCE)
						if (s) {
							h += s.delta
							nextGuides.push({ axis: "y", at: s.guide })
						}
					}
					if (handle.includes("n")) {
						const s = bestSnap([y], ys, SNAP_TOLERANCE)
						if (s) {
							y += s.delta
							h -= s.delta
							nextGuides.push({ axis: "y", at: s.guide })
						}
					}
				}

				// Clamp without letting a min-size clamp drag the opposite edge.
				if (w < MIN_W) {
					if (handle.includes("w")) x -= MIN_W - w
					w = MIN_W
				}
				if (h < MIN_H) {
					if (handle.includes("n")) y -= MIN_H - h
					h = MIN_H
				}

				patch(
					new Map([
						[
							origin.id,
							{
								x: Math.round(x),
								y: Math.round(y),
								w: Math.round(w),
								h: Math.round(h),
							},
						],
					]),
				)
			}

			setGuides(nextGuides)
		},
		[layout, patch, scale, snapEnabled],
	)

	const selectedElements = layout.elements.filter((el) => selected.has(el.id))
	// The page can legitimately run past its preset (a long price list); show the
	// overflow rather than clipping it, with the page edge marked.
	const surfaceH = Math.max(
		preset.height,
		Math.ceil(contentHeight(layout)) + 40,
	)

	return (
		<div
			ref={surfaceRef}
			onPointerDown={() => onSelect([])}
			onPointerMove={onPointerMove}
			onPointerUp={finish}
			onPointerCancel={finish}
			style={{
				width: preset.width,
				height: surfaceH,
				position: "relative",
				background: bg.css,
				transform: `scale(${scale})`,
				transformOrigin: "top left",
				flexShrink: 0,
				touchAction: "none",
				userSelect: "none",
				boxShadow: "0 10px 40px rgba(15,23,42,0.25)",
			}}
		>
			{showGrid && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						pointerEvents: "none",
						zIndex: 9998,
						backgroundImage:
							"linear-gradient(to right, rgba(127,127,127,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(127,127,127,0.18) 1px, transparent 1px)",
						backgroundSize: "40px 40px",
					}}
				/>
			)}

			{layout.elements.map((el) => {
				const isSelected = selected.has(el.id)
				return (
					<div
						key={el.id}
						onPointerDown={(e) => onElementPointerDown(e, el)}
						style={{
							...elementBoxStyle(el),
							cursor: el.locked ? "not-allowed" : "move",
							outline: isSelected
								? `${Math.max(1, 2 / scale)}px solid #6366f1`
								: undefined,
							outlineOffset: 2 / scale,
						}}
					>
						<div style={{ pointerEvents: "none" }}>
							<ElementView el={el} theme={theme} data={data} />
						</div>
					</div>
				)
			})}

			{/* Resize handles - only for a single selection, to keep the maths honest. */}
			{selectedElements.length === 1 &&
				!selectedElements[0].locked &&
				HANDLES.map((handle) => {
					const el = selectedElements[0]
					const size = 10 / scale
					return (
						<div
							key={handle.id}
							onPointerDown={(e) => onHandlePointerDown(e, el, handle.id)}
							style={{
								position: "absolute",
								left: el.x + el.w * handle.cx - size / 2,
								top: el.y + el.h * handle.cy - size / 2,
								width: size,
								height: size,
								background: "#ffffff",
								border: `${Math.max(1, 1.5 / scale)}px solid #6366f1`,
								borderRadius: 2 / scale,
								cursor: handle.cursor,
								zIndex: 10000,
							}}
						/>
					)
				})}

			{surfaceH > preset.height && (
				<div
					style={{
						position: "absolute",
						top: preset.height,
						left: 0,
						width: "100%",
						borderTop: `${Math.max(1, 2 / scale)}px dashed rgba(239,68,68,0.8)`,
						pointerEvents: "none",
						zIndex: 9997,
					}}
				/>
			)}

			{guides.map((g, i) => (
				<div
					key={`${g.axis}-${g.at}-${i}`}
					style={{
						position: "absolute",
						background: "#ec4899",
						pointerEvents: "none",
						zIndex: 9999,
						...(g.axis === "x"
							? { left: g.at, top: 0, width: 1 / scale, height: "100%" }
							: { top: g.at, left: 0, height: 1 / scale, width: "100%" }),
					}}
				/>
			))}
		</div>
	)
}
