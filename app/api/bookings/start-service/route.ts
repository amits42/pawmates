import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { sendFcmNotification } from "@/lib/sendFcmNotification"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {


    const { bookingId, otp } = await request.json()

    console.log("🔐 START Service API - bookingId:", bookingId, "otp:", otp)

    if (!bookingId || !otp) {
      return NextResponse.json({ error: "Booking ID and OTP are required" }, { status: 400 })
    }

    // First, check if this is a regular booking or recurring session
    const regularBookingCheck = await sql`
      SELECT id FROM bookings WHERE id = ${bookingId}
    `

    const recurringSessionCheck = await sql`
      SELECT id FROM recurring_booking WHERE id = ${bookingId}
    `

    let isRecurringSession = false
    let targetTable = "bookings"
    let otpColumn = "booking_id"

    if (recurringSessionCheck.length > 0) {
      isRecurringSession = true
      targetTable = "recurring_booking"
      otpColumn = "recurring_booking_id"
    } else if (regularBookingCheck.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    let ownerUserId: string | null = null;
    if (isRecurringSession) {
      const result = await sql`SELECT user_id FROM recurring_booking WHERE id = ${bookingId}`;
      ownerUserId = result[0]?.user_id || null;
    } else {
      const result = await sql`SELECT user_id FROM bookings WHERE id = ${bookingId}`;
      ownerUserId = result[0]?.user_id || null;
    }

    // Notify owner via FCM if user_id found
    if (ownerUserId) {
      try {
        await sendFcmNotification({
          userIds: [ownerUserId],
          title: "Service Started",
          body: "Your pet care service has started."
        });
      } catch (notifyErr) {
        console.error("Failed to send FCM notification to owner:", notifyErr);
      }
    }

    console.log("🔐 Is recurring session:", isRecurringSession)

    // Verify the START OTP
    const otpQuery = isRecurringSession
      ? sql`
          SELECT * FROM service_otps 
          WHERE recurring_booking_id = ${bookingId} 
          AND type = 'START' 
          AND otp = ${otp} 
          AND is_used = false 
          AND (expires_at IS NULL OR expires_at > NOW())
        `
      : sql`
          SELECT * FROM service_otps 
          WHERE booking_id = ${bookingId} 
          AND type = 'START' 
          AND otp = ${otp} 
          AND is_used = false 
          AND (expires_at IS NULL OR expires_at > NOW())
        `

    const otpResult = await otpQuery

    console.log("🔐 OTP verification result:", otpResult)

    if (otpResult.length === 0) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    // Mark OTP as used
    await sql`
      UPDATE service_otps 
      SET is_used = true, used_at = NOW() 
      WHERE id = ${otpResult[0].id}
    `

    // Update booking/session status to ONGOING
    if (isRecurringSession) {
      await sql`
        UPDATE recurring_booking 
        SET status = 'ONGOING', service_started_at = NOW(), updated_at = NOW()
        WHERE id = ${bookingId}
      `
    } else {
      await sql`
        UPDATE bookings 
        SET status = 'ONGOING', updated_at = NOW()
        WHERE id = ${bookingId}
      `
    }

    // Fetch owner user_id

    console.log("🔐 Service started successfully for:", isRecurringSession ? "recurring session" : "regular booking")

    return NextResponse.json({
      success: true,
      message: "Service started successfully",
      bookingType: isRecurringSession ? "recurring_session" : "regular",
    })
  } catch (error) {
    console.error("Error starting service:", error)
    return NextResponse.json({ error: "Failed to start service" }, { status: 500 })
  }
}
