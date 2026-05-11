export function parseApiErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;

  try {
    const raw = JSON.parse(err.message) as {
      message?: string;
      errors?: string[];
    };
    if (Array.isArray(raw.errors) && raw.errors.length > 0) {
      return raw.errors.join(", ");
    }
    if (typeof raw.message === "string" && raw.message) {
      return raw.message;
    }
  } catch {
    // ignore JSON parse failures and use plain error message
  }

  return err.message || fallback;
}
