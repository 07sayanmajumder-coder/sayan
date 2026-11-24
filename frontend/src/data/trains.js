
const API_URL = "http://localhost:5000/api";

// Common response handler
async function handleResponse(response, defaultMessage) {
  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || defaultMessage);
  }

  return result?.data?.data || result?.data || result;
}

// Fetch train catalog
export async function getTrains() {
  const response = await fetch(
    `${API_URL}/trains/catalog?q=a&limit=300`
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Unable to load trains.");
  }

  return result.data;
}

// Fetch live train details
export async function getLiveTrainStatus(trainNumber) {
  const response = await fetch(
    `${API_URL}/trains/${encodeURIComponent(trainNumber)}/live`
  );

  return handleResponse(
    response,
    "Unable to fetch live train status."
  );
}

// Fetch complete scheduled train route

export async function getTrainSchedule(trainNumber) {
  const response = await fetch(
    `${API_URL}/trains/${encodeURIComponent(trainNumber)}/schedule`
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
