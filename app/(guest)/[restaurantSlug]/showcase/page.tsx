import { notFound } from "next/navigation"
import { loadPublicMenu } from "@/lib/data/guest"
import { ShowcaseMenu } from "@/components/showcase/showcase-menu"
import { themeToCssVars } from "@/lib/theme"

// Public big-screen "trung bày" menu. Guests view this on a large display and
// order verbally - there is no cart here. Note: the static `showcase` segment
// takes precedence over the sibling dynamic `[tableToken]` route.
export default async function PublicShowcasePage({
	params,
}: {
	params: Promise<{ restaurantSlug: string }>
}) {
	const { restaurantSlug } = await params
	const menu = await loadPublicMenu(restaurantSlug)
	if (!menu) notFound()

	const style = themeToCssVars(menu.restaurant.theme_settings as any)
	return (
		<div style={style}>
			<ShowcaseMenu menu={menu} />
		</div>
	)
}
