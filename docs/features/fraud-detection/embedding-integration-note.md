# Embedding Integration Note (MobileNet)

**Created:** 2025-12-06

## Purpose
This note records a gap discovered during review: the codebase includes MobileNet embedding generation utilities and precomputed demo embeddings, but the main verification flow (`verifyDocumentLocally()`) does not currently use embeddings to flag near-duplicates or influence the fraud score. This document lists the current state, the intended approach, exact code references, recommended thresholds and storage/indexing options, and a step-by-step integration plan for future work.

---

## Current state (what exists now)
- Embedding generator (client-side TF.js): `client/src/utils/mobilenetEmbedding.ts`
  - Exports `getMobilenetEmbedding(file: File): Promise<number[] | undefined>` and `cosineSimilarity(vectorA, vectorB)`.
- Precomputed demo embeddings: `client/src/data/demoDocEmbeddings.json` (many entries with `filename` + `embedding`).
- Demo hashes JSON: `client/src/data/demoDocHashes.json` (sha256 + perceptualHash for demo files).
- Demo seeding at runtime: `client/src/utils/documentVerification.ts` provides `seedDemoHashesFromImages()` which computes SHA/dHash and writes values into `localStorage` on page load.
- Main verification function: `client/src/utils/documentVerification.ts` → `verifyDocumentLocally(input)`
  - Currently computes and compares: SHA-256 (exact), perceptual hash/dHash (near-duplicate), and runs the field/date/template/benchmarking checks.
  - Does NOT call `getMobilenetEmbedding()` or consult `demoDocEmbeddings.json` or any embedding store.

---

## Why this matters
- MobileNet embeddings provide robust semantic/structural similarity detection that complements SHA-256 (exact) and dHash (low-level perceptual). Without integrating embeddings, the verification flow misses many cases where a document has been heavily edited, re-scanned, or reflowed but still originates from the same template.

---

## Intended approach (summary)
- Compute the MobileNet embedding for each uploaded document (client-side or server-side depending on capacity).
- Compare the uploaded embedding to a store of known embeddings (demo JSON for local/demo mode; server vector DB or ANN index for scale) using cosine similarity on L2-normalized vectors.
- If a nearest neighbor passes defined thresholds, set a `nearDuplicateDetectedByEmbedding` flag and apply score deductions according to confidence bands.
- Combine embedding signal with dHash and SHA signals to raise or lower confidence/deductions.

---

## Exact places to change / code references
- Add invocation + handling at end of the existing perceptual hash block inside `verifyDocumentLocally()` in `client/src/utils/documentVerification.ts`.
  - File: `client/src/utils/documentVerification.ts`
  - Function: `verifyDocumentLocally(input: DocumentVerificationInput)`
- Use existing helper: `getMobilenetEmbedding(file: File)` from `client/src/utils/mobilenetEmbedding.ts`.
- For demo-mode comparison, read `client/src/data/demoDocEmbeddings.json` (or copy its entries into `localStorage` at seed time) and run a linear scan with `cosineSimilarity()`.
- If you prefer runtime embedding persistence in the browser, use IndexedDB for binary storage (larger and more appropriate than localStorage). For a quick demo, localStorage or appending to `documentTrustEmbeddings` in memory is acceptable.

---

## Suggested thresholds (demo-friendly)
- Cosine similarity on L2-normalized vectors (dot product after normalization):
  - Strong near-duplicate: >= 0.95 → Deduct -40 points (or escalate to -50 if dHash also matched)
  - Suspicious similarity: 0.85–0.95 → Deduct -25 points
  - Weak similarity: 0.75–0.85 → Deduct -10 points (or just log for analyst)
- When combined with dHash:
  - If dHash >= `PERCEPTUAL_HASH_THRESHOLD` (0.80) AND cosine >= 0.95 → treat as high-confidence duplicate (consider -50)

---

