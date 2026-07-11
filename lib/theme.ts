import type { Json } from "@/types/database"

export type ThemeSettings = {
	primary?: string // HSL triplet, e.g. "24 96% 53%"
	background?: string
	foreground?: string
	radius?: string
	fontSans?: string
	fontDisplay?: string
	dark?: boolean
}

/** Convert a restaurant's theme_settings JSON into inline CSS variables that
 * override the Tailwind design tokens for that restaurant's public menu. */
export function themeToCssVars(theme: Json | null | undefined): React.CSSProperties {
	const t = (theme ?? {}) as ThemeSettings
	const vars: Record<string, string> = {}
	if (t.primary) vars["--primary"] = t.primary
	if (t.background) vars["--background"] = t.background
	if (t.foreground) vars["--foreground"] = t.foreground
	if (t.radius) vars["--radius"] = t.radius
	if (t.fontSans) vars["--font-sans"] = t.fontSans
	if (t.fontDisplay) vars["--font-display"] = t.fontDisplay
	return vars as React.CSSProperties
}
