export class DependentRejectedTemplate {
  static generate(data: { dependentName: string; reason?: string }): string {
    const reason = data.reason ? `: ${data.reason}` : '';
    return `Dependent ${data.dependentName} has been rejected${reason}`;
  }
}
