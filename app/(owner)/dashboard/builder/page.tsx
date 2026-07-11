import { getPrimaryRestaurant } from "@/lib/data/owner"
import { loadOwnerMenu } from "@/lib/data/menu-admin"
import { MenuBuilder } from "@/components/menu-builder/menu-builder"

export default async function BuilderPage() {
	const restaurant = await getPrimaryRestaurant()
	if (!restaurant) return <p>Chưa có nhà hàng.</p>
	const { menu, categories, items } = await loadOwnerMenu(restaurant.id)
	if (!menu)
		return (
			<p className="text-muted-foreground">
				Chưa có menu. Hãy tạo món ở trang Menu trước.
			</p>
		)
	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-2xl font-bold">Thiết kế menu</h1>
				<p className="text-sm text-muted-foreground">
					Kéo thả tự do từng món như Canva, hoặc chọn một bố cục mẫu để tự động
					canh đều. Bấm “Lưu bố cục” để áp dụng.
				</p>
			</div>
			<MenuBuilder menu={menu} categories={categories} items={items} />
		</div>
	)
}
