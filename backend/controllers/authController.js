
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import firebaseAuth from "../config/firebaseAdmin.js";

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Escape user-provided text before adding it to HTML email
const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

// Send welcome email after successful login
const sendWelcomeEmail = async (user) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Welcome email skipped: email configuration is missing.");
      return;
    }

    const safeName = escapeHTML(user.name || "there");

    await transporter.sendMail({
      from: `"Where Is My Train" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Welcome back to Where Is My Train!",
      text: `Hello ${user.name || "there"},

You have successfully signed in to Where Is My Train.

We're glad to have you with us!

If you did not sign in, please contact our support team.

Where Is My Train Team`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">
          <h2 style="color:#2563eb;">Welcome to Where Is My Train!</h2>
          <p>Hello ${safeName},</p>
          <p>You have successfully signed in to <strong>Where Is My Train</strong>.</p>
          <p>We're glad to have you with us. You can now search trains and explore their route information.</p>
          <p style="color:#64748b;font-size:13px;">
            If you did not sign in, please contact our support team.
          </p>
          <p>Where Is My Train Team</p>
        </div>
      `
    });

    console.log(`Welcome email sent to ${user.email}`);
  } catch (error) {
    // Do not block login if email delivery fails
    console.error("Welcome email failed:", error.message);
  }
};

// Generate JWT token
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in backend .env");
  }

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Safe user response
const getSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  authProvider: user.authProvider
});

// EMAIL REGISTRATION
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      authProvider: "email"
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: getSafeUser(user)
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to register. Please try again."
    });
  }
};

// EMAIL LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select("+password");

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password."
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password."
      });
    }

    const token = generateToken(user._id);

    // Send welcome email after successful authentication
    await sendWelcomeEmail(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: getSafeUser(user)
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in. Please try again."
    });
  }
};

// GOOGLE LOGIN
export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google ID token is required."
      });
    }

    // Verify the Google sign-in token with Firebase
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);

    const {
      uid,
      email,
      name,
      email_verified
    } = decodedToken;

    if (!email || !email_verified) {
      return res.status(401).json({
        success: false,
        message: "Please use a verified Google email account."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = await User.findOne({
      firebaseUid: uid
    });

    if (!user) {
      user = await User.findOne({
        email: normalizedEmail
      });

      if (user) {
        // Link the verified Google identity to the existing account
        if (user.firebaseUid && user.firebaseUid !== uid) {
          return res.status(409).json({
            success: false,
            message: "This email is already linked to another Google account."
          });
        }

        user.firebaseUid = uid;

        if (!user.password) {
          user.authProvider = "google";
        }

        await user.save();
      } else {
        user = await User.create({
          name: name || normalizedEmail.split("@")[0],
          email: normalizedEmail,
          firebaseUid: uid,
          authProvider: "google"
        });
      }
    }

    const token = generateToken(user._id);

    // Send welcome email after successful Google authentication
    await sendWelcomeEmail(user);

    return res.status(200).json({
      success: true,
      message: "Google login successful.",
      token,
      user: getSafeUser(user)
    });
  } catch (error) {
    console.error("Google login error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Google authentication failed. Please try again."
    });
  }
};
