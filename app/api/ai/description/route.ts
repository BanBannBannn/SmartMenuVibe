import { NextResponse } from "next/server"
import { z } from "zod"
import { suggestDishDescription, llmAvailability } from "@/lib/llm"
import { getSessionUser } from "@/lib/auth"

const schema = z.object({
	name: z.string().min(1).max(120),
	ingredients: z.string().max(300).optional().default(""),
})

// AI helper for the Menu Builder (Plan section 3.4). Auth-gated: only logged-in
// owners/staff may call it. Falls back gracefully when no LLM key is set.
export async function POST(request: Request) {
	const user = await getSessionUser()
	if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

	const parsed = schema.safeParse(await request.json().catch(() => null))
	if (!parsed.success)
		return NextResponse.json({ error: "VALIDATION" }, { status: 422 })

	const result = await suggestDishDescription(
		parsed.data.name,
		parsed.data.ingredients,
	)
	return NextResponse.json({ ...result, aiEnabled: llmAvailability().enabled })
}
