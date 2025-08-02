"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  User,
  Loader2,
  MessageCircle,
  HelpCircle,
  Repeat,
  CreditCard,
  AlertCircle,
  Search,
  Filter,
  Phone,
  CheckCircle,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { BookingDetailsDialog } from "@/components/booking-details-dialog"
import { RebookButton } from "@/components/rebook-button"
import type { Booking } from "@/types/api"
import { format } from "date-fns"
import { Toaster } from "@/components/ui/toaster"

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
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isLoadingChat, setIsLoadingChat] = useState(false)

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const searchParams = useSearchParams()
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

      const response = await fetch(`/api/bookings?userId=${encodeURIComponent(user.id)}`, {
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch bookings")
      }

      const data = await response.json()
      setBookings(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setError("Failed to load your bookings. Please try again.")
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

  const handleCardClick = (booking: Booking) => {
    router.push(`/booking-details/${booking.id}`)
  }

  const handleChatWithSitter = async (booking: Booking) => {
    if (!user?.phone) {
      toast({
        title: "Phone number required",
        description: "Please ensure your phone number is set in your profile",
        variant: "destructive",
      })
      return
    }

    const sitterPhone = booking.sitter_phone || booking.sitterPhone
    const sitterName = booking.sitter_name || booking.sitterName || booking.caretakerName

    if (!sitterPhone) {
      toast({
        title: "Sitter contact not available",
        description: "Sitter phone number is not available for this booking",
        variant: "destructive",
      })
      return
    }

    setIsLoadingChat(true)

    try {
      const chatData = {
        bookingId: booking.id.toString(),
        userPhone: user.phone,
        sitterPhone: sitterPhone,
        userAlias: user.name || "Pet Owner",
        sitterAlias: sitterName,
      }

      const response = await fetch("/api/whatsapp/setup-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatData),
      })

      const result = await response.json()

      if (response.ok) {
        if (result.message?.includes("already exists") || result.message?.includes("message sent")) {
          toast({
            title: "Message Sent! 📨",
            description: `Your message to ${sitterName} has been sent. Check your WhatsApp for updates!`,
          })
        } else {
          toast({
            title: "Chat Started! 🎉",
            description: `WhatsApp chat with ${sitterName} has been set up. Check your WhatsApp!`,
          })
        }
      } else {
        throw new Error(result.error || result.details || "Failed to start chat")
      }
    } catch (error) {
      console.error("❌ Error starting sitter chat:", error)
      toast({
        title: "Failed to start chat",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoadingChat(false)
    }
  }

  const getStatusBadge = (status: string, paymentStatus?: string, sitterId?: string, sitterName?: string) => {
    const statusConfig = {
      upcoming: {
        variant: "default" as const,
        icon: "⏳",
        color:
          "bg-zubo-primary-royal-midnight-blue-50 text-zubo-primary-royal-midnight-blue-700 border-zubo-primary-royal-midnight-blue-200",
      },
      confirmed: {
        variant: "default" as const,
        icon: "✅",
        color:
          "bg-zubo-accent-soft-moss-green-50 text-zubo-accent-soft-moss-green-700 border-zubo-accent-soft-moss-green-200",
      },
      pending: {
        variant: "outline" as const,
        icon: "⏳",
        color:
          "bg-zubo-highlight-2-bronze-clay-50 text-zubo-highlight-2-bronze-clay-700 border-zubo-highlight-2-bronze-clay-200",
      },
      ongoing: {
        variant: "secondary" as const,
        icon: "🔄",
        color:
          "bg-zubo-highlight-1-blush-coral-50 text-zubo-highlight-1-blush-coral-700 border-zubo-highlight-1-blush-coral-200",
      },
      "in-progress": {
        variant: "secondary" as const,
        icon: "🔄",
        color:
          "bg-zubo-highlight-1-blush-coral-50 text-zubo-highlight-1-blush-coral-700 border-zubo-highlight-1-blush-coral-200",
      },
      completed: {
        variant: "outline" as const,
        icon: "✅",
        color:
          "bg-zubo-accent-soft-moss-green-50 text-zubo-accent-soft-moss-green-700 border-zubo-accent-soft-moss-green-200",
      },
      cancelled: {
        variant: "destructive" as const,
        icon: "❌",
        color: "bg-red-50 text-red-700 border-red-200",
      },
      usercancelled: {
        variant: "destructive" as const,
        icon: "❌",
        color: "bg-red-50 text-red-700 border-red-200",
      },
      assigned: {
        variant: "default" as const,
        icon: "👤",
        color:
          "bg-zubo-primary-royal-midnight-blue-50 text-zubo-primary-royal-midnight-blue-700 border-zubo-primary-royal-midnight-blue-200",
      },
    }

    const normalizedStatus = status?.toLowerCase() || "pending"
    const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.pending

    let displayStatus = status?.charAt(0).toUpperCase() + status?.slice(1) || "Pending"

    if (normalizedStatus === "usercancelled") {
      displayStatus = "Cancelled by You"
    } else if (normalizedStatus === "pending" && !sitterId) {
      displayStatus = "Sitter Unassigned"
    } else if (normalizedStatus === "assigned" && sitterId) {
      displayStatus = "Sitter Assigned"
    }

    return (
      <Badge className={`${config.color} font-medium px-3 py-1 text-sm`}>
        <span className="mr-1">{config.icon}</span>
        {displayStatus}
      </Badge>
    )
  }

  const getServiceIcon = (service: string) => {
    const serviceIcons: { [key: string]: string } = {
      "dog walking": "🚶‍♂️",
      "dog walking1": "🚶‍♂️",
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
        filtered = filtered.filter((b) => ["ongoing", "in-progress"].includes(b.status?.toLowerCase() || ""))
      } else if (statusFilter === "past") {
        filtered = filtered.filter((b) =>
          ["completed", "cancelled", "usercancelled"].includes(b.status?.toLowerCase() || ""),
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

  const handlePayNow = (bookingId: string) => {
    router.push(`/book-service/payment?bookingId=${bookingId}&payExisting=true`)
  }

  const handleGetHelp = (bookingId: string) => {
    router.push(`/support?bookingId=${bookingId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zubo-background-porcelain-white-300">
        <div className="container mx-auto p-4 pb-20">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-zubo-primary-royal-midnight-blue-600" />
              <h3 className="text-lg font-semibold text-zubo-text-graphite-gray-800 mb-2">Loading your bookings</h3>
              <p className="text-sm text-zubo-text-graphite-gray-600">Please wait...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zubo-background-porcelain-white-300">
        <div className="container mx-auto p-4 pb-20">
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zubo-background-porcelain-white-300">
      <div className="container mx-auto p-4 pb-20 max-w-6xl">
        {/* ✅ Success Popup */}
        {showSuccessModal && (
          <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-zubo-accent-soft-moss-green-700">
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
                    <p className="flex items-center gap-1 text-sm mt-2 text-zubo-text-graphite-gray-700">
                      <Phone className="h-4 w-4" /> Confirmation sent to WhatsApp.
                    </p>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex justify-between gap-2">
                <Button onClick={handleCloseSuccessModal} variant="outline" className="w-full bg-transparent">
                  Close
                </Button>
                <Button
                  onClick={handleViewBooking}
                  className="bg-zubo-accent-soft-moss-green-600 hover:bg-zubo-accent-soft-moss-green-700 text-white w-full"
                >
                  View Booking
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <h1 className="text-3xl font-bold text-zubo-text-graphite-gray-900 mb-6">My Bookings</h1>

        {/* Search and Filter */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zubo-text-graphite-gray-400" />
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
                count: bookings.filter((b) =>
                  ["completed", "cancelled", "usercancelled"].includes(b.status?.toLowerCase() || ""),
                ).length,
              },
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={statusFilter === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(filter.key)}
                className={`whitespace-nowrap text-xs h-8 px-3 ${
                  statusFilter === filter.key
                    ? "bg-zubo-primary-royal-midnight-blue-600 text-white hover:bg-zubo-primary-royal-midnight-blue-700" // Updated color for prominence
                    : "border-zubo-primary-royal-midnight-blue-200 text-zubo-primary-royal-midnight-blue hover:bg-zubo-primary-royal-midnight-blue-50"
                }`}
              >
                <Filter className="mr-1 h-3 w-3" />
                {filter.label} ({filter.count})
              </Button>
            ))}
          </div>
        </div>

        {filteredBookings.length === 0 && !loading && !error ? (
          <div className="flex flex-col items-center justify-center py-12 bg-zubo-background-porcelain-white-50 rounded-lg shadow-sm border border-zubo-background-porcelain-white-200">
            <Calendar className="h-12 w-12 text-zubo-text-graphite-gray-400 mb-4" />
            <p className="text-lg font-semibold text-zubo-text-graphite-gray-700 mb-2">
              {searchQuery || statusFilter !== "all" ? "No matching bookings" : "No Bookings Yet"}
            </p>
            <p className="text-sm text-zubo-text-graphite-gray-500 mb-6 text-center">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "It looks like you haven't made any bookings. Let's get your first service scheduled!"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button
                onClick={() => router.push("/book-service")}
                className="bg-zubo-primary-royal-midnight-blue-600 hover:bg-zubo-primary-royal-midnight-blue-700 text-zubo-background-porcelain-white-50"
              >
                Book a Service
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => {
              const sitterName = booking.sitter_name || booking.sitterName || booking.caretakerName
              const hasSitterAssigned =
                booking.sitterId &&
                sitterName &&
                sitterName.trim() !== "" &&
                sitterName.toLowerCase() !== "to be assigned" &&
                sitterName.toLowerCase() !== "sitter not assigned"

              const showChatButton = [
                "upcoming",
                "confirmed",
                "pending",
                "assigned",
                "ongoing",
                "in-progress",
              ].includes(booking.status?.toLowerCase() || "")
              const showRebookButton = ["completed", "cancelled", "usercancelled"].includes(
                booking.status?.toLowerCase() || "",
              )

              return (
                <Card
                  key={booking.id}
                  className="overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleCardClick(booking)}
                >
                  <CardHeader className="p-4 border-b border-zubo-background-porcelain-white-200 bg-zubo-background-porcelain-white-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-zubo-text-graphite-gray-900 flex items-center gap-2">
                        <span className="text-xl">{getServiceIcon(booking.serviceName || "pet care")}</span>
                        {booking.serviceName || "Pet Care"}
                      </CardTitle>
                      {getStatusBadge(booking.status || "pending", booking.paymentStatus, booking.sitterId, sitterName)}
                    </div>
                    <p className="text-sm text-zubo-text-graphite-gray-600 mt-1">Booking ID: #{booking.id.slice(-8)}</p>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-zubo-text-graphite-gray-700">
                      <Calendar className="h-4 w-4 text-zubo-primary-royal-midnight-blue-600" />
                      <span>{format(new Date(booking.date), "PPP")}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zubo-text-graphite-gray-700">
                      <Clock className="h-4 w-4 text-zubo-accent-soft-moss-green-600" />
                      <span>{booking.time || "Not scheduled"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zubo-text-graphite-gray-700">
                      <DollarSign className="h-4 w-4 text-zubo-highlight-2-bronze-clay-600" />
                      <span>₹{booking.totalPrice?.toFixed(2) || "0.00"}</span>
                      {booking.paymentStatus === "PENDING" ? (
                        <Badge className="bg-zubo-highlight-2-bronze-clay-50 text-zubo-highlight-2-bronze-clay-700 border-zubo-highlight-2-bronze-clay-200 font-medium px-2 py-0.5 text-xs">
                          Unpaid
                        </Badge>
                      ) : (
                        <Badge className="bg-zubo-accent-soft-moss-green-50 text-zubo-accent-soft-moss-green-700 border-zubo-accent-soft-moss-green-200 font-medium px-2 py-0.5 text-xs">
                          Paid
                        </Badge>
                      )}
                    </div>
                    {booking.recurring && (
                      <div className="flex items-center gap-3 text-sm text-zubo-text-graphite-gray-700">
                        <Repeat className="h-4 w-4 text-zubo-highlight-1-blush-coral-600" />
                        <span>Recurring Service</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm text-zubo-text-graphite-gray-700">
                      <User className="h-4 w-4 text-zubo-primary-royal-midnight-blue-600" />
                      <span>
                        Sitter:{" "}
                        <span className="font-medium">
                          {sitterName || "To be assigned"}
                          {booking.sitterId && !sitterName && (
                            <span className="text-zubo-highlight-2-bronze-clay-600 text-sm ml-1">(Loading...)</span>
                          )}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zubo-text-graphite-gray-700">
                      <MapPin className="h-4 w-4 text-zubo-highlight-1-blush-coral-600" />
                      <span>{booking.addressId || "Address not specified"}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3">
                      {booking.paymentStatus === "PENDING" && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePayNow(booking.id)
                          }}
                          className="bg-zubo-primary-royal-midnight-blue-600 hover:bg-zubo-primary-royal-midnight-blue-700 text-zubo-background-porcelain-white-50 text-xs"
                        >
                          <CreditCard className="mr-1 h-3 w-3" />
                          Pay Now
                        </Button>
                      )}
                      {showChatButton && hasSitterAssigned && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleChatWithSitter(booking)
                          }}
                          disabled={isLoadingChat}
                          className="border-zubo-accent-soft-moss-green-300 text-zubo-accent-soft-moss-green-600 hover:bg-zubo-accent-soft-moss-green-50 bg-transparent text-xs"
                        >
                          {isLoadingChat ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Chatting...
                            </>
                          ) : (
                            <>
                              <MessageCircle className="mr-1 h-3 w-3" />
                              Chat
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGetHelp(booking.id)
                        }}
                        className="border-zubo-primary-royal-midnight-blue-300 text-zubo-primary-royal-midnight-blue-600 hover:bg-zubo-primary-royal-midnight-blue-50 bg-transparent text-xs"
                      >
                        <HelpCircle className="mr-1 h-3 w-3" />
                        Help
                      </Button>
                      {showRebookButton && <RebookButton booking={booking} size="sm" className="text-xs" />}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
      <BookingDetailsDialog
        booking={selectedBooking}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        getStatusBadge={getStatusBadge}
        getServiceIcon={getServiceIcon}
        router={router}
        user={user}
        showChatButton={true} // This dialog is for details, chat button logic is handled internally
      />
      <Toaster />
    </div>
  )
}
