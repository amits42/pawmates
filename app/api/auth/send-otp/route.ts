import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { phone, userType = "PET_OWNER" } = await request.json()

    if (!phone) {
      return NextResponse.json({ success: false, message: "Phone number is required" }, { status: 400 })
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ success: false, message: "Invalid phone number format" }, { status: 400 })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    console.log(`📱 Generating OTP for: ${phone}`)
    console.log(`🔐 Generated OTP: ${otp}`)
    console.log(`👤 User type: ${userType}`)

    // Check if user exists
    const existingUsers = await sql`
      SELECT id FROM users
      WHERE phone = ${phone} AND is_active = true
    `

    let userId = null
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id
    }

    // Delete any existing OTPs for this phone
    await sql`
      DELETE FROM otp_codes 
      WHERE phone = ${phone}
    `

    // Store OTP in database with correct user_type
    await sql`
      INSERT INTO otp_codes (
        user_id,
        phone,
        code,
        user_type,
        expires_at,
        is_used,
        created_at
      ) VALUES (
        ${userId},
        ${phone},
        ${otp},
        ${userType},
        ${expiresAt.toISOString()},
        false,
        NOW()
      )
    `

    console.log(`💾 OTP saved to database for ${phone} with user_type: ${userType}`)

    // Send OTP via WhatsApp (mock for now)
    await sendOTPViaWhatsApp(phone, otp)

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to your WhatsApp",
      userId,
      expiresAt: expiresAt.toISOString(),
      expiresIn: "10 minutes",
      // Include OTP in development for testing
      otp,
    })
  } catch (error) {
    console.error("❌ Error sending OTP:", error)
    return NextResponse.json({ success: false, message: "Failed to send OTP" }, { status: 500 })
  }
}

async function sendOTPViaWhatsApp(phone: string, otp: string): Promise<boolean> {
  const message = `🔐 Your PetCare OTP

Your verification code is: ${otp}

⏰ This code expires in 10 minutes
🔒 Do not share this code with anyone

Welcome to PetCare! 🐾`

  console.log(`📲 WhatsApp message sent to ${phone}:`)
  console.log(message)

  // Mock successful sending
  return true
}
