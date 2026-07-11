import { getPrimaryRestaurant } from "@/lib/data/owner"
import { loadOwnerMenu } from "@/lib/data/menu-admin"
import { loadRecommendationRules } from "@/lib/data/recommendations"
import { deleteRecommendationRule } from "@/app/(owner)/actions"
import { RuleForm } from "@/components/owner/rule-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const RULE_LABELS: Record<string, string> = {
	time_of_day: "Theo khung giờ",
	weather: "Theo thời tiết",
	combo: "Combo",
	best_seller: "Bán chạy",
}

export default async function RecommendationsPage() {
	const restaurant = await getPrimaryRestaurant()
	if (!restaurant) return <p>Chưa có nhà hàng.</p>
	const [{ items }, rules] = await Promise.all([
		loadOwnerMenu(restaurant.id),
		loadRecommendationRules(restaurant.id),
	])
	const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? id

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<div className="space-y-4">
				<div>
					<h1 className="text-2xl font-bold">Gợi ý món</h1>
					<p className="text-sm text-muted-foreground">
						Đặt luật gợi ý món theo giờ, thời tiết hoặc món bán chạy.
					</p>
				</div>
				{rules.length === 0 && (
					<p className="text-sm text-muted-foreground">Chưa có luật nào.</p>
				)}
				{rules.map((rule) => (
					<Card key={rule.id}>
						<CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
							<div>
								<CardTitle className="text-base">{rule.name}</CardTitle>
								<p className="text-xs text-muted-foreground">
									{RULE_LABELS[rule.rule_type] ?? rule.rule_type} · ưu tiên{" "}
									{rule.priority}
								</p>
							</div>
							<form action={deleteRecommendationRule}>
								<input type="hidden" name="id" value={rule.id} />
								<Button variant="ghost" size="sm" type="submit">
									Xoá
								</Button>
							</form>
						</CardHeader>
						<CardContent className="space-y-1">
							{rule.suggested_item_ids.length > 0 ? (
								<div className="flex flex-wrap gap-1">
									{rule.suggested_item_ids.map((id) => (
										<span
											key={id}
											className="rounded-full bg-muted px-2 py-0.5 text-xs"
										>
											{itemName(id)}
										</span>
									))}
								</div>
							) : (
								<p className="text-xs text-muted-foreground">Chưa chọn món.</p>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			<div>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Thêm luật mới</CardTitle>
					</CardHeader>
					<CardContent>
						<RuleForm
							restaurantId={restaurant.id}
							items={items.map((i) => ({ id: i.id, name: i.name }))}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
