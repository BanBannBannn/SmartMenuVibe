import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/types/database"
import { publicEnv } from "@/lib/env"

/**
 * Refreshes the Supabase auth session on every request and guards the
 * authenticated portals. Called from the root middleware.ts.
 */
export async function updateSession(request: NextRequest) {
	let response = NextResponse.next({ request })

	const supabase = createServerClient<Database>(
		publicEnv.supabaseUrl,
		publicEnv.supabaseAnonKey,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll()
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value),
					)
					response = NextResponse.next({ request })
					cookiesToSet.forEach(({ name, value, options }) =>
						response.cookies.set(name, value, options),
					)
				},
			},
		},
	)

	const {
		data: { user },
	} = await supabase.auth.getUser()

	const path = request.nextUrl.pathname
	const isProtected =
		path.startsWith("/dashboard") || path.startsWith("/admin")

	if (isProtected && !user) {
		const url = request.nextUrl.clone()
		url.pathname = "/login"
		url.searchParams.set("redirect", path)
		return NextResponse.redirect(url)
	}

	return response
}
