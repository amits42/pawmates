import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { ActiveUserPushNotifications } from "@/components/ActiveUserPushNotifications"
import { Toaster } from "sonner"

export const dynamic = "force-dynamic"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PetCare Booking",
  description: "Professional pet care booking app",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PetCare",
  },
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PetCare" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={inter.className}>
        <Toaster />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
          <AuthProvider>
            <ActiveUserPushNotifications vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""} />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
