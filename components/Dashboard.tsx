import React from 'react';
import { ReconciliationReport, Transaction } from '../types';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Printer, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Building2, FileText, FileSpreadsheet } from 'lucide-react';
import { downloadCSV, downloadPDF, downloadXLSX } from '../utils/reconciliationUtils';

interface DashboardProps {
  report: ReconciliationReport;
  onReset: () => void;
  currency: string;
  isCustomCurrency?: boolean;
  companyName?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ report, onReset, currency, isCustomCurrency = false, companyName }) => {
  const chartData = [
    { name: 'Matched', value: report.summary.totalMatchedAmount, color: '#22c55e' },
    { name: 'Unmatched Bank', value: report.summary.totalUnmatchedBankAmount, color: '#ef4444' },
    { name: 'Unmatched Ledger', value: report.summary.totalUnmatchedLedgerAmount, color: '#f59e0b' },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    downloadCSV(report, companyName);
  };

  const handleDownloadXLSX = () => {
    downloadXLSX(report, companyName);
  };

  const handleDownloadPDF = () => {
    // If it's a custom currency symbol (e.g. ₿), we pass it. 
    // If it's a code (USD), we pass that.
    downloadPDF(report, companyName, currency);
  };

  const formatCurrency = (amount: number) => {
    if (isCustomCurrency) {
      return `${currency}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    try {
      return amount.toLocaleString(undefined, { style: 'currency', currency: currency });
    } catch (e) {
      // Fallback if an invalid code somehow gets through
      return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const renderTransactionRow = (t: Transaction, badge?: React.ReactNode) => (
    <div key={t.id} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
          <span className="text-xs font-bold">{t.type === 'CREDIT' ? 'CR' : 'DR'}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{t.description}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500">{t.date}</span>
            {t.reference && <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{t.reference}</span>}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="font-semibold text-slate-900">{formatCurrency(t.amount)}</span>
        {badge}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-slate-900">
             {companyName && <Building2 className="w-6 h-6 text-slate-400" />}
             <h2 className="text-2xl font-bold">
               {companyName ? `${companyName} - ` : ''}Reconciliation Report
             </h2>
          </div>
          <p className="text-slate-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
           <button 
            onClick={onReset}
            className="flex-1 lg:flex-none px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-all whitespace-nowrap"
          >
            New Analysis
          </button>
          
          <div className="w-px bg-slate-300 mx-1 hidden lg:block"></div>

          <button 
            onClick={handleDownloadCSV}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-all whitespace-nowrap"
          >
            <FileText className="w-4 h-4 text-green-600" />
            CSV
          </button>

          <button 
            onClick={handleDownloadXLSX}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-all whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel
          </button>
          
          <button 
            onClick={handleDownloadPDF}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-all whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>

          <button 
            onClick={handlePrint}
            title="Print View"
            className="px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Print-only Header (simpler for paper) */}
      <div className="hidden print-only mb-8">
         <h1 className="text-3xl font-bold mb-2">{companyName ? companyName : 'Bank Reconciliation'}</h1>
         <p className="text-sm text-slate-500">Report generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Matched Volume</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(report.summary.totalMatchedAmount)}
              </h3>
            </div>
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-4 font-medium">{report.summary.matchCount} matched pairs found</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Unreconciled (Bank)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(report.summary.totalUnmatchedBankAmount)}
              </h3>
            </div>
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-red-600 mt-4 font-medium">{report.unmatchedBank.length} items missing in ledger</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Unreconciled (Ledger)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(report.summary.totalUnmatchedLedgerAmount)}
              </h3>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-orange-600 mt-4 font-medium">{report.unmatchedLedger.length} items missing in bank</p>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Matched Transactions List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900">Matched Transactions</h3>
                <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">High Confidence</span>
             </div>
             <div className="max-h-[500px] overflow-y-auto">
                {report.matches.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No matches found.</div>
                ) : (
                  report.matches.map((match, idx) => (
                    <div key={idx} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">BANK</span>
                              <span className="text-sm text-slate-900 font-medium">{match.bankParams.description}</span>
                           </div>
                           <div className="text-xs text-slate-500 flex gap-3">
                             <span>{match.bankParams.date}</span>
                             {match.bankParams.reference && <span>Ref: {match.bankParams.reference}</span>}
                           </div>
                        </div>
                        
                        <div className="hidden sm:flex text-slate-300">
                          <ArrowRight className="w-4 h-4" />
                        </div>

                        <div className="flex-1 sm:text-right">
                           <div className="flex items-center gap-2 mb-1 sm:justify-end">
                              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">LEDGER</span>
                              <span className="text-sm text-slate-900 font-medium">{match.ledgerParams.description}</span>
                           </div>
                           <div className="text-xs text-slate-500">
                             {match.ledgerParams.date}
                           </div>
                        </div>

                        <div className="text-right min-w-[100px]">
                           <span className="font-bold text-green-600 block">
                             {formatCurrency(match.bankParams.amount)}
                           </span>
                           <span className="text-[10px] text-slate-400">Match {(match.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      {match.notes && (
                        <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          {match.notes}
                        </div>
                      )}
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>

        {/* Right: Discrepancies & Chart */}
        <div className="space-y-6">
          
          {/* Chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 no-print">
            <h3 className="font-semibold text-slate-900 mb-4">Reconciliation Overview</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Unmatched Lists */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-red-50 flex justify-between items-center">
              <h3 className="font-semibold text-red-700 text-sm">Unmatched in Bank</h3>
              <span className="text-xs font-bold bg-white text-red-600 px-2 py-0.5 rounded-full shadow-sm">{report.unmatchedBank.length}</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {report.unmatchedBank.map(t => renderTransactionRow(t, <span className="text-[10px] text-red-500 font-medium">Missing Ledger</span>))}
              {report.unmatchedBank.length === 0 && <div className="p-4 text-center text-sm text-slate-400">All bank items matched!</div>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-orange-50 flex justify-between items-center">
              <h3 className="font-semibold text-orange-700 text-sm">Unmatched in Ledger</h3>
              <span className="text-xs font-bold bg-white text-orange-600 px-2 py-0.5 rounded-full shadow-sm">{report.unmatchedLedger.length}</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {report.unmatchedLedger.map(t => renderTransactionRow(t, <span className="text-[10px] text-orange-500 font-medium">Missing Bank</span>))}
              {report.unmatchedLedger.length === 0 && <div className="p-4 text-center text-sm text-slate-400">All ledger items matched!</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};