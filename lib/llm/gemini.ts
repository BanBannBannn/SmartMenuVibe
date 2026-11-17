import "server-only"
import {
	ApiError,
	GoogleGenAI,
	ThinkingLevel,
	type GenerateContentConfig,
	type PartUnion,
} from "@google/genai"
import { serverEnv } from "@/lib/env"

/**
 * Google Gemini via the official @google/genai SDK.
 *
 * Built for the FREE tier, which has small per-model quotas: the configured
 * models are tried in order and a 429 (quota) or 5xx on one model moves on to
 * the next, since each model has its own free quota.
 *
 * Free-tier terms: Google may use inputs/outputs to improve its products and
 * humans may review them. Only ever send public menu content here - never
 * guest names, phones, orders or any other personal data.
 */

export class GeminiError extends Error {
	constructor(
		public readonly code: "DISABLED" | "QUOTA" | "UNAVAILABLE" | "BAD_OUTPUT",
		message?: string,
	) {
		super(message ?? code)
	}
}

let client: GoogleGenAI | null = null
function getClient(): GoogleGenAI | null {
	const apiKey = serverEnv.gemini.key
	if (!apiKey) return null
	client ??= new GoogleGenAI({ apiKey })
	return client
}

export function geminiEnabled(): boolean {
	return Boolean(serverEnv.gemini.key)
}

type GenerateOptions = {
	system: string
	parts: PartUnion[]
	/** JSON Schema for the response; omit for plain text. */
	jsonSchema?: unknown
	maxOutputTokens?: number
	timeoutMs?: number
}

/** Returns the raw response text plus the model that produced it. */
export async function geminiGenerate(
	opts: GenerateOptions,
): Promise<{ text: string; model: string }> {
	const ai = getClient()
	if (!ai) throw new GeminiError("DISABLED")

	const baseConfig: GenerateContentConfig = {
		systemInstruction: opts.system,
		maxOutputTokens: opts.maxOutputTokens ?? 2048,
		...(opts.jsonSchema
			? { responseMimeType: "application/json", responseJsonSchema: opts.jsonSchema }
			: {}),
	}

	let lastError: GeminiError = new GeminiError("UNAVAILABLE")
	for (const model of serverEnv.gemini.models) {
		// Low thinking keeps free-tier token use down and stops thoughts from
		// eating the output budget. If a model rejects the setting (400), retry
		// it once without.
		for (const thinking of [true, false]) {
			try {
				const res = await ai.models.generateContent({
					model,
					contents: opts.parts,
					config: {
						...baseConfig,
						...(thinking
							? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
							: {}),
						abortSignal: AbortSignal.timeout(opts.timeoutMs ?? 50_000),
					},
				})
				const text = res.text?.trim()
				if (text) return { text, model }
				lastError = new GeminiError("BAD_OUTPUT", `${model}: empty response`)
				break
			} catch (err) {
				if (err instanceof ApiError && err.status === 400 && thinking) continue
				if (err instanceof ApiError && (err.status === 429 || err.status >= 500)) {
					// Quota exhausted / overloaded on this model: try the next one.
					lastError = new GeminiError(
						err.status === 429 ? "QUOTA" : "UNAVAILABLE",
						`${model}: ${err.message}`,
					)
					console.warn("[gemini]", lastError.message)
					break
				}
				if (err instanceof Error && err.name === "TimeoutError") {
					lastError = new GeminiError("UNAVAILABLE", `${model}: timeout`)
					break
				}
				throw err
			}
		}
	}
	throw lastError
}
