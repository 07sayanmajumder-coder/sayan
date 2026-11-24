import mongoose from "mongoose";
import crypto from "crypto";

const passengerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    age: {
      type: Number,
      required: true,
      min: 1,
      max: 120
    },

    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true
    }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    pnr: {
      type: String,
      unique: true,
      required: true,
      default: () =>
        "WIMT" + crypto.randomBytes(5).toString("hex").toUpperCase()
    },

    userName: {
      type: String,
      required: true,
      trim: true
    },

    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    trainNumber: {
      type: String,
      required: true
    },

    trainName: {
      type: String,
      required: true
    },

    from: {
      type: String,
      required: true
    },

    to: {
      type: String,
      required: true
    },

    journeyDate: {
      type: Date,
      required: true
    },

    passengerName: {
      type: String,
      required: true,
      trim: true
    },

    passengerAge: {
      type: Number,
      required: true,
      min: 1,
      max: 120
    },

    passengerGender: {
      type: String,
      enum: ["Male", "Female"],
      required: true
    },

    passengerCount: {
      type: Number,
      default: 1
    },

    passengers: {
      type: [passengerSchema],
      default: []
    },

    travelClass: {
      type: String,
      required: true
    },

    bookingStatus: {
      type: String,
      enum: ["Demo Confirmed", "Cancelled"],
      default: "Demo Confirmed"
    },

    emailSent: {
      type: Boolean,
      default: false
    },

    emailError: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;