import "server-only"
import { serverEnv } from "@/lib/env"

/**
 * Azure Face API wrapper (Plan section 7.2).
 *
 * IMPORTANT limits (verified from Microsoft docs, 07/2026):
 *  - Detect: usable immediately, no approval required.
 *  - Identify/Verify (recognise a returning guest): requires Microsoft approval
 *    via the Face Recognition intake form. Gated behind FACE_IDENTIFY_ENABLED.
 *  - Age/gender/emotion inference: retired or heavily restricted -> NOT used.
 *
 * All methods degrade gracefully so the guest ordering flow is never blocked
 * if Face is unavailable (Plan sections 3.6 & 8.3).
 */

export type FaceDetectResult = {
	faceDetected: boolean
	faceId?: string
	quality?: "low" | "medium" | "high"
}

export type FaceIdentifyResult = {
	matched: boolean
	personId?: string
	confidence?: number
}

function headers() {
	return {
		"Ocp-Apim-Subscription-Key": serverEnv.azureFace.key,
		"Content-Type": "application/octet-stream",
	}
}

/** Detect whether a usable face is present. Only used to confirm the guest is
 * looking at the camera and image quality is acceptable. */
export async function detectFace(image: ArrayBuffer): Promise<FaceDetectResult> {
	const { key, endpoint } = serverEnv.azureFace
	if (!key || !endpoint) return { faceDetected: false }
	try {
		const url =
			`${endpoint}/face/v1.0/detect` +
			`?returnFaceId=true&recognitionModel=recognition_04&detectionModel=detection_03` +
			`&returnFaceAttributes=qualityForRecognition`
		const res = await fetch(url, {
			method: "POST",
			headers: headers(),
			body: image,
		})
		if (!res.ok) return { faceDetected: false }
		const faces = (await res.json()) as Array<{
			faceId?: string
			faceAttributes?: { qualityForRecognition?: "low" | "medium" | "high" }
		}>
		if (!faces.length) return { faceDetected: false }
		return {
			faceDetected: true,
			faceId: faces[0].faceId,
			quality: faces[0].faceAttributes?.qualityForRecognition,
		}
	} catch {
		return { faceDetected: false }
	}
}

/**
 * Identify a returning guest. Returns { matched:false } immediately unless
 * FACE_IDENTIFY_ENABLED=true (i.e. Microsoft approved and configured). This is
 * the feature-flag pattern required by Plan section 7.2 so enabling it later
 * needs no architecture change.
 */
export async function identifyGuest(
	faceId: string,
): Promise<FaceIdentifyResult> {
	const { key, endpoint, identifyEnabled, personGroup } = serverEnv.azureFace
	if (!identifyEnabled || !key || !endpoint) return { matched: false }
	try {
		const res = await fetch(`${endpoint}/face/v1.0/identify`, {
			method: "POST",
			headers: { ...headers(), "Content-Type": "application/json" },
			body: JSON.stringify({
				personGroupId: personGroup,
				faceIds: [faceId],
				maxNumOfCandidatesReturned: 1,
				confidenceThreshold: 0.6,
			}),
		})
		if (!res.ok) return { matched: false }
		const data = (await res.json()) as Array<{
			candidates: { personId: string; confidence: number }[]
		}>
		const candidate = data[0]?.candidates?.[0]
		if (!candidate) return { matched: false }
		return {
			matched: true,
			personId: candidate.personId,
			confidence: candidate.confidence,
		}
	} catch {
		return { matched: false }
	}
}

export function isIdentifyEnabled(): boolean {
	return serverEnv.azureFace.identifyEnabled
}
