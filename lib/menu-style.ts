// Shared decorative background presets used by the menu builder, the guest
// showcase (big-screen) menu and previews. Keeping them in one place means the
// owner picks a background once and every surface renders it identically.

export type BackgroundDef = {
	id: string
	label: string
	// Tailwind classes for the surface fill.
	className: string
	// Whether text on top should be light (for dark/vivid fills).
	dark: boolean
}

export const MENU_BACKGROUNDS: BackgroundDef[] = [
	{ id: "none", label: "Trắng trơn", className: "bg-background", dark: false },
	{
		id: "cream",
		label: "Kem nhẹ",
		className: "bg-gradient-to-b from-amber-50 to-orange-100",
		dark: false,
	},
	{
		id: "sunset",
		label: "Hoàng hôn",
		className: "bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600",
		dark: true,
	},
	{
		id: "ocean",
		label: "Đại dương",
		className: "bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-700",
		dark: true,
	},
	{
		id: "forest",
		label: "Rừng xanh",
		className: "bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700",
		dark: true,
	},
	{
		id: "midnight",
		label: "Nửa đêm",
		className: "bg-gradient-to-br from-slate-800 via-gray-900 to-black",
		dark: true,
	},
	{
		id: "berry",
		label: "Berry",
		className: "bg-gradient-to-br from-fuchsia-600 via-pink-600 to-rose-600",
		dark: true,
	},
	{
		id: "gold",
		label: "Sang trọng",
		className: "bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600",
		dark: true,
	},
]

export function backgroundById(id?: string | null): BackgroundDef {
	return MENU_BACKGROUNDS.find((b) => b.id === id) ?? MENU_BACKGROUNDS[0]
}
