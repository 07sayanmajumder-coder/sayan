
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

export default function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState('');

  const fetchBookings = useCallback(async () => {
    if (!user?.email) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_URL}/bookings?email=${encodeURIComponent(user.email)}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to load bookings.');
      }

      setBookings(
        Array.isArray(result.bookings) ? result.bookings : []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  function formatDate(dateValue) {
    if (!dateValue) return 'Not available';

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return 'Not available';
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    });
  }

  async function deleteBooking(booking) {
    if (!window.confirm(
      `Are you sure you want to delete booking ${booking.pnr}?`
    )) {
      return;
    }

    try {
      setDeleting(booking._id);
      setError('');
      setMessage('');

      const response = await fetch(
        `${API_URL}/bookings/${encodeURIComponent(booking._id)}?email=${encodeURIComponent(user.email)}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to delete booking.');
      }

      setBookings((previous) =>
        previous.filter((item) => item._id !== booking._id)
      );

      // Remove the old latest-ticket browser copy if it matches.
      try {
        const latest = JSON.parse(
          localStorage.getItem('latestBooking') || 'null'
        );

        if (
          latest?.bookingId === booking._id ||
          latest?._id === booking._id ||
          latest?.pnr === booking.pnr
        ) {
          localStorage.removeItem('latestBooking');
        }
      } catch {
        localStorage.removeItem('latestBooking');
      }

      setMessage('Booking deleted successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting('');
    }
  }

  async function clearAllBookings() {
    if (bookings.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete all ${bookings.length} bookings? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting('all');
      setError('');
      setMessage('');

      const response = await fetch(
        `${API_URL}/bookings?email=${encodeURIComponent(user.email)}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to clear bookings.');
      }

      setBookings([]);
      localStorage.removeItem('latestBooking');
      localStorage.removeItem('bookings');

      setMessage(
        `${result.deletedCount} booking(s) deleted successfully.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting('');
    }
  }

  if (!user) {
    return (
      <section className="page narrow-page">
        <div className="content-card">
          <h1>Please log in</h1>
          <p>Log in to view your booking history.</p>

          <button
            className="button primary"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="page narrow-page">

      <p className="eyebrow">YOUR JOURNEYS</p>

      <h1>My Bookings</h1>

      <p className="lead">
        View and manage your previous demo train bookings.
      </p>

      <p className="muted small">
        Logged in as: <strong>{user.email}</strong>
      </p>

      {message && (
        <div className="content-card">
          <p>{message}</p>
        </div>
      )}

      {error && (
        <div className="content-card">
          <p>{error}</p>

          <button
            className="button secondary"
            onClick={fetchBookings}
          >
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="content-card">
          <p>Loading your bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="content-card">
          <h2>No bookings found</h2>

          <p>You don't have any saved bookings yet.</p>

          <button
            className="button primary"
            onClick={() => navigate('/book-ticket')}
          >
            Book a Train
          </button>
        </div>
      ) : (
        <>
          <div className="content-card">

            <h2>Booking History</h2>

            <p>
              Total bookings: <strong>{bookings.length}</strong>
            </p>

            <button
              className="button secondary full-width"
              onClick={clearAllBookings}
              disabled={deleting !== ''}
            >
              {deleting === 'all'
                ? 'Clearing Bookings...'
                : 'Clear All Bookings'}
            </button>

          </div>

          <div className="stack-form">

            {bookings.map((booking) => (
              <article
                className="content-card"
                key={booking._id}
              >

                <h2>
                  {booking.trainNumber} — {booking.trainName}
                </h2>

                <div className="booking-summary">

                  <span>
                    Status:{' '}
                    <strong>
                      {booking.bookingStatus || 'Demo Confirmed'}
                    </strong>
                  </span>

                  <span>
                    Demo PNR:{' '}
                    <strong>{booking.pnr}</strong>
                  </span>

                </div>

                <p>
                  <strong>From:</strong> {booking.from}
                </p>

                <p>
                  <strong>To:</strong> {booking.to}
                </p>

                <p>
                  <strong>Journey Date:</strong>{' '}
                  {formatDate(booking.journeyDate)}
                </p>

                <p>
                  <strong>Passenger:</strong> {booking.passengerName}
                </p>

                <p>
                  <strong>Age:</strong> {booking.passengerAge}
                </p>

                <p>
                  <strong>Class:</strong> {booking.travelClass}
                </p>

                <p>
                  <strong>Email:</strong>{' '}
                  {booking.emailSent ? 'Sent' : 'Not sent'}
                </p>

                <div className="booking-actions">

                  <button
                    className="button primary"
                    onClick={() =>
                      navigate('/booking-ticket', {
                        state: {
                          booking: {
                            ...booking,
                            status: booking.bookingStatus
                          }
                        }
                      })
                    }
                  >
                    View Ticket
                  </button>

                  <button
                    className="button secondary"
                    disabled={deleting !== ''}
                    onClick={() => deleteBooking(booking)}
                  >
                    {deleting === booking._id
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>

                </div>

              </article>
            ))}

          </div>
        </>
      )}

      <p className="muted small">
        These are demo booking records stored in MongoDB.
        They are not official railway reservations.
      </p>

    </section>
  );
}
