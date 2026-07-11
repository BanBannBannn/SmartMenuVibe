import { createClient } from "@/lib/supabase/server"
import { setRestaurantStatus, deleteRestaurant } from "@/app/(admin)/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminHome() {
	const supabase = await createClient()
	// RLS: super admins can read all rows (is_super_admin policies).
	const [{ data: restaurants }, { data: owners }, { data: items }] =
		await Promise.all([
			supabase
				.from("restaurants")
				.select("id, name, slug, status, city, created_at, owner_id")
				.order("created_at", { ascending: false }),
			supabase.from("profiles").select("id, email, full_name"),
			supabase.from("menu_items").select("restaurant_id"),
		])

	const ownerById = new Map(
		(owners ?? []).map((o) => [o.id, o.email ?? o.full_name ?? "—"]),
	)
	const itemCount = new Map<string, number>()
	for (const it of items ?? []) {
		itemCount.set(it.restaurant_id, (itemCount.get(it.restaurant_id) ?? 0) + 1)
	}

	const total = (restaurants ?? []).length
	const activeCount = (restaurants ?? []).filter(
		(r) => r.status === "active",
	).length

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-2xl font-bold">Nhà hàng trên nền tảng</h1>
				<div className="flex gap-3">
					<Card className="px-4 py-2">
						<p className="text-xs text-muted-foreground">Tổng</p>
						<p className="text-xl font-bold">{total}</p>
					</Card>
					<Card className="px-4 py-2">
						<p className="text-xs text-muted-foreground">Đang hoạt động</p>
						<p className="text-xl font-bold text-primary">{activeCount}</p>
					</Card>
				</div>
			</div>

			<div className="overflow-x-auto rounded-lg border">
				<table className="w-full text-sm">
					<thead className="bg-muted/50 text-left">
						<tr>
							<th className="px-4 py-2">Tên</th>
							<th className="px-4 py-2">Chủ sở hữu</th>
							<th className="px-4 py-2">Thành phố</th>
							<th className="px-4 py-2">Món</th>
							<th className="px-4 py-2">Trạng thái</th>
							<th className="px-4 py-2">Hành động</th>
						</tr>
					</thead>
					<tbody>
						{(restaurants ?? []).map((r) => (
							<tr key={r.id} className="border-t">
								<td className="px-4 py-2 font-medium">
									<a
										href={`/${r.slug}/showcase`}
										target="_blank"
										rel="noreferrer"
										className="hover:text-primary hover:underline"
									>
										{r.name}
									</a>
								</td>
								<td className="px-4 py-2 text-muted-foreground">
									{ownerById.get(r.owner_id) ?? "—"}
								</td>
								<td className="px-4 py-2">{r.city ?? "—"}</td>
								<td className="px-4 py-2">{itemCount.get(r.id) ?? 0}</td>
								<td className="px-4 py-2">
									<Badge
										variant={
											r.status === "active"
												? "success"
												: r.status === "suspended"
													? "destructive"
													: "secondary"
										}
									>
										{r.status}
									</Badge>
								</td>
								<td className="px-4 py-2">
									<div className="flex flex-wrap gap-2">
										<form action={setRestaurantStatus} className="flex gap-2">
											<input type="hidden" name="id" value={r.id} />
											{r.status !== "active" && (
												<Button size="sm" name="status" value="active">
													Kích hoạt
												</Button>
											)}
											{r.status !== "suspended" && (
												<Button
													size="sm"
													variant="destructive"
													name="status"
													value="suspended"
												>
													Tạm khoá
												</Button>
											)}
										</form>
										<form action={deleteRestaurant}>
											<input type="hidden" name="id" value={r.id} />
											<Button size="sm" variant="ghost">
												Xoá
											</Button>
										</form>
									</div>
								</td>
							</tr>
						))}
						{total === 0 && (
							<tr>
								<td
									colSpan={6}
									className="px-4 py-6 text-center text-muted-foreground"
								>
									Chưa có nhà hàng nào.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	)
}
