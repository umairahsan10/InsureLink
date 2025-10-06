export interface Transaction {
  id: string;
  claimId: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Failed';
  method: string;
  reference: string;
}

