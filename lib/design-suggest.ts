import { LAYOUT_TEMPLATES } from "@/lib/menu-layout"

/**
 * Rule-based template suggestions for the menu designer. No AI involved:
 * free, instant, deterministic, and it only ever picks from our own curated
 * templates, so suggestions never drift into a generic "AI look".
 *
 * Signals: menu vocabulary (category + dish names), how many dishes have
 * photos, how many dishes there are, and the typical price.
 */

export type DesignSignals = {
	categoryNames: string[]
	itemNames: string[]
	itemCount: number
	/** Share of dishes with at least one photo, 0..1. */
	photoRatio: number
	/** Median base price in VND (0 when unknown). */
	medianPrice: number
}

export type TemplateSuggestion = {
	templateId: string
	score: number
	reasons: string[]
}

type Rule = {
	vocab?: RegExp
	vocabReason?: string
	photoHeavy?: boolean
	textLed?: boolean
	dense?: boolean
	intimate?: boolean
	premium?: boolean
	budget?: boolean
}

const RULES: Record<string, Rule> = {
	"fastfood-board": {
		vocab: /gà rán|burger|combo|pizza|khoai tây|hot ?dog|cánh gà|fast ?food/,
		vocabReason: "Menu có combo / món ăn nhanh",
		photoHeavy: true,
	},
	"convenience-grid": {
		vocab: /tiện lợi|snack|mì ly|nước ngọt|đồ hộp|cơm hộp|bánh mì kẹp|xúc xích|nước suối/,
		vocabReason: "Nhiều mặt hàng kiểu cửa hàng tiện lợi",
		dense: true,
		budget: true,
	},
	"cafe-chalkboard": {
		vocab: /cà phê|cafe|coffee|espresso|latte|cappuccino|bạc xỉu|bánh ngọt|croissant/,
		vocabReason: "Menu cà phê",
		textLed: true,
		budget: true,
	},
	"finedining-a4": {
		vocab: /wagyu|steak|bò úc|vang|rượu|khai vị|tráng miệng|set menu|degustation|cá hồi|tôm hùm/,
		vocabReason: "Món cao cấp / set menu",
		textLed: true,
		intimate: true,
		premium: true,
	},
	"bubbletea-poster": {
		vocab: /trà sữa|topping|trân châu|milk ?tea|đá xay|trà trái cây|matcha|sữa tươi/,
		vocabReason: "Menu trà sữa / đồ uống",
		photoHeavy: true,
		intimate: true,
		budget: true,
	},
	"vietnam-a4": {
		vocab: /phở|bún|cơm|lẩu|nướng|gỏi|miến|hủ tiếu|bánh xèo|chả giò|canh/,
		vocabReason: "Món Việt",
		photoHeavy: true,
	},
	"photo-grid": { photoHeavy: true },
}

function countMatches(re: RegExp, texts: string[]): number {
	let n = 0
	for (const t of texts) if (re.test(t.toLowerCase())) n++
	return n
}

export function suggestTemplates(signals: DesignSignals): TemplateSuggestion[] {
	const out: TemplateSuggestion[] = []
	for (const tpl of LAYOUT_TEMPLATES) {
		const rule = RULES[tpl.id] ?? {}
		let score = tpl.id === "photo-grid" ? 1 : 0 // safe generic default
		const reasons: string[] = []

		let vocabHit = false
		if (rule.vocab) {
			const cat = countMatches(rule.vocab, signals.categoryNames)
			const items = countMatches(rule.vocab, signals.itemNames)
			// Category names are a stronger signal than individual dishes; cap so
			// one huge menu cannot swamp every other signal.
			const v = Math.min(6, cat * 3 + Math.min(3, items))
			if (v > 0 && rule.vocabReason) reasons.push(rule.vocabReason)
			vocabHit = v > 0
			score += v
		}
		if (rule.photoHeavy && signals.photoRatio >= 0.6) {
			score += 2
			reasons.push("Phần lớn món đã có ảnh")
		}
		if (rule.photoHeavy && signals.itemCount > 0 && signals.photoRatio < 0.3) score -= 2
		if (rule.textLed && signals.itemCount > 0 && signals.photoRatio < 0.3) {
			score += 2
			reasons.push("Ít ảnh món, hợp kiểu chữ")
		}
		if (rule.dense && signals.itemCount > 40) {
			score += 2
			reasons.push(`Nhiều món (${signals.itemCount}), cần bảng giá gọn`)
		}
		// Small tie-breakers only refine a template the menu already fits;
		// on their own they would push niche templates onto unrelated menus.
		if (vocabHit && rule.intimate && signals.itemCount > 0 && signals.itemCount <= 15)
			score += 1
		if (rule.premium && signals.medianPrice >= 150_000) {
			score += 3
			reasons.push("Mức giá cao")
		}
		if (vocabHit && rule.budget && signals.medianPrice > 0 && signals.medianPrice <= 40_000)
			score += 1

		out.push({ templateId: tpl.id, score, reasons: reasons.slice(0, 2) })
	}
	return out.sort((a, b) => b.score - a.score)
}

/** Build signals from the owner's menu data. */
export function signalsFrom(
	categories: { name: string }[],
	items: { name: string; images: string[]; base_price: number }[],
): DesignSignals {
	const prices = items
		.map((i) => Number(i.base_price) || 0)
		.filter((p) => p > 0)
		.sort((a, b) => a - b)
	return {
		categoryNames: categories.map((c) => c.name),
		itemNames: items.map((i) => i.name),
		itemCount: items.length,
		photoRatio: items.length
			? items.filter((i) => i.images.length > 0).length / items.length
			: 0,
		medianPrice: prices.length ? prices[Math.floor(prices.length / 2)] : 0,
	}
}
