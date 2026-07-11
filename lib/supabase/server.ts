import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"
import { publicEnv } from "@/lib/env"

/**
 * Server Supabase client bound to the request cookies. Runs with the logged-in
 * user's session and is subject to RLS. Use in Server Components / Route
 * Handlers / Server Actions.
 */
export async function createClient() {
	const cookieStore = await cookies()
	return createServerClient<Database>(
		publicEnv.supabaseUrl,
		publicEnv.supabaseAnonKey,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll()
				},
				setAll(cookiesToSet) {
					try {
						cookiesToSet.forEach(({ name, value, options }) =>
							cookieStore.set(name, value, options),
						)
					} catch {
						// Called from a Server Component - safe to ignore, middleware refreshes.
					}
				},
			},
		},
	)
}
