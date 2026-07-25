"use client"

import {
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from "react"
import {
	Eye,
	Grid3x3,
	Magnet,
	Maximize2,
	Redo2,
	Save,
	Undo2,
	ZoomIn,
	ZoomOut,
} from "lucide-react"
import type { AdminCategory, AdminItem, AdminMenu } from "@/lib/data/menu-admin"
import { saveMenuLayout } from "@/app/(owner)/actions"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { canvasPresetById, cardSkinById, themeById } from "@/lib/menu-design"
import {
	buildFromTemplate,
	emptyLayout,
	newElementId,
	topZ,
	type MenuElement,
	type MenuLayout,
	type TemplateContext,
} from "@/lib/menu-layout"
import { buildRenderData } from "@/components/menu-canvas/renderer"
import { BuilderCanvas } from "./canvas"
import { Inspector } from "./inspector"
import { LibraryPanel, type AddRequest } from "./library"
import { MenuBoard } from "@/components/menu-board/menu-board"

// =============================================================================
// Menu designer.
//
// Editing model: one immutable layout document per undo step. Drags run as a
// transaction (begin -> many transient updates -> end) so dragging a card 200px
// costs exactly one undo step, not two hundred.
// =============================================================================

const MAX_HISTORY = 60

type HistoryState = {
	past: MenuLayout[]
	present: MenuLayout
	future: MenuLayout[]
	/** Layout as it was when the current drag started. */
	txBase: MenuLayout | null
	dirty: boolean
}

type Action =
	| { type: "commit"; layout: MenuLayout }
	| { type: "begin" }
	| { type: "transient"; layout: MenuLayout }
	| { type: "end" }
	| { type: "undo" }
	| { type: "redo" }
	| { type: "saved" }

function reducer(state: HistoryState, action: Action): HistoryState {
	switch (action.type) {
		case "commit":
			return {
				past: [...state.past, state.present].slice(-MAX_HISTORY),
				present: action.layout,
				future: [],
				txBase: null,
				dirty: true,
			}
		case "begin":
			return { ...state, txBase: state.present }
		case "transient":
			return { ...state, present: action.layout }
		case "end": {
			if (!state.txBase || state.txBase === state.present)
				return { ...state, txBase: null }
			return {
				...state,
				past: [...state.past, state.txBase].slice(-MAX_HISTORY),
				future: [],
				txBase: null,
				dirty: true,
			}
		}
		case "undo": {
			const prev = state.past[state.past.length - 1]
			if (!prev) return state
			return {
				past: state.past.slice(0, -1),
				present: prev,
				future: [state.present, ...state.future],
				txBase: null,
				dirty: true,
			}
		}
		case "redo": {
			const next = state.future[0]
			if (!next) return state
			return {
				past: [...state.past, state.present],
				present: next,
				future: state.future.slice(1),
				txBase: null,
				dirty: true,
			}
		}
		case "saved":
			return { ...state, dirty: false }
	}
}

function isTypingTarget(target: EventTarget | null): boolean {
	const el = target as HTMLElement | null
	if (!el) return false
	const tag = el.tagName
	return (
		tag === "INPUT" ||
		tag === "TEXTAREA" ||
		tag === "SELECT" ||
		el.isContentEditable
	)
}

export function MenuBuilder({
	menu,
	categories,
	items,
	restaurantName,
	previewUrl,
}: {
	menu: AdminMenu
	categories: AdminCategory[]
	items: AdminItem[]
	restaurantName: string
	previewUrl: string
}) {
	const templateContext = useMemo<TemplateContext>(
		() => ({
			restaurantName,
			subtitle: null,
			categories: categories.map((c) => ({
				id: c.id,
				name: c.name,
				itemIds: items.filter((i) => i.category_id === c.id).map((i) => i.id),
			})),
		}),
		[categories, items, restaurantName],
	)

	const [state, dispatch] = useReducer(reducer, undefined, () => ({
		past: [],
		present: menu.layout ?? emptyLayout(),
		future: [],
		txBase: null,
		dirty: false,
	}))
	const layout = state.present

	const [selectedIds, setSelectedIds] = useState<string[]>([])
	const [zoom, setZoom] = useState(0.5)
	const [autoFit, setAutoFit] = useState(true)
	const [showGrid, setShowGrid] = useState(false)
	const [snapEnabled, setSnapEnabled] = useState(true)
	const [preview, setPreview] = useState(false)
	const [saving, setSaving] = useState(false)
	const viewportRef = useRef<HTMLDivElement>(null)

	const renderCategories = useMemo(
		() =>
			categories.map((c) => ({
				id: c.id,
				name: c.name,
				items: items
					.filter((i) => i.category_id === c.id)
					.map((i) => ({
						id: i.id,
						name: i.name,
						description: i.description,
						base_price: i.base_price,
						images: i.images,
						tags: i.tags,
					})),
			})),
		[categories, items],
	)
	const data = useMemo(
		() => buildRenderData(renderCategories),
		[renderCategories],
	)

	// -- zoom ------------------------------------------------------------------
	const preset = canvasPresetById(layout.canvas)
	useEffect(() => {
		if (!autoFit) return
		const el = viewportRef.current
		if (!el) return
		const fit = () => {
			const pad = 48
			const sx = (el.clientWidth - pad) / preset.width
			const sy = (el.clientHeight - pad) / preset.height
			setZoom(Math.max(0.1, Math.min(1.5, Math.min(sx, sy))))
		}
		fit()
		if (typeof ResizeObserver === "undefined") return
		const ro = new ResizeObserver(fit)
		ro.observe(el)
		return () => ro.disconnect()
	}, [autoFit, preset.width, preset.height])

	// -- mutations -------------------------------------------------------------
	const commit = useCallback((next: MenuLayout) => {
		dispatch({ type: "commit", layout: next })
	}, [])

	const patchLayout = useCallback(
		(patch: Partial<MenuLayout>) => {
			dispatch({ type: "commit", layout: { ...layout, ...patch } })
		},
		[layout],
	)

	const patchElement = useCallback(
		(id: string, patch: Partial<MenuElement>) => {
			commit({
				...layout,
				elements: layout.elements.map((el) =>
					el.id === id ? ({ ...el, ...patch } as MenuElement) : el,
				),
			})
		},
		[commit, layout],
	)

	const deleteSelected = useCallback(() => {
		if (selectedIds.length === 0) return
		const ids = new Set(selectedIds)
		commit({
			...layout,
			elements: layout.elements.filter((el) => !ids.has(el.id)),
		})
		setSelectedIds([])
	}, [commit, layout, selectedIds])

	const duplicateSelected = useCallback(() => {
		if (selectedIds.length === 0) return
		const ids = new Set(selectedIds)
		let z = topZ(layout.elements)
		const clones: MenuElement[] = []
		for (const el of layout.elements) {
			if (!ids.has(el.id)) continue
			z += 1
			clones.push({
				...el,
				id: newElementId(el.type),
				x: el.x + 20,
				y: el.y + 20,
				z,
			} as MenuElement)
		}
		commit({ ...layout, elements: [...layout.elements, ...clones] })
		setSelectedIds(clones.map((c) => c.id))
	}, [commit, layout, selectedIds])

	const reorder = useCallback(
		(direction: "front" | "back") => {
			if (selectedIds.length === 0) return
			const ids = new Set(selectedIds)
			const max = topZ(layout.elements)
			const min = layout.elements.reduce(
				(m, el) => Math.min(m, el.z),
				Number.POSITIVE_INFINITY,
			)
			commit({
				...layout,
				elements: layout.elements.map((el) =>
					ids.has(el.id)
						? { ...el, z: direction === "front" ? max + 1 : min - 1 }
						: el,
				),
			})
		},
		[commit, layout, selectedIds],
	)

	const nudge = useCallback(
		(dx: number, dy: number) => {
			if (selectedIds.length === 0) return
			const ids = new Set(selectedIds)
			commit({
				...layout,
				elements: layout.elements.map((el) =>
					ids.has(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el,
				),
			})
		},
		[commit, layout, selectedIds],
	)

	const addElement = useCallback(
		(req: AddRequest) => {
			const theme = themeById(layout.theme)
			const z = topZ(layout.elements) + 1
			// Cascade new elements near the top-left of the page so they never land
			// exactly on top of each other.
			const offset = (layout.elements.length % 8) * 24
			const base = {
				id: newElementId(req.kind),
				z,
				x: 60 + offset,
				y: 90 + offset,
			}

			let el: MenuElement
			switch (req.kind) {
				case "item": {
					const size = cardSkinById(theme.skin).defaultSize
					el = {
						...base,
						type: "item",
						itemId: req.itemId,
						w: size.w,
						h: size.h,
					}
					break
				}
				case "category":
					el = {
						...base,
						type: "category",
						categoryId: req.categoryId,
						w: 380,
						h: 340,
						columns: theme.skin === "board" ? 1 : 2,
						gap: 12,
						showHeader: true,
					}
					break
				case "text": {
					const sizes = { heading: 48, subheading: 28, body: 18 } as const
					const weights = { heading: 900, subheading: 700, body: 400 } as const
					el = {
						...base,
						type: "text",
						text:
							req.preset === "heading"
								? "TIÊU ĐỀ"
								: req.preset === "subheading"
									? "Phụ đề"
									: "Nhập nội dung ở panel bên phải",
						fontSize: sizes[req.preset],
						weight: weights[req.preset],
						w: req.preset === "heading" ? 520 : 360,
						h: sizes[req.preset] * 1.4,
					}
					break
				}
				case "shape":
					el = {
						...base,
						type: "shape",
						shape: req.shape,
						w: req.shape === "line" ? 280 : req.shape === "ellipse" ? 180 : 260,
						h: req.shape === "line" ? 3 : req.shape === "ellipse" ? 180 : 140,
						fill: req.shape === "line" ? theme.accent : theme.surface,
						radius: req.shape === "rect" ? theme.radius : undefined,
					}
					break
				case "image":
					el = {
						...base,
						type: "image",
						url: "/no-image.svg",
						w: 260,
						h: 200,
						fit: "cover",
						radius: theme.radius,
					}
					break
			}

			commit({ ...layout, elements: [...layout.elements, el] })
			setSelectedIds([el.id])
		},
		[commit, layout],
	)

	const applyTemplate = useCallback(
		(templateId: string) => {
			commit(buildFromTemplate(templateId, templateContext))
			setSelectedIds([])
			setAutoFit(true)
		},
		[commit, templateContext],
	)

	// -- save ------------------------------------------------------------------
	const save = useCallback(async () => {
		setSaving(true)
		try {
			await saveMenuLayout(menu.id, layout)
			dispatch({ type: "saved" })
		} finally {
			setSaving(false)
		}
	}, [layout, menu.id])

	// -- keyboard --------------------------------------------------------------
	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (isTypingTarget(e.target)) return
			const mod = e.metaKey || e.ctrlKey

			if (mod && e.key.toLowerCase() === "z") {
				e.preventDefault()
				dispatch({ type: e.shiftKey ? "redo" : "undo" })
				return
			}
			if (mod && e.key.toLowerCase() === "y") {
				e.preventDefault()
				dispatch({ type: "redo" })
				return
			}
			if (mod && e.key.toLowerCase() === "s") {
				e.preventDefault()
				void save()
				return
			}
			if (mod && e.key.toLowerCase() === "d") {
				e.preventDefault()
				duplicateSelected()
				return
			}
			if (e.key === "Delete" || e.key === "Backspace") {
				e.preventDefault()
				deleteSelected()
				return
			}
			if (e.key === "Escape") {
				setSelectedIds([])
				return
			}
			const step = e.shiftKey ? 10 : 1
			if (e.key === "ArrowLeft") {
				e.preventDefault()
				nudge(-step, 0)
			} else if (e.key === "ArrowRight") {
				e.preventDefault()
				nudge(step, 0)
			} else if (e.key === "ArrowUp") {
				e.preventDefault()
				nudge(0, -step)
			} else if (e.key === "ArrowDown") {
				e.preventDefault()
				nudge(0, step)
			}
		}
		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [deleteSelected, duplicateSelected, nudge, save])

	// Warn before losing unsaved work.
	useEffect(() => {
		if (!state.dirty) return
		function onBeforeUnload(e: BeforeUnloadEvent) {
			e.preventDefault()
			e.returnValue = ""
		}
		window.addEventListener("beforeunload", onBeforeUnload)
		return () => window.removeEventListener("beforeunload", onBeforeUnload)
	}, [state.dirty])

	const selected = layout.elements.filter((el) => selectedIds.includes(el.id))
	const empty = layout.elements.length === 0

	const toolButton =
		"flex h-9 w-9 items-center justify-center rounded-lg border bg-background transition hover:border-primary disabled:opacity-40"

	return (
		<div className="flex h-[calc(100vh-8rem)] min-h-[620px] flex-col gap-3">
			{/* -- Toolbar ------------------------------------------------------ */}
			<div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 p-2">
				<button
					type="button"
					className={toolButton}
					title="Hoàn tác (Ctrl+Z)"
					disabled={state.past.length === 0}
					onClick={() => dispatch({ type: "undo" })}
				>
					<Undo2 className="h-4 w-4" />
				</button>
				<button
					type="button"
					className={toolButton}
					title="Làm lại (Ctrl+Shift+Z)"
					disabled={state.future.length === 0}
					onClick={() => dispatch({ type: "redo" })}
				>
					<Redo2 className="h-4 w-4" />
				</button>

				<span className="mx-1 h-6 w-px bg-border" />

				<button
					type="button"
					className={toolButton}
					title="Thu nhỏ"
					onClick={() => {
						setAutoFit(false)
						setZoom((z) => Math.max(0.1, z - 0.1))
					}}
				>
					<ZoomOut className="h-4 w-4" />
				</button>
				<span className="w-12 text-center text-xs font-medium tabular-nums">
					{Math.round(zoom * 100)}%
				</span>
				<button
					type="button"
					className={toolButton}
					title="Phóng to"
					onClick={() => {
						setAutoFit(false)
						setZoom((z) => Math.min(2, z + 0.1))
					}}
				>
					<ZoomIn className="h-4 w-4" />
				</button>
				<button
					type="button"
					className={cn(toolButton, autoFit && "border-primary text-primary")}
					title="Vừa khung"
					onClick={() => setAutoFit(true)}
				>
					<Maximize2 className="h-4 w-4" />
				</button>

				<span className="mx-1 h-6 w-px bg-border" />

				<button
					type="button"
					className={cn(toolButton, showGrid && "border-primary text-primary")}
					title="Lưới canh"
					onClick={() => setShowGrid((v) => !v)}
				>
					<Grid3x3 className="h-4 w-4" />
				</button>
				<button
					type="button"
					className={cn(
						toolButton,
						snapEnabled && "border-primary text-primary",
					)}
					title="Tự động bám lề"
					onClick={() => setSnapEnabled((v) => !v)}
				>
					<Magnet className="h-4 w-4" />
				</button>
				<button
					type="button"
					className={cn(toolButton, preview && "border-primary text-primary")}
					title="Xem trước (ẩn khung chỉnh sửa)"
					onClick={() => setPreview((v) => !v)}
				>
					<Eye className="h-4 w-4" />
				</button>

				<div className="ml-auto flex items-center gap-2">
					<a
						href={previewUrl}
						target="_blank"
						rel="noreferrer"
						className="text-sm text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
					>
						Mở màn hình thật ↗
					</a>
					<span
						className={cn(
							"text-xs",
							state.dirty ? "text-amber-600" : "text-muted-foreground",
						)}
					>
						{state.dirty ? "Chưa lưu" : "Đã lưu"}
					</span>
					<Button onClick={save} disabled={!state.dirty || saving}>
						<Save className="mr-1.5 h-4 w-4" />
						{saving ? "Đang lưu..." : "Lưu thiết kế"}
					</Button>
				</div>
			</div>

			{/* -- Workspace ---------------------------------------------------- */}
			<div className="flex min-h-0 flex-1 gap-3">
				{!preview && (
					<aside className="hidden w-60 shrink-0 overflow-hidden rounded-xl border bg-card lg:block">
						<LibraryPanel
							items={items.map((i) => ({
								id: i.id,
								name: i.name,
								base_price: i.base_price,
								images: i.images,
								categoryId: i.category_id,
							}))}
							categories={categories.map((c) => ({ id: c.id, name: c.name }))}
							elements={layout.elements}
							selectedIds={selectedIds}
							onAdd={addElement}
							onSelect={setSelectedIds}
						/>
					</aside>
				)}

				<div
					ref={viewportRef}
					className="relative min-w-0 flex-1 overflow-auto rounded-xl border bg-slate-200/70 p-6"
				>
					{preview ? (
						<div className="h-full w-full overflow-hidden rounded-lg">
							<MenuBoard layout={layout} categories={renderCategories} />
						</div>
					) : (
						<>
							<BuilderCanvas
								layout={layout}
								data={data}
								selectedIds={selectedIds}
								scale={zoom}
								showGrid={showGrid}
								snapEnabled={snapEnabled}
								onSelect={setSelectedIds}
								onBegin={() => dispatch({ type: "begin" })}
								onChange={(next) =>
									dispatch({ type: "transient", layout: next })
								}
								onEnd={() => dispatch({ type: "end" })}
							/>
							{empty && (
								<div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
									<div className="pointer-events-auto max-w-sm rounded-2xl border bg-background/95 p-5 text-center shadow-lg">
										<p className="font-semibold">Trang đang trống</p>
										<p className="mt-1 text-sm text-muted-foreground">
											Chọn một mẫu dựng sẵn ở panel bên phải — hệ thống sẽ tự
											dựng cả trang từ món ăn thật của bạn.
										</p>
									</div>
								</div>
							)}
						</>
					)}
				</div>

				{!preview && (
					<aside className="hidden w-72 shrink-0 overflow-y-auto rounded-xl border bg-card p-3 xl:block">
						<Inspector
							layout={layout}
							selected={selected}
							items={items.map((i) => ({
								id: i.id,
								name: i.name,
								categoryId: i.category_id,
							}))}
							categories={categories.map((c) => ({ id: c.id, name: c.name }))}
							onLayoutChange={patchLayout}
							onApplyTemplate={applyTemplate}
							onPatchElement={patchElement}
							onDelete={deleteSelected}
							onDuplicate={duplicateSelected}
							onReorder={reorder}
						/>
					</aside>
				)}
			</div>

			<p className="text-xs text-muted-foreground">
				Phím tắt: kéo để di chuyển · kéo ô vuông xanh để đổi kích thước · Shift
				để giữ tỉ lệ · mũi tên để nhích · Ctrl+Z hoàn tác · Ctrl+D nhân bản ·
				Delete để xoá · Ctrl+S lưu.
			</p>
		</div>
	)
}
