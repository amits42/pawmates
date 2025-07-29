import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import twilio from "twilio"

const sql = neon(process.env.DATABASE_URL!)
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

// Helper function to get admin phone numbers
async function getAdminPhones(): Promise<string[]> {
  try {
    const admins = await sql`
      SELECT phone FROM admin_contacts 
      WHERE is_active = true
    `

    const adminPhones = admins.map((admin) => admin.phone)

    // Fallback to environment variable if no admins in database
    if (adminPhones.length === 0 && process.env.TWILIO_ADMIN_PHONE) {
      return [process.env.TWILIO_ADMIN_PHONE]
    }

    return adminPhones
  } catch (error) {
    console.error("Error getting admin phones:", error)
    // Fallback to environment variable
    return process.env.TWILIO_ADMIN_PHONE ? [process.env.TWILIO_ADMIN_PHONE] : []
  }
}

async function findActiveChatRooms(senderPhone: string) {
  try {
    console.log("🔍 Finding active chat rooms for:", senderPhone)

    const chatRooms = await sql`
      SELECT 
        wcr.*,
        b.status AS booking_status,
        b.date AS booking_date,
        b.time AS booking_time,
        b.id AS booking_id_num,
        s.name AS service_name,
        p.name AS pet_name,
        u.name AS user_name
      FROM whatsapp_chat_rooms wcr
      LEFT JOIN bookings b ON wcr.booking_id = b.id
      LEFT JOIN services s ON b.service_id = s.id  
      LEFT JOIN pets p ON b.pet_id = p.id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE (
        wcr.user_phone = ${senderPhone} 
        OR wcr.sitter_phone = ${senderPhone}
      )
      AND wcr.status = 'active'
      AND wcr.created_at > NOW() - INTERVAL '7 days'
      AND (
        LOWER(b.status) IN ('pending', 'confirmed', 'assigned', 'ongoing', 'upcoming') 
        OR b.status IS NULL
      )
      ORDER BY wcr.created_at DESC
      LIMIT 5;
    `

    console.log(`📊 Found ${chatRooms.length} active chat rooms`)

    chatRooms.forEach((room, index) => {
      console.log(`📋 Room ${index + 1}:`, {
        id: room.id,
        booking_id: room.booking_id,
        booking_status: room.booking_status,
        service_name: room.service_name,
        pet_name: room.pet_name,
        user_name: room.user_name,
        created_at: room.created_at,
      })
    })

    return chatRooms
  } catch (error) {
    console.error("❌ Error finding chat rooms:", error)
    return []
  }
}

// Function to check if message is a menu response
function parseMenuResponse(messageBody: string): number | null {
  const trimmed = messageBody.trim()
  const number = Number.parseInt(trimmed)

  // Check if it's a valid menu option (1-9)
  if (!isNaN(number) && number >= 1 && number <= 9) {
    return number
  }

  return null
}

// Function to send interactive menu
async function sendChatRoomMenu(senderPhone: string, chatRooms: any[]): Promise<boolean> {
  try {
    let menuMessage = "🤔 **Multiple active chats found!**\n\n"
    menuMessage += "Which booking would you like to message about?\n\n"

    chatRooms.forEach((room, index) => {
      const bookingInfo = room.service_name || "Pet Care Service"
      const petInfo = room.pet_name ? ` for ${room.pet_name}` : ""
      const dateInfo = room.booking_date ? ` (${room.booking_date})` : ""
      const userInfo = room.user_name ? ` by ${room.user_name}` : ""

      menuMessage += `**${index + 1}.** Booking #${room.booking_id}${petInfo}${userInfo}\n`
      menuMessage += `   ${bookingInfo}${dateInfo}\n\n`
    })

    menuMessage += "📱 **Reply with just the number** (1, 2, 3, etc.) to select your booking.\n\n"
    menuMessage += "⏰ This menu will expire in 5 minutes."

    const result = await sendWhatsAppMessage(senderPhone, menuMessage)

    if (result) {
      // Store menu state in database for 5 minutes
      await sql`
        INSERT INTO whatsapp_menu_state (
          phone_number, chat_room_options, expires_at, created_at
        ) VALUES (
          ${senderPhone}, 
          ${JSON.stringify(chatRooms.map((r) => ({ id: r.id, booking_id: r.booking_id })))},
          NOW() + INTERVAL '5 minutes',
          NOW()
        )
        ON CONFLICT (phone_number) 
        DO UPDATE SET 
          chat_room_options = EXCLUDED.chat_room_options,
          expires_at = EXCLUDED.expires_at,
          created_at = EXCLUDED.created_at
      `
      console.log("✅ Menu sent and state stored")
      return true
    }

    return false
  } catch (error) {
    console.error("❌ Error sending menu:", error)
    return false
  }
}

