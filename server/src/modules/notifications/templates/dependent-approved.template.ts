export class DependentApprovedTemplate {
  static generate(data: { dependentName: string; approverName?: string }): string {
    const approver = data.approverName ? ` by ${data.approverName}` : '';
    return `Dependent ${data.dependentName} has been approved${approver}`;
  }
}
