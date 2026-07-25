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
export function themeToCssVars(theme: unknown): React.CSSProperties {
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

/** "#f59e0b" -> "38 92% 50%", the triplet form Tailwind tokens expect. */
export function hexToHslTriplet(hex: string): string | null {
	const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
	if (!m) return null
	const int = parseInt(m[1], 16)
	const r = ((int >> 16) & 255) / 255
	const g = ((int >> 8) & 255) / 255
	const b = (int & 255) / 255

	const max = Math.max(r, g, b)
	const min = Math.min(r, g, b)
	const l = (max + min) / 2
	const d = max - min

	if (d === 0) return `0 0% ${Math.round(l * 100)}%`

	const s = d / (1 - Math.abs(2 * l - 1))
	let h: number
	if (max === r) h = ((g - b) / d) % 6
	else if (max === g) h = (b - r) / d + 2
	else h = (r - g) / d + 4
	h = Math.round(h * 60)
	if (h < 0) h += 360

	return `${h} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/**
 * Tint the guest ordering page with the accent colour chosen in the menu
 * designer, so the phone menu and the wall board read as one brand. An explicit
 * `theme_settings.primary` still wins - that is the owner's manual override.
 */
export function guestThemeVars(
	themeSettings: unknown,
	accentHex: string,
): React.CSSProperties {
	const vars = themeToCssVars(themeSettings) as Record<string, string>
	if (!vars["--primary"]) {
		const hsl = hexToHslTriplet(accentHex)
		if (hsl) {
			vars["--primary"] = hsl
			vars["--ring"] = hsl
		}
	}
	return vars as React.CSSProperties
}
