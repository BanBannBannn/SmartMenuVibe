"use client"

import { useState } from "react"
import { saveRecommendationRule } from "@/app/(owner)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type ItemRef = { id: string; name: string }
type RuleType = "time_of_day" | "weather" | "combo" | "best_seller"

const RULE_OPTIONS: { value: RuleType; label: string; hint: string }[] = [
	{
		value: "best_seller",
		label: "Bán chạy",
		hint: 'Để trống hoặc { "limit": 5 }',
	},
	{
		value: "time_of_day",
		label: "Theo khung giờ",
		hint: '{ "from": "18:00", "to": "22:00" }',
	},
	{
		value: "weather",
		label: "Theo thời tiết",
		hint: '{ "weather": ["rain", "cold"] }',
	},
	{ value: "combo", label: "Combo", hint: '{ "with": "<item_id>" }' },
]

export function RuleForm({
	restaurantId,
	items,
}: {
	restaurantId: string
	items: ItemRef[]
}) {
	const [ruleType, setRuleType] = useState<RuleType>("best_seller")
	const [selected, setSelected] = useState<string[]>([])
	const hint = RULE_OPTIONS.find((o) => o.value === ruleType)?.hint ?? "{}"

	function toggle(id: string) {
		setSelected((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		)
	}

	return (
		<form action={saveRecommendationRule} className="space-y-4">
			<input type="hidden" name="restaurantId" value={restaurantId} />
			<input
				type="hidden"
				name="suggested_item_ids"
				value={selected.join(",")}
			/>

			<div className="space-y-1.5">
				<Label htmlFor="rule-name">Tên luật</Label>
				<Input
					id="rule-name"
					name="name"
					placeholder="VD: Giờ cao điểm"
					required
				/>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="rule-type">Loại luật</Label>
				<select
					id="rule-type"
					name="rule_type"
					value={ruleType}
					onChange={(e) => setRuleType(e.target.value as RuleType)}
					className="h-10 w-full rounded-md border bg-background px-3 text-sm"
				>
					{RULE_OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="conditions">Điều kiện (JSON)</Label>
				<Input
					id="conditions"
					name="conditions"
					defaultValue="{}"
					placeholder={hint}
				/>
				<p className="text-xs text-muted-foreground">Ví dụ: {hint}</p>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="priority">Ưu tiên</Label>
				<Input id="priority" name="priority" type="number" defaultValue={100} />
			</div>

			<div className="space-y-1.5">
				<Label>Món gợi ý</Label>
				{items.length === 0 ? (
					<p className="text-xs text-muted-foreground">Chưa có món nào.</p>
				) : (
					<div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-md border p-2">
						{items.map((it) => {
							const on = selected.includes(it.id)
							return (
								<button
									key={it.id}
									type="button"
									onClick={() => toggle(it.id)}
									className={cn(
										"rounded-full border px-2.5 py-1 text-xs",
										on
											? "border-primary bg-primary/10 font-semibold text-primary"
											: "bg-background",
									)}
								>
									{it.name}
								</button>
							)
						})}
					</div>
				)}
			</div>

			<Button type="submit">Lưu luật</Button>
		</form>
	)
}
