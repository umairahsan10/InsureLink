/**
 * Node script to compute SHA-256 and perceptual (dHash) values for
 * every file inside `client/public/demo-docs`.
 *
 * Run from the `client` directory:
 *
 *   npx node ./scripts/generate-demo-hashes.js
 *
 * The output JSON is stored at `src/data/demoDocHashes.json`.
 */

const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { Jimp, intToRGBA } = require("jimp");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DEMO_DOCS_DIR = path.join(PROJECT_ROOT, "public", "demo-docs");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "src", "data", "demoDocHashes.json");
const VALID_EXTENSIONS = [".png", ".jpg", ".jpeg"];

const bitsToHex = (bits) => {
  const padded = bits.padEnd(Math.ceil(bits.length / 4) * 4, "0");
  let hex = "";
  for (let i = 0; i < padded.length; i += 4) {
    const chunk = padded.slice(i, i + 4);
    hex += parseInt(chunk, 2).toString(16);
  }
  return hex;
};

const computeSha256 = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

const computeDHash = async (filePath) => {
  const image = await Jimp.read(filePath);
  const resized = image.clone();
  await resized.resize({ w: 9, h: 8, mode: Jimp.RESIZE_NEAREST_NEIGHBOR });

  let bits = "";
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const leftColor = intToRGBA(resized.getPixelColor(x, y));
      const rightColor = intToRGBA(resized.getPixelColor(x + 1, y));
      const left = 0.299 * leftColor.r + 0.587 * leftColor.g + 0.114 * leftColor.b;
      const right = 0.299 * rightColor.r + 0.587 * rightColor.g + 0.114 * rightColor.b;
      bits += left > right ? "1" : "0";
    }
  }

  return bitsToHex(bits);
};

const shouldInclude = (filename) =>
  VALID_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext));

const main = async () => {
  console.info(`Scanning demo docs in: ${DEMO_DOCS_DIR}`);
  const entries = await fs.readdir(DEMO_DOCS_DIR);
  const files = entries.filter(shouldInclude).sort();

  if (!files.length) {
    console.warn("No image files found.");
    return;
  }

  const results = [];
  for (const filename of files) {
    const filePath = path.join(DEMO_DOCS_DIR, filename);
    const sha256 = await computeSha256(filePath);
    const perceptualHash = await computeDHash(filePath);

    results.push({ filename, sha256, perceptualHash });
    console.info(`Processed ${filename}`);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    files: results,
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2));
  console.info(`Saved hashes for ${results.length} files → ${OUTPUT_PATH}`);
};

main().catch((error) => {
  console.error("Failed to generate hashes:", error);
  process.exitCode = 1;
});

