import type { NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
	return updateSession(request)
}

export const config = {
	// Only routes that read the Supabase session. Public guest pages (QR menu,
	// showcase), the landing page and guest APIs skip middleware entirely, which
	// saves a Supabase Auth round-trip on every QR scan. Server actions post to
	// the page they live on, so /login and /register cover the auth actions.
	matcher: [
		"/dashboard/:path*",
		"/admin/:path*",
		"/login",
		"/register",
		"/auth/:path*",
		"/api/ai/:path*",
	],
}
