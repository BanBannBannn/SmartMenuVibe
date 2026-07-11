import { NextResponse } from "next/server"
import { detectFace, identifyGuest, isIdentifyEnabled } from "@/lib/azure-face"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Face scan endpoint (Plan sections 3.6, 7.2, 8.3).
 * Body: multipart/form-data with `image` (blob), `restaurantId`, `consent`.
 * - Requires explicit consent=true. Never blocks ordering if it fails.
 * - Runs Detect always; runs Identify only when FACE_IDENTIFY_ENABLED=true.
 * - Logs the scan into face_scan_logs for transparency/audit.
 */
export async function POST(request: Request) {
	const form = await request.formData()
	const restaurantId = String(form.get("restaurantId") ?? "")
	const consent = String(form.get("consent") ?? "") === "true"
	const image = form.get("image")

	if (!restaurantId) {
		return NextResponse.json({ error: "MISSING_RESTAURANT" }, { status: 400 })
	}
	if (!consent) {
		// Consent is mandatory and must be explicit (section 8.3).
		return NextResponse.json({ error: "CONSENT_REQUIRED" }, { status: 403 })
	}
	if (!(image instanceof Blob)) {
		return NextResponse.json({ error: "MISSING_IMAGE" }, { status: 400 })
	}

	const buffer = await image.arrayBuffer()
	const detect = await detectFace(buffer)

	let matched = false
	let personId: string | undefined
	if (detect.faceDetected && detect.faceId && isIdentifyEnabled()) {
		const id = await identifyGuest(detect.faceId)
		matched = id.matched
		personId = id.personId
	}

	// Transparency log. We deliberately do NOT store the raw image.
	const db = createAdminClient()
	await db.from("face_scan_logs").insert({
		restaurant_id: restaurantId,
		matched,
		consent_given: true,
	})

	let guestProfileId: string | null = null
	if (matched && personId) {
		const { data } = await db
			.from("guest_profiles")
			.select("id")
			.eq("restaurant_id", restaurantId)
			.eq("face_person_id", personId)
			.maybeSingle()
		guestProfileId = data?.id ?? null
	}

	return NextResponse.json({
		faceDetected: detect.faceDetected,
		quality: detect.quality ?? null,
		identifyEnabled: isIdentifyEnabled(),
		matched,
		guestProfileId,
	})
}
