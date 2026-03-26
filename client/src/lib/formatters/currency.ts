export function safeCurrency(value: string | number | null | undefined): string {
  const num = typeof value === "string" ? Number(value) : value ?? 0;
  if (!Number.isFinite(num)) {
    return "PKR 0";
  }

  return `PKR ${Math.round(num).toLocaleString()}`;
}

export function safeCurrencyShort(value: string | number | null | undefined): string {
  const num = typeof value === "string" ? Number(value) : value ?? 0;
  if (!Number.isFinite(num)) {
    return "PKR 0";
  }

  if (num >= 1_000_000) {
    return `PKR ${(num / 1_000_000).toFixed(1)}M`;
  }

  if (num >= 1_000) {
    return `PKR ${(num / 1_000).toFixed(1)}K`;
  }

  return `PKR ${Math.round(num).toLocaleString()}`;
}
