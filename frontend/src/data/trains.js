const API_URL =
  import.meta.env.VITE_API_URL || "https://railway-booking-backend-n1cx.onrender.com/api";

// Fetch train catalog
export async function getTrains() {
  const response = await fetch(
    `${API_URL}/trains/catalog?q=a&limit=300`,
    { cache: "no-store" }
  );

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Unable to load trains.");
  }

  const trains =
    result?.data?.results ||
    result?.data?.data?.results ||
    result?.data?.data ||
    result?.data;

  if (!Array.isArray(trains)) {
    console.error("Invalid train catalog response:", result);
    throw new Error("Invalid train catalog response.");
  }

  console.log("Train catalog source:", result.source);
  console.log("Trains loaded:", trains.length);

  return trains;
}

// Search trains between two stations
export async function getTrainsBetweenStations(from, to, date) {
  if (!from || !to || !date) {
    throw new Error(
      "Please select source, destination and journey date."
    );
  }

  const params = new URLSearchParams({
    from: from.trim().toUpperCase(),
    to: to.trim().toUpperCase(),
    date
  });

  const response = await fetch(
    `${API_URL}/trains/between?${params.toString()}`,
    { cache: "no-store" }
  );

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Unable to find trains.");
  }

  const trains = Array.isArray(result.data)
    ? result.data
    : result.data?.results || [];

  console.log("Train search source:", result.source);
  console.log("Matching trains:", trains.length);

  return trains;
}

// Fetch live train status
export async function getLiveTrainStatus(trainNumber, date) {
  const params = new URLSearchParams();

  if (date) {
    params.set("date", date);
  }

  const query = params.toString();

  const response = await fetch(
    `${API_URL}/trains/${encodeURIComponent(trainNumber)}/live${
      query ? `?${query}` : ""
    }`,
    { cache: "no-store" }
  );

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || "Unable to fetch live train status."
    );
  }

  console.log("Live train status response:", result);

  return result;
}

// Fetch scheduled train route
export async function getTrainSchedule(trainNumber) {
  const response = await fetch(
    `${API_URL}/trains/${encodeURIComponent(trainNumber)}/schedule`,
    { cache: "no-store" }
  );

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || "Unable to fetch train schedule."
    );
  }

  console.log("Raw schedule API response:", result);

  return result.data || result;
}
