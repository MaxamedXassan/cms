"use client";

import { useEffect, useState } from "react";
import { 
  CreditCard, 
  Printer, 
  Search, 
  DollarSign, 
  TrendingUp, 
  Check, 
  Clock, 
  AlertCircle,
  X,
  Building,
  User,
  Calendar,
  Receipt
} from "lucide-react";
import confetti from "canvas-confetti";
import Sidebar from "@/components/sidebar";
import { db, Finance, Settings } from "@/lib/db";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function FinancePage() {
  const { isAuthorized, isChecking } = useRequireAuth();
  const [finances, setFinances] = useState<Finance[]>([]);
  const [filteredFinances, setFilteredFinances] = useState<Finance[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Modal States
  const [activeFinance, setActiveFinance] = useState<Finance | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Payment Processing Form State
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthorized) return;
    loadFinanceData();
  }, [isAuthorized]);

  const loadFinanceData = async () => {
    setIsLoading(true);
    try {
      const data = await db.getFinanceRecords();
      setFinances(data);
      setFilteredFinances(data);
      const setts = await db.getSettings();
      setSettings(setts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setFilteredFinances(finances);
      return;
    }
    const query = val.toLowerCase();
    const filtered = finances.filter(f => 
      (f.patient_name || "").toLowerCase().includes(query) ||
      f.status.toLowerCase().includes(query)
    );
    setFilteredFinances(filtered);
  };

  const handleOpenPayment = (finance: Finance) => {
    setActiveFinance(finance);
    setPaymentAmount(finance.remaining.toString());
    setPaymentError("");
    setIsPaymentModalOpen(true);
  };

  const handleOpenReceipt = (finance: Finance) => {
    setActiveFinance(finance);
    setIsReceiptModalOpen(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    if (!activeFinance) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setPaymentError("Please enter a valid payment amount greater than 0.");
      return;
    }

    if (amount > activeFinance.remaining) {
      setPaymentError(`Amount cannot exceed the remaining balance of ${currency}${activeFinance.remaining.toFixed(2)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await db.updateFinancePayment(activeFinance.id, amount);
      
      if (updated) {
        // If payment resolves or fully completes, celebrate
        if (updated.status === "Paid") {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }

        setIsPaymentModalOpen(false);
        setActiveFinance(null);
        await loadFinanceData();
      }
    } catch (err) {
      console.error(err);
      setPaymentError("Failed to process payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  if (isChecking || !isAuthorized) {
    return (
      <div className="flex-grow flex items-center justify-center bg-[#0b1329]">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currency = settings?.currency || "$";

  // Calculate Metrics
  const totalBilled = finances.reduce((sum, f) => sum + Number(f.total), 0);
  const totalCollected = finances.reduce((sum, f) => sum + Number(f.paid), 0);
  const totalOutstanding = finances.reduce((sum, f) => sum + Number(f.remaining), 0);

  return (
    <div className="flex min-h-screen bg-[#0b1329] text-[#f8fafc] no-print">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-8 pt-[73px] lg:pt-8 overflow-y-auto z-10">
        {/* Top Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Billing & Finance</h1>
            <p className="text-slate-400 mt-1 text-sm font-sans">Track invoice records, collect payments, and print customer statements.</p>
          </div>
        </div>

        {/* Finance Stats KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Billed */}
          <div className="glass-card-blue p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Billed</p>
              <h3 className="text-2xl font-bold text-white mt-1.5">
                {currency}{totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Total Collected */}
          <div className="glass-card-green p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Collected</p>
              <h3 className="text-2xl font-bold text-white mt-1.5">
                {currency}{totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl text-green-400 border border-green-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* Total Outstanding */}
          <div className="glass-card-purple p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Outstanding Balance</p>
              <h3 className="text-2xl font-bold text-white mt-1.5">
                {currency}{totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mb-6 max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by patient name or status (paid, unpaid)..."
            className="w-full pl-12 pr-4 py-3.5 glass-input text-sm"
          />
        </div>

        {/* Billing Table */}
        {isLoading ? (
          <div className="flex justify-center items-center h-[30vh]">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block glass-panel rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="p-4 pl-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Patient</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Visit Date</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Cons. Fee</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Med. Cost</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Total Billed</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Paid</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Balance</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="p-4 pr-6 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFinances.length > 0 ? (
                    filteredFinances.map((finance) => (
                      <tr 
                        key={finance.id} 
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-4 pl-6 font-semibold text-white text-sm">{finance.patient_name}</td>
                        <td className="p-4 text-xs text-slate-400 font-mono">
                          {new Date(finance.visit_date || finance.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-xs text-slate-300 font-mono">{currency}{Number(finance.consult_fee).toFixed(2)}</td>
                        <td className="p-4 text-xs text-slate-300 font-mono">{currency}{Number(finance.med_cost).toFixed(2)}</td>
                        <td className="p-4 text-sm text-white font-semibold font-mono">{currency}{Number(finance.total).toFixed(2)}</td>
                        <td className="p-4 text-xs text-emerald-400 font-mono">{currency}{Number(finance.paid).toFixed(2)}</td>
                        <td className="p-4 text-xs text-red-400 font-mono">{currency}{Number(finance.remaining).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            finance.status === "Paid" 
                              ? "bg-green-500/10 text-green-400 border border-green-500/10" 
                              : finance.status === "Partial"
                              ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/10"
                              : "bg-red-500/10 text-red-400 border border-red-500/10"
                          }`}>
                            {finance.status === "Paid" && <Check className="w-3 h-3" />}
                            {finance.status === "Partial" && <Clock className="w-3 h-3" />}
                            {finance.status === "Pending" && <AlertCircle className="w-3 h-3" />}
                            <span>{finance.status}</span>
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right space-x-2">
                          {finance.remaining > 0 && (
                            <button
                              onClick={() => handleOpenPayment(finance)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 hover:text-cyan-300 text-xs font-semibold transition"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenReceipt(finance)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-slate-200 text-xs font-semibold transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 text-sm">
                        No financial statements found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden space-y-4">
              {filteredFinances.length > 0 ? (
                filteredFinances.map((finance) => (
                  <div key={finance.id} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white text-sm">{finance.patient_name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          {new Date(finance.visit_date || finance.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        finance.status === "Paid" 
                          ? "bg-green-500/10 text-green-400" 
                          : finance.status === "Partial"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        <span>{finance.status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Total</span>
                        <span className="text-xs font-bold text-white font-mono">{currency}{Number(finance.total).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Paid</span>
                        <span className="text-xs font-semibold text-emerald-400 font-mono">{currency}{Number(finance.paid).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Balance</span>
                        <span className="text-xs font-semibold text-red-400 font-mono">{currency}{Number(finance.remaining).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-white/5">
                      {finance.remaining > 0 && (
                        <button
                          onClick={() => handleOpenPayment(finance)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-semibold transition"
                        >
                          <CreditCard className="w-4 h-4" />
                          Pay
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenReceipt(finance)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold transition"
                      >
                        <Printer className="w-4 h-4" />
                        Receipt
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 text-sm py-8">
                  No financial statements found.
                </div>
              )}
            </div>
          </>
        )}

        {/* Process Payment Modal */}
        {isPaymentModalOpen && activeFinance && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl relative animate-float-slow">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="absolute right-6 top-6 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                Process Payment
              </h3>
              <p className="text-slate-400 text-xs mb-5">Record billing payment for <strong>{activeFinance.patient_name}</strong>.</p>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-5 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Total Bill Amount:</span>
                  <span className="font-mono text-white font-semibold">{currency}{activeFinance.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Already Paid:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{currency}{activeFinance.paid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-white/5 pt-2 text-slate-300">
                  <span className="font-bold">Remaining Balance:</span>
                  <span className="font-mono text-red-400 font-bold">{currency}{activeFinance.remaining.toFixed(2)}</span>
                </div>
              </div>

              {paymentError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              <form onSubmit={handleProcessPayment} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Payment Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    max={activeFinance.remaining}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="e.g. 50.00"
                    className="w-full px-4 py-3 glass-input text-sm font-mono text-white"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/5 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 active:scale-98 transition-all duration-200"
                  >
                    {isSubmitting ? "Processing..." : "Complete Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Print Receipt Modal */}
        {isReceiptModalOpen && activeFinance && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in print:bg-white print:p-0">
            <div className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative flex flex-col max-h-[90vh] print:max-h-full print:w-full print:h-full print:border-none print:shadow-none print:glass-panel print:p-0">
              
              {/* Header (No Print) */}
              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6 no-print">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-cyan-400" />
                  Patient Statement Receipt
                </h3>
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Receipt Content Area (Printed) */}
              <div className="flex-1 overflow-y-auto pr-1 print:overflow-visible print:pr-0 text-slate-300 print:text-black">
                <div className="border border-white/5 p-6 rounded-2xl bg-white/[0.01] print:bg-transparent print:border-black print:text-black space-y-6">
                  
                  {/* Clinic Header */}
                  <div className="flex justify-between items-start border-b border-white/10 print:border-black pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white print:text-black">{settings?.clinic_name || "Apex Care Clinic"}</h2>
                      <p className="text-xs text-slate-400 print:text-black mt-0.5">Clinical Invoice / Receipt</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 print:text-black uppercase tracking-wider font-semibold">Contact Support</p>
                      <p className="text-xs font-semibold text-slate-200 print:text-black mt-0.5">Apex Care Clinic</p>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[9px] text-slate-400 print:text-black uppercase tracking-wider font-semibold">Invoice Details</p>
                      <p className="mt-1"><strong className="text-slate-200 print:text-black">Invoice ID:</strong> <span className="font-mono">{activeFinance.id}</span></p>
                      <p className="mt-0.5"><strong className="text-slate-200 print:text-black">Date Issued:</strong> {new Date(activeFinance.visit_date || activeFinance.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 print:text-black uppercase tracking-wider font-semibold">Patient</p>
                      <p className="mt-1 font-semibold text-white print:text-black">{activeFinance.patient_name}</p>
                    </div>
                  </div>

                  {/* Billing Breakdown table */}
                  <div className="border-t border-b border-white/10 print:border-black py-4 space-y-2">
                    <div className="flex justify-between text-xs text-slate-400 print:text-black">
                      <span>Consultation Fee:</span>
                      <span className="font-mono text-slate-200 print:text-black">{currency}{activeFinance.consult_fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 print:text-black">
                      <span>Medicine Cost:</span>
                      <span className="font-mono text-slate-200 print:text-black">{currency}{activeFinance.med_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t border-white/5 print:border-black pt-2 text-white print:text-black">
                      <span>Total Invoice:</span>
                      <span className="font-mono">{currency}{activeFinance.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <p className="text-slate-400 print:text-black">Status: <strong className="text-slate-200 print:text-black font-semibold">{activeFinance.status}</strong></p>
                      <p className="text-slate-400 print:text-black mt-0.5">Amount Paid: <strong className="text-emerald-400 print:text-black font-mono font-bold">{currency}{activeFinance.paid.toFixed(2)}</strong></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 print:text-black uppercase tracking-wider font-semibold">Balance Due</p>
                      <p className="text-lg font-mono font-bold text-red-400 print:text-black mt-0.5">{currency}{activeFinance.remaining.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Footer Terms */}
                  <div className="text-center text-[10px] text-slate-500 print:text-black pt-4 border-t border-dashed border-white/10 print:border-black">
                    <p>Thank you for choosing Apex Care Clinic. Be well!</p>
                  </div>

                </div>
              </div>

              {/* Actions Footer (No Print) */}
              <div className="flex gap-4 pt-6 border-t border-white/5 mt-6 no-print">
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold transition"
                >
                  Close
                </button>
                <button
                  onClick={triggerPrint}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 active:scale-98 transition flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt Statement
                </button>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
