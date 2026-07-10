"use client";

import { useEffect, useState } from "react";
import { 
  Settings as SettingsIcon, 
  Building, 
  ShieldCheck, 
  Save, 
  Check, 
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Mail
} from "lucide-react";
import confetti from "canvas-confetti";
import Sidebar from "@/components/sidebar";
import { auth, db, Settings } from "@/lib/db";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function SettingsPage() {
  const { isAuthorized, isChecking } = useRequireAuth();

  // Clinic Settings State
  const [clinicName, setClinicName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [currency, setCurrency] = useState("$");
  const [defaultFee, setDefaultFee] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Admin Credentials State
  const [adminId, setAdminId] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Message States
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [credSuccess, setCredSuccess] = useState("");
  const [credError, setCredError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingCreds, setIsSavingCreds] = useState(false);

  // Password visibility
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  useEffect(() => {
    if (!isAuthorized) return;
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const setts = await db.getSettings();
        if (setts) {
          setClinicName(setts.clinic_name || "");
          setLogoUrl(setts.logo_url || "");
          setCurrency(setts.currency || "$");
          setDefaultFee(setts.default_consult_fee?.toString() || "50");
        }
        const profile = await auth.getAdminProfile();
        if (profile) {
          setAdminId(profile.id);
          setAdminUsername(profile.username);
          setAdminEmail(profile.email);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, [isAuthorized]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");

    const fee = parseFloat(defaultFee);
    if (isNaN(fee) || fee < 0) {
      setProfileError("Default consultation fee must be a valid number.");
      return;
    }

    setIsSavingProfile(true);
    try {
      await db.updateSettings({
        clinic_name: clinicName.trim(),
        logo_url: logoUrl.trim(),
        currency: currency.trim(),
        default_consult_fee: fee,
      });
      window.dispatchEvent(new Event("settingsUpdated"));
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      setProfileSuccess("Clinic configuration saved successfully!");
    } catch (err) {
      console.error(err);
      setProfileError("Failed to update settings. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredSuccess("");
    setCredError("");

    if (!adminUsername.trim() || !adminEmail.trim()) {
      setCredError("Username and Email are required.");
      return;
    }

    const isChangingPassword = newPassword.trim() || confirmPassword.trim();
    if (isChangingPassword) {
      if (!currentPassword) {
        setCredError("Current password is required to change password.");
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        setCredError("New password must be at least 6 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setCredError("New passwords do not match.");
        return;
      }
    }

    setIsSavingCreds(true);
    try {
      const { error } = await auth.updateAdmin(
        adminId,
        adminUsername.trim(),
        adminEmail.trim().toLowerCase(),
        isChangingPassword ? newPassword : undefined
      );
      if (error) {
        setCredError(error);
      } else {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        setCredSuccess("Admin credentials updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        window.dispatchEvent(new Event("settingsUpdated"));
      }
    } catch (err) {
      console.error(err);
      setCredError("An error occurred. Please try again.");
    } finally {
      setIsSavingCreds(false);
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <SettingsIcon className="w-8 h-8 text-cyan-400" />
              Settings
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Configure clinic preferences, billing defaults, and credentials.</p>
          </div>
        </div>

        {isLoadingData ? (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* Clinic Configuration */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
                <Building className="w-5 h-5 text-cyan-400" />
                Clinic Profile
              </h3>

              {profileSuccess && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>{profileSuccess}</span>
                </div>
              )}
              {profileError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Clinic Name *</label>
                  <input
                    type="text"
                    required
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="e.g. Apex Care Clinic"
                    className="w-full px-4 py-3 glass-input text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Logo Image URL</label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://domain.com/logo.png"
                    className="w-full px-4 py-3 glass-input text-xs font-mono text-slate-300"
                  />
                  {logoUrl && (
                    <div className="mt-2 flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5 max-w-[200px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoUrl} alt="Preview Logo" className="w-10 h-10 object-cover rounded-lg border border-white/10" />
                      <span className="text-[10px] text-slate-400">Logo preview</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Currency Symbol *</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="e.g. $"
                    className="w-full px-4 py-3 glass-input text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Default Consultation Fee *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={defaultFee}
                    onChange={(e) => setDefaultFee(e.target.value)}
                    className="w-full px-4 py-3 glass-input text-xs font-mono"
                  />
                </div>

                <div className="pt-4 border-t border-white/5 mt-6">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all duration-200 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  >
                    {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSavingProfile ? "Saving..." : "Save Configuration"}
                  </button>
                </div>
              </form>
            </div>

            {/* Admin Security Credentials */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                Security &amp; Admin Credentials
              </h3>

              {credSuccess && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>{credSuccess}</span>
                </div>
              )}
              {credError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span>{credError}</span>
                </div>
              )}

              <form onSubmit={handleSaveCredentials} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Admin Username *</label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full px-4 py-3 glass-input text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 glass-input text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-4 mt-6">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Change Password</span>
                    <span className="text-[10px] text-slate-400">Leave blank if you don&apos;t want to change password.</span>
                  </div>

                  {[
                    { label: "Current Password", value: currentPassword, setter: setCurrentPassword, show: showCurrentPass, toggle: () => setShowCurrentPass(!showCurrentPass) },
                    { label: "New Password", value: newPassword, setter: setNewPassword, show: showNewPass, toggle: () => setShowNewPass(!showNewPass) },
                    { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword, show: showConfirmPass, toggle: () => setShowConfirmPass(!showConfirmPass) },
                  ].map(({ label, value, setter, show, toggle }) => (
                    <div key={label} className="space-y-1.5">
                      <label className="text-[9px] font-semibold text-slate-300 uppercase tracking-wider block">{label}</label>
                      <div className="relative">
                        <input
                          type={show ? "text" : "password"}
                          value={value}
                          onChange={(e) => setter(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 pr-10 py-3 glass-input text-xs font-mono"
                        />
                        <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5 mt-6">
                  <button
                    type="submit"
                    disabled={isSavingCreds}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all duration-200 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  >
                    {isSavingCreds ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSavingCreds ? "Updating..." : "Update Security Settings"}
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
