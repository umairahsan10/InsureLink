export class ClaimApprovedTemplate {
  static generate(data: any): string {
    return `Your claim ${data.claimNumber} has been approved for amount ${data.amount}`;
  }
}
