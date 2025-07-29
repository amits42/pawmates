import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import Razorpay from "razorpay"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: NextRequest) {
  try {
    const { bookingId, reason, userId } = await request.json()

    // Get booking details
    const bookingResult = await sql`
      SELECT * FROM bookings 
      WHERE id = ${bookingId} AND user_id = ${userId}
    `

    if (bookingResult.rows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const booking = bookingResult.rows[0]

    // Check if booking can be cancelled (only for non-recurring bookings)
    if (booking.is_recurring) {
      return NextResponse.json(
        {
          error: "Cannot cancel entire recurring booking. Please cancel individual sessions instead.",
        },
        { status: 400 },
      )
    }

    const cancellableStatuses = ["PENDING", "CONFIRMED", "ASSIGNED", "UPCOMING"]
    if (!cancellableStatuses.includes(booking.status?.toUpperCase())) {
      return NextResponse.json({ error: "This booking cannot be cancelled" }, { status: 400 })
    }

    // Get cancellation fee percentage
    const configResult = await sql`
      SELECT value FROM config_settings 
      WHERE key = 'percentageDeductionOnSelfCancellation'
    `
    const percentageDeduction = configResult.rows.length > 0 ? Number.parseInt(configResult.rows[0].value) : 10

    let refundInfo = null

    // Handle refund if booking was paid
    if (booking.payment_status === "PAID") {
      const deductionAmount = (booking.total_price * percentageDeduction) / 100
      const refundAmount = booking.total_price - deductionAmount

      // Get payment details
      const paymentResult = await sql`
        SELECT * FROM payments 
        WHERE booking_id = ${bookingId} 
        AND status = 'CAPTURED'
        ORDER BY created_at DESC
        LIMIT 1
      `

      if (paymentResult.rows.length > 0) {
        const payment = paymentResult.rows[0]

        try {
          // Create refund via Razorpay
          const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
            amount: Math.round(refundAmount * 100), // Convert to paise
            notes: {
              booking_id: bookingId,
              reason: reason,
              cancellation_fee: deductionAmount.toFixed(2),
            },
          })

          // Record refund in database
          await sql`
            INSERT INTO payment_refunds (
              payment_id, refund_id, amount, status, 
               initiated_at, razorpay_response
            ) VALUES (
              ${payment.id},
              ${refund.id},
              ${refundAmount},
              'INITIATED',
              NOW(),
              ${JSON.stringify(refund)}
            )
          `

          refundInfo = {
            refundAmount: refundAmount.toFixed(2),
            deductionAmount: deductionAmount.toFixed(2),
            processingTime: "5-7 business days",
            refundId: refund.id,
          }
        } catch (refundError) {
          console.error("Booking refund creation failed:", refundError)
          refundInfo = {
            refundAmount: refundAmount.toFixed(2),
            deductionAmount: deductionAmount.toFixed(2),
            processingTime: "5-7 business days (processing)",
            error: "Refund will be processed manually",
          }
        }
      }
    }

    // Update booking status
    await sql`
      UPDATE bookings 
      SET 
        status = 'USERCANCELLED',
        cancellation_reason = ${reason},
        updated_at = NOW()
      WHERE id = ${bookingId}
    `

    return NextResponse.json({
      message: "Booking cancelled successfully",
      refundInfo,
    })
  } catch (error) {
    console.error("Error cancelling booking:", error)
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
  }
}
