
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  initializeApp,
  cert,
  getApps
} from "firebase-admin/app";

import { getAuth } from "firebase-admin/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(
  __dirname,
  "firebase-service-account.json"
);

let serviceAccount;

// Check whether Render provides the environment variable
const firebaseEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

console.log(
  "Firebase environment variable detected:",
  Boolean(firebaseEnv)
);

if (firebaseEnv && firebaseEnv.trim() !== "") {
  try {
    serviceAccount = JSON.parse(firebaseEnv);

    console.log("Firebase credentials loaded from environment.");

  } catch (error) {
    console.error("Firebase environment JSON parsing failed.");

    throw new Error(
      "Invalid FIREBASE_SERVICE_ACCOUNT JSON. Check its formatting."
    );
  }
}

// Local development fallback
else if (fs.existsSync(serviceAccountPath)) {
  try {
    serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf8")
    );

    console.log("Firebase credentials loaded from local JSON file.");

  } catch (error) {
    throw new Error(
      "Local Firebase service account JSON is invalid."
    );
  }
}

// No credentials found
else {
  console.error(
    "Firebase credentials were not detected."
  );

  throw new Error(
    "Firebase credentials not found. Add FIREBASE_SERVICE_ACCOUNT to Render Environment."
  );
}

// Validate essential service account fields
if (
  !serviceAccount.project_id ||
  !serviceAccount.client_email ||
  !serviceAccount.private_key
) {
  throw new Error(
    "Firebase service account is missing required fields."
  );
}

// Initialize Firebase Admin only once
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const firebaseAuth = getAuth();

console.log(
  "Firebase Admin SDK initialized successfully."
);

export default firebaseAuth;
