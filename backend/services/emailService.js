import nodemailer from "nodemailer";

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

// Send booking confirmation
const sendBookingConfirmation = async (booking) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error("Gmail email configuration is missing.");
  }

  // Create transporter after environment variables are loaded
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });

  const journeyDate = new Date(booking.journeyDate).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    }
  );

  const mailOptions = {
    from: `"Where Is My Train" <${emailUser}>`,
    to: booking.userEmail,
    subject: `Booking Confirmation - ${booking.pnr}`,

    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #ddd;border-radius:12px;">

        <h2 style="color:#2563eb;">Where Is My Train</h2>

        <h3 style="color:green;">Demo Booking Confirmed!</h3>

        <p>Hello ${escapeHTML(booking.userName)},</p>

        <p>Your demo train booking has been successfully saved.</p>

        <div style="background:#f3f4f6;padding:16px;border-radius:8px;">

          <h3>Booking Details</h3>

          <p><b>Demo PNR:</b> ${escapeHTML(booking.pnr)}</p>

          <p><b>Train:</b> ${escapeHTML(booking.trainNumber)} - ${escapeHTML(booking.trainName)}</p>

          <p><b>From:</b> ${escapeHTML(booking.from)}</p>

          <p><b>To:</b> ${escapeHTML(booking.to)}</p>

          <p><b>Journey Date:</b> ${escapeHTML(journeyDate)}</p>

          <p><b>Passenger:</b> ${escapeHTML(booking.passengerName)}</p>

          <p><b>Age:</b> ${escapeHTML(booking.passengerAge)}</p>

          <p><b>Gender:</b> ${escapeHTML(booking.passengerGender || "Not provided")}</p>

          <p><b>Class:</b> ${escapeHTML(booking.travelClass)}</p>

          <p><b>Status:</b> Demo Confirmed</p>

        </div>

        <p style="color:#dc2626;font-weight:bold;">
          This is a demonstration booking, not a valid railway ticket.
        </p>

        <p>Thank you for using Where Is My Train!</p>

        <hr/>

        <small>Automatically generated email. Please do not reply.</small>

      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};

export default sendBookingConfirmation;