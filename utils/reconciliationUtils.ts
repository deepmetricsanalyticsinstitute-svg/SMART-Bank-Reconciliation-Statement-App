import { Transaction, ReconciliationReport, MatchedTransaction } from "../types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export const reconcileTransactions = (
  bankTransactions: Transaction[],
  ledgerTransactions: Transaction[]
): ReconciliationReport => {
  const matches: MatchedTransaction[] = [];
  const unmatchedBank: Transaction[] = [...bankTransactions];
  const unmatchedLedger: Transaction[] = [...ledgerTransactions];

  // Helper to normalize strings for fuzzy matching
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Exact Match Pass (Amount + Date + Type)
  // We iterate backwards to safely splice items out
  for (let i = unmatchedBank.length - 1; i >= 0; i--) {
    const bankTx = unmatchedBank[i];
    
    const matchIndex = unmatchedLedger.findIndex(ledgerTx => 
      Math.abs(ledgerTx.amount - bankTx.amount) < 0.01 && // Floating point tolerance
      ledgerTx.date === bankTx.date &&
      ledgerTx.type === bankTx.type
    );

    if (matchIndex !== -1) {
      const ledgerTx = unmatchedLedger[matchIndex];
      matches.push({
        bankParams: bankTx,
        ledgerParams: ledgerTx,
        confidence: 1.0,
        notes: "Exact match on Date, Amount, and Type"
      });
      
      // Remove from pools
      unmatchedBank.splice(i, 1);
      unmatchedLedger.splice(matchIndex, 1);
    }
  }

  // 2. Fuzzy Match Pass (Same Amount + Type, Close Date +/- 3 days)
  for (let i = unmatchedBank.length - 1; i >= 0; i--) {
    const bankTx = unmatchedBank[i];
    
    const matchIndex = unmatchedLedger.findIndex(ledgerTx => {
      const amountMatch = Math.abs(ledgerTx.amount - bankTx.amount) < 0.01;
      const typeMatch = ledgerTx.type === bankTx.type;
      
      const d1 = new Date(bankTx.date).getTime();
      const d2 = new Date(ledgerTx.date).getTime();
      const dayDiff = Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));
      
      return amountMatch && typeMatch && dayDiff <= 3;
    });

    if (matchIndex !== -1) {
      const ledgerTx = unmatchedLedger[matchIndex];
      matches.push({
        bankParams: bankTx,
        ledgerParams: ledgerTx,
        confidence: 0.9,
        notes: "Match on Amount/Type within 3 days"
      });
      unmatchedBank.splice(i, 1);
      unmatchedLedger.splice(matchIndex, 1);
    }
  }
  
  // 3. Amount Match only (Warning level)
  for (let i = unmatchedBank.length - 1; i >= 0; i--) {
      const bankTx = unmatchedBank[i];
      // Only match if description is somewhat similar to avoid false positives on common amounts
      const matchIndex = unmatchedLedger.findIndex(ledgerTx => {
          const amountMatch = Math.abs(ledgerTx.amount - bankTx.amount) < 0.01;
          const typeMatch = ledgerTx.type === bankTx.type;
          const descSim = normalize(bankTx.description).includes(normalize(ledgerTx.description)) || 
                          normalize(ledgerTx.description).includes(normalize(bankTx.description));
          return amountMatch && typeMatch && descSim;
      });

      if (matchIndex !== -1) {
          const ledgerTx = unmatchedLedger[matchIndex];
          matches.push({
            bankParams: bankTx,
            ledgerParams: ledgerTx,
            confidence: 0.7,
            notes: "Match on Amount and similar Description"
          });
          unmatchedBank.splice(i, 1);
          unmatchedLedger.splice(matchIndex, 1);
      }
  }

  // Calculate totals
  const totalMatchedAmount = matches.reduce((acc, m) => acc + m.bankParams.amount, 0);
  const totalUnmatchedBankAmount = unmatchedBank.reduce((acc, t) => acc + t.amount, 0);
  const totalUnmatchedLedgerAmount = unmatchedLedger.reduce((acc, t) => acc + t.amount, 0);

  return {
    matches,
    unmatchedBank,
    unmatchedLedger,
    summary: {
      totalMatchedAmount,
      totalUnmatchedBankAmount,
      totalUnmatchedLedgerAmount,
      matchCount: matches.length,
      discrepancyCount: unmatchedBank.length + unmatchedLedger.length
    }
  };
};

