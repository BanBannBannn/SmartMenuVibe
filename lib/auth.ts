import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import type { AppRole } from "@/types/database"

export type SessionUser = {
	id: string
	email: string | null
	role: AppRole
	fullName: string | null
}

/**
 * Return the current authenticated user + profile role, or null.
 * React cache only deduplicates calls inside the current server render. It does
 * not persist or share private session data between requests or users.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return null

	const { data: profile } = await supabase
		.from("profiles")
		.select("role, full_name")
		.eq("id", user.id)
		.single()

	return {
		id: user.id,
		email: user.email ?? null,
		role: (profile?.role ?? "owner") as AppRole,
		fullName: profile?.full_name ?? null,
	}
})

/** List restaurant ids the user can access (owner or staff). */
export async function getAccessibleRestaurantIds(
	userId: string,
): Promise<string[]> {
	const supabase = await createClient()
	const [{ data: owned }, { data: staffed }] = await Promise.all([
		supabase.from("restaurants").select("id").eq("owner_id", userId),
		supabase
			.from("restaurant_staff")
			.select("restaurant_id")
			.eq("user_id", userId),
	])
	const ids = new Set<string>()
	owned?.forEach((restaurant) => ids.add(restaurant.id))
	staffed?.forEach((restaurant) => ids.add(restaurant.restaurant_id))
	return [...ids]
}
