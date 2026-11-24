
import express from "express";

import {
  createBooking,
  getBookings,
  deleteBooking,
  deleteAllBookings
} from "../controllers/bookingController.js";

const router = express.Router();

router.post("/", createBooking);
router.get("/", getBookings);

// Delete one booking
router.delete("/:id", deleteBooking);

// Delete all bookings for one email
router.delete("/", deleteAllBookings);

export default router;
