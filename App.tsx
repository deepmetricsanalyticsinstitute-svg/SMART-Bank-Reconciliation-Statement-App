import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { FileData, ReconciliationReport } from './types';
import { parseDocumentWithGemini } from './services/geminiService';
import { reconcileTransactions } from './utils/reconciliationUtils';
import { Sparkles, ArrowRight, ShieldCheck, Database, DownloadCloud, Coins, Building2, Trash2 } from 'lucide-react';
import { SAMPLE_BANK_DATA, SAMPLE_LEDGER_DATA, generateSampleCSV } from './utils/sampleData';

const App: React.FC = () => {
  const [bankFile, setBankFile] = useState<FileData | undefined>();
  const [ledgerFile, setLedgerFile] = useState<FileData | undefined>();
  const [reconciliationReport, setReconciliationReport] = useState<ReconciliationReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings State
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [customSymbol, setCustomSymbol] = useState('');
  const [isCustomCurrency, setIsCustomCurrency] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'CUSTOM') {
      setIsCustomCurrency(true);
    } else {
      setIsCustomCurrency(false);
      setCurrencyCode(value);
    }
  };

  const handleFileSelect = async (file: File, type: 'BANK' | 'LEDGER') => {
    // Optimistic update
    const newFileData: FileData = { file, type, status: 'PARSING' };
    
    if (type === 'BANK') setBankFile(newFileData);
    else setLedgerFile(newFileData);
    setError(null);

    try {
      // Parse immediately upon upload
      const parsedData = await parseDocumentWithGemini(file, type);
      
      const readyFileData: FileData = { ...newFileData, status: 'READY', parsedData };
      if (type === 'BANK') setBankFile(readyFileData);
      else setLedgerFile(readyFileData);
      
    } catch (e: any) {
      const errorFileData: FileData = { ...newFileData, status: 'ERROR', error: e.message };
      if (type === 'BANK') setBankFile(errorFileData);
      else setLedgerFile(errorFileData);
    }
  };

  const handleLoadSampleData = () => {
    // Create dummy files for display
    const dummyBankFile = new File([""], "sample_bank_statement_mar24.pdf", { type: "application/pdf" });
    const dummyLedgerFile = new File([""], "sample_general_ledger_mar24.csv", { type: "text/csv" });

    setBankFile({
      file: dummyBankFile,
      type: 'BANK',
      status: 'READY',
      parsedData: SAMPLE_BANK_DATA
    });

    setLedgerFile({
      file: dummyLedgerFile,
      type: 'LEDGER',
      status: 'READY',
      parsedData: SAMPLE_LEDGER_DATA
    });

    setCompanyName("Tech Startups Inc");
    
    setError(null);
  };

  const downloadSampleFile = (type: 'BANK' | 'LEDGER') => {
    const content = generateSampleCSV(type);
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'BANK' ? 'sample_bank_statement.csv' : 'sample_general_ledger.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleReconcile = () => {
    if (!bankFile?.parsedData || !ledgerFile?.parsedData) {
      setError("Please wait for both files to finish parsing.");
      return;
    }

    setIsProcessing(true);
    
    // Simulate a small delay for UX so the user sees the "Processing" state
    setTimeout(() => {
      try {
        const report = reconcileTransactions(bankFile.parsedData!, ledgerFile.parsedData!);
        setReconciliationReport(report);
      } catch (err) {
        setError("An unexpected error occurred during reconciliation.");
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    }, 800);
  };

  const reset = () => {
    setBankFile(undefined);
    setLedgerFile(undefined);
    setReconciliationReport(null);
    setError(null);
  };

  if (reconciliationReport) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <Dashboard 
          report={reconciliationReport} 
          onReset={reset} 
          currency={isCustomCurrency ? customSymbol : currencyCode} 
          isCustomCurrency={isCustomCurrency}
          companyName={companyName}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full space-y-8">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Reconciliation App</h1>
          <p className="text-lg text-slate-600">
            Intelligent Bank Reconciliation powered by Gemini
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-8 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>

          <div className="space-y-6">
             
             {/* Settings Section */}
             <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                
                {/* Company Name */}
                <div className="flex items-center gap-2">
                   <Building2 className="w-4 h-4 text-slate-400" />
                   <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter your Company Name (Optional)"
                    className="flex-1 text-sm bg-transparent border-b border-slate-300 py-1 px-1 outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400 text-slate-700"
                   />
                </div>

                <div className="h-px bg-slate-200 w-full"></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600">Currency:</label>
                    <div className="relative">
                      <select
                        value={isCustomCurrency ? 'CUSTOM' : currencyCode}
                        onChange={handleCurrencyChange}
                        className="appearance-none pl-8 pr-8 py-1.5 text-sm border border-slate-200 bg-white rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
                        title="Select Currency"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="AUD">AUD ($)</option>
                        <option value="JPY">JPY (¥)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="CNY">CNY (¥)</option>
                        <option value="CHF">CHF (Fr)</option>
                        <option value="SGD">SGD ($)</option>
                        <option value="CUSTOM">Custom...</option>
                      </select>
                      <Coins className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                    <span>Secure & Private</span>
                  </div>
                </div>

                {isCustomCurrency && (
                   <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                     <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Symbol:</label>
                     <input 
                       type="text" 
                       value={customSymbol}
                       onChange={(e) => setCustomSymbol(e.target.value)}
                       placeholder="e.g. ₿"
                       className="w-24 text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                       autoFocus
                     />
                   </div>
                )}
             </div>

             <div className="flex flex-col items-center gap-3 pt-2">
                <button 
                  onClick={handleLoadSampleData}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-colors font-medium"
                >
                  <Database className="w-4 h-4" />
                  Try with Sample Data
                </button>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <DownloadCloud className="w-3 h-3" />
                  <span>Download samples:</span>
                  <button onClick={() => downloadSampleFile('BANK')} className="text-blue-600 hover:underline">Bank CSV</button>
                  <span className="text-slate-300">|</span>
                  <button onClick={() => downloadSampleFile('LEDGER')} className="text-blue-600 hover:underline">Ledger CSV</button>
                </div>
             </div>

            <FileUpload 
              label="1. Upload Bank Statement" 
              accept=".csv,.pdf" 
              fileData={bankFile}
              onFileSelect={(f) => handleFileSelect(f, 'BANK')}
            />
            
            <FileUpload 
              label="2. Upload General Ledger" 
              accept=".csv,.pdf" 
              fileData={ledgerFile}
              onFileSelect={(f) => handleFileSelect(f, 'LEDGER')}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            {(bankFile || ledgerFile) && (
              <button
                onClick={reset}
                className="px-6 py-4 rounded-xl font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm flex items-center gap-2"
                title="Clear files"
              >
                <Trash2 className="w-5 h-5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}

            <button
              onClick={handleReconcile}
              disabled={!bankFile?.parsedData || !ledgerFile?.parsedData || isProcessing}
              className={`
                flex-1 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all
                ${!bankFile?.parsedData || !ledgerFile?.parsedData 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]'
                }
              `}
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  Reconcile Now
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          Supported formats: PDF (Bank Statements, Invoices), CSV (Exports).
        </div>
      </div>
    </div>
  );
};

export default App;