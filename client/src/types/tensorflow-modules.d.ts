declare module "@tensorflow-models/mobilenet" {
  export function load(opts?: { version?: number; alpha?: number }): Promise<{
    infer: (input: unknown, embedding?: boolean) => unknown;
  }>;
  export type MobileNet = {
    infer: (input: unknown, embedding?: boolean) => unknown;
  };
}

declare module "@tensorflow/tfjs" {
  export type Tensor = {
    data: () => Promise<number[]>;
    dispose: () => void;
    toFloat: () => Tensor;
    expandDims: (dim?: number) => Tensor;
  };

  export const browser: {
    fromPixels: (img: unknown) => Tensor;
  };

  export function ready(): Promise<void>;

  export function tidy<T>(fn: () => T): T;
}
