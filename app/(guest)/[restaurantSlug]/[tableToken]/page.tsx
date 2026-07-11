import { notFound } from "next/navigation"
import { loadPublicMenu } from "@/lib/data/guest"
import { themeToCssVars } from "@/lib/theme"
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

	return (
		<div style={themeToCssVars(menu.restaurant.theme_settings as any)}>
			<GuestMenu menu={menu} />
		</div>
	)
}
