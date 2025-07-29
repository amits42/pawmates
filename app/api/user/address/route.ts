import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Initialize the SQL client
const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    console.log("📍 Fetching user address from database...")

    // Get user ID from query params
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")
    const phone = url.searchParams.get("phone")

    if (!userId && !phone) {
      return NextResponse.json({ error: "User ID or phone is required" }, { status: 400 })
    }

    let actualUserId = userId

    // If no userId provided, find user by phone
    if (!actualUserId && phone) {
      console.log("🔍 Finding user by phone:", phone)
      const users = await sql`
        SELECT id FROM users WHERE phone = ${phone} LIMIT 1
      `

      if (users.length === 0) {
        console.log("❌ User not found with phone:", phone)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      actualUserId = users[0].id
      console.log("✅ Found user ID:", actualUserId)
    }

    // Get default address with raw SQL
    const addresses = await sql`
      SELECT 
        id,
        user_id as "userId",
        line1,
        line2,
        city,
        state,
        postal_code as "postalCode",
        country,
        latitude,
        longitude,
        landmark,
        is_default as "isDefault",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM addresses
      WHERE user_id = ${actualUserId} AND is_default = true
      LIMIT 1
    `

    if (addresses.length === 0) {
      console.log("❌ Address not found for user:", actualUserId)
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    console.log("✅ Address fetched:", addresses[0])
    return NextResponse.json(addresses[0])
  } catch (error) {
    console.error("❌ Database error:", error)
    return NextResponse.json({ error: "Failed to fetch address" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    console.log("📝 Updating user address...")
    const body = await request.json()
    console.log("📥 Address data received:", body)

    // Get user ID from request body or use phone to find user
    let userId = body.userId
    const phone = body.phone

    if (!userId && !phone) {
      console.log("❌ User ID or phone is required")
      return NextResponse.json({ error: "User ID or phone is required" }, { status: 400 })
    }

    // If no userId provided, find user by phone
    if (!userId && phone) {
      console.log("🔍 Finding user by phone:", phone)
      const users = await sql`
        SELECT id FROM users WHERE phone = ${phone} LIMIT 1
      `

      if (users.length === 0) {
        console.log("❌ User not found with phone:", phone)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      userId = users[0].id
      console.log("✅ Found user ID:", userId)
    }

    // Validate required fields
    if (!body.line1 || !body.city || !body.state || !body.postalCode) {
      console.log("❌ Missing required address fields")
      return NextResponse.json(
        {
          error: "Missing required address fields",
          required: ["line1", "city", "state", "postalCode"],
        },
        { status: 400 },
      )
    }

    console.log("🔄 Processing address for user ID:", userId)

    // Process latitude and longitude
    let latitude = null
    let longitude = null

    if (body.latitude !== undefined && body.latitude !== null) {
      latitude = Number.parseFloat(body.latitude)
      console.log("📍 Parsed latitude:", latitude)
    }

    if (body.longitude !== undefined && body.longitude !== null) {
      longitude = Number.parseFloat(body.longitude)
      console.log("📍 Parsed longitude:", longitude)
    }

    // Find existing default address
    const existingAddresses = await sql`
      SELECT * FROM addresses
      WHERE user_id = ${userId} AND is_default = true
      LIMIT 1
    `

    console.log("🔍 Existing addresses found:", existingAddresses.length)

    let updatedAddress

    if (existingAddresses.length > 0) {
      console.log("🔄 Updating existing address...")
      console.log("📍 Location data:", { latitude, longitude })

      // Update existing address
      const updated = await sql`
        UPDATE addresses
        SET 
          line1 = ${body.line1},
          line2 = ${body.line2 || null},
          city = ${body.city},
          state = ${body.state},
          postal_code = ${body.postalCode},
          country = ${body.country || "India"},
          landmark = ${body.landmark || null},
          latitude = ${latitude},
          longitude = ${longitude},
          updated_at = NOW()
        WHERE id = ${existingAddresses[0].id}
        RETURNING 
          id,
          user_id as "userId",
          line1,
          line2,
          city,
          state,
          postal_code as "postalCode",
          country,
          latitude,
          longitude,
          landmark,
          is_default as "isDefault",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `
      updatedAddress = updated[0]
      console.log("✅ Address updated:", updatedAddress)
    } else {
      console.log("➕ Creating new address...")
      console.log("📍 Location data:", { latitude, longitude })

      // Create new address
      const newAddresses = await sql`
        INSERT INTO addresses (
          user_id,
          line1,
          line2,
          city,
          state,
          postal_code,
          country,
          landmark,
          latitude,
          longitude,
          is_default
        ) VALUES (
          ${userId},
          ${body.line1},
          ${body.line2 || null},
          ${body.city},
          ${body.state},
          ${body.postalCode},
          ${body.country || "India"},
          ${body.landmark || null},
          ${latitude},
          ${longitude},
          true
        )
        RETURNING 
          id,
          user_id as "userId",
          line1,
          line2,
          city,
          state,
          postal_code as "postalCode",
          country,
          latitude,
          longitude,
          landmark,
          is_default as "isDefault",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `
      updatedAddress = newAddresses[0]
      console.log("✅ New address created:", updatedAddress)
    }

    return NextResponse.json({
      success: true,
      message: "Address updated successfully",
      address: updatedAddress,
    })
  } catch (error) {
    console.error("❌ Database error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update address",
        message: "Failed to update address",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Get user ID from request body or use phone to find user
    let userId = body.userId
    const phone = body.phone

    if (!userId && !phone) {
      return NextResponse.json({ error: "User ID or phone is required" }, { status: 400 })
    }

    // If no userId provided, find user by phone
    if (!userId && phone) {
      const users = await sql`
        SELECT id FROM users WHERE phone = ${phone} LIMIT 1
      `

      if (users.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      userId = users[0].id
    }

    // Process latitude and longitude
    let latitude = null
    let longitude = null

    if (body.latitude !== undefined && body.latitude !== null) {
      latitude = Number.parseFloat(body.latitude)
    }

    if (body.longitude !== undefined && body.longitude !== null) {
      longitude = Number.parseFloat(body.longitude)
    }

    // If this is set as default, update other addresses
    if (body.isDefault) {
      await sql`
        UPDATE addresses
        SET is_default = false
        WHERE user_id = ${userId} AND is_default = true
      `
    }

    // Create new address
    const newAddresses = await sql`
      INSERT INTO addresses (
        user_id,
        line1,
        line2,
        city,
        state,
        postal_code,
        country,
        landmark,
        latitude,
        longitude,
        is_default
      ) VALUES (
        ${userId},
        ${body.line1},
        ${body.line2 || null},
        ${body.city},
        ${body.state},
        ${body.postalCode},
        ${body.country},
        ${body.landmark || null},
        ${latitude},
        ${longitude},
        ${body.isDefault || false}
      )
      RETURNING 
        id,
        user_id as "userId",
        line1,
        line2,
        city,
        state,
        postal_code as "postalCode",
        country,
        latitude,
        longitude,
        landmark,
        is_default as "isDefault",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `

    return NextResponse.json(newAddresses[0], { status: 201 })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 })
  }
}
