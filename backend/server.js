
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

import connectDB from "./config/db.js";

import trainRoutes from "./routes/trainRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
  })
);

app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Where Is My Train backend is running!"
  });
});

// Existing train APIs
app.use("/api/trains", trainRoutes);

// New demo booking APIs
app.use("/api/bookings", bookingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);

// Not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found."
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Backend error:", error.message);

  const status = error.status === 429 ? 429 : 500;

  res.status(status).json({
    success: false,
    message: error.message || "Something went wrong."
  });
});

// Start server after MongoDB connection
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log("----------------------------------");
      console.log("Where Is My Train Backend");
      console.log(`Server running: http://localhost:${PORT}`);
      console.log("----------------------------------");
    });

  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
