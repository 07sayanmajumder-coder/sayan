
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(
  __dirname,
  "firebase-service-account.json"
);

let serviceAccount;

// Render: read credentials from environment variable
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT
    );
  } catch {
    throw new Error(
      "Invalid FIREBASE_SERVICE_ACCOUNT environment variable. Check its JSON format."
    );
  }
}
// Local development: read credentials from JSON file
else if (fs.existsSync(serviceAccountPath)) {
  serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  );
} else {
  throw new Error(
    "Firebase credentials not found. Configure FIREBASE_SERVICE_ACCOUNT or provide the local service account JSON file."
  );
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const firebaseAuth = getAuth();

console.log("Firebase Admin SDK initialized successfully.");

export default firebaseAuth;