// Function to handle menu response
async function handleMenuResponse(senderPhone: string, selectedOption: number) {
  try {
    // Get menu state
    const menuStates = await sql`
      SELECT * FROM whatsapp_menu_state 
      WHERE phone_number = ${senderPhone} 
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (menuStates.length === 0) {
      await sendWhatsAppMessage(
        senderPhone,
        "⏰ Menu expired or not found. Please send your message again to get a new menu.",
      )
      return null
    }

    const menuState = menuStates[0]
    const options = menuState.chat_room_options

    if (selectedOption < 1 || selectedOption > options.length) {
      await sendWhatsAppMessage(
        senderPhone,
        `❌ Invalid option. Please choose a number between 1 and ${options.length}.`,
      )
      return null
    }

    const selectedRoom = options[selectedOption - 1]

    // Clear menu state
    await sql`
      DELETE FROM whatsapp_menu_state 
      WHERE phone_number = ${senderPhone}
    `

    // Get full chat room details
    const chatRooms = await sql`
      SELECT * FROM whatsapp_chat_rooms 
      WHERE id = ${selectedRoom.id}
    `

    if (chatRooms.length > 0) {
      await sendWhatsAppMessage(senderPhone, `✅ Selected Booking #${selectedRoom.booking_id}. Send your message now!`)
      console.log(`✅ User selected chat room ${selectedRoom.id} for booking ${selectedRoom.booking_id}`)
      return chatRooms[0]
    }

    return null
  } catch (error) {
    console.error("❌ Error handling menu response:", error)
    return null
  }
}

// Helper function to get sender identity for display
function getSenderIdentity(senderPhone: string, chatRoom: any, isForAdmin = false) {
  if (isForAdmin) {
    // Admin sees real identities
    if (senderPhone === chatRoom.user_phone) {
      return `${chatRoom.user_alias || "Pet Owner"} (${senderPhone})`
    } else if (senderPhone === chatRoom.sitter_phone) {
      return `${chatRoom.sitter_alias || "Pet Sitter"} (${senderPhone})`
    } else {
      return `Admin (${senderPhone})`
    }
  } else {
    // Users see anonymous identities
    if (senderPhone === chatRoom.user_phone) {
      return chatRoom.user_alias || "Pet Owner"
    } else if (senderPhone === chatRoom.sitter_phone) {
      return chatRoom.sitter_alias || "Pet Sitter"
    } else {
      return "Support Team"
    }
  }
}

// Helper function to send WhatsApp message
async function sendWhatsAppMessage(to: string, body: string, mediaUrl?: string) {
  try {
    const messageOptions: any = {
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
      body: body,
    }

    if (mediaUrl) {
      messageOptions.mediaUrl = [mediaUrl]
    }

    const message = await twilioClient.messages.create(messageOptions)
    console.log(`✅ Message sent to ${to}: ${message.sid}`)
    return message
  } catch (error) {
    console.error(`❌ Failed to send message to ${to}:`, error)
    return null
  }
}

