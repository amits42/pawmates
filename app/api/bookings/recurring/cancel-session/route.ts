import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import Razorpay from "razorpay"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: NextRequest) {
  try {
    const { sessionId, reason, userId } = await request.json()

    if (!sessionId || !reason || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get session details
    const sessionResult = await sql`
      SELECT * FROM recurring_booking 
      WHERE id = ${sessionId}::uuid AND user_id = ${userId}
    `

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const session = sessionResult.rows[0]

    // Check if session can be cancelled
    const cancellableStatuses = ["PENDING", "CONFIRMED", "ASSIGNED", "UPCOMING"]
    if (!cancellableStatuses.includes(session.status?.toUpperCase())) {
      return NextResponse.json(
        {
          error: `This session cannot be cancelled. Current status: ${session.status}`,
        },
        { status: 400 },
      )
    }

    // Get cancellation fee percentage from config
    const configResult = await sql`
      SELECT value FROM config_settings 
      WHERE key = 'percentageDeductionOnSelfCancellation'
    `
    const percentageDeduction = configResult.rows.length > 0 ? Number.parseInt(configResult.rows[0].value) : 10

    let refundInfo = null

    // Handle refund if session was paid
    if (session.payment_status === "PAID") {
      const deductionAmount = (session.session_price * percentageDeduction) / 100
      const refundAmount = session.session_price - deductionAmount

      // Get payment details for this session
      let paymentResult = await sql`
        SELECT * FROM payments 
        WHERE recurring_booking_id = ${sessionId}::uuid 
        AND status = 'CAPTURED'
        ORDER BY created_at DESC
        LIMIT 1
      `
      if (paymentResult.rows.length === 0) {
        paymentResult = await sql`
        SELECT * FROM payments 
        WHERE booking_id = ${session.booking_id}::text
        AND status = 'CAPTURED'
        ORDER BY created_at DESC
        LIMIT 1
      `
      }
      if (paymentResult.rows.length > 0) {
        const payment = paymentResult.rows[0]

        try {
          // Create refund via Razorpay
          const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
            amount: Math.round(refundAmount * 100), // Convert to paise
            notes: {
              session_id: sessionId,
              sequence_number: session.sequence_number,
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
          console.error("Session refund creation failed:", refundError)

          // Still record the refund attempt for manual processing
          await sql`
            INSERT INTO payment_refunds (
              payment_id, refund_id, amount, status, 
              initiated_at, failure_reason
            ) VALUES (
              ${payment.id},
              'manual_' || ${sessionId},
              ${refundAmount},
              'FAILED',
              ${sessionId}::uuid,
              ${session.sequence_number},
              ${session.session_date},
              NOW(),
              ${refundError.message || "Razorpay API error"}
            )
          `

          refundInfo = {
            refundAmount: refundAmount.toFixed(2),
            deductionAmount: deductionAmount.toFixed(2),
            processingTime: "7-10 business days (manual processing)",
            error: "Refund will be processed manually by our team",
          }
        }
      } else {
        return NextResponse.json({ error: "Payment record not found for this session" }, { status: 404 })
      }
    }

    // Update session status and add cancellation reason
    await sql`
      UPDATE recurring_booking 
      SET 
        status = 'USERCANCELLED',
        cancellation_reason = ${reason},
        updated_at = NOW()
      WHERE id = ${sessionId}::uuid
    `

    return NextResponse.json({
      message: "Session cancelled successfully",
      sessionId,
      sequenceNumber: session.sequence_number,
      refundInfo,
    })
  } catch (error) {
    console.error("Error cancelling session:", error)
    return NextResponse.json(
      {
        error: "Failed to cancel session",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
