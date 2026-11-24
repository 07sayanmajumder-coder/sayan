import dotenv from "dotenv";

dotenv.config();

const BASE_URL =
  process.env.RAILCORE_BASE_URL || "https://ir.railcore.tech/v1";

const API_KEY = process.env.RAILCORE_KEY;

export async function railwayRequest(endpoint) {
  if (!API_KEY) {
    throw new Error("RailCore API key is missing. Check backend/.env");
  }

  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-RailCore-Key": API_KEY,
      Accept: "application/json"
    },
    signal: AbortSignal.timeout(20000)
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.error?.message ||
      result?.message ||
      `RailCore API request failed (${response.status})`;

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return result;
}