export class FraudDetectionDto {
  claimId: number;
  riskScore: number;
  isFraudulent: boolean;
  reasons: string[];
}
