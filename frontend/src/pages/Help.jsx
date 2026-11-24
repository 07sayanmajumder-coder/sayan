
import {
  HelpCircle,
  Ticket,
  Bell,
  TrainFront,
  Mail
} from "lucide-react";

export default function Help() {
  return (
    <div className="help-page">
      <div className="help-container">
        <div className="help-header">
          <HelpCircle size={42} />
          <h1>How Can We Help You?</h1>
          <p>
            Find assistance with bookings, train information,
            notifications and your account.
          </p>
        </div>

        <div className="help-grid">
          <div className="help-card">
            <Ticket size={30} />
            <h3>Ticket Booking</h3>
            <p>Get help with booking and managing your train tickets.</p>
          </div>

          <div className="help-card">
            <TrainFront size={30} />
            <h3>Train Information</h3>
            <p>Learn how to find train routes and train details.</p>
          </div>

          <div className="help-card">
            <Bell size={30} />
            <h3>Notifications</h3>
            <p>Understand your booking updates and notifications.</p>
          </div>

          <div className="help-card">
            <Mail size={30} />
            <h3>Contact Support</h3>
            <p>Need more assistance? Contact our support team.</p>
            <a href="/contact">Contact Us</a>
          </div>
        </div>
      </div>
    </div>
  );
}
