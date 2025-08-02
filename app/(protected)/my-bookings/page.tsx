"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { BookingDetailsDialog } from "@/components/booking-details-dialog"
import { RebookButton } from "@/components/rebook-button"
import type { Booking } from "@/types/api"
import { format } from "date-fns"
import { Toaster } from "@/components/ui/toaster"

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

  useEffect(() => {
    if (user?.id) {
      fetchBookings()
    }
  }, [user])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/bookings?userId=${encodeURIComponent(user.id)}`, {
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch bookings")
      }

      const data = await response.json()
      // Sort bookings by date, upcoming first
      const sortedBookings = data.sort((a: Booking, b: Booking) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateA - dateB
      })
      setBookings(sortedBookings)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setError("Failed to load your bookings. Please try again.")
    } finally {
      setLoading(false)
    }
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
        color: "bg-destructive text-destructive-foreground border-destructive",
      },
      usercancelled: {
        variant: "destructive" as const,
        icon: "❌",
        color: "bg-destructive text-destructive-foreground border-destructive",
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
          <Alert className="border-destructive bg-destructive/10 max-w-md mx-auto">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zubo-background-porcelain-white-300">
      <div className="container mx-auto p-4 pb-20 max-w-6xl">
        <h1 className="text-3xl font-bold text-zubo-text-graphite-gray-900 mb-6">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-zubo-background-porcelain-white-50 rounded-lg shadow-sm border border-zubo-background-porcelain-white-200">
            <Calendar className="h-12 w-12 text-zubo-text-graphite-gray-400 mb-4" />
            <p className="text-lg font-semibold text-zubo-text-graphite-gray-700 mb-2">No Bookings Yet</p>
            <p className="text-sm text-zubo-text-graphite-gray-500 mb-6 text-center">
              It looks like you haven't made any bookings. Let's get your first service scheduled!
            </p>
            <Button
              onClick={() => router.push("/book-service")}
              className="bg-zubo-primary-royal-midnight-blue-600 hover:bg-zubo-primary-royal-midnight-blue-700 text-zubo-background-porcelain-white-50"
            >
              Book a Service
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => {
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
