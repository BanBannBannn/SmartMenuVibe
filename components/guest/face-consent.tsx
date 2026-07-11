"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Face-scan consent screen (Plan sections 3.6 & 8.3).
 * - Consent is a separate, explicit action (checkbox + button), NOT bundled
 *   into terms of service.
 * - "Bỏ qua" (Skip) is always fully functional; ordering is never blocked.
 * - Purpose is clearly stated; this is sensitive biometric data under
 *   Nghi dinh 13/2023 and the 2025 PDP Law.
 */
export function FaceConsent({
	restaurantId,
	onDone,
}: {
	restaurantId: string
	onDone: (result: { matched: boolean; guestProfileId: string | null } | null) => void
}) {
	const [agreed, setAgreed] = useState(false)
	const [busy, setBusy] = useState(false)
	const videoRef = useRef<HTMLVideoElement>(null)
	const streamRef = useRef<MediaStream | null>(null)

	async function startCamera() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true })
			streamRef.current = stream
			if (videoRef.current) videoRef.current.srcObject = stream
		} catch {
			onDone(null)
		}
	}

	function stopCamera() {
		streamRef.current?.getTracks().forEach((t) => t.stop())
		streamRef.current = null
	}

	async function capture() {
		if (!videoRef.current) return
		setBusy(true)
		try {
			const canvas = document.createElement("canvas")
			canvas.width = videoRef.current.videoWidth
			canvas.height = videoRef.current.videoHeight
			canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0)
			const blob = await new Promise<Blob | null>((res) =>
				canvas.toBlob(res, "image/jpeg", 0.85),
			)
			if (!blob) return onDone(null)
			const form = new FormData()
			form.append("image", blob)
			form.append("restaurantId", restaurantId)
			form.append("consent", "true")
			const res = await fetch("/api/face", { method: "POST", body: form })
			const data = await res.json()
			onDone({
				matched: Boolean(data.matched),
				guestProfileId: data.guestProfileId ?? null,
			})
		} catch {
			onDone(null)
		} finally {
			stopCamera()
			setBusy(false)
		}
	}

	return (
		<Card className="mb-4 border-dashed">
			<CardContent className="space-y-3 p-4">
				<p className="text-sm font-medium">
					Gợi ý chính xác hơn cho khách quen (tùy chọn)
				</p>
				<p className="text-xs text-muted-foreground">
					Chúng tôi có thể nhận diện để gợi ý theo lịch sử đặt món của bạn. Đây là
					dữ liệu sinh trắc học nhạy cảm; ảnh gốc KHÔNG được lưu trữ. Bạn có thể bỏ
					qua mà vẫn đặt món bình thường.
				</p>
				<label className="flex items-center gap-2 text-xs">
					<input
						type="checkbox"
						checked={agreed}
						onChange={(e) => {
							setAgreed(e.target.checked)
							if (e.target.checked) startCamera()
							else stopCamera()
						}}
					/>
					Tôi đồng ý cho phép quét khuôn mặt cho mục đích gợi ý món.
				</label>
				{agreed && (
					<video
						ref={videoRef}
						autoPlay
						playsInline
						muted
						className="aspect-video w-full rounded-md bg-black/5 object-cover"
					/>
				)}
				<div className="flex gap-2">
					<Button
						size="sm"
						disabled={!agreed || busy}
						onClick={capture}
					>
						{busy ? "Đang xử lý..." : "Quét & gợi ý"}
					</Button>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							stopCamera()
							onDone(null)
						}}
					>
						Bỏ qua
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
