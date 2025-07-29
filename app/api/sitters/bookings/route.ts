import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const fetchCache = 'force-no-store'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    console.log("Sitter bookings API - userId:", userId)

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get sitter ID from user ID using tagged template
    const sitterResult = await sql`SELECT id FROM sitters WHERE user_id = ${userId}`

    console.log("Sitter query result:", sitterResult)

    if (sitterResult.length === 0) {
      console.log("No sitter found for user ID:", userId)
      return NextResponse.json([]) // Return empty array instead of error
    }

    const sitterId = sitterResult[0].id
    console.log("Found sitter ID:", sitterId)

    // Get regular bookings for this sitter
    const regularBookingsResult = await sql`
      SELECT 
        b.id,
        b.date,
        b.time,
        b.duration,
        b.status,
        b.total_price,
        b.notes,
        b.is_recurring,
        b.recurring_pattern,
        s.name as service_name,
        p.name as pet_name,
        p.type as pet_type,
        u.name as owner_name,
        p.breed,
        u.phone as owner_phone,
        a.line1,
        a.city,
        a.state,
        'regular' as booking_type
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN pets p ON b.pet_id = p.id
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN addresses a ON u.id = a.user_id
      WHERE b.sitter_id = ${sitterId} AND (b.is_recurring = false OR b.is_recurring IS NULL)
    `

    // Get recurring booking sessions for this sitter
    const recurringBookingsResult = await sql`
      SELECT 
        rb.id,
        rb.session_date as date,
        rb.session_time as time,
        rb.duration,
        rb.status,
        rb.session_price as total_price,
        rb.notes,
        false as is_recurring,
        null as recurring_pattern,
        s.name as service_name,
        p.name as pet_name,
        p.type as pet_type,
        u.name as owner_name,
        p.breed,
        u.phone as owner_phone,
        a.line1,
        a.city,
        a.state,
        'recurring_session' as booking_type,
        rb.sequence_number,
        rb.payment_status
      FROM recurring_booking rb
      LEFT JOIN services s ON rb.service_id = s.id
      LEFT JOIN pets p ON rb.pet_id = p.id
      LEFT JOIN users u ON rb.user_id = u.id
      LEFT JOIN bookings b ON rb.booking_id::text = b.id
      LEFT JOIN addresses a ON u.id = a.user_id
      WHERE rb.sitter_id = ${sitterId}
    `

    console.log("Regular bookings query result:", regularBookingsResult)
    console.log("Recurring bookings query result:", recurringBookingsResult)

    // Combine both types of bookings
    const allBookings = [
      ...(Array.isArray(regularBookingsResult) ? regularBookingsResult : []),
      ...(Array.isArray(recurringBookingsResult) ? recurringBookingsResult : []),
    ]

    const formattedBookings = allBookings.map((booking: any) => ({
      id: booking.id,
      date: booking.date,
      time: booking.time,
      service: booking.service_name || "Service",
      breed: booking.breed,
      petName: booking.pet_name || "Pet",
      petType: booking.pet_type || "Unknown",
      ownerName: booking.owner_name || "Owner",
      ownerPhone: booking.owner_phone || "",
      location:
        `${booking.line1 || ""}, ${booking.city || ""}, ${booking.state || ""}`.trim().replace(/^,|,$/, "") ||
        "Location not specified",
      status: booking.status ? booking.status.toLowerCase() : "pending",
      duration: booking.duration || 60,
      amount: Number.parseFloat(booking.total_price) || 0,
      notes: booking.notes,
      recurring: booking.is_recurring || false,
      recurringPattern: booking.recurring_pattern,
      bookingType: booking.booking_type,
      sequenceNumber: booking.sequence_number,
      paymentStatus: booking.payment_status,
    }))

    // Sort by date and time
    formattedBookings.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`)
      const dateB = new Date(`${b.date} ${b.time}`)
      return dateB.getTime() - dateA.getTime()
    })

    console.log("Formatted bookings:", formattedBookings)

    return NextResponse.json(formattedBookings)
  } catch (error) {
    console.error("Error fetching sitter bookings:", error)
    // Return empty array on error to prevent frontend crashes
    return NextResponse.json([])
  }
}
