
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getTrainSchedule,
  getLiveTrainStatus
} from "../data/trains";

// Current date in Indian Standard Time
const getIndiaDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

// Format scheduled station times and ISO date-times
const formatTime = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  if (
    typeof value === "string" &&
    /^\d{1,2}:\d{2}/.test(value)
  ) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
};

// Format ETA with its date
const formatETA = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
};

// Format station objects returned by Railway Engine
const formatStation = (station) => {
  if (!station) return "Not available";

  if (typeof station === "string") {
    return station;
  }

  if (station.name && station.code) {
    return `${station.name} (${station.code})`;
  }

  return station.name || station.code || "Not available";
};

// Convert NOT_STARTED into Not Started
const formatStatus = (status) => {
  if (!status) return "Not available";

  return String(status)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// Normalize scheduled station information
const normalizeStation = (station, index) => ({
  ...station,

  station_code:
    station.station_code ||
    station.stationCode ||
    station.code ||
    station.stnCode ||
    "",

  station_name:
    station.station_name ||
    station.stationName ||
    station.name ||
    "Station information unavailable",

  sequence:
    station.sequence ??
    station.stop_number ??
    station.stopNumber ??
    index + 1,

  distance_km:
    station.distance_km ??
    station.distanceKm ??
    station.distance ??
    station.km ??
    null,

  scheduled_arrival:
    station.scheduled_arrival ??
    station.scheduledArrival ??
    station.arrival_time ??
    station.arrivalTime ??
    station.arrival ??
    null,

  scheduled_departure:
    station.scheduled_departure ??
    station.scheduledDeparture ??
    station.departure_time ??
    station.departureTime ??
    station.departure ??
    null
});

// Format distance
const formatDistance = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return "Not available";
  }

  return `${Number(value).toFixed(1)} km`;
};