export const downloadCSV = (report: ReconciliationReport, companyName?: string) => {
  const companyHeader = companyName ? [`Company: ${companyName}`, '', '', '', '', '', '', ''] : [];
  const reportDateHeader = [`Generated: ${new Date().toISOString().split('T')[0]}`, '', '', '', '', '', '', ''];
  
  const rows = [
    ...(companyName ? [companyHeader] : []),
    reportDateHeader,
    [], // Empty row for spacing
    ['Status', 'Source', 'Date', 'Description', 'Amount', 'Reference', 'Type', 'Match Notes'],
    // Matched
    ...report.matches.map(m => ['MATCHED', 'BANK', m.bankParams.date, `"${m.bankParams.description}"`, m.bankParams.amount, m.bankParams.reference || '', m.bankParams.type, m.notes]),
    ...report.matches.map(m => ['MATCHED', 'LEDGER', m.ledgerParams.date, `"${m.ledgerParams.description}"`, m.ledgerParams.amount, m.ledgerParams.reference || '', m.ledgerParams.type, m.notes]),
    // Unmatched Bank
    ...report.unmatchedBank.map(t => ['UNMATCHED', 'BANK', t.date, `"${t.description}"`, t.amount, t.reference || '', t.type, 'Only in Bank']),
    // Unmatched Ledger
    ...report.unmatchedLedger.map(t => ['UNMATCHED', 'LEDGER', t.date, `"${t.description}"`, t.amount, t.reference || '', t.type, 'Only in Ledger'])
  ];

  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  
  const safeCompanyName = companyName ? companyName.replace(/[^a-z0-9]/gi, '_') + '_' : '';
  link.setAttribute("download", `${safeCompanyName}reconciliation_report_${new Date().toISOString().split('T')[0]}.csv`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadXLSX = (report: ReconciliationReport, companyName?: string) => {
  const wb = XLSX.utils.book_new();
  const safeCompanyName = companyName || 'My Company';

  // --- Summary Sheet ---
  const summaryData = [
    ['Reconciliation Report'],
    [`Company: ${safeCompanyName}`],
    [`Generated: ${new Date().toISOString().split('T')[0]}`],
    [],
    ['Category', 'Count', 'Total Amount'],
    ['Matched Transactions', report.summary.matchCount, report.summary.totalMatchedAmount],
    ['Unmatched (Bank)', report.unmatchedBank.length, report.summary.totalUnmatchedBankAmount],
    ['Unmatched (Ledger)', report.unmatchedLedger.length, report.summary.totalUnmatchedLedgerAmount],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  // --- Matches Sheet ---
  const matchesHeader = ['Bank Date', 'Bank Description', 'Bank Ref', 'Amount', 'Type', 'Ledger Date', 'Ledger Description', 'Ledger Ref', 'Match Confidence', 'Notes'];
  const matchesRows = report.matches.map(m => [
    m.bankParams.date,
    m.bankParams.description,
    m.bankParams.reference || '',
    m.bankParams.amount,
    m.bankParams.type,
    m.ledgerParams.date,
    m.ledgerParams.description,
    m.ledgerParams.reference || '',
    m.confidence,
    m.notes
  ]);
  const matchesWs = XLSX.utils.aoa_to_sheet([matchesHeader, ...matchesRows]);
  XLSX.utils.book_append_sheet(wb, matchesWs, "Matched Transactions");

  // --- Unmatched Bank Sheet ---
  const bankHeader = ['Date', 'Description', 'Amount', 'Type', 'Reference'];
  const bankRows = report.unmatchedBank.map(t => [
    t.date,
    t.description,
    t.amount,
    t.type,
    t.reference || ''
  ]);
  const bankWs = XLSX.utils.aoa_to_sheet([bankHeader, ...bankRows]);
  XLSX.utils.book_append_sheet(wb, bankWs, "Unmatched Bank");

  // --- Unmatched Ledger Sheet ---
  const ledgerHeader = ['Date', 'Description', 'Amount', 'Type', 'Reference'];
  const ledgerRows = report.unmatchedLedger.map(t => [
    t.date,
    t.description,
    t.amount,
    t.type,
    t.reference || ''
  ]);
  const ledgerWs = XLSX.utils.aoa_to_sheet([ledgerHeader, ...ledgerRows]);
  XLSX.utils.book_append_sheet(wb, ledgerWs, "Unmatched Ledger");

  // Write file
  const safeName = safeCompanyName.replace(/[^a-z0-9]/gi, '_');
  XLSX.writeFile(wb, `${safeName}_reconciliation_report_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const downloadPDF = (report: ReconciliationReport, companyName?: string, currencyCode: string = 'USD') => {
  const doc = new jsPDF();
  const safeCompanyName = companyName || 'My Company';
  const reportDate = new Date().toLocaleDateString();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text("Reconciliation Report", 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(safeCompanyName, 14, 30);
  doc.text(`Generated on: ${reportDate}`, 14, 36);

  // Summary Section
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Executive Summary", 14, 48);

  const summaryData = [
    ['Category', 'Count', 'Total Amount'],
    ['Matched Transactions', report.summary.matchCount.toString(), `${currencyCode} ${report.summary.totalMatchedAmount.toFixed(2)}`],
    ['Unmatched (Bank)', report.unmatchedBank.length.toString(), `${currencyCode} ${report.summary.totalUnmatchedBankAmount.toFixed(2)}`],
    ['Unmatched (Ledger)', report.unmatchedLedger.length.toString(), `${currencyCode} ${report.summary.totalUnmatchedLedgerAmount.toFixed(2)}`],
  ];

  autoTable(doc, {
    startY: 52,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [66, 133, 244] }, // Blue
  });

  // Matched Transactions
  let currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.text("Matched Transactions (Detailed)", 14, currentY);

  const matchesBody = report.matches.map(m => [
    m.bankParams.date,
    m.bankParams.description,
    m.ledgerParams.description,
    `${currencyCode} ${m.bankParams.amount.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Date', 'Bank Desc', 'Ledger Desc', 'Amount']],
    body: matchesBody,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] }, // Green
    styles: { fontSize: 8 },
  });

  // Unmatched Bank
  currentY = (doc as any).lastAutoTable.finalY + 15;
  
  // Check if we need a new page
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFontSize(14);
  doc.text("Unmatched Bank Transactions", 14, currentY);

  const bankBody = report.unmatchedBank.map(t => [
    t.date,
    t.description,
    t.reference || '-',
    t.type,
    `${currencyCode} ${t.amount.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Date', 'Description', 'Ref', 'Type', 'Amount']],
    body: bankBody,
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68] }, // Red
    styles: { fontSize: 8 },
  });

  // Unmatched Ledger
  currentY = (doc as any).lastAutoTable.finalY + 15;
  
   // Check if we need a new page
   if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(14);
  doc.text("Unmatched Ledger Transactions", 14, currentY);

  const ledgerBody = report.unmatchedLedger.map(t => [
    t.date,
    t.description,
    t.reference || '-',
    t.type,
    `${currencyCode} ${t.amount.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Date', 'Description', 'Ref', 'Type', 'Amount']],
    body: ledgerBody,
    theme: 'striped',
    headStyles: { fillColor: [245, 158, 11] }, // Orange/Amber
    styles: { fontSize: 8 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount} - Generated by Reconciliation App`, 105, 290, { align: 'center' });
  }

  const safeName = safeCompanyName.replace(/[^a-z0-9]/gi, '_');
  doc.save(`${safeName}_reconciliation_report.pdf`);
};