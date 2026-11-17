import "server-only"
import { NextResponse } from "next/server"
import { GeminiError } from "@/lib/llm/gemini"

/** Map a failed AI call to the JSON error the menu UIs understand. */
export function aiErrorResponse(err: unknown, tag: string) {
	if (err instanceof GeminiError) {
		if (err.code === "DISABLED")
			return NextResponse.json({ error: "AI_DISABLED" }, { status: 503 })
		if (err.code === "QUOTA")
			return NextResponse.json({ error: "AI_QUOTA" }, { status: 429 })
		return NextResponse.json({ error: "AI_UNAVAILABLE" }, { status: 502 })
	}
	console.error(`[${tag}]`, err)
	return NextResponse.json({ error: "AI_UNAVAILABLE" }, { status: 502 })
}
