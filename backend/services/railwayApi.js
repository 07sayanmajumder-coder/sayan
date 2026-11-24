
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = (
  process.env.RAILWAY_ENGINE_BASE_URL ||
  "https://railway-engine.apkscope.workers.dev"
).replace(/\/+$/, "");

const API_KEY = process.env.RAILWAY_ENGINE_API_KEY?.trim();

export async function railwayRequest(endpoint) {
  // 1. Validate API key
  if (!API_KEY) {
    const error = new Error(
      "Railway Engine API key is missing. Check backend/.env"
    );

    error.status = 500;
    error.code = "MISSING_API_KEY";

    throw error;
  }

  // 2. Validate endpoint
  const cleanEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const url = `${BASE_URL}${cleanEndpoint}`;

  console.log("Railway Engine request:", url);

  // 3. Send request
  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY,
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(20000)
    });
  } catch (fetchError) {
    const error = new Error(
      fetchError.name === "TimeoutError" ||
      fetchError.name === "AbortError"
        ? "Railway Engine request timed out."
        : `Unable to connect to Railway Engine: ${fetchError.message}`
    );

    error.status = 503;
    error.code = "PROVIDER_CONNECTION_ERROR";

    throw error;
  }

  // 4. Read response
  const responseText = await response.text();

  let result = {};

  try {
    result = responseText ? JSON.parse(responseText) : {};
  } catch {
    const error = new Error(
      "Railway Engine returned an invalid JSON response."
    );

    error.status = response.status;
    error.code = "INVALID_PROVIDER_RESPONSE";

    throw error;
  }

  // 5. Handle HTTP errors
  if (!response.ok) {
    const message =
      result?.error?.message ||
      result?.message ||
      `Railway Engine request failed (${response.status}).`;

    const error = new Error(message);

    error.status = response.status;
    error.code =
      result?.error?.code ||
      result?.code ||
      "PROVIDER_REQUEST_FAILED";

    throw error;
  }

  // 6. Handle provider status
  const providerStatus = String(
    result?.status || ""
  ).toUpperCase();

  if (
    providerStatus &&
    !["SUCCESS", "STALE_DATA"].includes(providerStatus)
  ) {
    const error = new Error(
      result?.error?.message ||
      result?.message ||
      `Railway Engine returned status: ${providerStatus}`
    );

    error.status = response.status;
    error.code =
      result?.error?.code ||
      providerStatus;

    throw error;
  }

  // 7. Validate returned data
  if (!result?.data) {
    const error = new Error(
      "Railway Engine returned no usable data."
    );

    error.status = 502;
    error.code = "EMPTY_PROVIDER_RESPONSE";

    throw error;
  }

  // 8. Return normalized provider response
  return {
    ...result,
    isStale: providerStatus === "STALE_DATA"
  };
}
