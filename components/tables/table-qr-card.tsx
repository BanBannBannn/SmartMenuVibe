"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

/** Renders a printable QR code for a table's guest ordering URL (Plan 3.2). */
export function TableQrCard({
	tableNumber,
	url,
}: {
	tableNumber: string
	url: string
}) {
	const [dataUrl, setDataUrl] = useState<string>("")
	useEffect(() => {
		QRCode.toDataURL(url, { width: 240, margin: 1 }).then(setDataUrl).catch(() => {})
	}, [url])

	return (
		<Card>
			<CardContent className="flex flex-col items-center gap-2 p-4">
				<p className="font-medium">Bàn {tableNumber}</p>
				{dataUrl ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={dataUrl} alt={`QR bàn ${tableNumber}`} className="h-40 w-40" />
				) : (
					<div className="h-40 w-40 animate-pulse rounded bg-muted" />
				)}
				<Button
					size="sm"
					variant="outline"
					onClick={() => {
						const w = window.open("")
						if (w) w.document.write(`<img src="${dataUrl}" style="width:300px"/>`)
					}}
				>
					In QR
				</Button>
			</CardContent>
		</Card>
	)
}
