export class PaymentProcessedTemplate {
  static generate(data: any): string {
    return `Payment of ${data.amount} has been processed successfully`;
  }
}
