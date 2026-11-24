
import Booking from "../models/Booking.js";
import sendBookingConfirmation from "../services/emailService.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Delete one booking belonging to the supplied email
export const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID."
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "A valid email is required."
      });
    }

    const deletedBooking = await Booking.findOneAndDelete({
      _id: id,
      userEmail: email
    });

    if (!deletedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking deleted successfully."
    });
  } catch (error) {
    next(error);
  }
};

// Delete all bookings belonging to the supplied email
export const deleteAllBookings = async (req, res, next) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "A valid email is required."
      });
    }

    const result = await Booking.deleteMany({
      userEmail: email
    });

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} booking(s) deleted successfully.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};

// Create a new demo booking
export const createBooking = async (req, res, next) => {
  try {
    const {
      userName,
      userEmail,
      trainNumber,
      trainName,
      from,
      to,
      journeyDate,
      passengerName,
      passengerAge,
      passengerGender,
      travelClass
    } = req.body;

    // Validate required text fields
    const requiredFields = [
      userName,
      userEmail,
      trainNumber,
      trainName,
      from,
      to,
      passengerName,
      passengerGender,
      travelClass
    ];

    if (
      requiredFields.some(
        (value) => typeof value !== "string" || !value.trim()
      ) ||
      !journeyDate ||
      passengerAge === undefined ||
      passengerAge === null ||
      passengerAge === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required booking details."
      });
    }

    // Validate email
    const email = userEmail.trim().toLowerCase();

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address."
      });
    }

    // Validate passenger age
    const age = Number(passengerAge);

    if (!Number.isInteger(age) || age < 1 || age > 120) {
      return res.status(400).json({
        success: false,
        message: "Passenger age must be between 1 and 120."
      });
    }

    // Validate passenger gender
    const gender = passengerGender.trim();

    if (!["Male", "Female"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Passenger gender must be Male or Female."
      });
    }

    // Validate journey date (YYYY-MM-DD)
    if (
      typeof journeyDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(journeyDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid journey date."
      });
    }

    const date = new Date(`${journeyDate}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== journeyDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid journey date."
      });
    }

    const today = new Date().toISOString().slice(0, 10);

    if (journeyDate < today) {
      return res.status(400).json({
        success: false,
        message: "Journey date cannot be in the past."
      });
    }

    // Save booking in MongoDB
    const booking = await Booking.create({
      userName: userName.trim(),
      userEmail: email,
      trainNumber: trainNumber.trim(),
      trainName: trainName.trim(),
      from: from.trim(),
      to: to.trim(),
      journeyDate: date,
      passengerName: passengerName.trim(),
      passengerAge: age,
      passengerGender: gender,
      passengerCount: 1,
      passengers: [
        {
          name: passengerName.trim(),
          age,
          gender
        }
      ],
      travelClass: travelClass.trim(),
      bookingStatus: "Demo Confirmed"
    });

    // Send Gmail confirmation
    try {
      await sendBookingConfirmation(booking);

      booking.emailSent = true;
      booking.emailError = null;

      await booking.save();

    } catch (emailError) {
      console.error("Booking email error:", emailError.message);

      booking.emailSent = false;
      booking.emailError = "Email delivery failed. Please retry.";

      await booking.save();
    }

    // Create booking notification in MongoDB
    try {
      await Notification.create({
        userEmail: booking.userEmail,
        type: "booking",
        title: "Booking Confirmed",
        message: `Your demo booking for ${booking.trainName} (${booking.trainNumber}) from ${booking.from} to ${booking.to} has been saved successfully. ${
          booking.emailSent
            ? "Your confirmation email has also been sent."
            : "However, your confirmation email could not be sent."
        }`,
        isRead: false,
        relatedBooking: booking._id
      });

      console.log(
        "Booking notification created:",
        booking.userEmail
      );

    } catch (notificationError) {
      console.error(
        "Booking notification error:",
        notificationError.message
      );
    }

    // Send response to frontend
    return res.status(201).json({
      success: true,
      message: booking.emailSent
        ? "Demo booking saved and confirmation email sent."
        : "Demo booking saved, but confirmation email could not be sent.",

      booking: {
        bookingId: booking._id,
        pnr: booking.pnr,
        status: booking.bookingStatus,
        trainNumber: booking.trainNumber,
        trainName: booking.trainName,
        from: booking.from,
        to: booking.to,
        journeyDate,
        passengerName: booking.passengerName,
        passengerAge: booking.passengerAge,
        passengerGender: booking.passengerGender,
        passengerCount: booking.passengerCount,
        travelClass: booking.travelClass,
        emailSent: booking.emailSent,
        createdAt: booking.createdAt
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get demo bookings by email
export const getBookings = async (req, res, next) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "A valid email query is required."
      });
    }

    const bookings = await Booking.find({
      userEmail: email
    }).sort({
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });

  } catch (error) {
    next(error);
  }
};
