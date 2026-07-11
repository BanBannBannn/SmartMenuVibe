import {
	getAccessibleRestaurants,
	getPrimaryRestaurant,
} from "@/lib/data/owner"
import { createRestaurant, setActiveRestaurant } from "@/app/(owner)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function RestaurantsPage() {
	const [restaurants, active] = await Promise.all([
		getAccessibleRestaurants(),
		getPrimaryRestaurant(),
	])

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<div className="space-y-4">
				<div>
					<h1 className="text-2xl font-bold">Nhà hàng của bạn</h1>
					<p className="text-sm text-muted-foreground">
						Bạn có thể quản lý nhiều nhà hàng và chuyển qua lại giữa chúng.
					</p>
				</div>
				{restaurants.length === 0 && (
					<p className="text-sm text-muted-foreground">
						Chưa có nhà hàng nào. Tạo nhà hàng đầu tiên bên phải.
					</p>
				)}
				{restaurants.map((r) => {
					const isActive = active?.id === r.id
					return (
						<Card
							key={r.id}
							className={isActive ? "border-primary" : undefined}
						>
							<CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
								<div>
									<CardTitle className="text-base">{r.name}</CardTitle>
									<p className="text-xs text-muted-foreground">
										/{r.slug}
										{r.city ? ` · ${r.city}` : ""}
									</p>
								</div>
								<div className="flex items-center gap-2">
									{isActive && <Badge variant="success">Đang chọn</Badge>}
									<Badge
										variant={
											r.status === "active" ? "secondary" : "destructive"
										}
									>
										{r.status}
									</Badge>
								</div>
							</CardHeader>
							<CardContent>
								{!isActive && (
									<form action={setActiveRestaurant}>
										<input type="hidden" name="id" value={r.id} />
										<Button size="sm" variant="outline" type="submit">
											Chuyển sang quản lý
										</Button>
									</form>
								)}
							</CardContent>
						</Card>
					)
				})}
			</div>

			<div>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Thêm nhà hàng mới</CardTitle>
					</CardHeader>
					<CardContent>
						<form action={createRestaurant} className="space-y-4">
							<div className="space-y-1.5">
								<Label htmlFor="name">Tên nhà hàng</Label>
								<Input
									id="name"
									name="name"
									placeholder="VD: Quán Phở 24"
									required
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="city">Thành phố</Label>
								<Input id="city" name="city" placeholder="Hồ Chí Minh" />
							</div>
							<Button type="submit">Tạo nhà hàng</Button>
						</form>
						<p className="mt-3 text-xs text-muted-foreground">
							Nhà hàng mới sẽ được tạo sẵn một “Menu chính” và tự động được chọn
							để quản lý.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
