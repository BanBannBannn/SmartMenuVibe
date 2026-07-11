import { getPrimaryRestaurant } from "@/lib/data/owner"
import { loadPublicMenu } from "@/lib/data/guest"
import { ShowcaseMenu } from "@/components/showcase/showcase-menu"
import { Button } from "@/components/ui/button"

export default async function ShowcasePage() {
	const restaurant = await getPrimaryRestaurant()
	if (!restaurant)
		return <p className="text-muted-foreground">Chưa có nhà hàng.</p>

	const menu = await loadPublicMenu(restaurant.slug)
	const publicUrl = `/${restaurant.slug}/showcase`

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">Màn hình trưng bày</h1>
					<p className="max-w-2xl text-sm text-muted-foreground">
						Loại menu để chiếu lên màn hình lớn cho khách nhìn và gọi món bằng
						miệng. Món nổi bật (Hot / Bán chạy / Đề xuất) sẽ hiển thị to hơn, có
						hiệu ứng chuyển màu và phóng to để thu hút khách.
					</p>
				</div>
				<a href={publicUrl} target="_blank" rel="noreferrer">
					<Button>Mở toàn màn hình ↗</Button>
				</a>
			</div>

			<div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
				<span className="text-muted-foreground">Đường dẫn công khai:</span>{" "}
				<code className="font-mono">{publicUrl}</code>
			</div>

			{menu ? (
				<div className="overflow-hidden rounded-2xl border shadow-sm">
					<ShowcaseMenu menu={menu} />
				</div>
			) : (
				<p className="text-muted-foreground">
					Chưa có menu để hiển thị. Hãy thêm món ở trang Menu, rồi chọn nền /
					tiêu đề ở trang Thiết kế menu.
				</p>
			)}
		</div>
	)
}
