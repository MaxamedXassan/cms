"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  Plus, 
  UserPlus, 
  Eye, 
  X, 
  MapPin, 
  Phone as PhoneIcon, 
  Calendar as AgeIcon, 
  Users as GenderIcon 
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import Sidebar from "@/components/sidebar";
import { db, Patient } from "@/lib/db";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function Patients() {
  const { isAuthorized, isChecking } = useRequireAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthorized) return;
    loadPatients();
  }, [isAuthorized]);

  const loadPatients = async (query = "") => {
    setIsLoading(true);
    try {
      const data = await db.getPatients(query);
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPatients(searchQuery);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    loadPatients(val);
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    if (!name.trim() || !age || !gender || !phone.trim() || !address.trim()) {
      setFormError("All fields are required.");
      return;
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge <= 0) {
      setFormError("Please enter a valid age.");
      return;
    }

    setIsSubmitting(true);
    try {
      await db.addPatient({
        name: name.trim(),
        age: parsedAge,
        gender,
        phone: phone.trim(),
        address: address.trim()
      });

      // Blast confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Clear Form & Close Modal
      setName("");
      setAge("");
      setGender("Male");
      setPhone("");
      setAddress("");
      setIsAddModalOpen(false);
      
      // Reload Patient List
      loadPatients();
    } catch (err) {
      console.error(err);
      setFormError("Failed to add patient. Please try again.");
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

  return (
    <div className="flex min-h-screen bg-[#0b1329] text-[#f8fafc]">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-8 pt-[73px] lg:pt-8 overflow-y-auto z-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Patients Directory</h1>
            <p className="text-slate-400 mt-1 text-sm">Manage, search, and register clinic patients.</p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 active:scale-98 transition-all duration-200"
          >
            <UserPlus className="w-4.5 h-4.5" />
            Add Patient
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6 max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-12 pr-4 py-3.5 glass-input text-sm"
          />
        </form>

        {isLoading ? (
          <div className="flex justify-center items-center h-[40vh]">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Desktop Table View (hidden on small screens) */}
            <div className="hidden md:block glass-panel rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="p-4 pl-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Patient Name</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Age / Gender</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Address</th>
                    <th className="p-4 pr-6 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.length > 0 ? (
                    patients.map((patient) => (
                      <tr 
                        key={patient.id} 
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400 font-semibold">
                              {patient.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-white text-sm">{patient.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-slate-200">{patient.age}y</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full font-medium">
                              {patient.gender}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-300 font-mono">{patient.phone}</td>
                        <td className="p-4 text-sm text-slate-400 max-w-[200px] truncate">{patient.address}</td>
                        <td className="p-4 pr-6 text-right">
                          <Link
                            href={`/patients/${patient.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 hover:text-cyan-300 text-xs font-semibold transition-all duration-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Portal
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                        No patients matching search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (hidden on large screens) */}
            <div className="block md:hidden space-y-4">
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <div key={patient.id} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400 font-semibold">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{patient.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                          <span className="text-slate-400">{patient.age}y</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-cyan-400 font-medium">{patient.gender}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-white/5 pt-3">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <PhoneIcon className="w-4 h-4 text-cyan-400/70" />
                        <span className="font-mono">{patient.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <MapPin className="w-4 h-4 text-cyan-400/70 shrink-0" />
                        <span className="truncate">{patient.address}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-semibold transition-all duration-200"
                      >
                        <Eye className="w-4 h-4" />
                        View Patient Portal
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 text-sm py-8">
                  No patients matching search criteria.
                </div>
              )}
            </div>
          </>
        )}

        {/* Add Patient Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative animate-float-slow">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute right-6 top-6 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                Register New Patient
              </h3>
              <p className="text-slate-400 text-sm mb-6">Create a new demographic profile in the system registry.</p>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAddPatient} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 glass-input text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Age */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Age (Years)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="150"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 35"
                      className="w-full px-4 py-3 glass-input text-sm"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-3 glass-input text-sm bg-[#0b1329] text-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                    className="w-full px-4 py-3 glass-input text-sm"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Address</label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 123 Pine St, Seattle, WA"
                    className="w-full px-4 py-3 glass-input text-sm"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t border-white/5 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 active:scale-98 transition-all duration-200"
                  >
                    {isSubmitting ? "Registering..." : "Register Patient"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
