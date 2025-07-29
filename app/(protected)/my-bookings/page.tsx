"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Phone,
  ChevronRight,
  CreditCard,
  Repeat,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Booking } from "@/types/api"

const formatDate = (dateString: string) => {
  if (!dateString) return "Not scheduled"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  } catch (error) {
    return dateString
  }
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  // ✅ Success popup state
  const success = searchParams?.get("success") === "true"
  const bookingId = searchParams?.get("bookingId")
  const payLater = searchParams?.get("payLater")
  const [showSuccessModal, setShowSuccessModal] = useState(success && bookingId)

  useEffect(() => {
    if (user?.id) {
      fetchBookings()
    }
  }, [user])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id) throw new Error("User not authenticated")

      const url = `/api/bookings?userId=${encodeURIComponent(user.id)}`
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
      })

      if (!response.ok) throw new Error("Failed to fetch bookings")

      const data = await response.json()
      setBookings(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setError("Failed to load bookings. Please try again.")
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    // ✅ Remove query params from URL
    router.replace("/my-bookings")
  }

  const handleViewBooking = () => {
    router.push(`/booking-details/${bookingId}`)
    handleCloseSuccessModal()
  }

  const getStatusBadge = (status: string, paymentStatus?: string) => {
    const statusConfig = {
      upcoming: { icon: "⏳", color: "bg-blue-50 text-blue-700 border-blue-200" },
      confirmed: { icon: "✅", color: "bg-green-50 text-green-700 border-green-200" },
      pending: { icon: "⏳", color: "bg-amber-50 text-amber-700 border-amber-200" },
      ongoing: { icon: "🔄", color: "bg-orange-50 text-orange-700 border-orange-200" },
      "in-progress": { icon: "🔄", color: "bg-orange-50 text-orange-700 border-orange-200" },
      completed: { icon: "✅", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      cancelled: { icon: "❌", color: "bg-red-50 text-red-700 border-red-200" },
      assigned: { icon: "👤", color: "bg-purple-50 text-purple-700 border-purple-200" },
    }

    const normalizedStatus = status?.toLowerCase() || "pending"
    const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge className={`${config.color} font-medium px-2 py-0.5 text-xs`}>
        <span className="mr-1">{config.icon}</span>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || "Pending"}
      </Badge>
    )
  }

  const getServiceIcon = (service: string) => {
    const serviceIcons: { [key: string]: string } = {
      "dog walking": "🚶‍♂️",
      "pet sitting": "🏠",
      grooming: "✂️",
      "pet grooming": "✂️",
      veterinary: "🏥",
      training: "🎓",
      boarding: "🏨",
    }
    return serviceIcons[service?.toLowerCase()] || "🐾"
  }

  const filteredBookings = useMemo(() => {
    let filtered = bookings

    if (statusFilter !== "all") {
      if (statusFilter === "upcoming") {
        filtered = filtered.filter((b) =>
          ["upcoming", "confirmed", "pending", "assigned"].includes(b.status?.toLowerCase() || ""),
        )
      } else if (statusFilter === "ongoing") {
        filtered = filtered.filter((b) =>
          ["ongoing", "in-progress"].includes(b.status?.toLowerCase() || ""),
        )
      } else if (statusFilter === "past") {
        filtered = filtered.filter((b) =>
          ["completed", "cancelled"].includes(b.status?.toLowerCase() || ""),
        )
      } else {
        filtered = filtered.filter((b) => b.status?.toLowerCase() === statusFilter)
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.serviceName?.toLowerCase().includes(query) ||
          b.petName?.toLowerCase().includes(query) ||
          b.id.toString().includes(query),
      )
    }

    return filtered.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
  }, [bookings, statusFilter, searchQuery])

  const handleBookingClick = (booking: Booking) => {
    router.push(`/booking-details/${booking.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="container mx-auto p-3 pb-16">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Loading bookings</h3>
              <p className="text-xs text-gray-600">Please wait...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto p-3 pb-16">

        {/* ✅ Success Popup */}
        {showSuccessModal && (
          <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Booking Confirmed 🎉
                </DialogTitle>
                <DialogDescription>
                  {payLater === "true"
                    ? "Your booking has been created. Complete payment to confirm."
                    : "Your booking has been confirmed successfully."}
                  <br />
                  <span className="font-medium">Booking ID: {bookingId}</span>
                  {payLater !== "true" && (
                    <p className="flex items-center gap-1 text-sm mt-2 text-gray-700">
                      <Phone className="h-4 w-4" /> Confirmation sent to WhatsApp.
                    </p>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex justify-between gap-2">
                <Button
                  onClick={handleCloseSuccessModal}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
                <Button
                  onClick={handleViewBooking}
                  className="bg-green-600 hover:bg-green-700 text-white w-full"
                >
                  View Booking
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              My Bookings
            </h1>
          </div>
          <p className="text-sm text-gray-600">Track your pet care appointments</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm h-9"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: "all", label: "All", count: bookings.length },
              {
                key: "upcoming",
                label: "Upcoming",
                count: bookings.filter((b) =>
                  ["upcoming", "confirmed", "pending", "assigned"].includes(b.status?.toLowerCase() || ""),
                ).length,
              },
              {
                key: "ongoing",
                label: "Ongoing",
                count: bookings.filter((b) => ["ongoing", "in-progress"].includes(b.status?.toLowerCase() || ""))
                  .length,
              },
              {
                key: "past",
                label: "Past",
                count: bookings.filter((b) => ["completed", "cancelled"].includes(b.status?.toLowerCase() || ""))
                  .length,
              },
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={statusFilter === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(filter.key)}
                className="whitespace-nowrap text-xs h-8 px-3"
              >
                <Filter className="mr-1 h-3 w-3" />
                {filter.label} ({filter.count})
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchBookings}
                  className="text-red-600 border-red-300 text-xs h-7 bg-transparent"
                >
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Bookings List */}
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <Card
              key={booking.id}
              className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${booking.recurring ? "border-l-purple-500" : "border-l-blue-500"
                }`}
              onClick={() => handleBookingClick(booking)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <span className="text-lg">{getServiceIcon(booking.serviceName || "pet care")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm truncate">
                            {booking.serviceName || "Pet Care Service"}
                          </h3>
                          {booking.recurring && (
                            <Repeat className="h-3 w-3 text-purple-600" title="Recurring booking" />
                          )}
                        </div>
                        {getStatusBadge(booking.status || "pending", booking.paymentStatus)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(booking.date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{booking.time || "TBD"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">${booking.totalPrice?.toFixed(2) || "0.00"}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500 truncate">
                          Pet: {booking.petName || "Not specified"} • ID: #{booking.id.toString().slice(-6)}
                          {booking.recurring && <span className="text-purple-600 ml-1">• Recurring</span>}
                        </p>
                        {booking.paymentStatus === "PENDING" && !booking.recurring && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6 px-2 text-amber-600 border-amber-300 hover:bg-amber-50 bg-transparent"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Redirect to payment page with booking details
                              router.push(`/book-service/payment?bookingId=${booking.id}&payExisting=true`)
                            }}
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            Pay Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredBookings.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🐾</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {searchQuery || statusFilter !== "all" ? "No matching bookings" : "No bookings yet"}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filter"
                : "Ready to book your first pet care service?"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button
                onClick={() => (window.location.href = "/book-service")}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-6 py-2 text-sm font-semibold rounded-lg"
              >
                Book a Service
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
