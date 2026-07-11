import "server-only"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { publicEnv, serverEnv } from "@/lib/env"

/**
 * Service-role Supabase client. BYPASSES Row Level Security - equivalent to
 * full admin (Plan section 8.2). Only use in trusted server code (Route
 * Handlers / Server Actions) for operations that legitimately need to act
 * outside a user's RLS scope, e.g. anonymous guest order creation and
 * resolving a table by its QR token.
 *
 * The `server-only` import guarantees a build error if this is ever pulled
 * into a client bundle.
 */
export function createAdminClient() {
	return createClient<Database>(publicEnv.supabaseUrl, serverEnv.serviceRoleKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	})
}
