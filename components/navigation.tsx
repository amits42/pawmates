"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X, Home, Calendar, MessageCircle, User, Heart, Settings } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, sitter, logout } = useAuth()
  const pathname = usePathname()

  const isAuthenticated = user || sitter
  const isSitterRoute = pathname?.startsWith("/sitter")

  const userNavItems = [
    { href: "/landing", label: "Home", icon: Home },
    { href: "/book-service", label: "Book Service", icon: Calendar },
    { href: "/my-bookings", label: "My Bookings", icon: Calendar },
    { href: "/profile", label: "Profile", icon: User },
  ]

  const sitterNavItems = [
    { href: "/sitter", label: "Dashboardss", icon: Home },
    { href: "/sitter/bookings", label: "Bookings", icon: Calendar },
    { href: "/sitter/wallet", label: "Wallet", icon: Heart },
    { href: "/sitter/profile", label: "Profile", icon: Settings },
  ]

  const navItems = isSitterRoute ? sitterNavItems : userNavItems

  if (!isAuthenticated) {
    return (
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Image src="/logo/zubo-logo.svg" alt="ZuboPets" width={120} height={40} className="h-8 w-auto" priority />
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
              </Link>
            </div>
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col space-y-4 mt-8">
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={isSitterRoute ? "/sitter" : "/home"} className="flex items-center">
              <Image src="/logo/zubo-logo.svg" alt="ZuboPets" width={120} height={40} className="h-8 w-auto" priority />
            </Link>
            <div className="flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === item.href
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                    }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
              <Button onClick={logout} variant="ghost" className="text-gray-700 hover:text-red-600">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${pathname === item.href
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
                }`}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
          <Button
            onClick={logout}
            variant="ghost"
            className="flex flex-col items-center justify-center p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Logout</span>
          </Button>
        </div>
      </div>
    </>
  )
}
