
import mongoose from "mongoose";
import Notification from "../models/Notification.js";

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Get notifications for a user
export const getNotifications = async (req, res, next) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "A valid email is required."
      });
    }

    const notifications = await Notification.find({
      userEmail: email
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount: notifications.filter((item) => !item.isRead).length,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

// Mark one notification as read
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!mongoose.isValidObjectId(id) || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID or email."
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userEmail: email },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      notification
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "A valid email is required."
      });
    }

    const result = await Notification.updateMany(
      { userEmail: email, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

// Delete one notification
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!mongoose.isValidObjectId(id) || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID or email."
      });
    }

    const deleted = await Notification.findOneAndDelete({
      _id: id,
      userEmail: email
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Notification not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted."
    });
  } catch (error) {
    next(error);
  }
};

// Delete all notifications for a user
export const deleteAllNotifications = async (req, res, next) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "A valid email is required."
      });
    }

    const result = await Notification.deleteMany({
      userEmail: email
    });

    return res.status(200).json({
      success: true,
      message: "All notifications deleted.",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};
