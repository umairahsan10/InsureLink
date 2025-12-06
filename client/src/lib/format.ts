export function formatPKR(value: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Rs. 0';
  return `Rs. ${value.toLocaleString('en-PK')}`;
}

export function formatPKRShort(value: number): string {
  if (!value || value === 0) return 'Rs. 0';
  if (Math.abs(value) >= 1_000_000) return `Rs. ${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `Rs. ${(value / 1_000).toFixed(0)}K`;
  return formatPKR(value);
}
