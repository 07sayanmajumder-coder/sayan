
import { useLocation, useNavigate } from 'react-router-dom';

export default function BookingTicket() {
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
          <h1>Booking Not Found</h1>
          <p>
            We could not find this booking. Please open My Bookings
            and select an existing ticket.
          </p>

          <button
            className="button primary"
            onClick={() => navigate('/my-bookings')}
          >
            My Bookings
          </button>
        </div>
      </section>
    );
  }

  const reference =
    booking.pnr || booking.bookingId || booking._id || 'N/A';

  return (
    <section className="page narrow-page">
      <div className="content-card">
        <p className="eyebrow">YOUR BOOKING DETAILS</p>

        <h1>Railway Booking Ticket</h1>

        <div className="booking-summary">
          <span>
            Booking Reference: <b>{reference}</b>
          </span>

          <span>
            Status:{' '}
            <b>
              {booking.bookingStatus || booking.status || 'Booked'}
            </b>
          </span>
        </div>

        <h2>Train Details</h2>

        <div className="booking-summary">
          <span>
            Train Number: <b>{booking.trainNumber || 'N/A'}</b>
          </span>

          <span>
            Train Name: <b>{booking.trainName || 'N/A'}</b>
          </span>

          <span>
            From: <b>{booking.from || 'N/A'}</b>
          </span>

          <span>
            To: <b>{booking.to || 'N/A'}</b>
          </span>

          <span>
            Journey Date: <b>{booking.journeyDate || 'N/A'}</b>
          </span>
        </div>

        <h2>Passenger Details</h2>

        <div className="booking-summary">
          <span>
            Passenger Name: <b>{booking.passengerName || 'N/A'}</b>
          </span>

          <span>
            Age: <b>{booking.passengerAge ?? 'N/A'}</b>
          </span>

          <span>
            Gender: <b>{booking.passengerGender || 'N/A'}</b>
          </span>

          <span>
            Travel Class: <b>{booking.travelClass || 'N/A'}</b>
          </span>

          <span>
            Email: <b>{booking.userEmail || booking.email || 'N/A'}</b>
          </span>
        </div>

        <div className="button-group">
          <button
            className="button primary"
            onClick={() => window.print()}
          >
            Print Ticket
          </button>

          <button
            className="button secondary"
            onClick={() => navigate('/my-bookings')}
          >
            Back to My Bookings
          </button>
        </div>
      </div>

      <p className="muted small">
        Demo booking details only. This is not an official railway
        ticket or a valid Indian Railways PNR.
      </p>
    </section>
  );
}
