"use client";

import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from "@tensorflow/tfjs";

type MobileNetModel = {
  infer: (input: unknown, embedding?: boolean) => unknown;
};

let mobilenetModelPromise: Promise<MobileNetModel> | null = null;

const loadModel = async (): Promise<MobileNetModel> => {
  if (!mobilenetModelPromise) {
    mobilenetModelPromise = (async () => {
      await tf.ready();
      return mobilenet.load({ version: 2, alpha: 1.0 });
    })();
  }
  return mobilenetModelPromise;
};

const fileToImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    img.src = url;
  });
};

export const getMobilenetEmbedding = async (
  file: File
): Promise<number[] | undefined> => {
  try {
    const model = await loadModel();
    const image = await fileToImage(file);

    const embeddingTensor = tf.tidy(() => {
      const tensor = tf.browser.fromPixels(image).toFloat();
      const expanded = tensor.expandDims(0);
      // Remove the second argument 'conv_preds' as it's not a valid argument
      const embedding = model.infer(expanded, true) as tf.Tensor;
      tensor.dispose();
      expanded.dispose();
      return embedding;
    });

    const embeddingData = Array.from(await embeddingTensor.data());
    embeddingTensor.dispose();

    return embeddingData;
  } catch (error) {
    console.warn("Failed to generate MobileNet embedding:", error);
    return undefined;
  }
};

export const cosineSimilarity = (
  vectorA: number[],
  vectorB: number[]
): number => {
  if (!vectorA.length || vectorA.length !== vectorB.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < vectorA.length; i++) {
    dot += vectorA[i] * vectorB[i];
    magA += vectorA[i] ** 2;
    magB += vectorB[i] ** 2;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};