// Main webhook handler
export async function POST(request: Request) {
  try {
    console.log("📨 Twilio webhook received")
    console.log(request)

    // Parse the incoming request body
    const formData = await request.formData()
    const body = Object.fromEntries(formData.entries())
    console.log(body)
    const { From, To, Body: MessageBody, MessageSid, MediaUrl0, MediaContentType0, NumMedia } = body as any

    // Extract phone number (remove whatsapp: prefix if present)
    const senderPhone = From?.replace("whatsapp:", "") || ""
    const twilioNumber = To?.replace("whatsapp:", "") || ""

    if (!senderPhone || !twilioNumber) {
      console.error("❌ Missing sender or recipient phone number")
      return NextResponse.json({ error: "Missing phone numbers" }, { status: 400 })
    }

    console.log("📥 Processing message:", {
      from: senderPhone,
      body: MessageBody,
      hasMedia: NumMedia && Number.parseInt(NumMedia) > 0,
    })

    // Check if this is a menu response (just a number)
    const menuOption = parseMenuResponse(MessageBody || "")
    if (menuOption !== null) {
      console.log(`🔢 Menu response detected: ${menuOption}`)
      const selectedRoom = await handleMenuResponse(senderPhone, menuOption)

      if (selectedRoom) {
        // Store the selected room temporarily for the next message
        await sql`
          INSERT INTO whatsapp_selected_room (
            phone_number, chat_room_id, expires_at
          ) VALUES (
            ${senderPhone}, ${selectedRoom.id}, NOW() + INTERVAL '10 minutes'
          )
          ON CONFLICT (phone_number)
          DO UPDATE SET 
            chat_room_id = EXCLUDED.chat_room_id,
            expires_at = EXCLUDED.expires_at
        `
      }

      return NextResponse.json({ status: "menu_response_handled" })
    }

    // Check if user has a recently selected room
    let chatRoom = null
    const selectedRooms = await sql`
      SELECT wcr.* FROM whatsapp_selected_room wsr
      JOIN whatsapp_chat_rooms wcr ON wsr.chat_room_id = wcr.id
      WHERE wsr.phone_number = ${senderPhone} 
        AND wsr.expires_at > NOW()
    `

    if (selectedRooms.length > 0) {
      chatRoom = selectedRooms[0]
      console.log("✅ Using recently selected chat room:", chatRoom.id)

      // Clear the selection after use
      await sql`
        DELETE FROM whatsapp_selected_room 
        WHERE phone_number = ${senderPhone}
      `
    } else {
      // Find active chat rooms with intelligent filtering
      const activeChatRooms = await findActiveChatRooms(senderPhone)

      if (activeChatRooms.length === 0) {
        console.log("❌ No active chat rooms found for sender:", senderPhone)
        await sendWhatsAppMessage(
          senderPhone,
          "Sorry, no active chat found. Please start a new chat from the app or contact support if you need assistance.",
        )
        return NextResponse.json({ status: "no_active_chat_room" })
      } else if (activeChatRooms.length === 1) {
        // Single active room - use it directly
        chatRoom = activeChatRooms[0]
        console.log("✅ Single active chat room found:", chatRoom.id)
      } else {
        // Multiple active rooms - send menu
        console.log(`🤔 Multiple active chat rooms found (${activeChatRooms.length}), sending menu`)
        const menuSent = await sendChatRoomMenu(senderPhone, activeChatRooms)

        if (menuSent) {
          return NextResponse.json({
            status: "menu_sent",
            rooms_found: activeChatRooms.length,
          })
        } else {
          // Fallback to most recent if menu fails
          chatRoom = activeChatRooms[0]
          console.log("⚠️ Menu failed, using most recent room:", chatRoom.id)
        }
      }
    }

    if (!chatRoom) {
      console.log("❌ No chat room available")
      return NextResponse.json({ status: "no_chat_room" })
    }

    console.log("✅ Using chat room:", chatRoom.id, "for booking:", chatRoom.booking_id)

    // Get admin phone numbers
    const adminPhones = await getAdminPhones()

    // Determine who to forward the message to
    let recipientPhones: string[] = []

    if (senderPhone === chatRoom.user_phone) {
      // Message from user -> forward to sitter and admins
      if (chatRoom.sitter_phone) {
        recipientPhones.push(chatRoom.sitter_phone)
      }
      recipientPhones.push(...adminPhones)
    } else if (senderPhone === chatRoom.sitter_phone) {
      // Message from sitter -> forward to user and admins
      recipientPhones.push(chatRoom.user_phone)
      recipientPhones.push(...adminPhones)
    } else if (adminPhones.includes(senderPhone)) {
      // Message from admin -> forward to user and sitter
      recipientPhones.push(chatRoom.user_phone)
      if (chatRoom.sitter_phone) {
        recipientPhones.push(chatRoom.sitter_phone)
      }
    }

    // Remove sender from recipients and deduplicate
    recipientPhones = [...new Set(recipientPhones.filter((phone) => phone !== senderPhone))]

    console.log("📤 Forwarding to:", recipientPhones)

    // Forward message to all recipients
    const forwardPromises = recipientPhones.map(async (recipientPhone) => {
      const isAdmin = adminPhones.includes(recipientPhone)
      const senderIdentity = getSenderIdentity(senderPhone, chatRoom, isAdmin)

      let messageBody = `*${senderIdentity}:*\n${MessageBody || ""}`

      // Add booking context for clarity
      if (MessageBody && MessageBody.trim()) {
        messageBody = `*${senderIdentity}* (Booking #${chatRoom.booking_id}):\n${MessageBody}`
      } else if (MediaUrl0) {
        messageBody = `*${senderIdentity}* (Booking #${chatRoom.booking_id}) sent a ${MediaContentType0?.split("/")[0] || "file"}`
      }

      return sendWhatsAppMessage(recipientPhone, messageBody, MediaUrl0)
    })

    const results = await Promise.allSettled(forwardPromises)
    const successCount = results.filter((r) => r.status === "fulfilled").length

    console.log(`✅ Forwarded to ${successCount}/${recipientPhones.length} recipients`)

    // Log message in database
    try {
      await sql`
        INSERT INTO whatsapp_messages (
          chat_room_id, sender_phone, recipient_phones, 
          message_body, message_type, media_url, 
          twilio_message_sid, status
        ) VALUES (
          ${chatRoom.id}, ${senderPhone}, ${recipientPhones},
          ${MessageBody || ""}, ${MediaUrl0 ? "media" : "text"}, ${MediaUrl0 || null},
          ${MessageSid}, 'forwarded'
        )
      `
      console.log("✅ Message logged to database")
    } catch (dbError) {
      console.error("❌ Failed to log message:", dbError)
    }

    return NextResponse.json({
      status: "success",
      forwarded_to: recipientPhones.length,
      chat_room_id: chatRoom.id,
      booking_id: chatRoom.booking_id,
    })
  } catch (error) {
    console.error("❌ Webhook error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Handle GET requests (for webhook verification)
export async function GET() {
  return NextResponse.json({ status: "Twilio WhatsApp webhook endpoint active" })
}
