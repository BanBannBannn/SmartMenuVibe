import Link from "next/link"
import { getPrimaryRestaurant } from "@/lib/data/owner"
import { loadPublicMenu } from "@/lib/data/guest"
import { MenuBoard } from "@/components/menu-board/menu-board"
import { Button } from "@/components/ui/button"
import { menuFontVars } from "@/lib/fonts"
import { canvasPresetById, themeById } from "@/lib/menu-design"

export default async function ShowcasePage() {
	const restaurant = await getPrimaryRestaurant()
	if (!restaurant)
		return <p className="text-muted-foreground">Chưa có nhà hàng.</p>

	const menu = await loadPublicMenu(restaurant.slug)
	const publicUrl = `/${restaurant.slug}/showcase`
	const preset = menu ? canvasPresetById(menu.layout.canvas) : null
	const theme = menu ? themeById(menu.layout.theme) : null

	return (
		<div className={`${menuFontVars} space-y-4`}>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">Màn hình trưng bày</h1>
					<p className="max-w-2xl text-sm text-muted-foreground">
						Bản xem trước của đúng thiết kế bạn dựng ở trang Thiết kế menu. Mở
						link này trên TV hoặc màn hình đặt cạnh quầy để khách xem và gọi
						món.
					</p>
				</div>
				<div className="flex gap-2">
					<Link href="/dashboard/builder">
						<Button variant="outline">Chỉnh thiết kế</Button>
					</Link>
					<a href={publicUrl} target="_blank" rel="noreferrer">
						<Button>Mở toàn màn hình ↗</Button>
					</a>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border bg-muted/30 px-3 py-2 text-sm">
				<span>
					<span className="text-muted-foreground">Đường dẫn công khai:</span>{" "}
					<code className="font-mono">{publicUrl}</code>
				</span>
				{preset && theme && (
					<span className="text-muted-foreground">
						Khổ: <strong>{preset.label}</strong> · Chủ đề:{" "}
						<strong>{theme.label}</strong>
					</span>
				)}
			</div>

			{menu && preset ? (
				<div
					className="overflow-hidden rounded-2xl border shadow-sm"
					style={{ aspectRatio: `${preset.width} / ${preset.height}` }}
				>
					<MenuBoard
						layout={menu.layout}
						categories={menu.categories}
						fit="contain"
						className="h-full"
					/>
				</div>
			) : (
				<p className="text-muted-foreground">
					Chưa có menu để hiển thị. Hãy thêm món ở trang Menu, rồi dựng bố cục ở
					trang Thiết kế menu.
				</p>
			)}
		</div>
	)
}
