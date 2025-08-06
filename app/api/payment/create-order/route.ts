import { type NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"
import { sql } from "@vercel/postgres"


export async function POST(request: NextRequest) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
    console.log("✅ Razorpay instance created")


    const body = await request.json()
    const { bookingData } = body

    console.log("📋 Booking data received:", bookingData)

    // Validate required fields
    if (!bookingData?.serviceId || !bookingData?.petId) {
      return NextResponse.json({ error: "Missing required booking data" }, { status: 400 })
    }

    // Get user from request headers or body
    const userId = request.headers.get("x-user-id") || bookingData.userId
    if (!userId) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 })
    }

    // 🔒 SECURITY: Server-side price validation
    console.log("🔍 Validating service price...")
    const serviceResult = await sql`
      SELECT id, name, price, duration 
      FROM services 
      WHERE id = ${bookingData.serviceId} AND is_active = true
    `

    if (serviceResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid service selected" }, { status: 400 })
    }
    const service = serviceResult.rows[0]
    let expectedAmount = 0;
    if (bookingData.recurringPattern && bookingData.recurringPattern) {
      const sessions = calculateRecurringSessions(bookingData.date, bookingData.recurringEndDate, bookingData.recurringPattern)
      expectedAmount = sessions * Number.parseFloat(service.price)
    } else {
      expectedAmount = Number.parseFloat(service.price)
    }

    // 🔒 SECURITY: Validate amount matches service price
    if (Math.abs(expectedAmount - Number.parseFloat(bookingData.totalPrice)) > 0.01) {
      console.error("❌ Price mismatch detected!", {
        expected: expectedAmount,
        received: bookingData.totalPrice,
      })

      return NextResponse.json({ error: "Price validation failed. Please refresh and try again." }, { status: 400 })
    }

    // Convert amount to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(expectedAmount * 100)

    console.log("💳 Creating Razorpay order with amount:", amountInPaise, "paise")

    // Add this right before razorpay.orders.create()
    const orderParams = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `booking_${Date.now()}`,
      notes: {
        booking_type: "pet_care_service",
        service_id: bookingData.serviceId,
        pet_id: bookingData.petId,
        user_id: userId,
        service_name: service.name,
      },
    }

    console.log("📤 Sending to Razorpay:", JSON.stringify(orderParams, null, 2))

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create(orderParams)

    console.log("✅ Razorpay order response:", JSON.stringify(razorpayOrder, null, 2))
    console.log("🔍 Order ID specifically:", razorpayOrder?.id)
    console.log("🔍 Order object keys:", Object.keys(razorpayOrder || {}))

    // Create payment record in database
    const paymentResult = await sql`
      INSERT INTO payments (
        user_id, service_id, amount, currency, expected_amount,
        razorpay_order_id, status, razorpay_response
      ) VALUES (
        ${userId}, ${bookingData.serviceId}, ${expectedAmount}, 'INR', ${expectedAmount},
        ${razorpayOrder.id}, 'CREATED', ${JSON.stringify(razorpayOrder)}
      ) RETURNING id
    `

    const paymentId = paymentResult.rows[0].id

    // Log payment creation
    await sql`
      SELECT log_payment_event(
        ${paymentId}, 'order_created', NULL, 'CREATED',
        ${JSON.stringify({ razorpay_order_id: razorpayOrder.id, amount: expectedAmount })},
        NULL, ${request.headers.get("x-forwarded-for")}, ${request.headers.get("user-agent")}
      )
    `

    console.log("💾 Payment record created with ID:", paymentId)

    // Return order details for frontend
    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      paymentId: paymentId,
      key: process.env.RAZORPAY_KEY_ID,
      name: "PawMates Pet Care",
      description: `${service.name} for your pet`,
      prefill: {
        name: bookingData.userName || "Pet Owner",
        email: bookingData.userEmail || "",
        contact: bookingData.userPhone || "",
      },
      theme: {
        color: "#3B82F6",
      },
      notes: razorpayOrder.notes,
    })
  } catch (error) {
    console.error("❌ Error creating Razorpay order:", error)

    return NextResponse.json(
      {
        error: "Failed to create payment order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function calculateRecurringSessions(selectedDate: string | number | Date, recurringEndDate: string | number | Date, recurringPattern: string) {

  const startDate = new Date(selectedDate)
  const endDate = new Date(recurringEndDate)

  if (endDate <= startDate) return 0

  const daysOfWeekMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }

  let sessionCount = 0

  if (recurringPattern.startsWith("weekly_")) {
    const [, intervalStr, daysStr] = recurringPattern.split("_")
    const weekInterval = parseInt(intervalStr, 10)
    const days = daysStr.split(",").map(d => daysOfWeekMap[d.toLowerCase()])

    const current = new Date(startDate)

    while (current <= endDate) {
      if (days.includes(current.getDay())) {
        sessionCount++
      }

      // Move to next day
      current.setDate(current.getDate() + 1)

      // If we pass a week, skip forward by (interval - 1) weeks
      const daysSinceStart = Math.floor((current.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceStart % (weekInterval * 7) === 0) {
        // already aligned by day increment
      }
    }

  } else if (recurringPattern.startsWith("monthly_")) {
    const [, intervalStr, nthStr, daysStr] = recurringPattern.split("_")
    const monthInterval = parseInt(intervalStr, 10)
    const nth = parseInt(nthStr, 10)
    const weekdays = daysStr.split(",").map(d => daysOfWeekMap[d.toLowerCase()])

    const current = new Date(startDate)

    while (current <= endDate) {
      const year = current.getFullYear()
      const month = current.getMonth()

      for (const weekday of weekdays) {
        const date = getNthWeekdayOfMonth(year, month, weekday, nth)
        if (date && date >= startDate && date <= endDate) {
          sessionCount++
        }
      }

      // Move to next interval month
      current.setMonth(current.getMonth() + monthInterval)
      current.setDate(1) // reset to start of month
    }
  }

  return sessionCount
}

// Utility: Get Nth weekday in a month (e.g., 3rd Tuesday of June 2025)
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date | null {
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay()
  const offset = (7 + weekday - firstDayOfWeek) % 7
  const date = 1 + offset + (nth - 1) * 7
  const result = new Date(year, month, date)
  return result.getMonth() === month ? result : null
}
