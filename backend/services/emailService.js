
import nodemailer from "nodemailer";

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

const sendBookingConfirmation = async (booking) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error(
      "Gmail configuration missing. Check EMAIL_USER and EMAIL_PASS in backend/.env."
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });

  const bookingReference = booking.pnr || booking._id?.toString() || "Not available";

  const journeyDate = new Date(booking.journeyDate).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    }
  );

  const details = `
Booking Reference: ${bookingReference}
Train: ${booking.trainNumber} - ${booking.trainName}
From: ${booking.from}
To: ${booking.to}
Journey Date: ${journeyDate}
Passenger: ${booking.passengerName}
Age: ${booking.passengerAge}
Gender: ${booking.passengerGender || "Not provided"}
Class: ${booking.travelClass}
Status: Demo Confirmed
`;

  const mailOptions = {
    from: `"Where Is My Train" <${emailUser}>`,
    to: booking.userEmail,
    subject: `Booking Confirmation - ${bookingReference}`,

    text: `
Hello ${booking.userName},

Your demo train booking has been saved successfully.

${details}

IMPORTANT: This is a demonstration booking, not a valid railway ticket or official railway PNR.

Thank you for using Where Is My Train!
`,

    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #ddd;border-radius:12px;color:#222;">

        <h2 style="color:#2563eb;">Where Is My Train</h2>

        <h3 style="color:green;">Demo Booking Confirmed!</h3>

        <p>Hello ${escapeHTML(booking.userName)},</p>

        <p>Your demo train booking has been successfully saved.</p>

        <div style="background:#f3f4f6;padding:16px;border-radius:8px;">

          <h3>Booking Details</h3>

          <p><b>Booking Reference:</b> ${escapeHTML(bookingReference)}</p>
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
          This is a demonstration booking, not a valid railway ticket or official railway PNR.
        </p>

        <p>Thank you for using Where Is My Train!</p>

        <hr/>

        <small>Automatically generated email. Please do not reply.</small>

      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    console.log("Booking confirmation email sent.");
    console.log("Recipient:", booking.userEmail);
    console.log("Message ID:", info.messageId);

    return info;
  } catch (error) {
    console.error("Gmail sending failed:", error.message);
    throw error;
  }
};

export default sendBookingConfirmation;
