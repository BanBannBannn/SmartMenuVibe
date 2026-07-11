import { Building2, CheckCircle2, MapPin, Plus, Store } from "lucide-react"
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
		<div className="space-y-7">
			<div>
				<p className="text-sm font-medium text-primary">Không gian của bạn</p>
				<h1 className="mt-1 text-3xl font-bold tracking-tight">Nhà hàng</h1>
				<p className="mt-2 text-muted-foreground">
					Quản lý nhiều chi nhánh và chuyển không gian làm việc chỉ với một
					chạm.
				</p>
			</div>

			<div className="grid gap-6 xl:grid-cols-[1fr_380px]">
				<section>
					{restaurants.length === 0 ? (
						<div className="overflow-hidden rounded-3xl border bg-white text-center shadow-sm">
							<img
								src="/images/empty-restaurant.svg"
								alt=""
								className="h-56 w-full object-cover"
							/>
							<div className="p-7">
								<h2 className="text-xl font-bold">Chưa có nhà hàng nào</h2>
								<p className="mt-2 text-sm text-muted-foreground">
									Điền thông tin bên cạnh để tạo không gian đầu tiên.
								</p>
							</div>
						</div>
					) : (
						<div className="grid gap-5 md:grid-cols-2">
							{restaurants.map((restaurant) => {
								const isActive = active?.id === restaurant.id
								return (
									<Card
										key={restaurant.id}
										className={`overflow-hidden border-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
											isActive ? "ring-2 ring-primary ring-offset-2" : ""
										}`}
									>
										<div className="relative h-36 overflow-hidden bg-orange-100">
											<img
												src={
													restaurant.cover_url ?? "/images/restaurant-cover.svg"
												}
												alt=""
												className="h-full w-full object-cover transition duration-500 hover:scale-105"
											/>
											<div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
											<div className="absolute bottom-3 left-4 flex items-center gap-2 text-white">
												<span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-white/95 text-primary shadow">
													{restaurant.logo_url ? (
														<img
															src={restaurant.logo_url}
															alt=""
															className="h-full w-full object-cover"
														/>
													) : (
														<Store className="h-5 w-5" />
													)}
												</span>
												<div>
													<p className="font-bold leading-tight">
														{restaurant.name}
													</p>
													<p className="text-xs text-white/80">
														/{restaurant.slug}
													</p>
												</div>
											</div>
										</div>
										<CardContent className="p-4">
											<div className="mb-4 flex items-center justify-between gap-2">
												<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
													<MapPin className="h-4 w-4" />
													{restaurant.city ?? "Chưa cập nhật thành phố"}
												</div>
												<Badge
													variant={
														restaurant.status === "active"
															? "secondary"
															: "destructive"
													}
												>
													{restaurant.status}
												</Badge>
											</div>
											{isActive ? (
												<div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
													<CheckCircle2 className="h-4 w-4" /> Đang quản lý
												</div>
											) : (
												<form action={setActiveRestaurant}>
													<input
														type="hidden"
														name="id"
														value={restaurant.id}
													/>
													<Button
														size="sm"
														variant="outline"
														type="submit"
														className="w-full"
													>
														Chuyển sang quản lý
													</Button>
												</form>
											)}
										</CardContent>
									</Card>
								)
							})}
						</div>
					)}
				</section>

				<aside>
					<Card className="sticky top-6 border-0 shadow-sm">
						<CardHeader>
							<span className="mb-2 grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-primary">
								<Plus className="h-5 w-5" />
							</span>
							<CardTitle>Thêm nhà hàng mới</CardTitle>
							<p className="text-sm text-muted-foreground">
								Menu chính sẽ được tạo tự động để bạn bắt đầu ngay.
							</p>
						</CardHeader>
						<CardContent>
							<form action={createRestaurant} className="space-y-4">
								<div className="space-y-1.5">
									<Label htmlFor="name">Tên nhà hàng</Label>
									<div className="relative">
										<Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
										<Input
											id="name"
											name="name"
											className="pl-9"
											placeholder="VD: Bếp Nhà Mình"
											required
										/>
									</div>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="city">Thành phố</Label>
									<div className="relative">
										<MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
										<Input
											id="city"
											name="city"
											className="pl-9"
											placeholder="Hồ Chí Minh"
										/>
									</div>
								</div>
								<Button type="submit" className="w-full">
									Tạo nhà hàng
								</Button>
							</form>
						</CardContent>
					</Card>
				</aside>
			</div>
		</div>
	)
}
