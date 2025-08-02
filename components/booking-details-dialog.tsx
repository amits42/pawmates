"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  User,
  MessageCircle,
  HelpCircle,
  Repeat,
  CreditCard,
  Loader2,
  Phone,
  Mail,
  ClipboardCopy,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import type { Booking, UserProfile } from "@/types/api"
import { format, parseISO } from "date-fns"
import type { JSX } from "react/jsx-runtime" // Import JSX to fix the undeclared variable error

interface BookingDetailsDialogProps {
  booking: Booking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  getStatusBadge: (status: string, paymentStatus?: string, sitterId?: string, sitterName?: string) => JSX.Element
  getServiceIcon: (service: string) => string
  router: any // Next.js router instance
  user: UserProfile | null // Current authenticated user
  showChatButton?: boolean // Optional prop to control chat button visibility
}

export function BookingDetailsDialog({
  booking,
  open,
  onOpenChange,
  getStatusBadge,
  getServiceIcon,
  router,
  user,
  showChatButton = true,
}: BookingDetailsDialogProps) {
  const { toast } = useToast()
  const [isLoadingChat, setIsLoadingChat] = useState(false)

  if (!booking) return null

  const sitterName = booking.sitter_name || booking.sitterName || booking.caretakerName
  const hasSitterAssigned =
    booking.sitterId &&
    sitterName &&
    sitterName.trim() !== "" &&
    sitterName.toLowerCase() !== "to be assigned" &&
    sitterName.toLowerCase() !== "sitter not assigned"

  const handleChatWithSitter = async () => {
    if (!user?.phone) {
      toast({
        title: "Phone number required",
        description: "Please ensure your phone number is set in your profile",
        variant: "destructive",
      })
      return
    }

    const sitterPhone = booking.sitter_phone || booking.sitterPhone

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

  const handlePayNow = () => {
    router.push(`/book-service/payment?bookingId=${booking.id}&payExisting=true`)
    onOpenChange(false) // Close dialog after navigating
  }

  const handleGetHelp = () => {
    router.push(`/support?bookingId=${booking.id}`)
    onOpenChange(false) // Close dialog after navigating
  }

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: message,
    })
  }

  const showChatButtonInDialog =
    showChatButton &&
    hasSitterAssigned &&
    ["upcoming", "confirmed", "pending", "assigned", "ongoing", "in-progress"].includes(
      booking.status?.toLowerCase() || "",
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-4 border-b border-zubo-background-porcelain-white-200 bg-zubo-background-porcelain-white-50">
          <DialogTitle className="text-xl font-semibold text-zubo-text-graphite-gray-900 flex items-center gap-2">
            <span className="text-2xl">{getServiceIcon(booking.serviceName || "pet care")}</span>
            {booking.serviceName || "Pet Care Service"}
          </DialogTitle>
          <DialogDescription className="text-sm text-zubo-text-graphite-gray-600">
            Booking ID: #{booking.id}
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zubo-text-graphite-gray-800">Status:</p>
            {getStatusBadge(booking.status || "pending", booking.paymentStatus, booking.sitterId, sitterName)}
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-3">
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
              <div className="flex items-center gap-3 text-sm text-zubo-text-graphite-gray-700">
                <Repeat className="h-4 w-4 text-zubo-highlight-1-blush-coral-600" />
                <span>Recurring Service</span>
              </div>
            </>
          )}
        </div>
        <DialogFooter className="p-4 border-t border-zubo-background-porcelain-white-200 bg-zubo-background-porcelain-white-50 flex flex-col sm:flex-row sm:justify-end gap-2">
          {booking.paymentStatus === "PENDING" && (
            <Button
              onClick={handlePayNow}
              className="bg-zubo-primary-royal-midnight-blue-600 hover:bg-zubo-primary-royal-midnight-blue-700 text-zubo-background-porcelain-white-50 w-full sm:w-auto"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Now
            </Button>
          )}
          {showChatButtonInDialog && (
            <Button
              variant="outline"
              onClick={handleChatWithSitter}
              disabled={isLoadingChat}
              className="border-zubo-accent-soft-moss-green-300 text-zubo-accent-soft-moss-green-600 hover:bg-zubo-accent-soft-moss-green-50 bg-transparent w-full sm:w-auto"
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
          <Button
            variant="outline"
            onClick={handleGetHelp}
            className="border-zubo-primary-royal-midnight-blue-300 text-zubo-primary-royal-midnight-blue-600 hover:bg-zubo-primary-royal-midnight-blue-50 bg-transparent w-full sm:w-auto"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Get Help
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
