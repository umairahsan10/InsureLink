export class ClaimOnHoldTemplate {
  static generate(data: { claimNumber: string; reason?: string }): string {
    const reason = data.reason ? `: ${data.reason}` : '';
    return `Your claim ${data.claimNumber} has been put on hold${reason}`;
  }
}
