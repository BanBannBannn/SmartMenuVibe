import { notFound } from "next/navigation"
import { loadPublicMenu } from "@/lib/data/guest"
import { guestThemeVars } from "@/lib/theme"
import { themeById } from "@/lib/menu-design"
import { GuestMenu } from "@/components/guest/guest-menu"

// Public guest ordering page: /{restaurantSlug}/{tableToken}
// Server component -> good SEO + fast first paint (Plan KPI: menu < 2s).
export default async function GuestOrderingPage({
	params,
}: {
	params: Promise<{ restaurantSlug: string; tableToken: string }>
}) {
	const { restaurantSlug, tableToken } = await params
	const menu = await loadPublicMenu(restaurantSlug, tableToken)
	if (!menu) notFound()

	// The accent chosen in the menu designer carries over to the ordering page,
	// so a red fast-food board does not open into an orange default menu.
	const accent = themeById(menu.layout.theme).accent

	return (
		<div style={guestThemeVars(menu.restaurant.theme_settings, accent)}>
			<GuestMenu menu={menu} />
		</div>
	)
}
