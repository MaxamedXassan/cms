"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  Plus, 
  Activity,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
import { db, Settings } from "@/lib/db";
import { useRequireAuth } from "@/lib/useRequireAuth";

interface DashboardMetrics {
  totalPatients: number;
  todayPatients: number;
  todayRevenue: number;
  monthlyRevenue: number;
  recentPatients: any[];
}

export default function Dashboard() {
  const { isAuthorized, isChecking } = useRequireAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; amount: number }[]>([]);

  useEffect(() => {
    if (!isAuthorized) return;

    const loadData = async () => {
      try {
        const metData = await db.getDashboardMetrics();
        const setts = await db.getSettings();
        setMetrics(metData);
        setSettings(setts);

        // Generate a 6-month revenue trend for the chart
        const finances = await db.getFinanceRecords();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const trendMap: { [key: string]: number } = {};
        
        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const monthStr = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
          trendMap[monthStr] = 0;
        }

        finances.forEach(f => {
          const vDate = new Date(f.visit_date || f.created_at);
          const monthStr = `${months[vDate.getMonth()]} ${vDate.getFullYear().toString().substr(-2)}`;
          if (trendMap[monthStr] !== undefined) {
            trendMap[monthStr] += Number(f.paid);
          }
        });

        const trendArray = Object.keys(trendMap).map(key => ({
          month: key,
          amount: trendMap[key]
        }));
        
        setMonthlyTrend(trendArray);
      } catch (err) {
        console.error("Error loading dashboard metrics:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthorized]);

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
        {/* Top Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1 text-sm">Welcome back to your clinical management portal.</p>
          </div>
          
          <Link
            href="/patients"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 active:scale-98 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add New Patient
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Patients */}
              <div className="glass-card-blue p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute right-4 top-4 text-cyan-400/10 group-hover:text-cyan-400/20 transition-colors">
                  <Users className="w-16 h-16" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Patients</p>
                    <h3 className="text-3xl font-bold mt-2 text-white">{metrics?.totalPatients || 0}</h3>
                  </div>
                  <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs text-cyan-400 mt-4 flex items-center gap-1 font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Active directory profiles
                </p>
              </div>

              {/* Today's Patients */}
              <div className="glass-card-green p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute right-4 top-4 text-green-400/10 group-hover:text-green-400/20 transition-colors">
                  <Calendar className="w-16 h-16" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Visits</p>
                    <h3 className="text-3xl font-bold mt-2 text-white">{metrics?.todayPatients || 0}</h3>
                  </div>
                  <div className="p-2.5 bg-green-500/10 rounded-xl text-green-400 border border-green-500/20">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs text-green-400 mt-4 flex items-center gap-1 font-medium">
                  <Activity className="w-3.5 h-3.5" />
                  Appointments completed today
                </p>
              </div>

              {/* Today's Revenue */}
              <div className="glass-card-purple p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute right-4 top-4 text-purple-400/10 group-hover:text-purple-400/20 transition-colors">
                  <DollarSign className="w-16 h-16" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Revenue</p>
                    <h3 className="text-3xl font-bold mt-2 text-white">
                      {currency}{(metrics?.todayRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs text-purple-400 mt-4 flex items-center gap-1 font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Daily transaction flow
                </p>
              </div>

              {/* Monthly Revenue */}
              <div className="glass-card-yellow p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute right-4 top-4 text-yellow-400/10 group-hover:text-yellow-400/20 transition-colors">
                  <TrendingUp className="w-16 h-16" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Revenue</p>
                    <h3 className="text-3xl font-bold mt-2 text-white">
                      {currency}{(metrics?.monthlyRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className="p-2.5 bg-yellow-500/10 rounded-xl text-yellow-400 border border-yellow-500/20">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs text-yellow-400 mt-4 flex items-center gap-1 font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Current billing cycle metrics
                </p>
              </div>
            </div>

            {/* Visual Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Trend Chart Card */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-white tracking-wide text-lg">Financial Performance</h3>
                  <span className="text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-full">Last 6 Months</span>
                </div>
                
                {/* HTML & CSS Chart */}
                <div className="h-64 flex items-end justify-between gap-4 pt-4 px-2">
                  {monthlyTrend.map((data, index) => {
                    const maxAmount = Math.max(...monthlyTrend.map(t => t.amount), 1);
                    const percentageHeight = (data.amount / maxAmount) * 80 + 10; // minimum 10% height for visibility if > 0
                    const heightPercent = data.amount === 0 ? "4%" : `${percentageHeight}%`;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end">
                        {/* Tooltip */}
                        <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900 border border-white/10 px-2 py-1 rounded text-[10px] font-mono -translate-y-4 pointer-events-none whitespace-nowrap z-20">
                          {currency}{data.amount.toFixed(2)}
                        </div>
                        
                        {/* Bar */}
                        <div 
                          style={{ height: heightPercent }}
                          className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 cursor-pointer ${
                            index === monthlyTrend.length - 1 
                              ? "bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]" 
                              : "bg-white/10 hover:bg-cyan-500/30"
                          }`}
                        />
                        
                        {/* Label */}
                        <span className="text-xs text-slate-400 font-mono tracking-wider">{data.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Patient Activities */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-white tracking-wide text-lg">Recent Patients</h3>
                  <Link href="/patients" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
                    View All
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="flex-1 space-y-4">
                  {metrics?.recentPatients && metrics.recentPatients.length > 0 ? (
                    metrics.recentPatients.map((patient, idx) => (
                      <Link 
                        href={`/patients/${patient.id}`} 
                        key={patient.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-300 group border border-transparent hover:border-white/5"
                      >
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400 font-semibold group-hover:scale-105 transition-transform">
                          {patient.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate">{patient.name}</h4>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{patient.lastComplaint}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : "No visits"}
                          </span>
                          <span className="text-[10px] text-cyan-400 mt-1 block font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded-full inline-block">
                            {patient.gender}, {patient.age}y
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-10">
                      <span>🩺</span>
                      <p className="text-xs mt-2">No patients registered yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
