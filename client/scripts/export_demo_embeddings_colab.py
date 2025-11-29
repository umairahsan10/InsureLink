"""
Utility script for Google Colab to generate MobileNet embeddings for
files inside `public/demo-docs/`.

Usage inside Colab:
1. Upload `client/public/demo-docs/` as a zipped folder and unzip it under `/content/demo-docs`.
2. Upload this script (or copy/paste it into a cell) and run:

   !python export_demo_embeddings_colab.py

Optional environment variables:
  - DEMO_DOCS_DIR: directory that holds the demo images (default: /content/demo-docs)
  - OUTPUT_PATH: path where the JSON output should be stored (default: /content/demoDocEmbeddings.json)
"""

import json
import os
from datetime import datetime, timezone
from typing import List

import numpy as np
import tensorflow as tf


IMG_SIZE = 160
VALID_EXTENSIONS = (".png", ".jpg", ".jpeg")


def load_model() -> tf.keras.Model:
    model = tf.keras.applications.MobileNetV2(
        include_top=False,
        pooling="avg",
        weights="imagenet",
        alpha=0.5,
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
    )
    return model


def compute_embedding(model: tf.keras.Model, image_path: str) -> List[float]:
    image = tf.keras.preprocessing.image.load_img(image_path, target_size=(IMG_SIZE, IMG_SIZE))
    array = tf.keras.preprocessing.image.img_to_array(image)
    array = tf.keras.applications.mobilenet_v2.preprocess_input(array)
    batch = np.expand_dims(array, axis=0)
    embedding = model.predict(batch, verbose=0)[0]
    return embedding.astype(float).tolist()


def main() -> None:
    input_dir = os.environ.get("DEMO_DOCS_DIR", "/content/demo-docs")
    output_path = os.environ.get("OUTPUT_PATH", "/content/demoDocEmbeddings.json")

    if not os.path.isdir(input_dir):
        raise FileNotFoundError(f"Input directory not found: {input_dir}")

    model = load_model()
    files = sorted(
        filename
        for filename in os.listdir(input_dir)
        if filename.lower().endswith(VALID_EXTENSIONS)
    )

    results = []
    for filename in files:
        path = os.path.join(input_dir, filename)
        embedding = compute_embedding(model, path)
        results.append({"filename": filename, "embedding": embedding})

    payload = {
        "model": "MobileNetV2",
        "alpha": 0.5,
        "inputResolution": IMG_SIZE,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "files": results,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print(f"Saved {len(results)} embeddings to {output_path}")


if __name__ == "__main__":
    main()

