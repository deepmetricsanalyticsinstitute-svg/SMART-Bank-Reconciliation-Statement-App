import { Transaction, TransactionType } from "../types";

export const SAMPLE_BANK_DATA: Transaction[] = [
  { 
    id: 'bank-1', 
    date: '2024-03-01', 
    description: 'TechSolutions Inc - Inv #2024-001', 
    amount: 12500.00, 
    type: TransactionType.CREDIT, 
    source: 'BANK',
    reference: 'WIRE-998877'
  },
  { 
    id: 'bank-2', 
    date: '2024-03-03', 
    description: 'Office Depot - Supplies', 
    amount: 245.50, 
    type: TransactionType.DEBIT, 
    source: 'BANK' 
  },
  { 
    id: 'bank-3', 
    date: '2024-03-05', 
    description: 'Uber Ride - Client Meeting', 
    amount: 45.20, 
    type: TransactionType.DEBIT, 
    source: 'BANK' 
  },
  { 
    id: 'bank-4', 
    date: '2024-03-10', 
    description: 'Monthly Bank Service Fee', 
    amount: 35.00, 
    type: TransactionType.DEBIT, 
    source: 'BANK' 
  },
  { 
    id: 'bank-5', 
    date: '2024-03-15', 
    description: 'Check Deposit - Client B', 
    amount: 4500.00, 
    type: TransactionType.CREDIT, 
    source: 'BANK',
    reference: 'CHK-1002'
  },
  { 
    id: 'bank-6', 
    date: '2024-03-20', 
    description: 'AWS Cloud Services', 
    amount: 890.00, 
    type: TransactionType.DEBIT, 
    source: 'BANK' 
  }
];

export const SAMPLE_LEDGER_DATA: Transaction[] = [
  { 
    id: 'ledger-1', 
    date: '2024-03-01', 
    description: 'TechSolutions Invoice Payment', 
    amount: 12500.00, 
    type: TransactionType.CREDIT, 
    source: 'LEDGER' 
  },
  { 
    id: 'ledger-2', 
    date: '2024-03-03', 
    description: 'Office Supplies', 
    amount: 245.50, 
    type: TransactionType.DEBIT, 
    source: 'LEDGER' 
  },
  // Ledger date is 3 days earlier than bank date (Fuzzy Match)
  { 
    id: 'ledger-3', 
    date: '2024-03-12', 
    description: 'Client B Payment (Check)', 
    amount: 4500.00, 
    type: TransactionType.CREDIT, 
    source: 'LEDGER' 
  }, 
  { 
    id: 'ledger-4', 
    date: '2024-03-20', 
    description: 'Amazon Web Services', 
    amount: 890.00, 
    type: TransactionType.DEBIT, 
    source: 'LEDGER' 
  },
  { 
    id: 'ledger-5', 
    date: '2024-03-25', 
    description: 'Software License Annual', 
    amount: 1200.00, 
    type: TransactionType.DEBIT, 
    source: 'LEDGER' 
  } 
];

export const generateSampleCSV = (type: 'BANK' | 'LEDGER'): string => {
  const data = type === 'BANK' ? SAMPLE_BANK_DATA : SAMPLE_LEDGER_DATA;
  const headers = ['Date', 'Description', 'Amount', 'Type', 'Reference'];
  const rows = data.map(t => [
    t.date,
    `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
    t.amount.toFixed(2),
    t.type,
    t.reference || ''
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};
