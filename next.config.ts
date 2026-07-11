import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	// Required by the multi-stage Dockerfile (m.c 12.3): produce a standalone server.
	output: "standalone",
	reactStrictMode: true,
	images: {
		// Supabase Storage public URLs. Replace <project-ref> at deploy time or
		// rely on the NEXT_PUBLIC_SUPABASE_URL host being added dynamically.
		remotePatterns: [
			{ protocol: "https", hostname: "*.supabase.co" },
			{ protocol: "https", hostname: "*.supabase.in" },
		],
	},
	experimental: {
		// Server Actions are used by the owner/admin portals.
		serverActions: { bodySizeLimit: "5mb" },
	},
}

export default nextConfig
