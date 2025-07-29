import { sql } from "@vercel/postgres";
import nodemailer from "nodemailer";

// ✅ Nodemailer transporter (update SMTP settings)
const transporter = nodemailer.createTransport({
  host: "smtp.zeptomail.in",
  port: 587,
  auth: {
    user: process.env.ZOHO_ZEPTO_SMTP_USER,
    pass: process.env.ZOHO_ZEPTO_SMTP_PASS,
  },
});

/**
 * Send booking confirmation email
 * @param {Object} params
 * @param {string} [params.bookingId]
 */
export async function sendBookingEmail({ bookingId, recurringBookingId }) {
  try {
    // 🔥 Fetch booking details
    let bookingDetails;
    if (bookingId) {
      const result = await sql`
        SELECT b.*, u.email AS user_email, u.name AS user_name
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.id = ${bookingId};
      `;
      if (result.rowCount === 0) throw new Error(`Booking ID ${bookingId} not found`);
      bookingDetails = result.rows[0];
    }
    else if (recurringBookingId) {
      const result = await sql`
        SELECT rb.*, u.email AS user_email, u.name AS user_name
        FROM recurring_bookings rb
        JOIN users u ON rb.user_id = u.id
        WHERE rb.id = ${recurringBookingId};
      `;
      if (result.rowCount === 0) throw new Error(`Recurring Booking ID ${recurringBookingId} not found`);
      bookingDetails = result.rows[0];
    }
    else {
      throw new Error("Provide either bookingId or recurringBookingId");
    }

    const { user_email, user_name, id, date, time, total_price, session_date, session_time } = bookingDetails;

    const bookingDate = date || session_date;
    const bookingTime = time || session_time;
    const price = total_price || bookingDetails.session_price;

    // 🌟 Beautiful HTML email template with pet icons
    const logoUrl = "https://yourdomain.com/logo.png"; // replace with your logo URL
    const heroImage = "https://cdn-icons-png.flaticon.com/512/616/616408.png"; // cute paw print
    const appUrl = `https://www.zubopets.com/booking-details/${id}`; // ✅ dynamic booking details page

    const userHtml = `
      <div style="font-family: Arial, sans-serif; background: #fdf6f0; padding: 20px; color: #333;">
        <table style="max-width: 600px; margin: auto; background: #fff; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <tr>
            <td style="text-align: center; background: #ffbb73; padding: 20px;">
              <img src="${logoUrl}" alt="Logo" style="height: 50px;" />
            </td>
          </tr>
          <tr>
            <td style="text-align: center;">
              <img src="${heroImage}" alt="Booking Confirmed" style="width: 120px; margin: 20px auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 20px;">
              <h2 style="color: #e07a5f;">Hi ${user_name} 🐾</h2>
              <p style="font-size: 18px;">🎉 <strong>Your booking has been confirmed!</strong></p>
              <p style="margin: 15px 0; font-size: 16px; line-height: 1.5;">
                <strong>🐶 Booking ID:</strong> ${id}<br/>
                <strong>📅 Date:</strong> ${bookingDate}<br/>
                <strong>⏰ Time:</strong> ${bookingTime}<br/>
                <strong>💳 Total Price:</strong> ₹${price}
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}" style="background: #81b29a; color: #fff; padding: 12px 25px; border-radius: 30px; text-decoration: none; font-size: 16px;">🐾 View Booking</a>
              </div>
              <p style="margin-top: 20px; color: #555; font-size: 14px;">Thank you for choosing us to care for your furry friend! ❤️</p>
            </td>
          </tr>
          <tr>
            <td style="background: #f1f1f1; text-align: center; font-size: 12px; color: #777; padding: 10px;">
              🐾 Your Pet Service Team<br/>
              <span style="font-size: 11px;">© ${new Date().getFullYear()} Zubopets</span>
            </td>
          </tr>
        </table>
      </div>
    `;

    const adminHtml = `
      <div style="font-family: Arial, sans-serif; background: #fff; padding: 20px; color: #333;">
        <h2 style="color: #e91e63;">📢 New Booking Alert! 🐾</h2>
        <p><strong>User:</strong> ${user_name} (${user_email})</p>
        <p><strong>Booking ID:</strong> ${id}</p>
        <p><strong>Date:</strong> ${bookingDate}</p>
        <p><strong>Time:</strong> ${bookingTime}</p>
        <p><strong>Total Price:</strong> ₹${price}</p>
        <p>✅ Please verify and take necessary action.</p>
      </div>
    `;

    // ✅ Send email to user
    await transporter.sendMail({
      from: 'notifications@zubopets.com',
      to: user_email,
      subject: "🎉 Your Pet’s Booking is Confirmed! 🐾",
      html: userHtml,
    });
    console.log(`✅ Email sent to user: ${user_email}`);

    // ✅ Send email to admin
    await transporter.sendMail({
      from: 'notifications@zubopets.com',
      to: "care@zohomail.com",
      subject: `📢 New Booking: ID ${id}`,
      html: adminHtml,
    });
    console.log("✅ Email sent to admin: care@zohomail.com");
  } catch (error) {
    console.error("❌ Failed to send booking email:", error);
    throw error;
  }
}
