import "server-only"
import { serverEnv } from "@/lib/env"
import { geminiEnabled, geminiGenerate } from "@/lib/llm/gemini"
import { BANNED_PHRASES, cleanDescription } from "@/lib/ai/descriptions"

/**
 * Optional LLM helper for menu content (Plan section 3.4).
 * - Writes appealing dish descriptions from a name + ingredients.
 * - Suggests a theme palette from the restaurant type.
 *
 * Design: NO LLM key => graceful fallback (never throws, never blocks the UI).
 * The user chose "enable AI, add key later, fallback if missing".
 * Provider order: Gemini (free tier, GEMINI_API_KEY) first, then the legacy
 * LLM_PROVIDER (Anthropic / OpenAI via plain fetch) if configured.
 */

export type LlmAvailability = { enabled: boolean; provider: string }

export function llmAvailability(): LlmAvailability {
	if (geminiEnabled()) return { enabled: true, provider: "gemini" }
	return legacyAvailability()
}

function legacyAvailability(): LlmAvailability {
	const p = serverEnv.llm.provider
	if (p === "anthropic" && serverEnv.llm.anthropicKey)
		return { enabled: true, provider: "anthropic" }
	if (p === "openai" && serverEnv.llm.openaiKey)
		return { enabled: true, provider: "openai" }
	return { enabled: false, provider: "" }
}

async function complete(prompt: string, maxTokens = 300): Promise<string | null> {
	if (geminiEnabled()) {
		try {
			const { text } = await geminiGenerate({
				system: "Bạn là người viết nội dung menu cho quán ăn Việt Nam.",
				parts: [prompt],
				maxOutputTokens: Math.max(maxTokens, 1024),
				timeoutMs: 20_000,
			})
			return text
		} catch (err) {
			console.warn("[llm] gemini failed, trying legacy provider", err)
		}
	}
	const { provider } = legacyAvailability()
	try {
		if (provider === "anthropic") {
			const res = await fetch("https://api.anthropic.com/v1/messages", {
				method: "POST",
				headers: {
					"x-api-key": serverEnv.llm.anthropicKey,
					"anthropic-version": "2023-06-01",
					"content-type": "application/json",
				},
				body: JSON.stringify({
					model: serverEnv.llm.model || "claude-3-5-sonnet-latest",
					max_tokens: maxTokens,
					messages: [{ role: "user", content: prompt }],
				}),
			})
			if (!res.ok) return null
			const data = (await res.json()) as { content?: { text?: string }[] }
			return data.content?.[0]?.text?.trim() ?? null
		}
		if (provider === "openai") {
			const res = await fetch("https://api.openai.com/v1/chat/completions", {
				method: "POST",
				headers: {
					authorization: `Bearer ${serverEnv.llm.openaiKey}`,
					"content-type": "application/json",
				},
				body: JSON.stringify({
					model: serverEnv.llm.model || "gpt-4o-mini",
					max_tokens: maxTokens,
					messages: [{ role: "user", content: prompt }],
				}),
			})
			if (!res.ok) return null
			const data = (await res.json()) as {
				choices?: { message?: { content?: string } }[]
			}
			return data.choices?.[0]?.message?.content?.trim() ?? null
		}
		return null
	} catch {
		return null
	}
}

/** Suggest a dish description. Falls back to a simple template if no LLM. */
export async function suggestDishDescription(
	name: string,
	ingredients: string,
): Promise<{ text: string; source: "ai" | "fallback" }> {
	const prompt = `Viết mô tả 1 câu (tối đa 18 từ, tiếng Việt) cho món "${name}"${
		ingredients ? ` với nguyên liệu: ${ingredients}` : ""
	}. Nói cụ thể nguyên liệu, cách chế biến hoặc ăn kèm gì. Không dùng cụm sáo rỗng như ${BANNED_PHRASES.slice(0, 6)
		.map((p) => `"${p}"`)
		.join(", ")}, không dấu chấm than, không bịa xuất xứ. Chỉ trả về câu mô tả.`
	const ai = await complete(prompt)
	const cleaned = ai ? cleanDescription(ai) : null
	if (cleaned) return { text: cleaned, source: "ai" }
	const base = ingredients ? `${name}, làm từ ${ingredients}.` : name
	return { text: base, source: "fallback" }
}

/** Suggest a theme template id + palette hint from a restaurant type. */
export async function suggestTheme(
	restaurantType: string,
): Promise<{ hint: string; source: "ai" | "fallback" }> {
	const prompt = `Quán loại "${restaurantType}" nên dùng tone màu và phong cách menu nào? Trả lời 1 câu ngắn tiếng Việt.`
	const ai = await complete(prompt, 120)
	if (ai) return { hint: ai, source: "ai" }
	const t = restaurantType.toLowerCase()
	let hint = "Tone trung tính, sạch sẽ, dễ đọc."
	if (t.includes("lẫu") || t.includes("nướng")) hint = "Tone ấm (đỏ/cam), hợp đồ nóng."
	else if (t.includes("trà") || t.includes("cafe") || t.includes("cà phê"))
		hint = "Tone pastel trẻ trung, hiện đại."
	return { hint, source: "fallback" }
}
