
import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTrains } from '../data/trains';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  const [query, setQuery] = useState('');
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch real train catalog
  useEffect(() => {
    const fetchTrains = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await getTrains();

        // Supports common RailCore response structures
        const records =
          response?.data?.results ||
          response?.results ||
          response?.data ||
          [];

        if (!Array.isArray(records)) {
          throw new Error('Unexpected train catalog response.');
        }

        // Map API fields to dashboard fields
        const formattedTrains = records.map((train) => ({
          number: String(
            train.train_number || train.number || ''
          ),
          name:
            train.train_name ||
            train.name ||
            'Unknown Train',
          from:
            train.source_name ||
            train.from_station_name ||
            train.source ||
            train.from ||
            train.source_code ||
            'Not available',
          to:
            train.destination_name ||
            train.to_station_name ||
            train.destination ||
            train.to ||
            train.destination_code ||
            'Not available',

          // These are not provided by the basic train catalog.
          status: null,
          currentStation: null,
          nextStation: null,
          departure: null,
          arrival: null,
          platform: null,
          delay: null
        }));

        setTrains(formattedTrains);
      } catch (err) {
        console.error('Error fetching trains:', err);
        setError(err.message || 'Unable to load trains.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrains();
  }, []);

  // Search trains
  const filteredTrains = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return trains;

    return trains.filter((train) =>
      [
        train.number,
        train.name,
        train.from,
        train.to
      ].some((value) =>
        String(value || '').toLowerCase().includes(q)
      )
    );
  }, [query, trains]);

  return (
    <div className="page dashboard-page">

      {/* Dashboard heading */}
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">TRAIN CONTROL PANEL</p>

          <h1>
            Welcome{user?.name ? `, ${user.name}` : ''}!
          </h1>

          <p className="lead">
            Search Indian trains and explore their route information.
          </p>
        </div>

        <Link className="button primary" to="/book-ticket">
          Book a Ticket
        </Link>
      </div>

      {/* Welcome message for signed-in users */}
      {user && (
        <div className="empty-state">
          <strong>
            Welcome to Where Is My Train
            {user.name ? `, ${user.name}` : ''}!
          </strong>

          <p>
            You are successfully signed in. Search trains and explore
            their route information.
          </p>
        </div>
      )}

      {/* Dashboard statistics */}
      <div className="dashboard-stats">
        <div className="dashboard-stat">
          <span>Total Trains</span>
          <strong>
            {loading ? '...' : trains.length}
          </strong>
        </div>

        <div className="dashboard-stat">
          <span>Search Results</span>
          <strong>{filteredTrains.length}</strong>
        </div>

        <div className="dashboard-stat">
          <span>Data Source</span>
          <strong>RailCore</strong>
        </div>
      </div>

      {/* Train list */}
      <section
        className="section dashboard-section"
        id="train-list"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">AVAILABLE TRAIN LIST</p>
            <h2>Indian Trains</h2>
          </div>

          <span className="muted">
            {filteredTrains.length} shown
          </span>
        </div>

        <p className="section-description">
          Search by train number, train name, source or destination.
        </p>

        {/* Search box */}
        <div className="train-search-wrap">
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>

          <input
            className="field search-field"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: 12301, Rajdhani, Howrah..."
            aria-label="Search trains"
          />

          {query && (
            <button
              className="clear-search"
              onClick={() => setQuery('')}
              type="button"
            >
              Clear
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="empty-state">
            <strong>Loading train catalog...</strong>
            <p>Please wait while we fetch train records.</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="empty-state">
            <strong>Unable to load trains.</strong>
            <p>{error}</p>

            <button
              className="button secondary"
              onClick={() => window.location.reload()}
              type="button"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Train cards */}
        {!loading && !error && (
          <div className="train-grid">
            {filteredTrains.map((train) => (
              <article
                className="train-card status-card"
                key={train.number}
              >
                <div className="train-card-top">
                  <div>
                    <strong>
                      {train.number} · {train.name}
                    </strong>

                    <p className="muted small">
                      {train.from} → {train.to}
                    </p>
                  </div>

                  <span className="status">
                    Train Catalog
                  </span>
                </div>

                <div className="location-panel">
                  <div className="location-item">
                    <span className="location-dot current-dot" />

                    <div>
                      <span className="location-label">
                        Starting Station
                      </span>

                      <strong>{train.from}</strong>
                    </div>
                  </div>

                  <div className="location-connector" />

                  <div className="location-item">
                    <span className="location-dot next-dot" />

                    <div>
                      <span className="location-label">
                        Destination Station
                      </span>

                      <strong>{train.to}</strong>
                    </div>
                  </div>
                </div>

                <p className="section-description">
                  Live location and running status are available
                  through the separate live tracking service.
                </p>

                <Link
                  className="text-link"
                  to={`/train/${train.number}`}
                >
                  View Train Details →
                </Link>
              </article>
            ))}

            {filteredTrains.length === 0 && (
              <div className="empty-state search-empty">
                <strong>No matching train found.</strong>

                <p>
                  Try another train name, number or station.
                </p>

                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setQuery('')}
                >
                  Show all trains
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Data information */}
      <section className="section timetable-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TRAIN INFORMATION</p>
            <h2>Train Catalog</h2>
          </div>

          <span className="muted">RailCore API</span>
        </div>

        <p className="section-description">
          This catalog displays train names, numbers, source
          stations and destinations returned by the API.
          Live running status, platform information, seat
          availability and fares require separate data sources.
        </p>
      </section>

    </div>
  );
}
