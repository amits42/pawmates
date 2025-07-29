import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("🔍 Fetching upcoming booking for user:", userId)

    // Query for the next upcoming booking using sitters -> users join
    const upcomingBookings = await sql`
      SELECT 
        b.id,
        b.date,
        b.time,
        b.status,
        b.total_price,
        b.notes,
        s.name as service_name,
        p.name as pet_name,
        p.type as pet_type,
        COALESCE(u.name, 'Sitter not assigned') as sitter_name,
        sit.rating as sitter_rating
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN pets p ON b.pet_id = p.id
      LEFT JOIN sitters sit ON b.sitter_id = sit.id
      LEFT JOIN users u ON sit.user_id = u.id AND u.user_type = 'SITTER'
      WHERE b.user_id = ${userId}
        AND b.status IN ('PENDING', 'CONFIRMED', 'ASSIGNED', 'UPCOMING')
        AND b.date >= CURRENT_DATE
      ORDER BY b.date ASC, b.time ASC
      LIMIT 1
    `

    console.log("📅 Query result:", upcomingBookings)

    if (upcomingBookings.length === 0) {
      return NextResponse.json({ error: "No upcoming booking found" }, { status: 404 })
    }

    const booking = upcomingBookings[0]
    console.log("⏰ Returning upcoming booking:", booking)

    return NextResponse.json(booking)
  } catch (error) {
    console.error("❌ Error fetching upcoming booking:", error)
    return NextResponse.json({ error: "Failed to fetch upcoming booking" }, { status: 500 })
  }
}
