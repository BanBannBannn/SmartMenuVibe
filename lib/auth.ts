import { createClient } from "@/lib/supabase/server"
import type { AppRole } from "@/types/database"

export type SessionUser = {
	id: string
	email: string | null
	role: AppRole
	fullName: string | null
}

/** Return the current authenticated user + profile role, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
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
}

/** List restaurant ids the user can access (owner or staff). */
export async function getAccessibleRestaurantIds(
	userId: string,
): Promise<string[]> {
	const supabase = await createClient()
	const [{ data: owned }, { data: staffed }] = await Promise.all([
		supabase.from("restaurants").select("id").eq("owner_id", userId),
		supabase.from("restaurant_staff").select("restaurant_id").eq("user_id", userId),
	])
	const ids = new Set<string>()
	owned?.forEach((r) => ids.add(r.id))
	staffed?.forEach((r) => ids.add(r.restaurant_id))
	return [...ids]
}
