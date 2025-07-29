import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Helper function to get the authenticated user ID from the request
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const userId = request.headers.get("x-user-id")
  return userId ?? null
}

// Helper function to calculate recurring session dates
function calculateRecurringDates(
  startDate: string,
  endDate: string,
  pattern: string,
  time: string,
): Array<{ date: string; time: string; sequenceNumber: number }> {
  const sessions: Array<{ date: string; time: string; sequenceNumber: number }> = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  let sequenceNumber = 1

  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }

  if (pattern.startsWith("weekly")) {
    const [, intervalStr, daysStr] = pattern.split("_")
    const interval = parseInt(intervalStr, 10)
    const weekdays = daysStr.split(",").map(d => dayMap[d.toLowerCase()])

    let current = new Date(start)

    while (current <= end) {
      const currentWeekStart = new Date(current)

      // Add each target weekday in this interval week
      for (const weekday of weekdays) {
        const sessionDate = new Date(currentWeekStart)
        sessionDate.setDate(sessionDate.getDate() + ((7 + weekday - sessionDate.getDay()) % 7))

        if (sessionDate >= start && sessionDate <= end) {
          const isoDate = sessionDate.toISOString().split("T")[0]
          if (!sessions.find(s => s.date === isoDate)) {
            sessions.push({
              date: isoDate,
              time,
              sequenceNumber: sequenceNumber++,
            })
          }
        }
      }

      // Move to next interval week
      current.setDate(current.getDate() + interval * 7)
    }

  } else if (pattern.startsWith("monthly")) {
    const [, monthIntervalStr, nthStr, weekdaysStr] = pattern.split("_")
    const monthInterval = parseInt(monthIntervalStr, 10)
    const nth = parseInt(nthStr, 10)
    const weekdays = weekdaysStr.split(",").map(d => dayMap[d.toLowerCase()])

    const current = new Date(start)

    while (current <= end) {
      const year = current.getFullYear()
      const month = current.getMonth()

      for (const weekday of weekdays) {
        const date = getNthWeekdayOfMonth(year, month, weekday, nth)
        if (date && date >= start && date <= end) {
          sessions.push({
            date: date.toISOString().split("T")[0],
            time,
            sequenceNumber: sequenceNumber++,
          })
        }
      }

      // Move to next applicable month
      current.setMonth(current.getMonth() + monthInterval)
      current.setDate(1)
    }
  }

  return sessions
}

