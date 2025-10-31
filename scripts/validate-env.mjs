#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const REQUIRED = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

function loadDotEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2];
    // Strip surrounding quotes
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function getEnv() {
  const root = process.cwd();
  const dotEnvPath = path.join(root, ".env");
  const fileEnv = loadDotEnv(dotEnvPath);
  return { ...process.env, ...fileEnv };
}

function fail(msg) {
  console.error(`\n[validate-env] ${msg}\n`);
  process.exit(1);
}

(function main() {
  const env = getEnv();

  // Basic presence checks
  const missing = REQUIRED.filter(
    (k) => !env[k] || String(env[k]).trim() === ""
  );
  if (missing.length) {
    fail(
      `Missing required env vars: ${missing.join(
        ", "
      )}.\nEnsure your .env is present before running 'npm run build', or set these variables in your CI.`
    );
  }

  // Plausibility checks
  const key = String(env.VITE_FIREBASE_API_KEY);
  if (!key.startsWith("AIza")) {
    fail(
      "VITE_FIREBASE_API_KEY doesn't look like a valid web API key (should start with 'AIza')."
    );
  }

  const bucket = String(env.VITE_FIREBASE_STORAGE_BUCKET);
  if (!/\.appspot\.com$/.test(bucket)) {
    fail(
      "VITE_FIREBASE_STORAGE_BUCKET must end with '.appspot.com'. Example: '<project-id>.appspot.com'."
    );
  }

  // Optional helpful warnings
  if (!env.VITE_FIREBASE_MEASUREMENT_ID) {
    console.warn(
      "[validate-env] Note: VITE_FIREBASE_MEASUREMENT_ID is optional, continuing..."
    );
  }

  console.log("[validate-env] OK: Environment looks valid.");
})();
