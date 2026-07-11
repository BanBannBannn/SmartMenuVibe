import { getPrimaryRestaurant } from "@/lib/data/owner"
import { loadOwnerMenu } from "@/lib/data/menu-admin"
import { MenuManager } from "@/components/menu/menu-manager"

export default async function MenuPage() {
	const restaurant = await getPrimaryRestaurant()
	if (!restaurant) return <p>Chưa có nhà hàng.</p>
	const { menu, categories, items } = await loadOwnerMenu(restaurant.id)
	if (!menu) return <p>Chưa có menu.</p>
	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Quản lý menu</h1>
			<MenuManager
				restaurantId={restaurant.id}
				menuId={menu.id}
				categories={categories}
				items={items}
			/>
		</div>
	)
}
