
import {
  TicketCheck,
  TrainFront,
  MailCheck,
  Info,
  Clock,
  CircleCheck,
  Trash2
} from "lucide-react";

const notificationConfig = {
  booking: {
    icon: TicketCheck
  },
  train: {
    icon: TrainFront
  },
  email: {
    icon: MailCheck
  },
  info: {
    icon: Info
  }
};

export default function NotificationCard({
  notification,
  onMarkRead,
  onDelete
}) {
  const config =
    notificationConfig[notification.type] || notificationConfig.info;

  const Icon = config.icon;

  const notificationId = notification._id || notification.id;
  const isRead = notification.isRead ?? notification.read ?? false;

  const time = notification.createdAt
    ? new Date(notification.createdAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      })
    : notification.time || "Recently";

  return (
    <div
      className={`notification-card ${isRead ? "" : "unread"}`}
    >
      {/* Notification Icon */}
      <div className={`notification-icon ${notification.type}`}>
        <Icon size={23} />
      </div>

      {/* Notification Content */}
      <div className="notification-content">
        <div className="notification-title-row">
          <h3 className="notification-title">
            {notification.title}
          </h3>

          {!isRead && (
            <span className="notification-unread-dot" />
          )}
        </div>

        <p className="notification-message">
          {notification.message}
        </p>

        <div className="notification-time">
          <Clock size={13} />
          <span>{time}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="notification-card-actions">
        {!isRead && (
          <button
            type="button"
            onClick={() => onMarkRead?.(notificationId)}
            title="Mark as read"
            className="notification-icon-btn"
          >
            <CircleCheck size={19} />
          </button>
        )}

        <button
          type="button"
          onClick={() => onDelete?.(notificationId)}
          title="Delete notification"
          className="notification-icon-btn delete"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
