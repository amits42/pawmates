"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Clock,
  DollarSign,
  Repeat,
  User,
  Shield,
  MessageCircle,
  HelpCircle,
  Loader2,
  Copy,
  Play,
  Square,
  XCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RebookButton } from "@/components/rebook-button"
import type { Booking } from "@/types/api"
import type { JSX } from "react/jsx-runtime"
import { BookingCancellationDialog } from "@/components/booking-cancellation-dialog"

interface BookingDetailsDialogProps {
  booking: Booking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  getStatusBadge: (status: string, paymentStatus?: string, sitterId?: string, sitterName?: string) => JSX.Element
  getServiceIcon: (service: string) => string
  router: any
  user: any
  showChatButton: boolean
  showRebookButton?: boolean
}

const formatDate = (dateString: string) => {
  if (!dateString) return "Not scheduled"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    return dateString
  }
}

const formatRecurringPattern = (pattern: string) => {
  if (!pattern) return "One-time service"

  if (pattern.startsWith("weekly_")) {
    const parts = pattern.split("_")
    const interval = parts[1]
    const days = parts.slice(2).join("_").split(",")

    if (days.length === 7) return `Every day`
    if (days.length === 5 && !days.includes("saturday") && !days.includes("sunday")) {
      return `Weekdays only`
    }
    if (days.length === 2 && days.includes("saturday") && days.includes("sunday")) {
      return `Weekends only`
    }

    const dayNames = days.map((day) => day.charAt(0).toUpperCase() + day.slice(1)).join(", ")
    return interval === "1" ? `Weekly on ${dayNames}` : `Every ${interval} weeks on ${dayNames}`
  }

  if (pattern.startsWith("monthly_")) {
    return `Monthly service`
  }

  return pattern
}

