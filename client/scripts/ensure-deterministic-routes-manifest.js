const fs = require("node:fs");
const path = require("node:path");

const distDir = path.join(process.cwd(), ".next");
const routesManifest = path.join(distDir, "routes-manifest.json");
const deterministicManifest = path.join(
  distDir,
  "routes-manifest-deterministic.json",
);

function log(message) {
  process.stdout.write(`[manifest-compat] ${message}\n`);
}

try {
  if (!fs.existsSync(routesManifest)) {
    log("routes-manifest.json was not found, skipping compatibility copy.");
    process.exit(0);
  }

  if (fs.existsSync(deterministicManifest)) {
    log("routes-manifest-deterministic.json already exists.");
    process.exit(0);
  }

  fs.copyFileSync(routesManifest, deterministicManifest);
  log("Created routes-manifest-deterministic.json from routes-manifest.json.");
} catch (error) {
  const reason = error instanceof Error ? error.message : String(error);
  log(`Failed to create deterministic routes manifest: ${reason}`);
  process.exit(1);
}
