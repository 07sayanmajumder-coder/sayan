
import { railwayRequest } from "../services/railwayApi.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localTrainDataPath = path.join(
  __dirname,
  "../data/trains.json"
);

// Read local train data
const readLocalTrains = () => {
  const localData = JSON.parse(
    fs.readFileSync(localTrainDataPath, "utf8")
  );

  if (!Array.isArray(localData)) {
    throw new Error("Local train data must be a JSON array.");
  }

  return localData;
};

// Validate date
const isValidDate = (date) => {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
};

// Normalize route stations
const normalizeStops = (stops = []) => {
  if (!Array.isArray(stops)) return [];

  return stops.map((stop) => ({
    stationCode: stop.station?.code || "",
    stationName: stop.station?.name || "",
    arrivalTime: stop.scheduledArrival || null,
    departureTime: stop.scheduledDeparture || null,
    actualArrival: stop.actualArrival || null,
    actualDeparture: stop.actualDeparture || null,
    platform: stop.platform || null,
    distanceKm: stop.distanceKm ?? null,
    day: stop.day ?? null,
    sequence: stop.sequence ?? null
  }));
};

// 1. Live train status
export const getLiveTrainStatus = async (req, res) => {
  const { trainNumber } = req.params;
  const { date } = req.query;

  try {
    if (!/^\d{5}$/.test(trainNumber)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_TRAIN_NUMBER",
        message: "Enter a valid 5-digit train number."
      });
    }

    if (date && !isValidDate(date)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_DATE",
        message: "Invalid journey date. Use YYYY-MM-DD format."
      });
    }

    const params = new URLSearchParams();

    if (date) {
      params.set("date", date);
    }

    const query = params.toString();

    const endpoint =
      `/v1/train/${trainNumber}/status` +
      (query ? `?${query}` : "");

    console.log("Fetching live train status:", trainNumber);
    console.log("Live status endpoint:", endpoint);

    const result = await railwayRequest(endpoint);

    if (!result?.data) {
      throw new Error(
        "Railway Engine did not return live train status data."
      );
    }

    console.log(
      "Live train status loaded:",
      trainNumber,
      result.isStale ? "(STALE DATA)" : "(FRESH DATA)"
    );

    return res.status(200).json({
      success: true,
      source: "Railway Engine",
      isStale: Boolean(result.isStale),
      data: result.data,
      meta: result.meta || null,
      message: result.isStale
        ? "Showing previously cached train status."
        : "Live train status loaded successfully."
    });

  } catch (error) {
    console.error("========== LIVE TRAIN STATUS ERROR ==========");
    console.error("Train number:", trainNumber);
    console.error("HTTP status:", error.status || 500);
    console.error("Error code:", error.code || "UNKNOWN");
    console.error("Error message:", error.message);
    console.error("==============================================");

    const statusCode =
      error.status >= 400 && error.status <= 599
        ? error.status
        : 503;

    return res.status(statusCode).json({
      success: false,
      source: "Railway Engine",
      code: error.code || "LIVE_STATUS_ERROR",
      message:
        error.message ||
        "Unable to fetch live train status.",
      data: null
    });
  }
};

