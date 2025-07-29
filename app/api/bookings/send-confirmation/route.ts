import { sendBookingEmail } from "@/lib/sendBookingEmail"
import { NextResponse } from "next/server"

// Twilio configuration - using the same as login
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "AC0434e03a43f5c7a790fb14913ff392bb"
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "4f4636c3059ce3d9564777639da2d2f3"
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886"

// For debugging
const DEBUG_MODE = true

async function sendWhatsAppMessage(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {


    // Format phone number correctly
    let formattedPhone = to
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+" + formattedPhone
    }

    // Remove any spaces or special characters
    formattedPhone = formattedPhone.replace(/[^\d+]/g, "")

    if (DEBUG_MODE) {
      console.log("Formatted phone number:", formattedPhone)
    }

    // Try to send via Twilio WhatsApp
    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    if (DEBUG_MODE) {
      console.log("Twilio endpoint:", twilioEndpoint)
    }

    const response = await fetch(twilioEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        To: `whatsapp:${formattedPhone}`,
        Body: message,
      }),
    })

    const responseText = await response.text()

    if (DEBUG_MODE) {
      console.log("Twilio API response status:", response.status)
      console.log("Twilio API response:", responseText)
    }

    if (response.ok) {
      let result
      try {
        result = JSON.parse(responseText)
      } catch (e) {
        console.error("Failed to parse Twilio response:", e)
        return { success: false, error: "Failed to parse Twilio response" }
      }

      console.log("WhatsApp message sent successfully:", result.sid)
      return { success: true }
    } else {
      console.error("Twilio API error:", responseText)
      return { success: false, error: `Twilio error: ${responseText}` }
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function POST(request: Request) {
  try {
    const { bookingId, serviceOtp, startOtp, endOtp, isRecurring, phone } = await request.json()

    const phoneNumber = phone || "+919876543210"

    // 📩 Build dynamic message
    let message = ""

    if (startOtp && endOtp) {
      // Full booking confirmation
      message = `🐾 *PetCare Booking Confirmed!*

          Your pet care service has been booked successfully!

          📋 *Booking Details:*
          • Booking ID: ${bookingId}
          • Service start OTP: *${startOtp}*
          • Service end OTP: *${endOtp}*
          • Status: Confirmed ✅

          🔐 *Important:*
          Please share the Service OTP with your caretaker when they arrive. This OTP is required to start and end the service.

          🚫 *Do not share this OTP with anyone else*

          Thank you for choosing PetCare! 🐕🐱

          Need help? Reply to this message.`
    } else {
      // Payment success for existing booking
      message = `💳 *Payment Received!*

        We’ve successfully received your payment for Booking ID: *${bookingId}*.

        ✅ Your booking is now confirmed.

        You’ll receive service start and end OTPs shortly if they haven't been generated yet.

        Thank you for trusting PetCare! 🐾`
    }

    const whatsappResult = await sendWhatsAppMessage(phoneNumber, message)
    await sendBookingEmail({ bookingId: isRecurring ? null : bookingId, recurringBookingId: isRecurring ? bookingId : null });
    return NextResponse.json({
      success: true,
      message: "Notification sent via WhatsApp! 📱",
      bookingId
    })
  } catch (error) {
    console.error("Send confirmation error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send confirmation",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
