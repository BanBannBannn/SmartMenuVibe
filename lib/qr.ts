import QRCode from "qrcode"
import { publicEnv } from "@/lib/env"

/** Build the public ordering URL for a table. */
export function tableOrderingUrl(
	restaurantSlug: string,
	qrToken: string,
): string {
	return `${publicEnv.appUrl}/${restaurantSlug}/${qrToken}`
}

/** Generate a QR code data URL (PNG) that opens the table ordering page. */
export async function generateTableQrDataUrl(
	restaurantSlug: string,
	qrToken: string,
): Promise<string> {
	const url = tableOrderingUrl(restaurantSlug, qrToken)
	return QRCode.toDataURL(url, {
		width: 512,
		margin: 2,
		color: { dark: "#111111", light: "#ffffff" },
	})
}