// 2. Train schedule with local fallback
export const getTrainSchedule = async (req, res) => {
  const { trainNumber } = req.params;
  const { date } = req.query;

  if (!/^\d{5}$/.test(trainNumber)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid 5-digit train number."
    });
  }

  if (date && !isValidDate(date)) {
    return res.status(400).json({
      success: false,
      message: "Invalid journey date. Use YYYY-MM-DD format."
    });
  }

  try {
    const params = new URLSearchParams();

    if (date) {
      params.set("date", date);
    }

    const query = params.toString();

    const endpoint =
      `/v1/train/${trainNumber}/route` +
      (query ? `?${query}` : "");

    const result = await railwayRequest(endpoint);

    const routeData = result?.data || {};
    const stations = normalizeStops(routeData.stops);

    if (!stations.length) {
      throw new Error(
        "Railway Engine returned no route stations."
      );
    }

    return res.status(200).json({
      success: true,
      source: "Railway Engine",
      isFallback: false,
      data: {
        train_number: routeData.trainNumber || trainNumber,
        train_name: routeData.trainName || "",
        stations
      },
      message: "Train route loaded successfully."
    });

  } catch (error) {
    console.error("Railway Engine route error:", error.message);
    console.log("LOCAL SCHEDULE FALLBACK STARTED");

    try {
      const localData = readLocalTrains();

      const localTrain = localData.find(
        (train) =>
          String(train.trainNumber) === String(trainNumber)
      );

      if (!localTrain || !Array.isArray(localTrain.schedule)) {
        return res.status(404).json({
          success: false,
          message: "No local schedule available for this train."
        });
      }

      const scheduleData = {
        train_number: localTrain.trainNumber,
        train_name: localTrain.trainName,
        source: "Local sample data",
        isFallback: true,
        stations: localTrain.schedule
      };

      return res.status(200).json({
        success: true,
        source: "Local sample data",
        isFallback: true,
        data: scheduleData,
        message:
          "Showing simulated schedule, not verified railway timings."
      });

    } catch (localError) {
      console.error("Local schedule error:", localError.message);

      return res.status(503).json({
        success: false,
        message:
          "Railway Engine is unavailable and local schedule could not be loaded."
      });
    }
  }
};

// 3. Trains between stations
export const getTrainsBetweenStations = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "Source and destination stations are required."
      });
    }

    if (
      !/^[A-Z0-9]{2,6}$/i.test(from) ||
      !/^[A-Z0-9]{2,6}$/i.test(to)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid station codes."
      });
    }

    const source = from.toUpperCase();
    const destination = to.toUpperCase();

    const localData = readLocalTrains();

    const matchingTrains = localData.filter((train) => {
      if (!Array.isArray(train.schedule)) return false;

      const sourceIndex = train.schedule.findIndex(
        (station) =>
          String(station.stationCode || "").toUpperCase() === source
      );

      const destinationIndex = train.schedule.findIndex(
        (station) =>
          String(station.stationCode || "").toUpperCase() === destination
      );

      return (
        sourceIndex !== -1 &&
        destinationIndex !== -1 &&
        sourceIndex < destinationIndex
      );
    });

    return res.status(200).json({
      success: true,
      source: "Local sample data",
      isFallback: true,
      count: matchingTrains.length,
      data: matchingTrains,
      message:
        "Results are based on local sample routes, not a live train search."
    });

  } catch (error) {
    console.error("Between stations error:", error.message);

    return res.status(503).json({
      success: false,
      message: "Unable to search local train routes."
    });
  }
};

// 4. Train catalog with local fallback
export const getTrainCatalog = async (req, res) => {
  const query = String(req.query.q || "a")
    .trim()
    .toLowerCase();

  const limit = Math.min(
    Math.max(Number(req.query.limit) || 300, 1),
    300
  );

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Train search query is required."
    });
  }

  try {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit)
    });

    const result = await railwayRequest(
      `/v1/trains/search?${params.toString()}`
    );

    const trains = result?.data?.results || [];

    return res.status(200).json({
      success: true,
      source: "Railway Engine",
      isFallback: false,
      count: trains.length,
      requestedLimit: limit,
      data: {
        results: trains
      }
    });

  } catch (error) {
    console.error("Train catalog API error:", error.message);

    try {
      const localData = readLocalTrains();

      const filteredTrains = localData.filter((train) => {
        const searchableText = [
          train.trainNumber,
          train.trainName,
          train.source,
          train.destination,
          train.sourceName,
          train.destinationName
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      });

      return res.status(200).json({
        success: true,
        source: "Local sample data",
        isFallback: true,
        count: filteredTrains.length,
        requestedLimit: limit,
        data: {
          results: filteredTrains.slice(0, limit)
        },
        message:
          "External train API unavailable. Showing local sample data."
      });

    } catch (localError) {
      console.error("Local train data error:", localError.message);

      return res.status(503).json({
        success: false,
        message:
          "Train API is unavailable and local train data could not be loaded."
      });
    }
  }
};
