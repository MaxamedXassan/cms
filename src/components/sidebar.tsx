"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Settings as SettingsIcon,
  LogOut,
  Stethoscope,
  Menu,
  X,
} from "lucide-react";
import { auth, db, Settings } from "@/lib/db";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [adminName, setAdminName] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    db.getSettings().then(setSettings);
    auth.getAdminProfile().then((profile) => {
      if (profile) setAdminName(profile.username);
    });

    const handleSettingsUpdate = () => db.getSettings().then(setSettings);
    window.addEventListener("settingsUpdated", handleSettingsUpdate);
    return () => window.removeEventListener("settingsUpdated", handleSettingsUpdate);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Finance", href: "/finance", icon: DollarSign },
    { name: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  const BrandLogo = () => (
    <>
      {settings?.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.logo_url}
          alt="Logo"
          className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400 shrink-0">
          <Stethoscope className="w-6 h-6 animate-pulse" />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="font-semibold text-white tracking-wide text-sm truncate max-w-[150px]">
          {settings?.clinic_name || "CareFlow Clinic"}
        </h1>
        <p className="text-[10px] text-cyan-400 font-mono tracking-wider uppercase">
          {adminName ? `@${adminName}` : "Portal Admin"}
        </p>
      </div>
    </>
  );

  const NavLinks = () => (
    <nav className="flex-1 px-4 py-6 space-y-2">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
              isActive
                ? "bg-cyan-500/15 text-cyan-300 border-l-4 border-cyan-400 font-medium"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Icon
              className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"
              }`}
            />
            <span className="text-sm">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  const LogoutButton = () => (
    <div className="p-4 border-t border-white/5">
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 group"
      >
        <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
        <span className="text-sm font-medium">Log Out</span>
      </button>
    </div>
  );

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 flex items-center justify-between px-4 py-3 no-print">
        <div className="flex items-center gap-3">
          <BrandLogo />
        </div>
        <button
          id="hamburger-btn"
          aria-label="Open navigation menu"
          onClick={() => setIsOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all duration-200 active:scale-95"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── Desktop sidebar ────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 glass-panel border-r border-white/5 flex-col h-screen sticky top-0 no-print z-50">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <BrandLogo />
        </div>
        <NavLinks />
        <LogoutButton />
      </aside>

      {/* ── Mobile backdrop ────────────────────────────────────── */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ──────────────────────────────────────── */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-72 z-[70] glass-panel border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out no-print ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <BrandLogo />
          </div>
          <button
            id="close-drawer-btn"
            aria-label="Close navigation menu"
            onClick={() => setIsOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all duration-200 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <NavLinks />
        <LogoutButton />
      </div>
    </>
  );
}
