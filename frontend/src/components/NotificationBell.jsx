
import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export default function NotificationBell() {
  const navigate = useNavigate();
  const { userEmail } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    if (!userEmail) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/notifications?email=${encodeURIComponent(userEmail)}`
      );

      if (!response.ok) {
        throw new Error("Unable to load notification count.");
      }

      const result = await response.json();

      setUnreadCount(Number(result.unreadCount) || 0);
    } catch (error) {
      console.error("Notification count error:", error);
    }
  }, [userEmail]);

  useEffect(() => {
    loadUnreadCount();

    // Check for new notifications every 15 seconds.
    const interval = setInterval(loadUnreadCount, 15000);

    // Refresh when the user returns to the browser tab.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadUnreadCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [loadUnreadCount]);

  return (
    <button
      type="button"
      onClick={() => navigate("/notifications")}
      title={
        unreadCount > 0
          ? `${unreadCount} unread notifications`
          : "View notifications"
      }
      className="notification-bell"
    >
      <Bell size={21} />

      {unreadCount > 0 && (
        <span className="notification-badge">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
