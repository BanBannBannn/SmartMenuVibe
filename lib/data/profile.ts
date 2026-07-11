import "server-only"
import { cache } from "react"
import { getSessionUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import type { AppRole } from "@/types/database"

export type OwnerProfile = {
	id: string
	email: string | null
	fullName: string | null
	phone: string | null
	avatarUrl: string | null
	role: AppRole
}

/** Current profile, deduplicated inside one server-render request. */
export const getCurrentProfile = cache(
	async (): Promise<OwnerProfile | null> => {
		const user = await getSessionUser()
		if (!user) return null

		const supabase = await createClient()
		const { data: profile } = await supabase
			.from("profiles")
			.select("id, email, full_name, phone, avatar_url, role")
			.eq("id", user.id)
			.maybeSingle()

		if (!profile) {
			return {
				id: user.id,
				email: user.email,
				fullName: user.fullName,
				phone: null,
				avatarUrl: null,
				role: user.role,
			}
		}

		return {
			id: profile.id,
			email: profile.email ?? user.email,
			fullName: profile.full_name,
			phone: profile.phone,
			avatarUrl: profile.avatar_url,
			role: profile.role as AppRole,
		}
	},
)
