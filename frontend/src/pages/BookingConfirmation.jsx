import { useLocation, useNavigate } from 'react-router-dom';

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();

  let savedBooking = null;

  try {
    savedBooking = JSON.parse(
      localStorage.getItem('latestBooking') || 'null'
    );
  } catch {
    savedBooking = null;
  }

  const booking = location.state?.booking || savedBooking;

  if (!booking) {
    return (
      <section className="page narrow-page">
        <div className="content-card">
          <h1>No booking found</h1>
          <p>Complete the booking demonstration first.</p>
          <button
            className="button primary"
            onClick={() => navigate('/book-ticket')}
          >
            Book a Train
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="page narrow-page">
      <div className="content-card">
        <p className="eyebrow">BOOKING CONFIRMATION</p>
        <h1>Demo Booking Confirmed</h1>
        <p className="lead">
          Your booking workflow demonstration is complete.
        </p>

        <div className="booking-summary">
          <span>
            Demo reference: <b>{booking.bookingId}</b>
          </span>
          <span>
            Train: <b>{booking.trainNumber} — {booking.trainName}</b>
          </span>
          <span>
            Route: <b>{booking.from} → {booking.to}</b>
          </span>
          <span>
            Journey date: <b>{booking.journeyDate}</b>
          </span>
          <span>
            Passenger: <b>{booking.passengerName}</b>
          </span>
          <span>
            Class: <b>{booking.travelClass}</b>
          </span>
        </div>

        <button
          className="button primary full-width"
          onClick={() =>
            navigate('/booking-ticket', { state: { booking } })
          }
        >
          View Booking Ticket
        </button>
      </div>

      <p className="muted small">
        This is a demo confirmation, not a railway reservation or valid
        travel ticket.
      </p>
    </section>
  );
}