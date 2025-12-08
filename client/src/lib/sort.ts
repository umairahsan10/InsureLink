export function sortClaimsByDateDesc<
  T extends { createdAt?: string; admissionDate?: string; date?: string }
>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const aTs = new Date(
      a.createdAt ?? a.admissionDate ?? a.date ?? 0
    ).getTime();
    const bTs = new Date(
      b.createdAt ?? b.admissionDate ?? b.date ?? 0
    ).getTime();
    return bTs - aTs;
  });
}
