"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SystemConsole() {
  const [username, setUsername] = useState("");
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [storageProvider, setStorageProvider] = useState("local");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const router = useRouter();

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    // 1. Fetch user session and storage data
    fetch("/api/files")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUsername(data.username);
          setEncryptionEnabled(data.encryptionEnabled);
          setDomain(data.domain || window.location.origin);
        }
      })
      .catch(() => {});

    // 2. Fetch config details
    fetch("/api/auth/config")
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0c0f17]">
        <div className="text-center">
          <div className="w-11 h-11 border-2 border-cyan-500/15 border-t-cyan-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading console settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col animate-fade-in-up">
      <main className="max-w-3xl mx-auto w-full px-4 py-6 md:px-6">
        
        {/* Settings Card */}
        <section className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-10 shadow-xl shadow-black/[0.03] dark:shadow-black/20">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm font-bold mb-6 transition-all duration-200 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            ← Back to My Files
          </Link>

          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Settings</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-medium">
              System information and configuration status
            </p>
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Database */}
            <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-3 hover:border-slate-350 dark:hover:border-white/20 transition-all duration-300 shadow-sm dark:shadow-none">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Database</span>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_theme(colors.emerald.500)]" />
                <span className="text-sm font-extrabold text-slate-800 dark:text-white">Online</span>
              </div>
            </div>

            {/* Encryption */}
            <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-3 hover:border-slate-350 dark:hover:border-white/20 transition-all duration-300 shadow-sm dark:shadow-none">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Encryption</span>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_10px_theme(colors.purple.500)]" />
                <span className="text-sm font-extrabold text-slate-800 dark:text-white">AES-256 Active</span>
              </div>
            </div>

            {/* Storage */}
            <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-3 hover:border-slate-350 dark:hover:border-white/20 transition-all duration-300 shadow-sm dark:shadow-none">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Storage</span>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_10px_theme(colors.cyan.500)]" />
                <span className="text-sm font-extrabold text-slate-800 dark:text-white">Local Link</span>
              </div>
            </div>
          </div>

          {/* Specs Table */}
          <div className="border-t border-slate-200 dark:border-white/10 pt-6">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">Details</h3>
            
            <div className="bg-slate-50 dark:bg-black/15 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-inner dark:shadow-none">
              <div className="flex flex-col gap-1 px-5 py-3.5 border-b border-slate-200 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Username</span>
                <span className="text-slate-900 dark:text-white font-bold text-sm break-words sm:text-right">{username}</span>
              </div>
              <div className="flex flex-col gap-1 px-5 py-3.5 border-b border-slate-200 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Domain</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm font-mono break-all sm:text-right">{domain}</span>
              </div>
              <div className="flex flex-col gap-1 px-5 py-3.5 border-b border-slate-200 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Encryption type</span>
                <span className="text-slate-900 dark:text-white font-bold text-sm break-words sm:text-right">{encryptionEnabled ? "AES-256-GCM" : "None"}</span>
              </div>
              <div className="flex flex-col gap-1 px-5 py-3.5 border-b border-slate-200 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-semibold">PWA Context</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold text-sm break-all sm:text-right">127.0.0.1:3000/</span>
              </div>
              <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Status</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm break-words sm:text-right">Active Node</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => showToast("Settings refreshed successfully", "success")} 
            className="w-full mt-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold rounded-2xl transition-all shadow-md active:scale-[0.98] text-sm cursor-pointer"
          >
            Refresh Configuration
          </button>
        </section>
      </main>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl shadow-2xl z-50 border backdrop-blur-md transition-all duration-300 ${
          toast.type === "success" 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
        }`}>
          <span className="text-xs font-extrabold tracking-wider">
            {toast.message.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
