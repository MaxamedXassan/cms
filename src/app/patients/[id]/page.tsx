"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  History, 
  MapPin, 
  Phone, 
  User, 
  Check, 
  Clock, 
  X,
  PlusCircle,
  AlertCircle,
  FileText,
  Printer
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import Sidebar from "@/components/sidebar";
import { db, Patient, Visit, Settings } from "@/lib/db";
import { useRequireAuth } from "@/lib/useRequireAuth";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PatientProfile({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthorized, isChecking } = useRequireAuth();

  // Auth & System State
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVisitForReport, setSelectedVisitForReport] = useState<Visit | null>(null);

  // Visit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [complaint, setComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [consultFee, setConsultFee] = useState("");
  const [medCost, setMedCost] = useState("");
  
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthorized) return;
    loadPatientData();
  }, [id, isAuthorized]);

  const loadPatientData = async () => {
    setIsLoading(true);
    try {
      const pat = await db.getPatientById(id);
      if (!pat) {
        router.push("/patients");
        return;
      }
      setPatient(pat);

      const visList = await db.getVisits(id);
      setVisits(visList);

      const setts = await db.getSettings();
      setSettings(setts);
      
      // Prefill default fee
      if (setts) {
        setConsultFee(setts.default_consult_fee.toString());
        setMedCost("0");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!complaint.trim() || !diagnosis.trim() || !treatment.trim() || !prescription.trim() || !consultFee || !medCost) {
      setFormError("Please fill in all required fields.");
      return;
    }

    const cFee = parseFloat(consultFee);
    const mCost = parseFloat(medCost);

    if (isNaN(cFee) || cFee < 0 || isNaN(mCost) || mCost < 0) {
      setFormError("Fees must be valid non-negative numbers.");
      return;
    }

    setIsSubmitting(true);
    try {
      await db.addVisit({
        patient_id: id,
        complaint: complaint.trim(),
        diagnosis: diagnosis.trim(),
        treatment: treatment.trim(),
        prescription: prescription.trim(),
        notes: notes.trim()
      }, {
        consult_fee: cFee,
        med_cost: mCost
      });

      // Confetti burst
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      // Clear Form and reload
      setComplaint("");
      setDiagnosis("");
      setTreatment("");
      setPrescription("");
      setNotes("");
      setIsFormOpen(false);
      
      // Reload Patient profile data & history
      await loadPatientData();
    } catch (err) {
      console.error(err);
      setFormError("Failed to save visit record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking || !isAuthorized) {
    return (
      <div className="flex-grow flex items-center justify-center bg-[#0b1329]">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currency = settings?.currency || "$";

  return (
    <div className="flex min-h-screen bg-[#0b1329] text-[#f8fafc]">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-8 pt-[73px] lg:pt-8 overflow-y-auto z-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/patients"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors bg-white/5 px-4 py-2.5 rounded-xl border border-white/5"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            Back to Patients Directory
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          patient && (
            <div className="space-y-8">
              {/* Patient Demographic Card */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                <div className="absolute right-6 top-6 opacity-5 font-mono text-9xl text-white select-none pointer-events-none">
                  {patient.gender.charAt(0)}
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 justify-between md:items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400 text-2xl font-bold">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{patient.name}</h2>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-slate-400 text-xs">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-cyan-400" />
                          {patient.age} Years Old
                        </span>
                        <span>•</span>
                        <span className="bg-cyan-500/10 px-2 py-0.5 rounded-full text-cyan-400 font-semibold border border-cyan-500/10">
                          {patient.gender}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full md:w-auto">
                    <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                      <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Phone</p>
                        <p className="text-sm font-mono text-slate-200">{patient.phone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Address</p>
                        <p className="text-sm text-slate-200 truncate max-w-[200px]">{patient.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action and Timeline Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Timeline and History (Left Side) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <History className="w-5 h-5 text-cyan-400" />
                      Visit History
                    </h3>
                    
                    {!isFormOpen && (
                      <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/25 hover:bg-cyan-500/25 text-cyan-300 text-xs font-semibold transition-all duration-200"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Log New Visit
                      </button>
                    )}
                  </div>

                  {visits.length > 0 ? (
                    <div className="relative border-l-2 border-white/5 ml-4 pl-6 space-y-6">
                      {visits.map((visit) => (
                        <div key={visit.id} className="relative">
                          {/* Timeline node */}
                          <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-cyan-500 border-4 border-[#0b1329]" />
                          
                          {/* Visit Details Card */}
                          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-white/5 pb-3">
                              <span className="text-xs text-slate-400 font-mono">
                                Logged: {new Date(visit.created_at).toLocaleString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedVisitForReport(visit)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-300 text-xs font-semibold transition-all duration-200"
                                >
                                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                                  View Medical Report
                                </button>
                                <span className="text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-slate-400 font-mono">
                                  ID: {visit.id.substring(0, 8)}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Chief Complaint</span>
                                <p className="text-sm text-white font-medium">{visit.complaint}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Diagnosis</span>
                                <p className="text-sm text-cyan-300 font-medium">{visit.diagnosis}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Treatment Plan</span>
                                <p className="text-sm text-slate-300">{visit.treatment}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Prescription</span>
                                <p className="text-sm text-emerald-400 font-mono">{visit.prescription}</p>
                              </div>
                            </div>

                            {visit.notes && (
                              <div className="border-t border-white/5 pt-3 space-y-1">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Notes</span>
                                <p className="text-xs text-slate-400 italic bg-white/[0.01] p-2.5 rounded-lg border border-white/5">{visit.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass-panel p-8 text-center text-slate-500 rounded-2xl border border-white/5">
                      <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                      <p className="text-sm">No historical clinical visits logged for this patient.</p>
                      <button
                        onClick={() => setIsFormOpen(true)}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold"
                      >
                        Create First Record
                      </button>
                    </div>
                  )}
                </div>

                {/* Visit Entry Form (Right Side / Sidebar Modal Style) */}
                <div className="lg:col-span-1">
                  {isFormOpen ? (
                    <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl space-y-5 sticky top-8">
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                          <PlusCircle className="w-5 h-5 text-cyan-400" />
                          Log Visit
                        </h3>
                        <button
                          onClick={() => setIsFormOpen(false)}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {formError && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{formError}</span>
                        </div>
                      )}

                      <form onSubmit={handleAddVisit} className="space-y-4">
                        {/* Complaint */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Chief Complaint *</label>
                          <input
                            type="text"
                            required
                            value={complaint}
                            onChange={(e) => setComplaint(e.target.value)}
                            placeholder="e.g. Headache, fever"
                            className="w-full px-3 py-2.5 glass-input text-xs"
                          />
                        </div>

                        {/* Diagnosis */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Diagnosis *</label>
                          <input
                            type="text"
                            required
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            placeholder="e.g. Mild dehydration"
                            className="w-full px-3 py-2.5 glass-input text-xs"
                          />
                        </div>

                        {/* Treatment */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Treatment *</label>
                          <input
                            type="text"
                            required
                            value={treatment}
                            onChange={(e) => setTreatment(e.target.value)}
                            placeholder="e.g. IV Fluids"
                            className="w-full px-3 py-2.5 glass-input text-xs"
                          />
                        </div>

                        {/* Prescription */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Prescription *</label>
                          <input
                            type="text"
                            required
                            value={prescription}
                            onChange={(e) => setPrescription(e.target.value)}
                            placeholder="e.g. Paracetamol 500mg"
                            className="w-full px-3 py-2.5 glass-input text-xs"
                          />
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Notes</label>
                          <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Additional doctor notes..."
                            className="w-full px-3 py-2.5 glass-input text-xs"
                          />
                        </div>

                        {/* Billing Sections */}
                        <div className="border-t border-white/5 pt-4 space-y-4">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Billing config</h4>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Consultation Fee ({currency})</label>
                              <input
                                type="number"
                                step="0.01"
                                required
                                value={consultFee}
                                onChange={(e) => setConsultFee(e.target.value)}
                                className="w-full px-3 py-2.5 glass-input text-xs font-mono"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Medicine Cost ({currency})</label>
                              <input
                                type="number"
                                step="0.01"
                                required
                                value={medCost}
                                onChange={(e) => setMedCost(e.target.value)}
                                className="w-full px-3 py-2.5 glass-input text-xs font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 active:scale-98 transition-all duration-200"
                          >
                            {isSubmitting ? "Saving..." : "Save Record"}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 text-center py-10 space-y-4 sticky top-8">
                      <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400 mx-auto">
                        <Plus className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Need to log a visit?</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Add diagnostic findings, prescription details, and fees instantly.</p>
                      </div>
                      <button
                        onClick={() => setIsFormOpen(true)}
                        className="w-full py-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-semibold transition-all"
                      >
                        Create New Visit Card
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )
        )}
      </main>

      {/* Medical Report Modal */}
      {selectedVisitForReport && patient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1329]/80 backdrop-blur-md overflow-y-auto no-print">
          <div className="relative w-full max-w-3xl bg-[#111c44]/95 border border-white/10 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Inject Print Styles dynamically */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body {
                  visibility: hidden !important;
                  background: white !important;
                }
                #printable-medical-report {
                  visibility: visible !important;
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  background: white !important;
                  color: black !important;
                  font-family: ui-sans-serif, system-ui, sans-serif !important;
                }
                #printable-medical-report * {
                  visibility: visible !important;
                  color: black !important;
                  border-color: #cbd5e1 !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}} />

            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Medical Statement</h3>
              </div>
              <button
                onClick={() => setSelectedVisitForReport(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Content Area */}
            <div id="printable-medical-report" className="space-y-6 text-left">
              
              {/* Clinic Header */}
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-white/5 pb-6">
                <div>
                  <h2 className="text-2xl font-bold text-cyan-400 print:text-black">
                    {settings?.clinic_name || "Apex Care Clinic"}
                  </h2>
                  <p className="text-xs text-slate-400 print:text-slate-600 font-mono mt-1">
                    Medical Statement & Patient Visit Report
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 print:text-slate-600 font-semibold">Report Date</p>
                  <p className="text-sm font-semibold text-white print:text-black mt-0.5">
                    {new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </p>
                </div>
              </div>

              {/* Patient Details Sub-panel */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 print:bg-slate-50 print:border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 print:text-slate-500 uppercase tracking-wider font-semibold">Patient Name</p>
                  <p className="text-sm font-bold text-white print:text-black mt-1">{patient.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 print:text-slate-500 uppercase tracking-wider font-semibold">Age</p>
                  <p className="text-sm font-semibold text-white print:text-black mt-1">{patient.age} Years</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 print:text-slate-500 uppercase tracking-wider font-semibold">Gender</p>
                  <p className="text-sm font-semibold text-white print:text-black mt-1">{patient.gender}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 print:text-slate-500 uppercase tracking-wider font-semibold">Visit Time</p>
                  <p className="text-sm font-semibold text-cyan-400 print:text-black mt-1">
                    {new Date(selectedVisitForReport.created_at).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Medical Report Clinical Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Chief Complaint */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 print:border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 print:text-slate-500 uppercase tracking-wider font-semibold">1. Chief Complaint</span>
                    <p className="text-sm text-white print:text-black font-medium leading-relaxed">
                      {selectedVisitForReport.complaint}
                    </p>
                  </div>

                  {/* Final Diagnosis */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 print:border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 print:text-slate-500 uppercase tracking-wider font-semibold">2. Final Diagnosis</span>
                    <p className="text-sm text-cyan-300 print:text-black font-semibold leading-relaxed">
                      {selectedVisitForReport.diagnosis}
                    </p>
                  </div>

                  {/* Treatment Given */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 print:border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 print:text-slate-500 uppercase tracking-wider font-semibold">3. Treatment Given</span>
                    <p className="text-sm text-slate-200 print:text-black leading-relaxed">
                      {selectedVisitForReport.treatment}
                    </p>
                  </div>

                  {/* Prescribed Medicines */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 print:border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 print:text-slate-500 uppercase tracking-wider font-semibold">4. Prescribed Medicines</span>
                    <p className="text-sm text-emerald-400 print:text-black font-mono font-medium leading-relaxed">
                      {selectedVisitForReport.prescription}
                    </p>
                  </div>

                </div>

                {/* Additional Notes */}
                {selectedVisitForReport.notes && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 print:border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 print:text-slate-500 uppercase tracking-wider font-semibold">5. Additional Notes</span>
                    <p className="text-sm text-slate-300 print:text-black italic leading-relaxed">
                      {selectedVisitForReport.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Hospital Signoff */}
              <div className="pt-8 border-t border-dashed border-slate-200 dark:border-white/5 flex justify-between items-end">
                <div className="text-xs text-slate-400 print:text-slate-500">
                  <p>Visit ID: {selectedVisitForReport.id}</p>
                  <p className="mt-1">Generated by CareFlow Portal</p>
                </div>
                <div className="text-center w-48 border-t border-slate-200 dark:border-white/10 pt-2 print:border-slate-300">
                  <p className="text-[10px] text-slate-400 print:text-slate-500 uppercase tracking-wider">Attending Physician</p>
                  <div className="h-6" />
                  <p className="text-xs font-semibold text-slate-300 print:text-black">Authorized Signature</p>
                </div>
              </div>

            </div>

            {/* Modal Footer / Print Action */}
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={() => setSelectedVisitForReport(null)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20 active:scale-98 transition-all"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
