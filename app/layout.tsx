import type React from "react"
import type { Metadata } from "next"
import { manrope } from "@/styles/fonts"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import Navigation from "@/components/navigation"
import { Toaster } from "@/components/ui/toaster"
import PushNotificationsClient from "@/components/PushNotificationsClient"

export const metadata: Metadata = {
  title: "ZuboPets - Your Pet's Best Friend, Always",
  description:
    "Connect with trusted pet sitters and caretakers for your beloved pets. Professional pet care services you can rely on.",
  keywords: "pet sitting, dog walking, pet care, pet sitters, animal care",
  authors: [{ name: "ZuboPets Team" }],
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
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <Navigation />
              <main className="pb-16 md:pb-0">{children}</main>
              <Toaster />
              <PushNotificationsClient />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
