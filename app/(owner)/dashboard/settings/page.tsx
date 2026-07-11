import type { LucideIcon } from "lucide-react"
import {
	Building2,
	Camera,
	Clock3,
	ImageIcon,
	Mail,
	MapPin,
	Phone,
	ShieldCheck,
	Store,
	UserRound,
} from "lucide-react"
import { getCurrentProfile } from "@/lib/data/profile"
import { getPrimaryRestaurant } from "@/lib/data/owner"
import { updateProfile, updateRestaurantSettings } from "@/app/(owner)/actions"
import { SaveButton } from "@/components/settings/save-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const THEME_PRESETS = [
	{ label: "Cam năng động", value: "24 96% 53%", color: "#f97316" },
	{ label: "Đỏ nổi bật", value: "0 84% 60%", color: "#ef4444" },
	{ label: "Xanh lá tươi", value: "142 71% 45%", color: "#22c55e" },
	{ label: "Xanh dương", value: "221 83% 53%", color: "#3b82f6" },
	{ label: "Tím hiện đại", value: "271 81% 56%", color: "#9333ea" },
	{ label: "Hồng trẻ trung", value: "330 81% 60%", color: "#ec4899" },
]

const TIMEZONES = [
	{ label: "Việt Nam — Hồ Chí Minh", value: "Asia/Ho_Chi_Minh" },
	{ label: "Ấn Độ — Kolkata", value: "Asia/Kolkata" },
	{ label: "Singapore", value: "Asia/Singapore" },
	{ label: "Thái Lan — Bangkok", value: "Asia/Bangkok" },
]

