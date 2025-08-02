"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  User,
  Loader2,
  MessageCircle,
  CreditCard,
  AlertCircle,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Info,
  Wallet,
  Phone,
  Mail,
  ClipboardCopy,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { BookingCancellationDialog } from "@/components/booking-cancellation-dialog"
import { RecurringBookingDetails } from "@/components/recurring-booking-details"
import { RebookButton } from "@/components/rebook-button"
import { OwnerEndService } from "@/components/owner-end-service"
import { ServiceOtpDialog } from "@/components/service-otp-dialog"
import { BookingSupportActions } from "@/components/booking-support-actions"
import type { Booking } from "@/types/api"
import { format, parseISO } from "date-fns"
import { Toaster } from "@/components/ui/toaster"

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const bookingId = params.id as string
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCancellationDialogOpen, setIsCancellationDialogOpen] = useState(false)
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false)
  const [otpType, setOtpType] = useState<"start" | "end" | null>(null)
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [cancellationPolicy, setCancellationPolicy] = useState<any>(null)
  const [isPolicyLoading, setIsPolicyLoading] = useState(true)
  const [policyError, setPolicyError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id && bookingId) {
      fetchBookingDetails()
      fetchCancellationPolicy()
    }
  }, [user, bookingId])

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id) throw new Error("User not authenticated")

      const response = await fetch(`/api/bookings/${bookingId}?userId=${encodeURIComponent(user.id)}`, {
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch booking details")
      }

      const data = await response.json()
      setBooking(data)
    } catch (error) {
      console.error("Error fetching booking details:", error)
      setError(error instanceof Error ? error.message : "Failed to load booking details. Please try again.")
      setBooking(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchCancellationPolicy = async () => {
    try {
      setIsPolicyLoading(true)
      setPolicyError(null)
      const response = await fetch("/api/bookings/cancellation-policy")
      if (!response.ok) {
        throw new Error("Failed to fetch cancellation policy")
      }
      const data = await response.json()
      setCancellationPolicy(data)
    } catch (err) {
      console.error("Error fetching cancellation policy:", err)
      setPolicyError("Failed to load cancellation policy.")
    } finally {
      setIsPolicyLoading(false)
    }
  }

  const handleCancellationSuccess = () => {
    toast({
      title: "Booking Cancelled",
      description: "Your booking has been successfully cancelled.",
      variant: "default",
    })
    setIsCancellationDialogOpen(false)
    fetchBookingDetails() // Re-fetch booking details to update status
  }

  const handleOtpGenerated = (otp: string) => {
    toast({
      title: `${otpType === "start" ? "Start" : "End"} OTP Generated`,
      description: `OTP: ${otp}. Please provide this to the sitter.`,
      variant: "default",
    })
    setIsOtpDialogOpen(false)
    fetchBookingDetails() // Re-fetch booking details to update status
  }

  const handleServiceEndSuccess = () => {
    toast({
      title: "Service Ended",
      description: "The service has been successfully marked as completed.",
      variant: "default",
    })
    fetchBookingDetails() // Re-fetch booking details to update status
  }

  const handleChatWithSitter = async () => {
    if (!user?.phone) {
      toast({
        title: "Phone number required",
        description: "Please ensure your phone number is set in your profile",
        variant: "destructive",
      })
      return
    }

    const sitterPhone = booking?.sitter_phone || booking?.sitterPhone
    const sitterName = booking?.sitter_name || booking?.sitterName || booking?.caretakerName

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
        bookingId: bookingId,
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

  const isCancellable = useMemo(() => {
    if (!booking) return false
    const status = booking.status?.toLowerCase()
    return ["pending", "confirmed", "assigned", "upcoming"].includes(status || "") && !booking.recurring
  }, [booking])

  const showCancellationPolicy = useMemo(() => {
    if (!booking) return false
    const status = booking.status?.toLowerCase()
    // Show policy if cancellable or if it was cancelled (for refund details)
    return isCancellable || ["cancelled", "usercancelled"].includes(status || "")
  }, [booking, isCancellable])

  const showPayNowButton = useMemo(() => {
    return booking?.paymentStatus === "PENDING" && !booking.recurring
  }, [booking])

  const showChatButton = useMemo(() => {
    if (!booking) return false
    const status = booking.status?.toLowerCase()
    const sitterAssigned = booking.sitterId && booking.sitter_name && booking.sitter_name.trim() !== ""
    return (
      sitterAssigned &&
      ["upcoming", "confirmed", "pending", "assigned", "ongoing", "in-progress"].includes(status || "")
    )
  }, [booking])

  const showRebookButton = useMemo(() => {
    if (!booking) return false
    const status = booking.status?.toLowerCase()
    return ["completed", "cancelled", "usercancelled"].includes(status || "")
  }, [booking])

  const showStartServiceButton = useMemo(() => {
    if (!booking) return false
    const status = booking.status?.toLowerCase()
    return ["confirmed", "assigned", "upcoming"].includes(status || "") && !booking.recurring
  }, [booking])

  const showEndServiceButton = useMemo(() => {
    if (!booking) return false
    const status = booking.status?.toLowerCase()
    return ["ongoing", "in-progress"].includes(status || "") && !booking.recurring
  }, [booking])

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: message,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zubo-background-porcelain-white-300">
        <div className="container mx-auto p-4 pb-20">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-zubo-primary-royal-midnight-blue-600" />
              <h3 className="text-lg font-semibold text-zubo-text-graphite-gray-800 mb-2">Loading booking details</h3>
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
          <div className="text-center mt-6">
            <Button onClick={() => router.back()} variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" /> Back to Bookings
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-zubo-background-porcelain-white-300">
        <div className="container mx-auto p-4 pb-20">
          <Alert className="border-yellow-200 bg-yellow-50">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">Booking not found.</AlertDescription>
          </Alert>
          <div className="text-center mt-6">
            <Button onClick={() => router.back()} variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" /> Back to Bookings
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const sitterName = booking.sitter_name || booking.sitterName || booking.caretakerName
  const hasSitterAssigned =
    booking.sitterId &&
    sitterName &&
    sitterName.trim() !== "" &&
    sitterName.toLowerCase() !== "to be assigned" &&
    sitterName.toLowerCase() !== "sitter not assigned"

  return (
    <div className="min-h-screen bg-zubo-background-porcelain-white-300">
      <div className="container mx-auto p-4 pb-20 max-w-3xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-zubo-text-graphite-gray-900">Booking Details</h1>
        </div>

        <Card className="shadow-sm mb-6">
          <CardHeader className="p-4 border-b border-zubo-background-porcelain-white-200 bg-zubo-background-porcelain-white-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-zubo-text-graphite-gray-900 flex items-center gap-2">
                <span className="text-2xl">{getServiceIcon(booking.serviceName || "pet care")}</span>
                {booking.serviceName || "Pet Care Service"}
              </CardTitle>
              {getStatusBadge(booking.status || "pending", booking.paymentStatus, booking.sitterId, sitterName)}
            </div>
            <p className="text-sm text-zubo-text-graphite-gray-600 mt-1">Booking ID: #{booking.id}</p>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 text-sm text-zubo-text-graphite-gray-700">
                <Calendar className="h-4 w-4 text-zubo-primary-royal-midnight-blue-600" />
                <span>Date: {format(parseISO(booking.date), "PPP")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zubo-text-graphite-gray-700">
                <Clock className="h-4 w-4 text-zubo-accent-soft-moss-green-600" />
                <span>Time: {booking.time || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zubo-text-graphite-gray-700">
                <DollarSign className="h-4 w-4 text-zubo-highlight-2-bronze-clay-600" />
                <span>Total Price: ₹{booking.totalPrice?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zubo-text-graphite-gray-700">
                <CreditCard className="h-4 w-4 text-zubo-highlight-1-blush-coral-600" />
                <span>
                  Payment Status:{" "}
                  <Badge
                    className={`font-medium px-2 py-0.5 text-xs ${
                      booking.paymentStatus === "PENDING"
                        ? "bg-zubo-highlight-2-bronze-clay-50 text-zubo-highlight-2-bronze-clay-700 border-zubo-highlight-2-bronze-clay-200"
                        : "bg-zubo-accent-soft-moss-green-50 text-zubo-accent-soft-moss-green-700 border-zubo-accent-soft-moss-green-200"
                    }`}
                  >
                    {booking.paymentStatus || "N/A"}
                  </Badge>
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-zubo-text-graphite-gray-800 flex items-center gap-2">
                <User className="h-4 w-4 text-zubo-primary-royal-midnight-blue-600" /> Sitter Information
              </h3>
              <p className="text-sm text-zubo-text-graphite-gray-700">
                Name:{" "}
                <span className="font-medium">
                  {sitterName || "To be assigned"}
                  {booking.sitterId && !sitterName && (
                    <span className="text-zubo-highlight-2-bronze-clay-600 text-sm ml-1">(Loading...)</span>
                  )}
                </span>
              </p>
              {hasSitterAssigned && (
                <>
                  <div className="flex items-center gap-2 text-sm text-zubo-text-graphite-gray-700">
                    <Phone className="h-4 w-4 text-zubo-accent-soft-moss-green-600" />
                    <span>Phone: {booking.sitter_phone || booking.sitterPhone || "N/A"}</span>
                    {(booking.sitter_phone || booking.sitterPhone) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          copyToClipboard(
                            booking.sitter_phone || booking.sitterPhone || "",
                            "Sitter phone number copied!",
                          )
                        }
                      >
                        <ClipboardCopy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zubo-text-graphite-gray-700">
                    <Mail className="h-4 w-4 text-zubo-accent-soft-moss-green-600" />
                    <span>Email: {booking.sitter_email || booking.sitterEmail || "N/A"}</span>
                    {(booking.sitter_email || booking.sitterEmail) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          copyToClipboard(booking.sitter_email || booking.sitterEmail || "", "Sitter email copied!")
                        }
                      >
                        <ClipboardCopy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-zubo-text-graphite-gray-800 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zubo-highlight-1-blush-coral-600" /> Location Details
              </h3>
              <p className="text-sm text-zubo-text-graphite-gray-700">Address: {booking.addressId || "N/A"}</p>
              <p className="text-sm text-zubo-text-graphite-gray-700">
                Instructions: {booking.additionalInstructions || "None"}
              </p>
            </div>

            {booking.recurring && (
              <>
                <Separator />
                <RecurringBookingDetails bookingId={booking.id} />
              </>
            )}

            <Separator />

            <div className="flex flex-wrap gap-3 pt-3">
              {showPayNowButton && (
                <Button
                  onClick={() => router.push(`/book-service/payment?bookingId=${booking.id}&payExisting=true`)}
                  className="bg-zubo-primary-royal-midnight-blue-600 hover:bg-zubo-primary-royal-midnight-blue-700 text-zubo-background-porcelain-white-50"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now
                </Button>
              )}

              {showChatButton && (
                <Button
                  variant="outline"
                  onClick={handleChatWithSitter}
                  disabled={isLoadingChat}
                  className="border-zubo-accent-soft-moss-green-300 text-zubo-accent-soft-moss-green-600 hover:bg-zubo-accent-soft-moss-green-50 bg-transparent"
                >
                  {isLoadingChat ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting Chat...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat with Sitter
                    </>
                  )}
                </Button>
              )}

              {showStartServiceButton && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setOtpType("start")
                    setIsOtpDialogOpen(true)
                  }}
                  className="border-zubo-primary-royal-midnight-blue-300 text-zubo-primary-royal-midnight-blue-600 hover:bg-zubo-primary-royal-midnight-blue-50 bg-transparent"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Generate Start OTP
                </Button>
              )}

              {showEndServiceButton && (
                <OwnerEndService bookingId={booking.id} onServiceEnd={handleServiceEndSuccess}>
                  <Button
                    variant="outline"
                    className="border-zubo-accent-soft-moss-green-300 text-zubo-accent-soft-moss-green-600 hover:bg-zubo-accent-soft-moss-green-50 bg-transparent"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    End Service
                  </Button>
                </OwnerEndService>
              )}

              {isCancellable && (
                <Button
                  variant="destructive"
                  onClick={() => setIsCancellationDialogOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Booking
                </Button>
              )}

              {showRebookButton && <RebookButton booking={booking} />}

              <BookingSupportActions bookingId={booking.id} />
            </div>
          </CardContent>
        </Card>

        {showCancellationPolicy && (
          <Card className="shadow-sm mb-6">
            <CardHeader className="p-4 border-b border-zubo-background-porcelain-white-200 bg-zubo-background-porcelain-white-50">
              <CardTitle className="text-lg font-semibold text-zubo-text-graphite-gray-900 flex items-center gap-2">
                <Info className="h-5 w-5 text-zubo-highlight-2-bronze-clay-600" /> Cancellation Policy & Refund
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-sm text-zubo-text-graphite-gray-700">
              {isPolicyLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-zubo-text-graphite-gray-500" />
                  <span>Loading policy...</span>
                </div>
              ) : policyError ? (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 text-sm">{policyError}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <p className="mb-2">{cancellationPolicy?.description || "No policy description available."}</p>
                  {cancellationPolicy?.rules && (
                    <ul className="list-disc list-inside space-y-1">
                      {cancellationPolicy.rules.map((rule: string, index: number) => (
                        <li key={index}>{rule}</li>
                      ))}
                    </ul>
                  )}
                  {booking.status?.toLowerCase().includes("cancelled") && (
                    <div className="mt-4 p-3 bg-zubo-background-porcelain-white-100 rounded-md border border-zubo-background-porcelain-white-200 flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-zubo-accent-soft-moss-green-600" />
                      <div>
                        <p className="font-semibold text-zubo-text-graphite-gray-800">Refund Status:</p>
                        <p>
                          {booking.refundStatus === "REFUNDED"
                            ? `Refunded ₹${booking.refundAmount?.toFixed(2) || "0.00"}`
                            : booking.refundStatus === "PENDING"
                              ? "Refund pending"
                              : "No refund applicable or processed yet."}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {booking && (
        <BookingCancellationDialog
          booking={booking}
          open={isCancellationDialogOpen}
          onOpenChange={setIsCancellationDialogOpen}
          onSuccess={handleCancellationSuccess}
        />
      )}

      {booking && otpType && (
        <ServiceOtpDialog
          bookingId={booking.id}
          otpType={otpType}
          open={isOtpDialogOpen}
          onOpenChange={setIsOtpDialogOpen}
          onOtpGenerated={handleOtpGenerated}
        />
      )}
      <Toaster />
    </div>
  )
}
