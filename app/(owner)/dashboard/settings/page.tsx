import { getPrimaryRestaurant } from "@/lib/data/owner"
import { updateRestaurantSettings } from "@/app/(owner)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const THEME_PRESETS = [
	{ label: "Cam (mặc định)", value: "24 96% 53%" },
	{ label: "Đỏ", value: "0 84% 60%" },
	{ label: "Xanh lá", value: "142 71% 45%" },
	{ label: "Xanh dương", value: "221 83% 53%" },
	{ label: "Tím", value: "271 81% 56%" },
	{ label: "Hồng", value: "330 81% 60%" },
]

export default async function SettingsPage() {
	const restaurant = await getPrimaryRestaurant()
	if (!restaurant) return <p>Chưa có nhà hàng.</p>
	const theme = (restaurant.theme_settings ?? {}) as { primary?: string }
	const currentPrimary = theme.primary ?? "24 96% 53%"

	return (
		<div className="max-w-2xl space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Cài đặt nhà hàng</h1>
				<p className="text-sm text-muted-foreground">
					Thông tin hiển thị trên menu khách và màu thương hiệu.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Thông tin chung</CardTitle>
				</CardHeader>
				<CardContent>
					<form action={updateRestaurantSettings} className="space-y-4">
						<input type="hidden" name="id" value={restaurant.id} />
						<div className="space-y-1.5">
							<Label htmlFor="name">Tên nhà hàng</Label>
							<Input
								id="name"
								name="name"
								defaultValue={restaurant.name}
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="city">
								Thành phố (dùng cho gợi ý theo thời tiết)
							</Label>
							<Input
								id="city"
								name="city"
								defaultValue={restaurant.city ?? ""}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="description">Giới thiệu</Label>
							<Textarea
								id="description"
								name="description"
								defaultValue={restaurant.description ?? ""}
								placeholder="Mô tả ngắn về nhà hàng..."
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="primary">Màu thương hiệu</Label>
							<select
								id="primary"
								name="primary"
								defaultValue={currentPrimary}
								className="h-10 w-full rounded-md border bg-background px-3 text-sm"
							>
								{THEME_PRESETS.map((p) => (
									<option key={p.value} value={p.value}>
										{p.label}
									</option>
								))}
							</select>
						</div>
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								name="face_enabled"
								defaultChecked={restaurant.face_enabled}
								className="h-4 w-4"
							/>
							Bật nhận diện khuôn mặt (cần khách đồng ý)
						</label>
						<Button type="submit">Lưu cài đặt</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
