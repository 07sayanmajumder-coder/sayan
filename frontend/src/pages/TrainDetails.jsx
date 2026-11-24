
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  getLiveTrainStatus,
  getTrainSchedule
} from '../data/trains';

// Format date and time in Indian Standard Time
const formatDateTime = (value) => {
  if (!value) return 'Not available';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

const formatDuration = (milliseconds) => {
  if (milliseconds <= 0) return 'Arrival time passed';

  const totalMinutes = Math.floor(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours} hr ${minutes} min`;
};

const formatDistance = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    !Number.isFinite(Number(value))
  ) {
    return 'Not available';
  }

  return `${Number(value).toFixed(1)} km`;
};

// Find station arrays inside common API response structures
const findStations = (data, depth = 0) => {
  if (!data || typeof data !== 'object' || depth > 6) {
    return [];
  }

  if (Array.isArray(data)) {
    const stationKeys = [
      'station_code',
      'stationCode',
      'station_name',
      'stationName',
      'station',
      'stnCode'
    ];

    const looksLikeStations =
      data.length > 0 &&
      data.some((item) =>
        item &&
        typeof item === 'object' &&
        stationKeys.some((key) => item[key] != null)
      );

    if (looksLikeStations) return data;

    for (const item of data) {
      const result = findStations(item, depth + 1);
      if (result.length) return result;
    }

    return [];
  }

  const preferredKeys = [
    'stations',
    'route',
    'stops',
    'schedule',
    'routeStations',
    'stationList',
    'stopList',
    'trainRoute',
    'data',
    'result',
    'results'
  ];

  for (const key of preferredKeys) {
    if (data[key] !== undefined) {
      const result = findStations(data[key], depth + 1);
      if (result.length) return result;
    }
  }

  for (const value of Object.values(data)) {
    if (value && typeof value === 'object') {
      const result = findStations(value, depth + 1);
      if (result.length) return result;
    }
  }

  return [];
};

// Convert different station field names into one consistent format
const normalizeStation = (station, index) => ({
  ...station,

  station_code:
    station.station_code ||
    station.stationCode ||
    station.code ||
    station.stnCode ||
    station.stn_code ||
    station.station?.code ||
    '',

  station_name:
    station.station_name ||
    station.stationName ||
    station.name ||
    station.station?.name ||
    (typeof station.station === 'string' ? station.station : '') ||
    'Station information unavailable',

  sequence:
    station.sequence ??
    station.stop_number ??
    station.stopNumber ??
    station.serial_no ??
    station.s_no ??
    index + 1,

  distance_km:
    station.distance_km ??
    station.distanceKm ??
    station.distance ??
    station.km ??
    null,

  scheduled_arrival:
    station.scheduled_arrival ||
    station.scheduledArrival ||
    station.arrival_time ||
    station.arrivalTime ||
    station.sta ||
    station.arrival ||
    null,

  scheduled_departure:
    station.scheduled_departure ||
    station.scheduledDeparture ||
    station.departure_time ||
    station.departureTime ||
    station.std ||
    station.departure ||
    null,

  actual_arrival:
    station.actual_arrival ||
    station.actualArrival ||
    station.ata ||
    null,

  actual_departure:
    station.actual_departure ||
    station.actualDeparture ||
    station.atd ||
    null,

  platform_number:
    station.platform_number ||
    station.platformNumber ||
    station.platform ||
    null
});

export default function TrainDetails() {
  const { trainNumber } = useParams();

  const [train, setTrain] = useState(null);
  const [schedule, setSchedule] = useState(null);

  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  const [error, setError] = useState('');
  const [scheduleError, setScheduleError] = useState('');

  const [lastUpdated, setLastUpdated] = useState('');

  // Fetch live status and scheduled route independently
  const loadStatus = useCallback(async () => {
    setLoading(true);
    setScheduleLoading(true);

    setError('');
    setScheduleError('');

    const liveRequest = getLiveTrainStatus(trainNumber)
      .then((data) => {
        setTrain(data);
        setLastUpdated(new Date().toISOString());
      })
      .catch((err) => {
        console.error('Live status error:', err);
        setError(err.message || 'Unable to load live status.');
      })
      .finally(() => {
        setLoading(false);
      });

    const scheduleRequest = getTrainSchedule(trainNumber)
      .then((data) => {
        console.log('COMPLETE SCHEDULE RESPONSE:', data);
        setSchedule(data);
      })
      .catch((err) => {
        console.error('Schedule error:', err);
        setScheduleError(
          err.message || 'Unable to load train schedule.'
        );
      })
      .finally(() => {
        setScheduleLoading(false);
      });

    await Promise.all([liveRequest, scheduleRequest]);
  }, [trainNumber]);

  useEffect(() => {
    setTrain(null);
    setSchedule(null);
    setLastUpdated('');

    loadStatus();
  }, [loadStatus]);

  // Extract route stations from the schedule response
  const scheduleStations = useMemo(() => {
    return findStations(schedule).map(normalizeStation);
  }, [schedule]);

  // Prefer the scheduled route. Use live stations as fallback.
  const liveStations = Array.isArray(train?.stations)
    ? train.stations
    : [];

  const stations =
    scheduleStations.length > 0
      ? scheduleStations
      : liveStations.map(normalizeStation);

  const isUsingSchedule = scheduleStations.length > 0;

  const currentIndex = stations.findIndex(
    (station) =>
      station.station_code &&
      station.station_code === train?.current_station_code
  );

  const covered = Number(train?.distance_covered_km);
  const total = Number(train?.total_distance_km);

  const hasDistance =
    Number.isFinite(covered) &&
    Number.isFinite(total) &&
    total > 0;

  const remaining = hasDistance
    ? Math.max(0, total - covered)
    : null;

  const progress = Number(train?.progress_percent);

  const safeProgress = Number.isFinite(progress)
    ? Math.min(100, Math.max(0, progress))
    : 0;

  const nextStop = train?.next_stop;

  const etaTime = train?.eta_destination_at
    ? new Date(train.eta_destination_at)
    : null;

  const remainingTime =
    etaTime && !Number.isNaN(etaTime.getTime())
      ? etaTime.getTime() - Date.now()
      : null;

  const freshness = train?.freshness;

  const isInitialLoading =
    loading &&
    scheduleLoading &&
    !train &&
    !schedule;

  if (isInitialLoading) {
    return (
      <section className="page narrow-page">
        <p className="eyebrow">LIVE TRAIN TRACKING</p>
        <h1>Loading train details...</h1>
        <p className="lead">
          Fetching live status and scheduled train route.
        </p>
      </section>
    );
  }

  if (!train && !schedule && !loading && !scheduleLoading) {
    return (
      <section className="page narrow-page">
        <p className="eyebrow">TRAIN INFORMATION</p>
        <h1>Unable to load train</h1>

        <p className="lead">
          {error || scheduleError || 'Train information is unavailable.'}
        </p>

        <button
          className="button primary"
          onClick={loadStatus}
          disabled={loading || scheduleLoading}
        >
          Try Again
        </button>

        <p>
          <Link to="/dashboard">← Back to Dashboard</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="page train-details-page">

      {/* Page heading */}
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">TRAIN TRACKING</p>

          <h1>
            {train?.train_name ||
              schedule?.train_name ||
              schedule?.trainName ||
              'Train Details'}
          </h1>

          <p className="lead">
            Train No. {train?.train_number || trainNumber}
          </p>
        </div>

        <button
          className="button primary"
          onClick={loadStatus}
          disabled={loading || scheduleLoading}
        >
          {loading || scheduleLoading
            ? 'Refreshing...'
            : '↻ Refresh Train Details'}
        </button>
      </div>

      {/* API errors */}
      {error && (
        <div className="empty-state">
          Live status unavailable: {error}
          <p>
            The scheduled route may still be displayed below.
          </p>
        </div>
      )}

      {scheduleError && (
        <div className="empty-state">
          Schedule unavailable: {scheduleError}
          <p>
            Trying to display station information from live status instead.
          </p>
        </div>
      )}

      {/* Running status */}
      <div className="content-card">
        <p className="eyebrow">CURRENT RUNNING STATUS</p>

        <h2>
          {train?.status_text ||
            train?.status ||
            'Live status unavailable'}
        </h2>

        <div className="dashboard-stats">
          <div className="dashboard-stat">
            <span>Current / Last Reported Station</span>
            <strong>
              {train?.current_station_name || 'Not available'}
            </strong>
            <small>{train?.current_station_code || ''}</small>
          </div>

          <div className="dashboard-stat">
            <span>Next Station / Stop</span>
            <strong>
              {nextStop?.station_name ||
                train?.approaching_station_name ||
                'Not available'}
            </strong>
            <small>
              {nextStop?.station_code ||
                train?.approaching_station_code ||
                ''}
            </small>
          </div>

          <div className="dashboard-stat">
            <span>Estimated Speed</span>
            <strong>
              {train?.speed_basis === 'unavailable' ||
              train?.speed_kmph == null
                ? 'Not available'
                : `${train.speed_kmph} km/h`}
            </strong>
            <small>
              {train?.speed_basis === 'estimated'
                ? 'Estimated speed'
                : train?.speed_basis || ''}
            </small>
          </div>
        </div>
      </div>

      {/* Journey progress */}
      <div className="content-card">
        <p className="eyebrow">JOURNEY PROGRESS</p>

        <div className="journey-distance">
          <div>
            <span className="location-label">Distance covered</span>
            <h2>
              {hasDistance ? formatDistance(covered) : 'Not available'}
            </h2>
          </div>

          <div>
            <span className="location-label">Distance remaining</span>
            <h2>
              {remaining !== null
                ? formatDistance(remaining)
                : 'Not available'}
            </h2>
          </div>

          <div>
            <span className="location-label">Total distance</span>
            <h2>
              {hasDistance ? formatDistance(total) : 'Not available'}
            </h2>
          </div>
        </div>

        <div
          className="journey-progress-track"
          role="progressbar"
          aria-valuenow={safeProgress}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Journey progress"
        >
          <div
            className="journey-progress-fill"
            style={{ width: `${safeProgress}%` }}
          />
        </div>

        <div className="journey-progress-labels">
          <span>{safeProgress.toFixed(1)}% completed</span>
          <span>{(100 - safeProgress).toFixed(1)}% remaining</span>
        </div>
      </div>

      {/* Time information */}
      <div className="content-card">
        <p className="eyebrow">TIME AND ARRIVAL INFORMATION</p>

        <div className="dashboard-stats">
          <div className="dashboard-stat">
            <span>Next Stop ETA</span>
            <strong>
              {formatDateTime(nextStop?.eta)}
            </strong>
          </div>

          <div className="dashboard-stat">
            <span>Expected Destination Arrival</span>
            <strong>
              {formatDateTime(train?.eta_destination_at)}
            </strong>
          </div>

          <div className="dashboard-stat">
            <span>Estimated Time Remaining</span>
            <strong>
              {remainingTime !== null
                ? formatDuration(remainingTime)
                : 'Not available'}
            </strong>
          </div>

          <div className="dashboard-stat">
            <span>Current Delay</span>
            <strong>
              {train?.delay_minutes == null
                ? 'Not available'
                : train.delay_minutes < 0
                ? `${Math.abs(train.delay_minutes)} min early`
                : `${train.delay_minutes} min`}
            </strong>
          </div>
        </div>
      </div>

      {/* Complete route timeline */}
      <div className="content-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FULL TRAIN ROUTE</p>
            <h2>Station-by-Station Journey</h2>
          </div>

          <span className="muted">
            {stations.length} route points
          </span>
        </div>

        {scheduleLoading && stations.length === 0 ? (
          <p>Loading scheduled station details...</p>
        ) : stations.length === 0 ? (
          <div>
            <p>
              Station details are not available from the schedule
              or live-status response.
            </p>
            <p className="muted small">
              Check the browser console for the complete schedule response.
            </p>
          </div>
        ) : (
          <>
            <p className="muted small">
              {isUsingSchedule
                ? 'Showing scheduled train route with live information where available.'
                : 'Showing stations supplied by the live-status API. Scheduled route was not available.'}
            </p>

            <div className="station-timeline">
              {stations.map((station, index) => {
                const isCurrent =
                  station.station_code &&
                  station.station_code ===
                    train?.current_station_code;

                const isPassed =
                  !isCurrent &&
                  (
                    station.travelled === true ||
                    station.has_departed === true ||
                    (
                      currentIndex >= 0 &&
                      index < currentIndex
                    )
                  );

                const isNext =
                  !isPassed &&
                  !isCurrent &&
                  (
                    station.station_code ===
                      train?.approaching_station_code ||
                    station.station_code ===
                      nextStop?.station_code
                  );

                const state = isCurrent
                  ? 'CURRENT'
                  : isPassed
                  ? 'CROSSED'
                  : isNext
                  ? 'NEXT'
                  : 'UPCOMING';

                const arrival =
                  station.actual_arrival ||
                  station.eta ||
                  station.scheduled_arrival;

                const departure =
                  station.actual_departure ||
                  station.etd ||
                  station.scheduled_departure;

                return (
                  <article
                    className={`station-timeline-item ${state.toLowerCase()}`}
                    key={`${station.station_code || station.station_name}-${station.sequence || index}`}
                  >
                    <div className="station-timeline-marker">
                      {isPassed ? '✓' : isCurrent ? '●' : index + 1}
                    </div>

                    <div className="station-timeline-content">
                      <div className="station-title-row">
                        <div>
                          <strong>{station.station_name}</strong>

                          <p className="muted small">
                            {station.station_code || 'Code unavailable'}
                            {' · '}
                            {station.stop_type || 'Station'}
                          </p>
                        </div>

                        <span className="status">{state}</span>
                      </div>

                      <div className="station-details-grid">
                        <span>
                          Distance:{' '}
                          <b>{formatDistance(station.distance_km)}</b>
                        </span>

                        <span>
                          Arrival:{' '}
                          <b>{formatDateTime(arrival)}</b>
                        </span>

                        <span>
                          Departure:{' '}
                          <b>{formatDateTime(departure)}</b>
                        </span>

                        {station.platform_number && (
                          <span>
                            Platform:{' '}
                            <b>{station.platform_number}</b>
                          </span>
                        )}

                        {station.delay_arrival_minutes != null && (
                          <span>
                            Arrival delay:{' '}
                            <b>{station.delay_arrival_minutes} min</b>
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Service information */}
      <div className="content-card">
        <p className="eyebrow">SERVICE INFORMATION</p>

        <p>
          Cancellation status:{' '}
          <strong>
            {train?.cancellation?.status || 'Not available'}
          </strong>
        </p>

        <p>
          Journey date:{' '}
          <strong>
            {train?.journey_date || 'Not available'}
          </strong>
        </p>

        <p>
          Last report:{' '}
          <strong>
            {formatDateTime(
              train?.last_reported_at ||
              freshness?.last_reported_at
            )}
          </strong>
        </p>

        <p>
          Data confidence:{' '}
          <strong>{train?.confidence || 'Not available'}</strong>
        </p>

        <p className="muted small">
          Page refreshed: {formatDateTime(lastUpdated)}
        </p>
      </div>

      <Link className="text-link" to="/dashboard">
        ← Back to Dashboard
      </Link>

      <p className="muted small">
        Live position and speed depend on railway feed availability.
        Speed is an estimate when supplied as such by RailCore.
        Arrival times and platforms may change.
      </p>
    </section>
  );
}
