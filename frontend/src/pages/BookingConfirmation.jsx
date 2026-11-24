
import { useLocation, useNavigate } from 'react-router-dom';

export default function BookingTicket() {
  const navigate = useNavigate();
  const location = useLocation();

  let storedBooking = null;

  try {
    storedBooking = JSON.parse(
      localStorage.getItem('latestBooking') || 'null'
    );
  } catch {
    storedBooking = null;
  }

  const booking = location.state?.booking || storedBooking;

  function formatDate(value) {
    if (!value) return 'Not available';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    });
  }

  if (!booking) {
    return (
      <section className="page narrow-page">
        <div className="content-card">
          <h1>Ticket Not Found</h1>

          <p>
            We could not find your booking details.
            Please open your booking history and select a ticket.
          </p>

          <button
            className="button primary"
            onClick={() => navigate('/my-bookings')}
          >
            Go to My Bookings
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="page narrow-page">
      <div className="content-card">

        <p className="eyebrow">YOUR JOURNEY DOCUMENT</p>

        <h1>Booking Ticket</h1>

        <p className="lead">
          Your demo booking details are displayed below.
        </p>

        <div className="booking-summary">
          <h2>Booking Information</h2>

          <p>
            <strong>PNR / Reference:</strong>{' '}
            {booking.pnr || booking.bookingId || booking._id || 'Not available'}
          </p>

          <p>
            <strong>Booking Status:</strong>{' '}
            {booking.bookingStatus || booking.status || 'Demo Confirmed'}
          </p>

          <p>
            <strong>Train Number:</strong>{' '}
            {booking.trainNumber || 'Not available'}
          </p>

          <p>
            <strong>Train Name:</strong>{' '}
            {booking.trainName || 'Not available'}
          </p>

          <p>
            <strong>From:</strong>{' '}
            {booking.from || 'Not available'}
          </p>

          <p>
            <strong>To:</strong>{' '}
            {booking.to || 'Not available'}
          </p>

          <p>
            <strong>Journey Date:</strong>{' '}
            {formatDate(booking.journeyDate)}
          </p>
        </div>

        <div className="booking-summary">
          <h2>Passenger Information</h2>

          <p>
            <strong>Passenger Name:</strong>{' '}
            {booking.passengerName || 'Not available'}
          </p>

          <p>
            <strong>Age:</strong>{' '}
            {booking.passengerAge || 'Not available'}
          </p>

          <p>
            <strong>Gender:</strong>{' '}
            {booking.passengerGender || 'Not available'}
          </p>

          <p>
            <strong>Travel Class:</strong>{' '}
            {booking.travelClass || 'Not available'}
          </p>

          <p>
            <strong>Email:</strong>{' '}
            {booking.userEmail || booking.email || 'Not available'}
          </p>

          <p>
            <strong>Email Confirmation:</strong>{' '}
            {booking.emailSent ? 'Sent' : 'Not confirmed'}
          </p>
        </div>

        <button
          className="button primary full-width"
          onClick={() => window.print()}
        >
          Print Ticket
        </button>

        <button
          className="button secondary full-width"
          onClick={() => navigate('/my-bookings')}
        >
          Back to My Bookings
        </button>

      </div>

      <p className="muted small">
        This is a demo booking document, not an official
        Indian Railways ticket or valid travel reservation.
      </p>
    </section>
  );
}
