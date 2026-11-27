
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  Inbox
} from "lucide-react";

import NotificationCard from "../components/NotificationCard";
import { useAuth } from "../context/AuthContext";

// Dynamic backend URL from frontend/.env
const API_URL = (
  import.meta.env.VITE_API_URL || "https://railway-booking-backend-n1cx.onrender.com/api"
).replace(/\/+$/, "");

export default function Notifications() {
  const { userEmail } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!userEmail) {
      setNotifications([]);
      setError("Please log in to view your notifications.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/notifications?email=${encodeURIComponent(userEmail)}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load notifications."
        );
      }

      const items = result.notifications || [];

      setNotifications(
        items.map((item) => ({
          ...item,
          id: item._id || item.id,
          read: Boolean(item.isRead)
        }))
      );
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Notification statistics
  const unreadCount = notifications.filter(
    (item) => !item.read
  ).length;

  const readCount = notifications.length - unreadCount;

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return notifications.filter((item) => !item.read);
    }

    if (activeFilter === "read") {
      return notifications.filter((item) => item.read);
    }

    return notifications;
  }, [notifications, activeFilter]);

  // Mark one notification as read
  const markAsRead = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/${id}/read?email=${encodeURIComponent(userEmail)}`,
        { method: "PATCH" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not mark notification as read."
        );
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === id
            ? { ...item, read: true, isRead: true }
            : item
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/read-all?email=${encodeURIComponent(userEmail)}`,
        { method: "PATCH" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not update notifications."
        );
      }

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          read: true,
          isRead: true
        }))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete one notification
  const deleteNotification = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/${id}?email=${encodeURIComponent(userEmail)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not delete notification."
        );
      }

      setNotifications((previous) =>
        previous.filter((item) => item.id !== id)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete all notifications
  const clearAll = async () => {
    try {
      const response = await fetch(
        `${API_URL}/notifications?email=${encodeURIComponent(userEmail)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not clear notifications."
        );
      }

      setNotifications([]);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-container">

        {/* Header */}
        <div className="notifications-header">
          <div>
            <div className="notifications-heading">
              <div className="notifications-heading-icon">
                <Bell size={25} />
              </div>

              <h1>Notifications</h1>
            </div>

            <p className="notifications-subtitle">
              Stay updated with your bookings and train information.
            </p>
          </div>

          <div className="notifications-actions">
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0 || loading || !userEmail}
              className="notification-action-btn"
            >
              <CheckCheck size={17} />
              Mark all read
            </button>

            <button
              type="button"
              onClick={clearAll}
              disabled={notifications.length === 0 || loading || !userEmail}
              className="notification-action-btn delete"
            >
              <Trash2 size={17} />
              Clear all
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="notification-error">
            <span>{error}</span>

            <button
              type="button"
              onClick={loadNotifications}
            >
              Try again
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="notification-stats">
          <div className="notification-stat-card">
            <p>Total Notifications</p>
            <h2>{notifications.length}</h2>
          </div>

          <div className="notification-stat-card stat-unread">
            <p>Unread</p>
            <h2>{unreadCount}</h2>
          </div>

          <div className="notification-stat-card stat-read">
            <p>Read</p>
            <h2>{readCount}</h2>
          </div>
        </div>

        {/* Filters */}
        <div className="notification-filters">
          <Filter size={18} />

          {[
            { label: "All", value: "all" },
            { label: "Unread", value: "unread" },
            { label: "Read", value: "read" }
          ].map((filter) => (
            <button
              type="button"
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`notification-filter-btn ${
                activeFilter === filter.value ? "active" : ""
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="notification-list">
          {loading ? (
            <div className="notification-loading">
              Loading notifications...
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))
          ) : (
            <div className="notification-empty">
              <Inbox size={45} />

              <h3>No notifications found</h3>

              <p>
                {activeFilter === "unread"
                  ? "You have no unread notifications."
                  : activeFilter === "read"
                  ? "You have no read notifications."
                  : "Your notifications will appear here."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="notifications-footer">
          Where Is My Train · Notification Center
        </p>

      </div>
    </div>
  );
}