export function BookingDetailsDialog({
  booking,
  open,
  onOpenChange,
  getStatusBadge,
  getServiceIcon,
  router,
  user,
  showChatButton,
  showRebookButton = false,
}: BookingDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [showCancellationDialog, setShowCancellationDialog] = useState(false)

  if (!booking) return null

  const sitterName = booking.sitter_name || booking.sitterName || booking.caretakerName
  const sitterPhone = booking.sitter_phone || booking.sitterPhone

  const hasSitterAssigned =
    booking.sitterId &&
    sitterName &&
    sitterName.trim() !== "" &&
    sitterName.toLowerCase() !== "to be assigned" &&
    sitterName.toLowerCase() !== "sitter not assigned" &&
    sitterPhone

  const handleGetHelp = () => {
    router.push(`/support?bookingId=${booking.id}`)
    onOpenChange(false)
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

    if (!sitterPhone) {
      toast({
        title: "Sitter contact not available",
        description: "Sitter phone number is not available for this booking",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

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
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    })
  }

  const handlePayNow = () => {
    // Redirect to payment page with booking details
    router.push(`/book-service/payment?bookingId=${booking.id}&payExisting=true`)
    onOpenChange(false)
  }

  const handleCancelBooking = async (reason: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: booking.id,
          reason: reason,
          userId: user?.id,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Booking Cancelled",
          description: result.message,
        })
        // Refresh the page or update the booking status
        window.location.reload()
      } else {
        throw new Error(result.error || "Failed to cancel booking")
      }
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getServiceIcon(booking.serviceName || "pet care")}</span>
              <DialogTitle className="text-base font-semibold">{booking.serviceName || "Pet Care Service"}</DialogTitle>
            </div>
            {getStatusBadge(booking.status || "pending", booking.paymentStatus, booking.sitterId, sitterName)}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-500">Booking ID:</p>
            <div className="flex items-center gap-1">
              <span className="text-xs font-mono text-gray-700">#{booking.id}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100"
                onClick={() => copyToClipboard(booking.id.toString(), "Booking ID")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Calendar className="h-3 w-3 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium">{formatDate(booking.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Clock className="h-3 w-3 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="text-sm font-medium">{booking.time || "Not scheduled"}</p>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <DollarSign className="h-3 w-3 text-purple-600" />
            <div>
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="text-sm font-medium">${booking.totalPrice?.toFixed(2) || "0.00"}</p>
            </div>
          </div>

          {/* Payment Status */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <DollarSign className="h-3 w-3 text-purple-600" />
            <div>
              <p className="text-xs text-gray-500">Payment Status</p>
              <p className="text-sm font-medium">
                {booking.paymentStatus === "PENDING" ? "Unpaid" : booking.paymentStatus || "Pending"}
              </p>
            </div>
          </div>

          {/* Recurring Pattern */}
          {booking.recurring && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Repeat className="h-3 w-3 text-orange-600" />
              <div>
                <p className="text-xs text-gray-500">Recurring Pattern</p>
                <p className="text-sm font-medium">{formatRecurringPattern(booking.recurringPattern)}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Pet & Sitter Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
              <span className="text-base">🐾</span>
              <div>
                <p className="text-xs text-gray-500">Pet</p>
                <p className="text-sm font-medium">{booking.petName || "Not specified"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
              <User className="h-3 w-3 text-purple-600" />
              <div>
                <p className="text-xs text-gray-500">Pet Sitter</p>
                <p className="text-sm font-medium">
                  {sitterName || "To be assigned"}
                  {booking.sitterId && !sitterName && <span className="text-amber-600 text-xs ml-1">(Loading...)</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Service OTPs - START and END */}
          {(booking.startOtp || booking.endOtp || booking.serviceOtp) &&
            ["upcoming", "confirmed", "pending", "assigned"].includes(booking.status?.toLowerCase() || "") && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-800 text-sm">Service OTPs</span>
                  </div>

                  {/* START OTP */}
                  {booking.startOtp && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Play className="h-3 w-3 text-green-600" />
                          <span className="font-medium text-green-800 text-xs">START Service</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-green-100"
                          onClick={() => copyToClipboard(booking.startOtp!, "START OTP")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-lg font-mono font-bold text-green-900 mb-1">{booking.startOtp}</div>
                      <p className="text-xs text-green-700">Share this OTP with your sitter to START the service</p>
                    </div>
                  )}

                  {/* END OTP */}
                  {booking.endOtp && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 p-3 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Square className="h-3 w-3 text-red-600" />
                          <span className="font-medium text-red-800 text-xs">END Service</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-100"
                          onClick={() => copyToClipboard(booking.endOtp!, "END OTP")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-lg font-mono font-bold text-red-900 mb-1">{booking.endOtp}</div>
                      <p className="text-xs text-red-700">Share this OTP with your sitter to END the service</p>
                    </div>
                  )}

                  {/* Legacy Service OTP (if no START/END OTPs) */}
                  {!booking.startOtp && !booking.endOtp && booking.serviceOtp && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-3 rounded-lg border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-3 w-3 text-amber-600" />
                          <span className="font-medium text-amber-800 text-xs">Service OTP</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-amber-100"
                          onClick={() => copyToClipboard(booking.serviceOtp!, "Service OTP")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-lg font-mono font-bold text-amber-900 mb-1">{booking.serviceOtp}</div>
                      <p className="text-xs text-amber-700">Share this OTP with your sitter to start the service</p>
                    </div>
                  )}
                </div>
              </>
            )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            {booking.paymentStatus === "PENDING" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-green-600 border-green-300 hover:bg-green-50 text-xs bg-transparent"
                onClick={handlePayNow}
              >
                <DollarSign className="mr-2 h-3 w-3" />
                Pay Now
              </Button>
            )}
            {!booking.recurring &&
              ["pending", "confirmed", "assigned", "upcoming"].includes(booking.status?.toLowerCase() || "") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 border-red-300 hover:bg-red-50 text-xs bg-transparent"
                  onClick={() => setShowCancellationDialog(true)}
                >
                  <XCircle className="mr-2 h-3 w-3" />
                  Cancel Booking
                </Button>
              )}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-blue-600 border-blue-300 hover:bg-blue-50 text-xs bg-transparent"
              onClick={handleGetHelp}
            >
              <HelpCircle className="mr-2 h-3 w-3" />
              Get Help & Support
            </Button>

            {showChatButton && hasSitterAssigned && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-green-600 border-green-300 hover:bg-green-50 text-xs bg-transparent"
                onClick={handleChatWithSitter}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Starting Chat...
                  </>
                ) : (
                  <>
                    <MessageCircle className="mr-2 h-3 w-3" />
                    Chat with {sitterName?.split(" ")[0]}
                  </>
                )}
              </Button>
            )}

            {showRebookButton && (
              <div className="pt-1">
                <RebookButton booking={booking} />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      <BookingCancellationDialog
        booking={booking}
        open={showCancellationDialog}
        onOpenChange={setShowCancellationDialog}
        onCancel={handleCancelBooking}
        isLoading={isLoading}
      />
    </Dialog>
  )
}
