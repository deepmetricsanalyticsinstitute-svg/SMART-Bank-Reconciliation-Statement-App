export enum TransactionType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export interface Transaction {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  description: string;
  amount: number;
  reference?: string;
  type: TransactionType;
  source: 'BANK' | 'LEDGER';
}

export interface MatchedTransaction {
  bankParams: Transaction;
  ledgerParams: Transaction;
  confidence: number;
  notes?: string;
}

export interface ReconciliationReport {
  matches: MatchedTransaction[];
  unmatchedBank: Transaction[];
  unmatchedLedger: Transaction[];
  summary: {
    totalMatchedAmount: number;
    totalUnmatchedBankAmount: number;
    totalUnmatchedLedgerAmount: number;
    matchCount: number;
    discrepancyCount: number;
  };
}

export interface FileData {
  file: File;
  type: 'BANK' | 'LEDGER';
  status: 'PENDING' | 'PARSING' | 'READY' | 'ERROR';
  parsedData?: Transaction[];
  error?: string;
}
