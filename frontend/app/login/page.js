"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          router.replace("/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  // Sync theme status on load
  useEffect(() => {
    const activeTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(activeTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-[#0c0f17] relative">
      {/* Floating corner theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-sm"
        title="Toggle Light/Dark Theme"
      >
        {theme === "dark" ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.75 4.75l1.6 1.6m11.3 11.3l1.6 1.6M3 12h2.25m13.5 0H21M4.75 19.25l1.6-1.6m11.3-11.3l1.6-1.6M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        )}
      </button>

      {/* Main Material You card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-8 md:p-10 shadow-xl shadow-black/[0.03] dark:shadow-black/20 animate-fade-in-up">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 dark:to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25 mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 22h20L12 2zm0 3.99L18.47 19H5.53L12 5.99z" fill="white" />
              <path d="M12 9l-4.5 7.5h9L12 9z" fill="rgba(255, 255, 255, 0.4)" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-medium">
            Sign in to access your secure archive
          </p>
        </div>

        {/* Error Notification Alert */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-300 text-sm font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="w-full px-4.5 py-3.5 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white text-base placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 focus:outline-none transition-all font-semibold"
              placeholder="e.g. soumyajit"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-4.5 py-3.5 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white text-base placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 focus:outline-none transition-all font-semibold"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/15 hover:shadow-cyan-500/25 active:scale-[0.98] transition-all disabled:opacity-50 text-sm tracking-wide cursor-pointer"
          >
            {loading ? "Establishing connection..." : "Sign In"}
          </button>
        </form>

        {/* Footer actions */}
        <div className="mt-8 text-center text-sm font-semibold border-t border-slate-200/80 dark:border-white/5 pt-6">
          <span className="text-slate-500">Don't have an account? </span>
          <Link
            href="/register"
            className="text-cyan-600 dark:text-cyan-400 hover:underline pl-0.5"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
