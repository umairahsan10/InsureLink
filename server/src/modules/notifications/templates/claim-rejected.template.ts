export class ClaimRejectedTemplate {
  static generate(data: { claimNumber: string; reason?: string }): string {
    const reason = data.reason ? `: ${data.reason}` : '';
    return `Your claim ${data.claimNumber} has been rejected${reason}`;
  }
}
