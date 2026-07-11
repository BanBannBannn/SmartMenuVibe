import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-sans" })

export const metadata: Metadata = {
	title: "SmartMenu — Menu số & đặt món thông minh",
	description:
		"Nền tảng SaaS quản lý nhà hàng, menu số và gợi ý món ăn cá nhân hoá.",
	manifest: "/manifest.json",
}

export const viewport: Viewport = {
	themeColor: "#f97316",
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="vi" className={inter.variable} suppressHydrationWarning>
			<body className="font-sans antialiased">
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
