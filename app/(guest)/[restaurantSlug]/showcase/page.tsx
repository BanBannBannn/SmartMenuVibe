import { notFound } from "next/navigation"
import { loadPublicMenu } from "@/lib/data/guest"
import { MenuBoard } from "@/components/menu-board/menu-board"
import { menuFontVars } from "@/lib/fonts"
import { canvasPresetById } from "@/lib/menu-design"

// Public big-screen "trưng bày" menu. Guests read this on a large display and
// order verbally - there is no cart here. Note: the static `showcase` segment
// takes precedence over the sibling dynamic `[tableToken]` route.
//
// The design comes straight from the menu designer document, so what the owner
// arranged in the builder is pixel-for-pixel what shows up on the TV.
export default async function PublicShowcasePage({
	params,
}: {
	params: Promise<{ restaurantSlug: string }>
}) {
	const { restaurantSlug } = await params
	const menu = await loadPublicMenu(restaurantSlug)
	if (!menu) notFound()

	// Landscape designs are letterboxed to fill a wall screen exactly; portrait
	// designs (A4 / poster) scale to width and scroll, which is what a phone or
	// a vertical display needs.
	const preset = canvasPresetById(menu.layout.canvas)
	const landscape = preset.width >= preset.height

	return (
		<main
			className={`${menuFontVars} ${
				landscape ? "h-screen overflow-hidden" : "min-h-screen"
			} w-full`}
		>
			<MenuBoard
				layout={menu.layout}
				categories={menu.categories}
				className={landscape ? "h-full" : undefined}
			/>
		</main>
	)
}
