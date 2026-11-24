
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

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error("Firebase service account JSON file not found.");
}

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8")
);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const firebaseAuth = getAuth();

console.log("Firebase Admin SDK initialized successfully.");

export default firebaseAuth;
