
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getTrains,
  getTrainSchedule
} from '../data/trains';

import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const STEPS = [
  'Validating Details',
  'Saving Booking',
  'Booking Processed'
];

const getToday = () => {
  const now = new Date();
  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 10);
};

export default function BookTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trains, setTrains] = useState([]);
  const [loadingTrains, setLoadingTrains] = useState(true);
  const [trainError, setTrainError] = useState('');

  const [trainNumber, setTrainNumber] = useState('');
  const [journeyDate, setJourneyDate] = useState(getToday());

  const [route, setRoute] = useState({
    from: '',
    to: ''
  });

  const [loadingRoute, setLoadingRoute] = useState(false);

  const [passenger, setPassenger] = useState({
    name: '',
    age: '',
    gender: '',
    seatClass: 'Sleeper'
  });

  const [step, setStep] = useState(-1);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  // Load train catalog.
  useEffect(() => {
    async function fetchTrains() {
      try {
        setLoadingTrains(true);
        setTrainError('');

        const response = await getTrains();

        const records = Array.isArray(response)
          ? response
          : response?.results ||
            response?.trains ||
            response?.data?.results ||
            response?.data ||
            [];

        if (!Array.isArray(records)) {
          throw new Error('Invalid train catalog response.');
        }

        const formattedTrains = records
          .map((item) => ({
            number: String(
              item.train_number || item.number || ''
            ),
            name:
              item.train_name ||
              item.name ||
              'Unknown Train',
            from:
              item.source_name ||
              item.from_station_name ||
              item.source ||
              item.from ||
              item.source_code ||
              item.source_station_code ||
              '',
            to:
              item.destination_name ||
              item.to_station_name ||
              item.destination ||
              item.to ||
              item.destination_code ||
              item.destination_station_code ||
              ''
          }))
          .filter((item) => item.number);

        setTrains(formattedTrains);
      } catch (error) {
        console.error('Train loading error:', error);
        setTrainError(error.message);
      } finally {
        setLoadingTrains(false);
      }
    }

    fetchTrains();
  }, []);

  const train = trains.find(
    (item) => item.number === trainNumber
  );

  // Fetch route from the selected train's schedule.
  useEffect(() => {
    if (!trainNumber || !train) {
      setRoute({ from: '', to: '' });
      return;
    }

    let cancelled = false;

    async function fetchRoute() {
      try {
        setLoadingRoute(true);

        setRoute({
          from: train.from || '',
          to: train.to || ''
        });

        const response = await getTrainSchedule(trainNumber);

        if (cancelled) return;

        // Handle both nested and direct API response formats.
        const schedule = response?.data || response;

        const stops = Array.isArray(schedule?.stops)
          ? schedule.stops
          : [];

        const source =
          schedule?.source_station_name ||
          schedule?.source_name ||
          schedule?.source_station_code ||
          train.from;

        const destination =
          schedule?.destination_station_name ||
          schedule?.destination_name ||
          schedule?.destination_station_code ||
          train.to;

        console.log('Selected train schedule:', schedule);
        console.log('Train route:', source, destination);
        console.log('Train stops:', stops);

        setRoute({
          from: source || 'Not available',
          to: destination || 'Not available'
        });
      } catch (error) {
        console.error('Schedule loading error:', error);

        if (!cancelled) {
          setRoute({
            from: train.from || 'Not available',
            to: train.to || 'Not available'
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingRoute(false);
        }
      }
    }

    fetchRoute();

    return () => {
      cancelled = true;
    };
  }, [trainNumber, train]);

  async function startBooking(e) {
    e.preventDefault();

    if (busy) return;

    if (!user?.email) {
      setMessage('Please log in before booking a train.');
      return;
    }

    if (
      !train ||
      !passenger.name.trim() ||
      !passenger.age ||
      !passenger.gender ||
      !journeyDate
    ) {
      setMessage('Please complete all booking details.');
      return;
    }

    if (loadingRoute) {
      setMessage('Please wait while the train route loads.');
      return;
    }

    if (
      !route.from ||
      !route.to ||
      route.from === 'Not available' ||
      route.to === 'Not available'
    ) {
      setMessage('Train route is unavailable. Please try selecting the train again.');
      return;
    }

    setBusy(true);
    setStep(0);
    setMessage('Validating your booking details...');

    try {
      const age = Number(passenger.age);

      if (!Number.isInteger(age) || age < 1 || age > 120) {
        throw new Error('Please enter a valid passenger age.');
      }

      if (journeyDate < getToday()) {
        throw new Error('Journey date cannot be in the past.');
      }

      const bookingData = {
        userName: user.name || passenger.name.trim(),
        userEmail: user.email,

        trainNumber: train.number,
        trainName: train.name,

        from: route.from,
        to: route.to,

        journeyDate,

        passengerName: passenger.name.trim(),
        passengerAge: age,
        passengerGender: passenger.gender,

        travelClass: passenger.seatClass
      };

      setStep(1);
      setMessage(
        'Saving booking in MongoDB and sending Gmail confirmation...'
      );

      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.booking) {
        throw new Error(
          result.message || 'Unable to complete demo booking.'
        );
      }

      const booking = result.booking;

      localStorage.setItem(
        'latestBooking',
        JSON.stringify(booking)
      );

      setStep(2);

      setMessage(
        booking.emailSent
          ? 'Demo booking saved! Confirmation email sent.'
          : 'Demo booking saved, but email delivery failed.'
      );

      navigate('/booking-confirmation', {
        state: { booking }
      });
    } catch (error) {
      console.error('Booking error:', error);

      setStep(-1);
      setMessage(
        error.message || 'Booking demonstration failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  function handleTrainChange(e) {
    setTrainNumber(e.target.value);
    setStep(-1);
    setMessage('');
  }

  return (
    <section className="page narrow-page">
      <p className="eyebrow">BOOK YOUR JOURNEY</p>

      <h1>Railway Ticket Booking</h1>

      <p className="lead">
        Select a train and enter your journey and passenger details
        to complete your demo booking.
      </p>

      <div className="content-card">
        {loadingTrains ? (
          <p>Loading trains from RailCore...</p>
        ) : trainError ? (
          <div className="empty-state">
            <strong>Unable to load trains.</strong>
            <p>{trainError}</p>

            <button
              className="button secondary"
              type="button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : (
          <form className="stack-form" onSubmit={startBooking}>
            <label>
              Logged-in user
              <input
                className="field"
                value={user?.email || 'Please log in'}
                readOnly
              />
            </label>

            <label>
              Select train
              <select
                className="field"
                required
                value={trainNumber}
                onChange={handleTrainChange}
                disabled={busy}
              >
                <option value="">Choose a train</option>

                {trains.map((item) => (
                  <option key={item.number} value={item.number}>
                    {item.number} — {item.name}
                  </option>
                ))}
              </select>
            </label>

            {train && (
              <div className="booking-summary">
                <span>
                  Train number: <b>{train.number}</b>
                </span>

                <span>
                  Train name: <b>{train.name}</b>
                </span>

                <span>
                  Route:{' '}
                  <b>
                    {loadingRoute
                      ? 'Loading route...'
                      : `${route.from || 'Not available'} → ${route.to || 'Not available'}`}
                  </b>
                </span>
              </div>
            )}

            <label>
              Journey date
              <input
                className="field"
                type="date"
                min={getToday()}
                required
                value={journeyDate}
                onChange={(e) => setJourneyDate(e.target.value)}
                disabled={busy}
              />
            </label>

            <label>
              Passenger name
              <input
                className="field"
                type="text"
                required
                value={passenger.name}
                onChange={(e) =>
                  setPassenger({
                    ...passenger,
                    name: e.target.value
                  })
                }
                disabled={busy}
              />
            </label>

            <label>
              Age
              <input
                className="field"
                type="number"
                min="1"
                max="120"
                required
                value={passenger.age}
                onChange={(e) =>
                  setPassenger({
                    ...passenger,
                    age: e.target.value
                  })
                }
                disabled={busy}
              />
            </label>

            <label>
              Gender
              <select
                className="field"
                required
                value={passenger.gender}
                onChange={(e) =>
                  setPassenger({
                    ...passenger,
                    gender: e.target.value
                  })
                }
                disabled={busy}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>

            <label>
              Seat class
              <select
                className="field"
                value={passenger.seatClass}
                onChange={(e) =>
                  setPassenger({
                    ...passenger,
                    seatClass: e.target.value
                  })
                }
                disabled={busy}
              >
                <option>Sleeper</option>
                <option>AC 3 Tier</option>
                <option>AC 2 Tier</option>
                <option>First Class</option>
              </select>
            </label>

            <button
              className="button primary full-width"
              type="submit"
              disabled={
                !train ||
                busy ||
                !user?.email ||
                loadingRoute
              }
            >
              {busy
                ? 'Processing Booking...'
                : loadingRoute
                  ? 'Loading Train Route...'
                  : 'Confirm Demo Booking'}
            </button>
          </form>
        )}

        {step >= 0 && (
          <div className="workflow content-card">
            <h2>Booking Workflow</h2>

            <div className="workflow-steps">
              {STEPS.map((label, index) => (
                <div
                  className={`workflow-step ${
                    index < step
                      ? 'complete'
                      : index === step
                        ? 'active'
                        : ''
                  }`}
                  key={label}
                >
                  <span>
                    {index < step ? '✓' : index + 1}
                  </span>

                  {label}
                </div>
              ))}
            </div>

            <p className="workflow-message">{message}</p>
          </div>
        )}

        {step === -1 && message && (
          <p className="workflow-message">{message}</p>
        )}
      </div>

      <p className="muted small">
        This is a demo booking system. It saves booking details
        in MongoDB and sends email confirmation. It does not
        reserve real railway seats, process payments, or generate
        an official Indian Railways PNR.
      </p>
    </section>
  );
}
