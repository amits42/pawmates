import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ownerId = searchParams.get("ownerId")

    if (!ownerId) {
      return NextResponse.json(
        { success: false, message: "Owner ID is required" },
        { status: 400 }
      )
    }

    const result = await sql`
      SELECT 
        b.id,
        b.date,
        b.time,
        b.duration,
        b.status,
        b.total_price AS amount,
        b.notes,
        b.actual_start_time AS startedAt,
        u.name AS sitterName,
        u.phone AS sitterPhone,
        p.name AS petName
      FROM bookings b
      JOIN sitters s ON b.sitter_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN pets p ON b.pet_id = p.id
      WHERE b.user_id = ${ownerId}
        AND LOWER(b.status) = 'ongoing'
    `

    return NextResponse.json({
      success: true,
      bookings: result,
    })
  } catch (error) {
    console.error("Error fetching ongoing bookings:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
