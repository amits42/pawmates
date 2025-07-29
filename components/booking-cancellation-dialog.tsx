"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Loader2, Clock, RefreshCw, Info } from "lucide-react"
import type { Booking } from "@/types/api"

interface BookingCancellationDialogProps {
  booking: Booking
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancel: (reason: string) => Promise<void>
  isLoading: boolean
}

const CANCELLATION_REASONS = [
  "Schedule conflict",
  "Pet is unwell",
  "Travel plans changed",
  "Financial constraints",
  "Found alternative care",
  "Emergency situation",
  "Service no longer needed",
  "Other",
]

export function BookingCancellationDialog({
  booking,
  open,
  onOpenChange,
  onCancel,
  isLoading,
}: BookingCancellationDialogProps) {
  const [selectedReason, setSelectedReason] = useState("")
  const [customReason, setCustomReason] = useState("")

  const handleCancel = async () => {
    const reason = selectedReason === "Other" ? customReason : selectedReason
    if (!reason.trim()) return

    try {
      await onCancel(reason.trim())
      onOpenChange(false)
      setSelectedReason("")
      setCustomReason("")
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      return dateString
    }
  }

  const isFormValid = selectedReason && (selectedReason !== "Other" || customReason.trim())

  // Calculate potential refund info (10% deduction as default)
  const percentageDeduction = 10
  const deductionAmount = (booking.totalPrice * percentageDeduction) / 100
  const refundAmount = booking.totalPrice - deductionAmount

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Cancel Booking?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">Booking Details:</span>
                  <Badge variant="outline" className="text-xs">
                    {formatDate(booking.date)} at {booking.time}
                  </Badge>
                </div>
                <div className="text-blue-700">Service: {booking.serviceName || "Pet Care Service"}</div>
                <div className="text-blue-700">Amount: ₹{booking.totalPrice?.toFixed(2) || "0.00"}</div>
              </div>
            </div>

            {booking.paymentStatus === "PAID" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800 font-medium mb-2">
                  <Info className="h-4 w-4 inline mr-1" />
                  Refund Information:
                </p>
                <div className="space-y-1 text-sm text-amber-700">
                  <div className="flex justify-between">
                    <span>Booking Amount:</span>
                    <span>₹{booking.totalPrice?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancellation Fee ({percentageDeduction}%):</span>
                    <span className="text-red-600">-₹{deductionAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-amber-200 pt-1">
                    <span>Refund Amount:</span>
                    <span className="text-green-600">₹{refundAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-600 mt-2">
                  <Clock className="h-3 w-3" />
                  <span>Processing time: 5-7 business days</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <RefreshCw className="h-3 w-3" />
                  <span>Refund via original payment method</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Please select a reason for cancellation: <span className="text-red-500">*</span>
              </Label>

              <div className="grid grid-cols-2 gap-2">
                {CANCELLATION_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`text-xs p-2 rounded border text-left transition-colors ${
                      selectedReason === reason
                        ? "bg-blue-50 border-blue-300 text-blue-800"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              {selectedReason === "Other" && (
                <div className="space-y-2">
                  <Label htmlFor="custom-reason" className="text-sm">
                    Please specify: <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="custom-reason"
                    placeholder="Please provide details about your cancellation reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="text-sm"
                    rows={3}
                  />
                </div>
              )}
            </div>

            {!isFormValid && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-xs">
                  Please select a cancellation reason to proceed.
                </AlertDescription>
              </Alert>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Keep Booking</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isLoading || !isFormValid}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Cancel Booking"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
