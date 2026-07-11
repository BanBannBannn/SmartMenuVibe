import { getPrimaryRestaurant } from "@/lib/data/owner"
import { createClient } from "@/lib/supabase/server"
import { createTable } from "@/app/(owner)/actions"
import { TableQrCard } from "@/components/tables/table-qr-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { publicEnv } from "@/lib/env"

export default async function TablesPage() {
	const restaurant = await getPrimaryRestaurant()
	if (!restaurant) return <p>Chưa có nhà hàng.</p>
	const supabase = await createClient()
	const { data: tables } = await supabase
		.from("tables")
		.select("id, table_number, qr_code_token")
		.eq("restaurant_id", restaurant.id)
		.order("table_number")

	const baseUrl = publicEnv.appUrl
	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Bàn & mã QR</h1>
			<form action={createTable} className="flex max-w-sm gap-2">
				<input type="hidden" name="restaurantId" value={restaurant.id} />
				<Input name="table_number" placeholder="Số bàn (ví dụ: 5)" required />
				<Button type="submit">Thêm bàn</Button>
			</form>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{(tables ?? []).map((t) => (
					<TableQrCard
						key={t.id}
						tableNumber={t.table_number}
						url={`${baseUrl}/${restaurant.slug}/${t.qr_code_token}`}
					/>
				))}
			</div>
		</div>
	)
}
