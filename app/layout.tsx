import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { manrope } from "@/styles/fonts"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { ActiveUserPushNotifications } from "@/components/ActiveUserPushNotifications"
import { Toaster } from "sonner"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ZuboPets - Your Pet's Best Friend, Always",
  description:
    "Connect with trusted pet sitters and caretakers for your beloved pets. Professional pet care services you can rely on.",
  keywords: "pet sitting, dog walking, pet care, pet sitters, animal care",
  authors: [{ name: "ZuboPets Team" }],
  manifest: "/manifest.json",
  themeColor: "#253347",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZuboPets",
  },
  openGraph: {
    title: "ZuboPets - Your Pet's Best Friend, Always",
    description: "Connect with trusted pet sitters and caretakers for your beloved pets.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZuboPets - Your Pet's Best Friend, Always",
    description: "Connect with trusted pet sitters and caretakers for your beloved pets.",
  },
  robots: {
    index: true,
    follow: true,
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
        <meta name="apple-mobile-web-app-title" content="ZuboPets" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#253347" />
      </head>
      <body className={manrope.className}>
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
