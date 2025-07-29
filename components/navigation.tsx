"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Home, Calendar, PlusCircle, User, HeadphonesIcon, LogOut, ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"

const navItems = [
  { href: "/landing", label: "Home", icon: Home },
  { href: "/book-service", label: "Book", icon: PlusCircle },
  { href: "/my-bookings", label: "Bookings", icon: Calendar },
]

export default function Navigation() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Only hide navigation on login or onboarding pages
  if (pathname === "/login" || pathname === "/onboarding") {
    return null
  }

  const handleLogout = () => {
    console.log("🚪 Logout clicked")
    logout()
  }

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.phone) {
      return user.phone.slice(-2)
    }
    return "U"
  }

  const toggleDropdown = () => {
    console.log("🔄 Toggling dropdown:", !isDropdownOpen)
    setIsDropdownOpen(!isDropdownOpen)
  }

  const closeDropdown = () => {
    setIsDropdownOpen(false)
  }

  return (
    <>
      {/* Top navigation for desktop */}
      <header className="hidden md:block border-b bg-white shadow-sm sticky top-0 z-40">
        <div className="container flex h-16 items-center px-4">
          <Link
            href="/landing"
            className="mr-4 font-bold text-2xl text-blue-800 flex items-center hover:opacity-80 transition-opacity"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-6 w-6 text-blue-600"
            >
              <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5" />
              <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5" />
              <path d="M8 14v.5" />
              <path d="M16 14v.5" />
              <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />
              <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306" />
            </svg>
            PetCare
          </Link>

          {/* Main Navigation - 3 items */}
          <nav className="flex items-center space-x-6 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? "text-blue-600 bg-blue-100" : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Profile Section */}
          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden lg:block">
                Welcome, {user.name || user.phone?.replace("+", "")}!
              </span>

              {/* Custom Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-medium text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-10" onClick={closeDropdown} />

                    {/* Dropdown Content */}
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-medium text-gray-900">{user.name || "User"}</p>
                        <p className="text-sm text-gray-500">{user.phone}</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={closeDropdown}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <User className="mr-3 h-4 w-4" />
                          Profile
                        </Link>
                        <Link
                          href="/support"
                          onClick={closeDropdown}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <HeadphonesIcon className="mr-3 h-4 w-4" />
                          Support & Help
                        </Link>
                        <hr className="my-1 border-gray-200" />
                        <button
                          onClick={() => {
                            closeDropdown()
                            handleLogout()
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Bottom navigation for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 md:hidden">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  isActive ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}

          {/* Mobile Profile Button */}
          <button
            onClick={toggleDropdown}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              isDropdownOpen ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-blue-600"
            }`}
          >
            <div className="relative">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="bg-blue-100 text-blue-600 font-medium text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs font-medium mt-1">Profile</span>
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={closeDropdown} />

            {/* Mobile Dropdown Content */}
            <div className="absolute bottom-16 right-4 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-medium text-gray-900">{user?.name || "User"}</p>
                <p className="text-sm text-gray-500">{user?.phone}</p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={closeDropdown}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <User className="mr-3 h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/support"
                  onClick={closeDropdown}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <HeadphonesIcon className="mr-3 h-4 w-4" />
                  Support & Help
                </Link>
                <hr className="my-1 border-gray-200" />
                <button
                  onClick={() => {
                    closeDropdown()
                    handleLogout()
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </nav>
    </>
  )
}
