import {
	Be_Vietnam_Pro,
	Lobster,
	Montserrat,
	Oswald,
	Playfair_Display,
} from "next/font/google"

// Display fonts for the menu designer. Every family here ships a Vietnamese
// subset - a menu board full of broken diacritics is worse than a plain font.
// These are imported only by the designer/board routes so the guest ordering
// page and the marketing pages keep their small font payload.

const body = Be_Vietnam_Pro({
	subsets: ["latin", "vietnamese"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-body",
	display: "swap",
})

const heading = Montserrat({
	subsets: ["latin", "vietnamese"],
	variable: "--font-heading",
	display: "swap",
})

const condensed = Oswald({
	subsets: ["latin", "vietnamese"],
	variable: "--font-condensed",
	display: "swap",
})

const serif = Playfair_Display({
	subsets: ["latin", "vietnamese"],
	variable: "--font-serif",
	display: "swap",
})

const script = Lobster({
	subsets: ["latin", "vietnamese"],
	weight: "400",
	variable: "--font-script",
	display: "swap",
})

/** Apply on any wrapper that renders a menu layout. */
export const menuFontVars = [
	body.variable,
	heading.variable,
	condensed.variable,
	serif.variable,
	script.variable,
].join(" ")
