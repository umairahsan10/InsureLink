export class ClaimSubmittedTemplate {
  static generate(data: { claimNumber: string; amount: number }): string {
    return `New claim ${data.claimNumber} submitted for review. Amount: ${data.amount}`;
  }
}