## Recommended demo implementation (linear scan)
- Minimal safe change (no new dependencies): add logic in `verifyDocumentLocally()` to:
  1. `import { getMobilenetEmbedding, cosineSimilarity } from '@/utils/mobilenetEmbedding';`
  2. Compute `embedding = await getMobilenetEmbedding(input.file)` (if file exists and not exact duplicate)
  3. Load demo embeddings in memory (demo JSON): `import demoEmbeddings from '@/data/demoDocEmbeddings.json';`
  4. For each `entry` in `demoEmbeddings.files`, compute `sim = cosineSimilarity(embedding, entry.embedding)` (ensure both are normalized — if precomputed embeddings in JSON are not normalized, normalize before comparing)
  5. Track best match and apply deduction bands above.
  6. Optionally store computed embedding into `localStorage` or IndexedDB for future checks.

Small TypeScript sketch (demo-only, to implement inside `verifyDocumentLocally`):

```ts
import demoEmbeddings from '@/data/demoDocEmbeddings.json';
import { getMobilenetEmbedding, cosineSimilarity } from '@/utils/mobilenetEmbedding';

if (input.file && !duplicateDetected) {
  const emb = await getMobilenetEmbedding(input.file);
  if (emb) {
    // L2-normalize (simple)
    const norm = Math.sqrt(emb.reduce((s, v) => s + v * v, 0));
    const normalized = emb.map((v) => v / (norm || 1));

    let bestSim = 0;
    let bestFile = null;
    for (const f of demoEmbeddings.files) {
      const sim = cosineSimilarity(normalized, f.embedding);
      if (sim > bestSim) {
        bestSim = sim;
        bestFile = f.filename;
      }
    }

    // Apply thresholds
    if (bestSim >= 0.95) {
      // high confidence
      score -= 40;
      reasons.push(`Embedding near-duplicate: ${ (bestSim*100).toFixed(1) }% similar to ${bestFile}`);
    } else if (bestSim >= 0.85) {
      score -= 25;
      reasons.push(`Embedding suspicious: ${ (bestSim*100).toFixed(1) }% similar to ${bestFile}`);
    } else if (bestSim >= 0.75) {
      // optional: warning only
      reasons.push(`Embedding weak similarity: ${ (bestSim*100).toFixed(1) }% to ${bestFile}`);
    }
  }
}
```

Notes:
- If `demoDocEmbeddings.json` embeddings are not L2-normalized, normalize them before use. The `cosineSimilarity` helper in `mobilenetEmbedding.ts` already computes cosine without assuming normalization — either approach works but be consistent.

---

## Production considerations (long-term)
- At scale, do NOT keep embeddings in `localStorage` or a large JSON file. Instead:
  - Persist embeddings server-side and index with an ANN library (FAISS, HNSWlib, Milvus) or managed vector DB (Pinecone, Weaviate).
  - Perform nearest-neighbor search server-side and return best matches to the client (or do embedding on server for private uploads).
- Use float32 binary storage for efficiency. In browsers, IndexedDB is the recommended store for binary blobs.
- Consider batching embedding computation or deferring to server if client device is slow.

---

## Validation & tests to add
- Unit test for embedding comparison code (mock embeddings and verify thresholds).
- E2E demo: upload one of the demo images and verify `verifyDocumentLocally()` returns a high similarity match when embeddings integration is enabled.

---

## Next steps (when you want to implement)
- Decide demo vs production path: (A) demo-only: implement linear scan against `client/src/data/demoDocEmbeddings.json` and store computed embeddings in `localStorage`; (B) production: add server endpoint to compute/compare embeddings and use ANN index.
- Implement code sketch above inside `verifyDocumentLocally()` and add unit tests.
- Update `docs/features/fraud-detection/verification-pipeline-flow.md` if you adjust thresholds or combine signals differently.

---

## Reference list (exact paths)
- Main verification: `client/src/utils/documentVerification.ts` (function `verifyDocumentLocally`)
- MobileNet helper: `client/src/utils/mobilenetEmbedding.ts` (exports `getMobilenetEmbedding`, `cosineSimilarity`)
- Demo embedding JSON: `client/src/data/demoDocEmbeddings.json`
- Demo hash JSON: `client/src/data/demoDocHashes.json`
- Demo seeding at runtime: `client/src/utils/documentVerification.ts` → `seedDemoHashesFromImages()`
- Demo generation script: `client/scripts/export_demo_embeddings_colab.py`

---

If you want, I can implement the demo linear-scan embedding comparison and add the code to `verifyDocumentLocally()` now (with tests). For now I have only added this documentation note as requested.