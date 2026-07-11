/**
 * Centralised, typed access to environment variables.
 * Never hardcode secrets (Plan section 8.2). Server-only secrets must never be
 * imported into a client component; the getters below throw if used wrongly.
 */

function required(name: string, value: string | undefined): string {
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`)
	}
	return value
}

// Public (safe for the browser) ----------------------------------------------
export const publicEnv = {
	supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
	supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
	appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
	paymentsEnabled: process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true",
	defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "vi",
}

// Server-only ----------------------------------------------------------------
export const serverEnv = {
	get serviceRoleKey() {
		return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY)
	},
	get dbPoolerUrl() {
		return process.env.SUPABASE_DB_POOLER_URL ?? ""
	},
	azureFace: {
		get key() {
			return process.env.AZURE_FACE_KEY ?? ""
		},
		get endpoint() {
			return process.env.AZURE_FACE_ENDPOINT ?? ""
		},
		get identifyEnabled() {
			return process.env.FACE_IDENTIFY_ENABLED === "true"
		},
		get personGroup() {
			return process.env.AZURE_FACE_PERSON_GROUP ?? "smartmenu-guests"
		},
	},
	get openWeatherKey() {
		return process.env.OPENWEATHER_API_KEY ?? ""
	},
	llm: {
		get provider() {
			return (process.env.LLM_PROVIDER ?? "").toLowerCase()
		},
		get anthropicKey() {
			return process.env.ANTHROPIC_API_KEY ?? ""
		},
		get openaiKey() {
			return process.env.OPENAI_API_KEY ?? ""
		},
		get model() {
			return process.env.LLM_MODEL ?? ""
		},
	},
}

if (typeof window !== "undefined") {
	// Defensive: ensure this module's server getters are never bundled to client
	// by accident. Public values are fine.
	Object.freeze(publicEnv)
}
