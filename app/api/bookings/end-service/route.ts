import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { sendFcmNotification } from "@/lib/sendFcmNotification"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { bookingId, otp } = await request.json()

    if (!bookingId || !otp) {
      return NextResponse.json({ error: "Booking ID and OTP are required" }, { status: 400 })
    }

    // Check if it's a recurring session or a regular booking
    const regularBookingCheck = await sql`
      SELECT id, user_id, total_price, sitter_id, date, time FROM bookings WHERE id = ${bookingId}
    `
    const recurringSessionCheck = await sql`
      SELECT id, user_id, sitter_id, session_price, service_started_at, session_date AS date, session_time AS time
      FROM recurring_booking WHERE id = ${bookingId}
    `

    let isRecurringSession = false
    let bookingData: any = null

    if (recurringSessionCheck.length > 0) {
      isRecurringSession = true
      bookingData = recurringSessionCheck[0]
    } else if (regularBookingCheck.length > 0) {
      bookingData = regularBookingCheck[0]
    } else {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const ownerUserId = bookingData.user_id
    const sitterId = bookingData.sitter_id
    const totalPrice = parseFloat(
      isRecurringSession ? bookingData.session_price : bookingData.total_price
    ) || 0

    // Send FCM Notification
    if (ownerUserId) {
      try {
        await sendFcmNotification({
          userIds: [ownerUserId],
          title: "Service Started",
          body: "Your pet care service has started.",
        })
      } catch (notifyErr) {
        console.error("Failed to send FCM notification to owner:", notifyErr)
      }
    }

    // OTP Verification
    let otpResult

    if (isRecurringSession) {
      otpResult = await sql`
        SELECT * FROM service_otps 
        WHERE recurring_booking_id = ${bookingId} 
        AND type = 'END' 
        AND otp = ${otp} 
        AND is_used = false 
        AND (expires_at > NOW() OR expires_at IS NULL)
      `
    } else {
      otpResult = await sql`
        SELECT * FROM service_otps 
        WHERE booking_id = ${bookingId} 
        AND type = 'END' 
        AND otp = ${otp} 
        AND is_used = false 
        AND (expires_at > NOW() OR expires_at IS NULL)
      `
    }

    if (otpResult.length === 0) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    // Mark OTP as used
    await sql`
      UPDATE service_otps 
      SET is_used = true, used_at = NOW() 
      WHERE id = ${otpResult[0].id}
    `

    // Start transaction
    await sql`BEGIN`
    try {
      let actualDuration = null

      if (isRecurringSession && bookingData.service_started_at) {
        const startTime = new Date(bookingData.service_started_at)
        const endTime = new Date()
        actualDuration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
      }

      // Update booking status
      if (isRecurringSession) {
        await sql`
          UPDATE recurring_booking 
          SET status = 'COMPLETED', 
              service_ended_at = NOW(), 
              actual_duration = ${actualDuration},
              updated_at = NOW()
          WHERE id = ${bookingId}
        `
      } else {
        await sql`
          UPDATE bookings 
          SET status = 'COMPLETED',
              completed_at = NOW(),
              earnings_processed = true,
              sitter_earnings = ${totalPrice},
              platform_fee = 0,
              updated_at = NOW()
          WHERE id = ${bookingId}
        `
      }

      // Handle sitter wallet
      const walletResult = await sql`
        SELECT id FROM sitter_wallets WHERE sitter_id = ${sitterId}
      `
      let walletId

      if (walletResult.length === 0) {
        const newWallet = await sql`
          INSERT INTO sitter_wallets (sitter_id, balance, pending_amount, total_earnings)
          VALUES (${sitterId}, 0.00, 0.00, 0.00)
          RETURNING id
        `
        walletId = newWallet[0].id
      } else {
        walletId = walletResult[0].id
      }

      // Add earnings to wallet
      await sql`
        UPDATE sitter_wallets 
        SET 
          pending_amount = pending_amount + ${totalPrice},
          total_earnings = total_earnings + ${totalPrice},
          updated_at = NOW()
        WHERE id = ${walletId}
      `

      const availableAt = new Date()
      availableAt.setDate(availableAt.getDate() + 3)

      await sql`
        INSERT INTO wallet_transactions (
          wallet_id, 
          booking_id, 
          amount, 
          type, 
          status, 
          description,
          available_at,
          metadata
        ) VALUES (
          ${walletId},
          ${bookingId},
          ${totalPrice},
          'earning',
          'pending',
          'Service completion earnings',
          ${availableAt.toISOString()},
          ${JSON.stringify({
        service_date: bookingData.date,
        service_time: bookingData.time,
        total_price: totalPrice,
        commission_rate: 1,
      })}
        )
      `

      await sql`COMMIT`

      return NextResponse.json({
        success: true,
        message: "Service completed and earnings credited",
        bookingType: isRecurringSession ? "recurring_session" : "regular",
        earnings: {
          amount: totalPrice,
          availableAt: availableAt.toISOString(),
        },
      })
    } catch (err) {
      await sql`ROLLBACK`
      throw err
    }
  } catch (error) {
    console.error("❌ Error ending service:", error)
    return NextResponse.json({ error: "Failed to end service" }, { status: 500 })
  }
}
