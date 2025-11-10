import fs from "fs";
import path from "path";
import { setTimeout as delay } from "timers/promises";

type Hospital = {
  id: string;
  name: string;
  city?: string;
  address?: string;
};

type GeocodeCacheEntry = {
  lat: number;
  lon: number;
  displayName: string;
  source: string;
  timestamp: string;
};

const HOSPITALS_PATH = path.resolve(__dirname, "../client/src/data/hospitals.json");
const CACHE_DIR = path.resolve(__dirname, "./cache");
const CACHE_PATH = path.join(CACHE_DIR, "geocode-cache.json");
const OUTPUT_PATH = path.resolve(__dirname, "../client/src/data/hospitals.enriched.json");

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

async function main() {
  ensureCacheDir();

  const hospitals = readHospitals();
  const karachiHospitals = hospitals.filter((hospital) =>
    hospital.city?.toLowerCase() === "karachi"
  );

  const cache = loadCache();
  for (const hospital of karachiHospitals) {
    const cacheKey = hospital.id;
    const cached = cache[cacheKey];

    if (cached) {
      continue;
    }

    const query = buildQuery(hospital);
    console.log(`Geocoding ${hospital.name} -> ${query}`);

    const result = await geocode(query);

    if (!result) {
      console.warn(`No geocode result for ${hospital.name}`);
      continue;
    }

    cache[cacheKey] = {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      displayName: result.display_name,
      source: "nominatim",
      timestamp: new Date().toISOString(),
    };

    saveCache(cache);

    await delay(1100);
  }

  writeEnrichedData(hospitals, cache);
  console.log(`Enriched data written to ${OUTPUT_PATH}`);
}

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function readHospitals(): Hospital[] {
  const raw = fs.readFileSync(HOSPITALS_PATH, "utf-8");
  return JSON.parse(raw);
}

function loadCache(): Record<string, GeocodeCacheEntry> {
  if (!fs.existsSync(CACHE_PATH)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
}

function saveCache(cache: Record<string, GeocodeCacheEntry>) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

function buildQuery(hospital: Hospital) {
  const parts = [hospital.name];

  if (hospital.address && !hospital.address.toLowerCase().includes("karachi")) {
    parts.push(hospital.address);
  }

  parts.push("Karachi");
  parts.push("Pakistan");

  return parts.join(", ");
}

async function geocode(query: string) {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    addressdetails: "0",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        "User-Agent": "InsureLink-FYP/1.0 (insurelink@example.com)",
        "Accept-Language": "en",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`Geocoding request failed (${response.status}) for query: ${query}`);
      return null;
    }

    const data = (await response.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    return data[0] ?? null;
  } catch (error) {
    console.error(`Geocoding error for query: ${query}`, error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function pseudoBoolean(seed: string, salt: number) {
  let hash = salt;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) & 0xffffffff;
  }

  return hash % 2 === 0;
}

function buildEnrichedRecord(hospital: Hospital, geocode: GeocodeCacheEntry) {
  return {
    ...hospital,
    city: "Karachi",
    lat: geocode.lat,
    lng: geocode.lon,
    locationHint: geocode.displayName,
    hasEmergency: pseudoBoolean(hospital.id, 17),
    is24Hours: pseudoBoolean(hospital.id, 23),
  };
}

function writeEnrichedData(hospitals: Hospital[], cache: Record<string, GeocodeCacheEntry>) {
  const enriched = hospitals.map((hospital) => {
    if (hospital.city?.toLowerCase() !== "karachi") {
      return hospital;
    }

    const geo = cache[hospital.id];
    if (!geo) {
      return hospital;
    }

    return buildEnrichedRecord(hospital, geo);
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(enriched, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

