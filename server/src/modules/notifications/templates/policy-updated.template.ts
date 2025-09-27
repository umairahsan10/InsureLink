export class PolicyUpdatedTemplate {
  static generate(data: any): string {
    return `Your policy ${data.policyNumber} has been updated`;
  }
}