export default async function SettingsPage() {
	const [profile, restaurant] = await Promise.all([
		getCurrentProfile(),
		getPrimaryRestaurant(),
	])
	if (!profile) return null

	const theme = (restaurant?.theme_settings ?? {}) as { primary?: string }
	const currentPrimary = theme.primary ?? "24 96% 53%"
	const canEditRestaurant = restaurant?.owner_id === profile.id

	return (
		<div className="mx-auto max-w-6xl space-y-7">
			<div>
				<p className="text-sm font-medium text-primary">
					Tài khoản & thương hiệu
				</p>
				<h1 className="mt-1 text-3xl font-bold tracking-tight">Cài đặt</h1>
				<p className="mt-2 text-muted-foreground">
					Quản lý thông tin cá nhân và nội dung nhà hàng hiển thị với khách.
				</p>
			</div>

			<div className="grid gap-6 xl:grid-cols-[340px_1fr]">
				<div className="space-y-6">
					<Card className="overflow-hidden border-0 shadow-sm">
						<div className="h-24 bg-gradient-to-r from-orange-400 to-rose-400" />
						<CardContent className="relative p-6 pt-0 text-center">
							<div className="mx-auto -mt-12 grid h-24 w-24 place-items-center overflow-hidden rounded-3xl border-4 border-white bg-orange-50 text-primary shadow-lg">
								{profile.avatarUrl ? (
									<img
										src={profile.avatarUrl}
										alt="Ảnh đại diện"
										className="h-full w-full object-cover"
									/>
								) : (
									<UserRound className="h-10 w-10" />
								)}
							</div>
							<h2 className="mt-4 text-xl font-bold">
								{profile.fullName ?? "Chủ nhà hàng"}
							</h2>
							<p className="mt-1 truncate text-sm text-muted-foreground">
								{profile.email}
							</p>
							<Badge variant="secondary" className="mt-3">
								{profile.role}
							</Badge>
						</CardContent>
					</Card>

					{/* <Card className="border-0 bg-emerald-50 shadow-sm">
						<CardContent className="flex gap-3 p-5 text-sm text-emerald-900">
							<ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
							<div>
								<p className="font-semibold">Bảo vệ nhiều lớp</p>
								<p className="mt-1 text-emerald-800/80">
									Thông tin chỉ được cập nhật theo session hiện tại và Supabase
									RLS.
								</p>
							</div>
						</CardContent>
					</Card> */}
				</div>

				<div className="space-y-6">
					<Card className="border-0 shadow-sm">
						<CardHeader>
							<div className="flex items-center gap-3">
								<span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
									<UserRound className="h-5 w-5" />
								</span>
								<div>
									<CardTitle>Hồ sơ cá nhân</CardTitle>
									<p className="text-sm text-muted-foreground">
										Thông tin của tài khoản đang đăng nhập.
									</p>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<form action={updateProfile} className="space-y-5">
								<div className="grid gap-4 md:grid-cols-2">
									<Field label="Họ và tên" icon={UserRound}>
										<Input
											id="full_name"
											name="full_name"
											defaultValue={profile.fullName ?? ""}
											maxLength={120}
											required
										/>
									</Field>
									<Field label="Số điện thoại" icon={Phone}>
										<Input
											id="phone"
											name="phone"
											type="tel"
											defaultValue={profile.phone ?? ""}
											maxLength={30}
											placeholder="0901 234 567"
										/>
									</Field>
								</div>
								<Field label="Email đăng nhập" icon={Mail}>
									<Input value={profile.email ?? ""} readOnly disabled />
									<p className="mt-1 text-xs text-muted-foreground">
										Email được quản lý bởi Supabase Auth và không đổi tại đây.
									</p>
								</Field>
								<Field label="URL ảnh đại diện" icon={Camera}>
									<Input
										id="avatar_url"
										name="avatar_url"
										type="url"
										defaultValue={profile.avatarUrl ?? ""}
										placeholder="https://..."
									/>
								</Field>
								<div className="flex justify-end">
									<SaveButton
										idleLabel="Lưu hồ sơ"
										pendingLabel="Đang lưu hồ sơ..."
									/>
								</div>
							</form>
						</CardContent>
					</Card>

					{restaurant && canEditRestaurant ? (
						<Card className="border-0 shadow-sm">
							<div className="relative h-44 overflow-hidden bg-orange-100">
								<img
									src={restaurant.cover_url ?? "/images/restaurant-cover.svg"}
									alt=""
									className="h-full w-full object-cover"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
								<div className="absolute bottom-4 left-5 flex items-center gap-3 text-white">
									<span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white text-primary shadow">
										{restaurant.logo_url ? (
											<img
												src={restaurant.logo_url}
												alt=""
												className="h-full w-full object-cover"
											/>
										) : (
											<Store className="h-6 w-6" />
										)}
									</span>
									<div>
										<p className="text-lg font-bold">{restaurant.name}</p>
										<p className="text-xs text-white/80">/{restaurant.slug}</p>
									</div>
								</div>
							</div>
							<CardHeader>
								<div className="flex items-center gap-3">
									<span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-primary">
										<Building2 className="h-5 w-5" />
									</span>
									<div>
										<CardTitle>Nhà hàng của tôi</CardTitle>
										<p className="text-sm text-muted-foreground">
											Tên, địa chỉ và thông tin xuất hiện trên menu khách.
										</p>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<form action={updateRestaurantSettings} className="space-y-5">
									<input type="hidden" name="id" value={restaurant.id} />
									<div className="grid gap-4 md:grid-cols-2">
										<Field label="Tên nhà hàng" icon={Store}>
											<Input
												id="name"
												name="name"
												defaultValue={restaurant.name}
												maxLength={160}
												required
											/>
										</Field>
										<Field label="Thành phố" icon={MapPin}>
											<Input
												id="city"
												name="city"
												defaultValue={restaurant.city ?? ""}
												maxLength={120}
												placeholder="Hồ Chí Minh"
											/>
										</Field>
									</div>
									<Field label="Địa chỉ đầy đủ" icon={MapPin}>
										<Input
											id="address"
											name="address"
											defaultValue={restaurant.address ?? ""}
											maxLength={300}
											placeholder="123 Nguyễn Huệ, Phường Bến Nghé, Quận 1"
										/>
									</Field>
									<div className="space-y-1.5">
										<Label htmlFor="description">Giới thiệu nhà hàng</Label>
										<Textarea
											id="description"
											name="description"
											defaultValue={restaurant.description ?? ""}
											maxLength={1000}
											rows={4}
											placeholder="Không gian, phong cách ẩm thực và điều đặc biệt của nhà hàng..."
										/>
									</div>
									<div className="grid gap-4 md:grid-cols-2">
										<Field label="URL logo" icon={ImageIcon}>
											<Input
												id="logo_url"
												name="logo_url"
												type="url"
												defaultValue={restaurant.logo_url ?? ""}
												placeholder="https://..."
											/>
										</Field>
										<Field label="URL ảnh bìa" icon={ImageIcon}>
											<Input
												id="cover_url"
												name="cover_url"
												type="url"
												defaultValue={restaurant.cover_url ?? ""}
												placeholder="https://..."
											/>
										</Field>
									</div>
									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-1.5">
											<Label
												htmlFor="timezone"
												className="flex items-center gap-2"
											>
												<Clock3 className="h-4 w-4 text-muted-foreground" />
												Múi giờ
											</Label>
											<select
												id="timezone"
												name="timezone"
												defaultValue={restaurant.timezone}
												className="h-10 w-full rounded-md border bg-background px-3 text-sm"
											>
												{TIMEZONES.map((zone) => (
													<option key={zone.value} value={zone.value}>
														{zone.label}
													</option>
												))}
											</select>
										</div>
										<div className="space-y-1.5">
											<Label htmlFor="primary">Màu thương hiệu</Label>
											<select
												id="primary"
												name="primary"
												defaultValue={currentPrimary}
												className="h-10 w-full rounded-md border bg-background px-3 text-sm"
											>
												{THEME_PRESETS.map((preset) => (
													<option key={preset.value} value={preset.value}>
														{preset.label}
													</option>
												))}
											</select>
											<div className="mt-2 flex gap-2">
												{THEME_PRESETS.map((preset) => {
													const swatchStyle = { backgroundColor: preset.color }
													return (
														<span
															key={preset.value}
															title={preset.label}
															className={`h-5 w-5 rounded-full ring-2 ring-offset-2 ${preset.value === currentPrimary ? "ring-slate-400" : "ring-transparent"}`}
															style={swatchStyle}
														/>
													)
												})}
											</div>
										</div>
									</div>
									<label className="flex items-start gap-3 rounded-2xl border bg-slate-50 p-4 text-sm">
										<input
											type="checkbox"
											name="face_enabled"
											defaultChecked={restaurant.face_enabled}
											className="mt-0.5 h-4 w-4"
										/>
										<span>
											<span className="font-medium">
												Bật nhận diện khuôn mặt
											</span>
											<span className="mt-1 block text-xs text-muted-foreground">
												Chỉ hoạt động khi khách chủ động đồng ý.
											</span>
										</span>
									</label>
									<div className="flex justify-end">
										<SaveButton
											idleLabel="Lưu nhà hàng"
											pendingLabel="Đang lưu nhà hàng..."
										/>
									</div>
								</form>
							</CardContent>
						</Card>
					) : (
						<Card className="border-dashed">
							<CardContent className="flex items-center gap-3 p-6">
								<Building2 className="h-6 w-6 text-muted-foreground" />
								<p className="text-sm text-muted-foreground">
									{restaurant
										? "Bạn đang truy cập với vai trò nhân viên. Chỉ chủ sở hữu mới có thể sửa thông tin nhà hàng."
										: "Bạn chưa có nhà hàng. Hãy tạo nhà hàng trước để cập nhật thông tin."}
								</p>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	)
}

function Field({
	label,
	icon: Icon,
	children,
}: {
	label: string
	icon: LucideIcon
	children: React.ReactNode
}) {
	return (
		<div className="space-y-1.5">
			<Label className="flex items-center gap-2">
				<Icon className="h-4 w-4 text-muted-foreground" />
				{label}
			</Label>
			{children}
		</div>
	)
}