// Helper to get Nth weekday of a given month
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date | null {
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay()
  const offset = (7 + weekday - firstDayOfWeek) % 7
  const day = 1 + offset + (nth - 1) * 7
  const result = new Date(year, month, day)
  return result.getMonth() === month ? result : null
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Fetching bookings from database...")

    // Get user ID from authentication
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      console.error("❌ No authenticated user found")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("👤 Fetching bookings for user:", userId)

    // Query bookings from database with proper joins to get sitter details and OTPs
    const bookings = await sql`
      SELECT 
        b.id,
        b.user_id,
        b.pet_id,
        b.service_id,
        b.sitter_id,
        b.address_id,
        b.date,
        b.time,
        b.duration,
        b.status,
        b.total_price,
        b.payment_status,
        b.payment_id,
        b.notes,
        b.is_recurring,
        b.recurring_pattern,
        b.recurring_end_date,
        b.service_otp,
        b.otp_expiry,
        b.otp_verified,
        b.actual_start_time,
        b.actual_end_time,
        b.actual_duration,
        b.created_at,
        b.updated_at,
        p.name as pet_name,
        p.type as pet_type,
        p.breed as pet_breed,
        s.name as service_name,
        s.description as service_description,
        s.price as service_price,
        s.duration as service_duration,
        sit.bio as sitter_bio,
        sit.rating as sitter_rating,
        sit.profile_picture as sitter_profile_picture,
        u.name as sitter_name,
        u.phone as sitter_phone,
        u.email as sitter_email,
        -- Get START and END OTPs from service_otps table
        start_otp.otp as start_otp,
        end_otp.otp as end_otp
      FROM bookings b
      LEFT JOIN pets p ON b.pet_id = p.id
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN sitters sit ON b.sitter_id = sit.id
      LEFT JOIN users u ON sit.user_id = u.id
      LEFT JOIN service_otps start_otp ON b.id = start_otp.booking_id AND start_otp.type = 'START'
      LEFT JOIN service_otps end_otp ON b.id = end_otp.booking_id AND end_otp.type = 'END'
      WHERE b.user_id = ${userId}
      ORDER BY b.created_at DESC
    `

    console.log(`✅ Found ${bookings.length} bookings`)

    // Log OTP data for debugging
    bookings.slice(0, 3).forEach((booking, index) => {
      console.log(`🔐 Booking ${index + 1} OTP data:`, {
        id: booking.id,
        service_otp: booking.service_otp,
        start_otp: booking.start_otp,
        end_otp: booking.end_otp,
      })
    })

    // Transform the data to match the expected format
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      userId: booking.user_id,
      petId: booking.pet_id,
      serviceId: booking.service_id,
      sitterId: booking.sitter_id,
      addressId: booking.address_id,
      date: booking.date,
      time: booking.time,
      duration: booking.duration,
      status: booking.status,
      totalPrice: Number.parseFloat(booking.total_price || "0"),
      paymentStatus: booking.payment_status,
      paymentId: booking.payment_id,
      notes: booking.notes,
      recurring: booking.is_recurring,
      recurringPattern: booking.recurring_pattern,
      recurringEndDate: booking.recurring_end_date,
      serviceOtp: booking.service_otp, // Legacy field
      otpExpiry: booking.otp_expiry,
      otpVerified: booking.otp_verified,
      actualStartTime: booking.actual_start_time,
      actualEndTime: booking.actual_end_time,
      actualDuration: booking.actual_duration,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
      // Related data
      petName: booking.pet_name,
      petType: booking.pet_type,
      petBreed: booking.pet_breed,
      serviceName: booking.service_name,
      serviceDescription: booking.service_description,
      servicePrice: Number.parseFloat(booking.service_price || "0"),
      serviceDuration: booking.service_duration,
      // Sitter data from proper joins
      sitter_name: booking.sitter_name,
      sitter_phone: booking.sitter_phone,
      sitter_email: booking.sitter_email,
      sitterName: booking.sitter_name,
      caretakerName: booking.sitter_name,
      sitterRating: Number.parseFloat(booking.sitter_rating || "0"),
      sitterImage: booking.sitter_profile_picture,
      // NEW: START and END OTPs
      startOtp: booking.start_otp,
      endOtp: booking.end_otp,
    }))

    console.log("✅ Bookings formatted and ready to send")
    return NextResponse.json(formattedBookings)
  } catch (error) {
    console.error("❌ Database error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch bookings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 Creating new booking...")
    const bookingData = await request.json()
    console.log("📥 Booking data received:", JSON.stringify(bookingData, null, 2))

    // Get user ID from authentication
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      console.error("❌ No authenticated user found")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("👤 Creating booking for user:", userId)

    // Validate required fields
    if (!bookingData.petId || !bookingData.serviceId || !bookingData.date || !bookingData.time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if pet exists and belongs to user
    const pets = await sql`SELECT id FROM pets WHERE id = ${bookingData.petId} AND user_id = ${userId}`
    if (pets.length === 0) {
      return NextResponse.json({ error: "Pet not found or access denied" }, { status: 404 })
    }

    // Check if service exists
    const services = await sql`SELECT id, price FROM services WHERE id = ${bookingData.serviceId}`
    if (services.length === 0) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    const servicePrice = Number.parseFloat(services[0].price || "0")

    // Determine payment status based on payment option
    let paymentStatus = "PENDING"
    if (bookingData.paymentOption === "pay-now") {
      paymentStatus = "PAID"
    }

    console.log(`💳 Payment option: ${bookingData.paymentOption}, setting paymentStatus to: ${paymentStatus}`)

    // Create main booking entry first
    console.log("💾 Creating main booking in database...")
    const newBookings = await sql`
      INSERT INTO bookings (
        user_id, pet_id, service_id, address_id,
        date, time, duration, status, total_price, payment_status,
        payment_id, notes, is_recurring, recurring_pattern, 
        recurring_end_date, service_otp, otp_expiry, created_at, updated_at
      ) VALUES (
        ${userId}, 
        ${bookingData.petId}, 
        ${bookingData.serviceId}, 
        ${bookingData.addressId || null},
        ${bookingData.date}, 
        ${bookingData.time}, 
        ${bookingData.duration || 60},
        'PENDING', 
        ${bookingData.totalPrice || servicePrice}, 
        ${paymentStatus},
        ${bookingData.paymentId || null}, 
        ${bookingData.notes || "Booking created via payment flow"},
        ${bookingData.recurring || false}, 
        ${bookingData.recurringPattern || null},
        ${bookingData.recurringEndDate || null}, 
        ${null}, 
        ${null},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    const newBooking = newBookings[0]
    console.log("✅ Main booking created successfully with ID:", newBooking.id)

    // Handle recurring bookings (pay-later flow)
    if (
      bookingData.recurring &&
      bookingData.recurringPattern &&
      bookingData.recurringEndDate &&
      bookingData.paymentOption === "pay-later"
    ) {
      console.log("🔄 Processing recurring booking sessions...")

      // Calculate all session dates
      const sessions = calculateRecurringDates(
        bookingData.date,
        bookingData.recurringEndDate,
        bookingData.recurringPattern,
        bookingData.time,
      )

      console.log(`📅 Calculated ${sessions.length} recurring sessions`)

      // Create recurring_booking entries for each session
      for (const session of sessions) {
        console.log(`📝 Creating recurring booking session ${session.sequenceNumber}...`)

        const recurringBookingResult = await sql`
          INSERT INTO recurring_booking (
            user_id, pet_id, service_id, sitter_id, booking_id,
            sequence_number, session_date, session_time, duration,
            session_price, status, payment_status, notes, created_at, updated_at
          ) VALUES (
            ${userId},
            ${bookingData.petId},
            ${bookingData.serviceId},
            ${null}, -- sitter_id will be assigned later
            ${newBooking.id},
            ${session.sequenceNumber},
            ${session.date},
            ${session.time},
            ${bookingData.duration || 60},
            ${servicePrice},
            'PENDING',
            'PENDING',
            ${`Session ${session.sequenceNumber} of recurring booking`},
            NOW(),
            NOW()
          )
          RETURNING *
        `

        const recurringBooking = recurringBookingResult[0]
        console.log(`✅ Recurring booking session ${session.sequenceNumber} created with ID:`, recurringBooking.id)

        // Generate OTPs for this recurring session
        const startOtp = Math.floor(100000 + Math.random() * 900000).toString()
        const endOtp = Math.floor(100000 + Math.random() * 900000).toString()

        console.log(`🔐 Generating OTPs for session ${session.sequenceNumber}:`)
        console.log(`   START OTP: ${startOtp}`)
        console.log(`   END OTP: ${endOtp}`)

        // Create START OTP for this recurring session
        await sql`
          INSERT INTO service_otps (booking_id, recurring_booking_id, type, otp, is_used, created_at)
          VALUES (${null}, ${recurringBooking.id}, 'START', ${startOtp}, false, NOW())
        `

        // Create END OTP for this recurring session
        await sql`
          INSERT INTO service_otps (booking_id, recurring_booking_id, type, otp, is_used, created_at)
          VALUES (${null}, ${recurringBooking.id}, 'END', ${endOtp}, false, NOW())
        `

        console.log(`✅ OTPs created for recurring session ${session.sequenceNumber}`)
      }

      console.log("🎉 All recurring booking sessions and OTPs created successfully!")

      return NextResponse.json({
        success: true,
        message: `Recurring booking created successfully with ${sessions.length} sessions - payment pending`,
        bookingId: newBooking.id,
        sessionsCreated: sessions.length,
        paymentStatus: paymentStatus,
        totalAmount: bookingData.totalPrice || servicePrice * sessions.length,
      })
    } else {
      // Handle single booking (existing flow)
      console.log("📝 Processing single booking...")

      // Generate OTPs for single booking
      const serviceOtp = Math.floor(100000 + Math.random() * 900000).toString() // Legacy
      const startOtp = Math.floor(100000 + Math.random() * 900000).toString()
      const endOtp = Math.floor(100000 + Math.random() * 900000).toString()

      console.log(`🔐 Generated OTPs for single booking:`)
      console.log(`   Legacy Service OTP: ${serviceOtp}`)
      console.log(`   START OTP: ${startOtp}`)
      console.log(`   END OTP: ${endOtp}`)

      // Update booking with legacy service OTP
      await sql`
        UPDATE bookings 
        SET service_otp = ${serviceOtp}, otp_expiry = ${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}
        WHERE id = ${newBooking.id}
      `

      // Create START and END OTPs for single booking
      try {
        // Insert START OTP
        await sql`
          INSERT INTO service_otps (booking_id, recurring_booking_id, type, otp, is_used, created_at)
          VALUES (${newBooking.id}, ${null}, 'START', ${startOtp}, false, NOW())
        `

        // Insert END OTP
        await sql`
          INSERT INTO service_otps (booking_id, recurring_booking_id, type, otp, is_used, created_at)
          VALUES (${newBooking.id}, ${null}, 'END', ${endOtp}, false, NOW())
        `

        console.log("✅ Single booking OTPs created successfully")
      } catch (otpError) {
        console.error("❌ ERROR creating service OTPs:", otpError)
      }

      // Handle payment logging for pay-now bookings
      if (bookingData.paymentOption === "pay-now" && bookingData.paymentId) {
        try {
          // Update payment with booking ID
          await sql`
            UPDATE payments 
            SET booking_id = ${newBooking.id}
            WHERE id = ${bookingData.paymentId}
          `

          // Log booking creation
          await sql`
            SELECT log_payment_event(
              ${bookingData.paymentId}, 'booking_created', 'CAPTURED', 'CAPTURED',
              ${JSON.stringify({
            booking_id: newBooking.id,
            service_otp: serviceOtp,
            start_otp: startOtp,
            end_otp: endOtp,
          })},
              NULL, ${request.headers.get("x-forwarded-for")}, ${request.headers.get("user-agent")}
            )
          `
        } catch (paymentError) {
          console.error("❌ Error handling payment logging:", paymentError)
        }
      }

      console.log("🎉 Single booking creation completed successfully!")

      return NextResponse.json({
        success: true,
        message:
          bookingData.paymentOption === "pay-now"
            ? "Payment verified and booking created successfully"
            : "Booking created successfully - payment pending",
        bookingId: newBooking.id,
        serviceOtp: serviceOtp,
        startOtp: startOtp,
        endOtp: endOtp,
        paymentId: bookingData.paymentOption === "pay-now" ? bookingData.paymentId : null,
        paymentStatus: paymentStatus,
      })
    }
  } catch (error) {
    console.error("❌ Error creating booking:", error)
    return NextResponse.json(
      {
        error: "Failed to create booking",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
