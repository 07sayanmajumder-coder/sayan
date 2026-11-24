
import { railwayRequest } from "../services/railwayApi.js";

// Validate journey date
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


// 1. Live train status
export const getLiveTrainStatus = async (req, res) => {
  try {
    const { trainNumber } = req.params;
    const { date } = req.query;

    if (!/^\d{4,6}$/.test(trainNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid train number."
      });
    }

    // Date is optional, but must be valid when provided.
    if (date && !isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid journey date. Use YYYY-MM-DD format."
      });
    }

    // Without a date, RailCore selects the current or next run.
    const endpoint = date
      ? `/trains/${trainNumber}/live?date=${encodeURIComponent(date)}`
      : `/trains/${trainNumber}/live`;

    const result = await railwayRequest(endpoint);

    return res.status(200).json(result);

  } catch (error) {
    console.error("Live status error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Unable to fetch live train status."
    });
  }
};

// 2. Train schedule
export const getTrainSchedule = async (req, res) => {
  try {
    const { trainNumber } = req.params;

    if (!/^\d{4,6}$/.test(trainNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid train number."
      });
    }

    const result = await railwayRequest(
      `/trains/${trainNumber}/schedule`
    );

    return res.status(200).json(result);

  } catch (error) {
    console.error("Schedule error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message
    });
  }
};

// 3. Trains between stations
export const getTrainsBetweenStations = async (req, res) => {
  try {
    const { from, to, date, quota = "GN", match = "city" } = req.query;

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

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Valid journey date is required. Use YYYY-MM-DD."
      });
    }

    const params = new URLSearchParams({
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      date,
      quota,
      match
    });

    const result = await railwayRequest(
      `/routes/trains?${params.toString()}`
    );

    return res.status(200).json(result);

  } catch (error) {
    console.error("Between stations error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Unable to find trains."
    });
  }
};

// 4. Search train catalog (up to 300 trains)
export const getTrainCatalog = async (req, res) => {
  try {
    const query = String(req.query.q || "a").trim();

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

    const params = new URLSearchParams({
      q: query,
      limit: String(limit)
    });

    const result = await railwayRequest(
      `/trains/search?${params.toString()}`
    );

    const trains = result?.data?.results;

    return res.status(200).json({
      success: true,
      count: Array.isArray(trains) ? trains.length : null,
      requestedLimit: limit,
      data: result
    });

  } catch (error) {
    console.error("Train catalog error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Unable to fetch train catalog."
    });
  }
};
