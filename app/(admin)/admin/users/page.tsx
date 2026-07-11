import { createClient } from "@/lib/supabase/server"
import { setUserRole } from "@/app/(admin)/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const ROLES = [
	{ value: "owner", label: "Chủ nhà hàng" },
	{ value: "staff", label: "Nhân viên" },
	{ value: "super_admin", label: "Quản trị" },
]

export default async function AdminUsersPage() {
	const supabase = await createClient()
	const [{ data: profiles }, { data: restaurants }] = await Promise.all([
		supabase
			.from("profiles")
			.select("id, email, full_name, role, created_at")
			.order("created_at", { ascending: false }),
		supabase.from("restaurants").select("owner_id"),
	])

	const restaurantCount = new Map<string, number>()
	for (const r of restaurants ?? []) {
		restaurantCount.set(r.owner_id, (restaurantCount.get(r.owner_id) ?? 0) + 1)
	}

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-2xl font-bold">Quản lý tài khoản</h1>
				<p className="text-sm text-muted-foreground">
					Xem toàn bộ tài khoản và thay đổi vai trò (chủ quán / nhân viên / quản
					trị).
				</p>
			</div>
			<div className="overflow-x-auto rounded-lg border">
				<table className="w-full text-sm">
					<thead className="bg-muted/50 text-left">
						<tr>
							<th className="px-4 py-2">Tài khoản</th>
							<th className="px-4 py-2">Vai trò</th>
							<th className="px-4 py-2">Số nhà hàng</th>
							<th className="px-4 py-2">Đổi vai trò</th>
						</tr>
					</thead>
					<tbody>
						{(profiles ?? []).map((p) => (
							<tr key={p.id} className="border-t">
								<td className="px-4 py-2">
									<p className="font-medium">{p.full_name ?? "—"}</p>
									<p className="text-xs text-muted-foreground">
										{p.email ?? "—"}
									</p>
								</td>
								<td className="px-4 py-2">
									<Badge
										variant={p.role === "super_admin" ? "success" : "secondary"}
									>
										{p.role}
									</Badge>
								</td>
								<td className="px-4 py-2">{restaurantCount.get(p.id) ?? 0}</td>
								<td className="px-4 py-2">
									<form
										action={setUserRole}
										className="flex items-center gap-2"
									>
										<input type="hidden" name="id" value={p.id} />
										<select
											name="role"
											defaultValue={p.role}
											className="h-9 rounded-md border bg-background px-2 text-sm"
										>
											{ROLES.map((r) => (
												<option key={r.value} value={r.value}>
													{r.label}
												</option>
											))}
										</select>
										<Button size="sm" variant="outline" type="submit">
											Lưu
										</Button>
									</form>
								</td>
							</tr>
						))}
						{(profiles ?? []).length === 0 && (
							<tr>
								<td
									colSpan={4}
									className="px-4 py-6 text-center text-muted-foreground"
								>
									Chưa có tài khoản nào.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	)
}
