import { getPrimaryRestaurant } from "@/lib/data/owner"
import { loadOwnerMenu } from "@/lib/data/menu-admin"
import { MenuBuilder } from "@/components/menu-builder/menu-builder"
import { menuFontVars } from "@/lib/fonts"

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
		<div className={`${menuFontVars} space-y-4`}>
			<div>
				<h1 className="text-2xl font-bold">Thiết kế menu</h1>
				<p className="text-sm text-muted-foreground">
					Kéo thả tự do như Canva. Chọn một mẫu dựng sẵn để hệ thống tự dàn cả
					trang từ món ăn thật của bạn, rồi chỉnh lại tuỳ ý — thiết kế này chính
					là thứ hiện lên màn hình trưng bày.
				</p>
			</div>
			<MenuBuilder
				menu={menu}
				categories={categories}
				items={items}
				restaurantName={restaurant.name}
				previewUrl={`/${restaurant.slug}/showcase`}
			/>
		</div>
	)
}
