import { getPrimaryRestaurant } from "@/lib/data/owner"
import { loadOwnerMenu } from "@/lib/data/menu-admin"
import { MenuManager } from "@/components/menu/menu-manager"
import { AiMenuImport } from "@/components/menu/ai-menu-import"
import { AiDescriptions } from "@/components/menu/ai-descriptions"
import { geminiEnabled } from "@/lib/llm/gemini"

export default async function MenuPage() {
	const restaurant = await getPrimaryRestaurant()
	if (!restaurant) return <p>Chưa có nhà hàng.</p>
	const { menu, categories, items } = await loadOwnerMenu(restaurant.id)
	if (!menu) return <p>Chưa có menu.</p>
	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Quản lý menu</h1>
			{geminiEnabled() && (
				<div className="grid gap-4 lg:grid-cols-2">
					<AiMenuImport restaurantId={restaurant.id} menuId={menu.id} />
					<AiDescriptions
						restaurantId={restaurant.id}
						missingCount={items.filter((i) => !i.description?.trim()).length}
					/>
				</div>
			)}
			<MenuManager
				restaurantId={restaurant.id}
				menuId={menu.id}
				categories={categories}
				items={items}
			/>
		</div>
	)
}
