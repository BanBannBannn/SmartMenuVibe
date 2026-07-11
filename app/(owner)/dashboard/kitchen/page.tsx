import { getPrimaryRestaurant } from "@/lib/data/owner"
import { KitchenBoard } from "@/components/kitchen/kitchen-board"

export default async function KitchenPage() {
	const restaurant = await getPrimaryRestaurant()
	if (!restaurant) return <p>Chưa có nhà hàng.</p>
	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Màn hình bếp</h1>
			<p className="text-sm text-muted-foreground">
				Đơn mới hiển thị realtime. Nhấn “Chuyển tiếp” để cập nhật trạng thái.
			</p>
			<KitchenBoard restaurantId={restaurant.id} />
		</div>
	)
}
