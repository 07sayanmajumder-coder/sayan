
import express from "express";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", getNotifications);

router.patch("/read-all", markAllNotificationsAsRead);
router.patch("/:id/read", markNotificationAsRead);

router.delete("/", deleteAllNotifications);
router.delete("/:id", deleteNotification);

export default router;
