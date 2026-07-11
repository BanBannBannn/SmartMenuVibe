"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { publicEnv } from "@/lib/env"

/**
 * Browser Supabase client. Uses only the public anon key, so it is always
 * subject to Row Level Security. Safe to import in client components.
 */
export function createClient() {
	return createBrowserClient<Database>(
		publicEnv.supabaseUrl,
		publicEnv.supabaseAnonKey,
	)
}