export default function TrainDetails() {
  const { trainNumber } = useParams();

  // Scheduled route states
  const [schedule, setSchedule] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState("");

  // Live status states
  const [liveResponse, setLiveResponse] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState("");

  // Load scheduled route
  const loadSchedule = useCallback(async () => {
    if (!trainNumber) {
      setScheduleError("Train number is missing from the page URL.");
      setScheduleLoading(false);
      return;
    }

    setScheduleLoading(true);
    setScheduleError("");
    setSchedule(null);

    try {
      const result = await getTrainSchedule(trainNumber);

      console.log("Complete schedule response:", result);

      setSchedule(result);
    } catch (error) {
      console.error("Schedule error:", error);

      setScheduleError(
        error.message || "Unable to load the train schedule."
      );
    } finally {
      setScheduleLoading(false);
    }
  }, [trainNumber]);

  // Load live running status
  const loadLiveStatus = useCallback(async () => {
    if (!trainNumber) return;

    setLiveLoading(true);
    setLiveError("");

    try {
      const result = await getLiveTrainStatus(
        trainNumber,
        getIndiaDate()
      );

      console.log("Complete live status response:", result);

      setLiveResponse(result);
    } catch (error) {
      console.error("Live train status error:", error);

      setLiveResponse(null);

      setLiveError(
        error.message || "Unable to fetch live train status."
      );
    } finally {
      setLiveLoading(false);
    }
  }, [trainNumber]);

  // Load both independently
  useEffect(() => {
    loadSchedule();
    loadLiveStatus();
  }, [loadSchedule, loadLiveStatus]);

  // Scheduled stations
  const rawStations = Array.isArray(schedule?.stations)
    ? schedule.stations
    : Array.isArray(schedule?.schedule)
    ? schedule.schedule
    : [];

  const stations = rawStations.map(normalizeStation);

  const trainName =
    schedule?.train_name ||
    schedule?.trainName ||
    "Train Details";

  const isFallback =
    schedule?.isFallback === true ||
    schedule?.source === "Local sample data";

  // Exact Railway Engine response structure
  const liveData = liveResponse?.data || {};

  const currentStation = liveData.currentStation;
  const nextStation = liveData.nextStation;

  const speed = liveData.speedKmph;
  const delay = liveData.delayMinutes;

  const eta = liveData.eta;
  const liveStatus = liveData.status;

  const routeProgress = liveData.routeProgress;
  const freshness = liveData.freshness;

  const hasLiveData = Boolean(
    liveResponse?.success && liveResponse?.data
  );

  const isStale =
    liveResponse?.isStale === true ||
    freshness?.state === "STALE";

  const refreshAll = () => {
    loadSchedule();
    loadLiveStatus();
  };

  return (
    <section className="page train-details-page">

      {/* PAGE HEADING */}
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">TRAIN INFORMATION</p>

          <h1>
            {liveData.trainName || trainName}
          </h1>

          <p className="lead">
            Train No. {trainNumber}
          </p>
        </div>

        <button
          className="button primary"
          onClick={refreshAll}
          disabled={scheduleLoading || liveLoading}
        >
          {scheduleLoading || liveLoading
            ? "Refreshing..."
            : "↻ Refresh"}
        </button>
      </div>

      {/* SAMPLE DATA WARNING */}
      {isFallback && (
        <div className="empty-state">
          <strong>Sample schedule displayed</strong>

          <p>
            These station timings come from local demonstration
            data. They are not verified live railway timings.
          </p>
        </div>
      )}

      {/* SCHEDULE LOADING */}
      {scheduleLoading && (
        <div className="content-card">
          <p>Loading scheduled station details...</p>
        </div>
      )}

      {/* SCHEDULE ERROR */}
      {scheduleError && (
        <div className="empty-state">
          <strong>Schedule unavailable</strong>

          <p>{scheduleError}</p>

          <button
            className="button primary"
            onClick={loadSchedule}
            disabled={scheduleLoading}
          >
            Try Again
          </button>
        </div>
      )}

      {!scheduleLoading && !scheduleError && (
        <>

          {/* SCHEDULED TRAIN ROUTE */}
          <div className="content-card">
            <p className="eyebrow">
              SCHEDULED TRAIN ROUTE
            </p>

            <h2>Station-by-Station Journey</h2>

            <p className="muted small">
              {stations.length} stations in this schedule
            </p>

            {stations.length === 0 ? (
              <p>
                No station details were returned for this train.
              </p>
            ) : (
              <div className="station-timeline">

                {stations.map((station, index) => (
                  <article
                    className="station-timeline-item upcoming"
                    key={`${station.station_code || station.station_name}-${index}`}
                  >
                    <div className="station-timeline-marker">
                      {index + 1}
                    </div>

                    <div className="station-timeline-content">

                      <div className="station-title-row">
                        <div>
                          <strong>
                            {station.station_name}
                          </strong>

                          <p className="muted small">
                            {station.station_code ||
                              "Station code unavailable"}
                          </p>
                        </div>

                        <span className="status">
                          {station.day
                            ? `Day ${station.day}`
                            : `Stop ${index + 1}`}
                        </span>
                      </div>

                      <div className="station-details-grid">

                        <span>
                          Arrival:{" "}
                          <b>
                            {formatTime(
                              station.scheduled_arrival
                            )}
                          </b>
                        </span>

                        <span>
                          Departure:{" "}
                          <b>
                            {formatTime(
                              station.scheduled_departure
                            )}
                          </b>
                        </span>

                        <span>
                          Distance:{" "}
                          <b>
                            {formatDistance(
                              station.distance_km
                            )}
                          </b>
                        </span>

                      </div>
                    </div>
                  </article>
                ))}

              </div>
            )}
          </div>

          {/* LIVE TRAIN STATUS */}
          <div className="content-card">

            <p className="eyebrow">
              LIVE TRAIN STATUS
            </p>

            <h2>Running Information</h2>

            {/* LOADING */}
            {liveLoading && (
              <p>
                Fetching live train running information...
              </p>
            )}

            {/* ERROR */}
            {!liveLoading && liveError && (
              <div className="empty-state">
                <strong>Live status unavailable</strong>

                <p>{liveError}</p>

                <button
                  className="button primary"
                  onClick={loadLiveStatus}
                >
                  Retry Live Status
                </button>
              </div>
            )}

            {/* LIVE RESPONSE */}
            {!liveLoading && !liveError && hasLiveData && (
              <>

                {/* STALE DATA WARNING */}
                {isStale && (
                  <div className="empty-state">
                    <strong>
                      Previously cached information
                    </strong>

                    <p>
                      The provider returned stale data.
                      This may not represent the train's
                      current position.
                    </p>
                  </div>
                )}

                {/* RUNNING STATUS */}
                <div className="station-details-grid">

                  <span>
                    Current station:{" "}
                    <b>
                      {formatStation(currentStation)}
                    </b>
                  </span>

                  <span>
                    Next station:{" "}
                    <b>
                      {formatStation(nextStation)}
                    </b>
                  </span>

                  <span>
                    Speed:{" "}
                    <b>
                      {speed !== null && speed !== undefined
                        ? `${speed} km/h`
                        : "Not available"}
                    </b>
                  </span>

                  <span>
                    Delay:{" "}
                    <b>
                      {delay !== null && delay !== undefined
                        ? `${delay} minutes`
                        : "Not available"}
                    </b>
                  </span>

                  <span>
                    {eta?.source === "SCHEDULED"
                      ? "Scheduled estimated arrival: "
                      : "Estimated arrival: "}

                    <b>
                      {formatETA(eta?.value)}
                    </b>
                  </span>

                  <span>
                    Running status:{" "}
                    <b>
                      {formatStatus(liveStatus)}
                    </b>
                  </span>

                </div>

                {/* ROUTE PROGRESS */}
                {routeProgress && (
                  <div style={{ marginTop: "24px" }}>

                    <p className="eyebrow">
                      ROUTE PROGRESS
                    </p>

                    <h3>
                      {routeProgress.completedStops ?? 0}
                      {" / "}
                      {routeProgress.totalStops ?? 0}
                      {" stops completed"}
                    </h3>

                    <div
                      style={{
                        height: "10px",
                        background: "var(--border-color, #ddd)",
                        borderRadius: "20px",
                        overflow: "hidden",
                        marginTop: "12px"
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              Number(routeProgress.percent) || 0
                            )
                          )}%`,
                          height: "100%",
                          background: "var(--primary, #3b82f6)",
                          borderRadius: "20px",
                          transition: "width 0.3s ease"
                        }}
                      />
                    </div>

                    <p className="muted small">
                      {routeProgress.remainingStops ?? 0}
                      {" stops remaining"}
                    </p>

                  </div>
                )}

                {/* DATA QUALITY INFORMATION */}
                <div style={{ marginTop: "20px" }}>

                  <p className="muted small">
                    Data freshness:{" "}
                    <b>
                      {freshness?.state || "Not available"}
                    </b>
                  </p>

                  <p className="muted small">
                    Confidence:{" "}
                    <b>
                      {liveData.confidence || "Not available"}
                    </b>
                  </p>

                  <p className="muted small">
                    Last observed:{" "}
                    <b>
                      {freshness?.observedAt
                        ? formatETA(freshness.observedAt)
                        : "Not available"}
                    </b>
                  </p>

                  <p className="muted small">
                    Provider:{" "}
                    <b>
                      {liveData.source || "Railway Engine"}
                    </b>
                  </p>

                </div>

                {/* PROVIDER MESSAGE */}
                <p className="muted small">
                  Source: {liveResponse.source || "Railway Engine"}
                  {" · "}
                  {liveResponse.message || ""}
                </p>

              </>
            )}

            {/* EMPTY RESPONSE */}
            {!liveLoading && !liveError && !hasLiveData && (
              <p>
                Live running information has not been received yet.
              </p>
            )}

            {/* REFRESH LIVE STATUS */}
            <button
              className="button primary"
              onClick={loadLiveStatus}
              disabled={liveLoading}
            >
              {liveLoading
                ? "Checking..."
                : "↻ Refresh Live Status"}
            </button>

          </div>

        </>
      )}

      {/* BACK BUTTON */}
      <Link className="text-link" to="/dashboard">
        ← Back to Dashboard
      </Link>

    </section>
  );
}
