"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          setUsername(data.username);
        } else {
          setUsername("");
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [pathname]);

  // Sync theme status on load
  useEffect(() => {
    const activeTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(activeTheme);
  }, []);

  // Close dropdown on route transition
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      if (res.ok) {
        router.push("/login");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

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

  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage) return null;

  const navLinks = [
    { href: "/dashboard", label: "My Files" },
    { href: "/upload", label: "Upload" },
    { href: "/console", label: "Settings" },
  ];

  return (
    <header className="mx-4 mt-4 mb-2">
      <div className="bg-white/75 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden transition-all duration-300">
        {/* Main bar */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 md:px-7 md:py-3.5">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer shrink-0"
            onClick={() => router.push(username ? "/dashboard" : "/login")}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 dark:to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25 shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 22h20L12 2zm0 3.99L18.47 19H5.53L12 5.99z" fill="white" />
                <path d="M12 9l-4.5 7.5h9L12 9z" fill="rgba(255, 255, 255, 0.4)" />
              </svg>
            </div>
            <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-purple-400 bg-clip-text text-transparent">
              Phoenix XShare
            </h1>
          </div>

          {/* Desktop Nav Links */}
          {username && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                    pathname === link.href
                      ? "text-cyan-600 dark:text-cyan-400 bg-cyan-500/[0.06] border-cyan-500/15 dark:border-cyan-500/25 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 hover:bg-slate-100 hover:border-slate-200 dark:hover:text-white dark:hover:bg-white/[0.03] dark:hover:border-white/[0.05]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* User Controls & Theme Toggle */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-sm shrink-0"
              title="Toggle Light/Dark Theme"
            >
              {theme === "dark" ? (
                // Sun Icon for dark theme (switches to light)
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.75 4.75l1.6 1.6m11.3 11.3l1.6 1.6M3 12h2.25m13.5 0H21M4.75 19.25l1.6-1.6m11.3-11.3l1.6-1.6M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
                </svg>
              ) : (
                // Moon Icon for light theme (switches to dark)
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>

            {/* Desktop User Section */}
            {username ? (
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                  <span>{username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-xl hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              !loading && (
                <Link
                  href="/login"
                  className="hidden md:inline-flex px-5 py-2 text-sm font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/5 dark:hover:bg-cyan-500/10 transition-all duration-200"
                >
                  Sign In
                </Link>
              )
            )}

            {/* Mobile Hamburger */}
            {username && (
              <button
                className={`md:hidden flex flex-col justify-between w-[38px] h-[38px] rounded-xl p-[11px_9px] cursor-pointer outline-none transition-all duration-200 ${
                  menuOpen
                    ? "bg-slate-100 dark:bg-white/[0.08] border border-cyan-500/40"
                    : "bg-transparent border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                }`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle Navigation Menu"
              >
                <span
                  className="block w-full h-0.5 rounded-full transition-all duration-350"
                  style={{
                    backgroundColor: menuOpen ? "rgb(6, 182, 212)" : "currentColor",
                    transform: menuOpen ? "translateY(5.5px) rotate(45deg)" : "none",
                  }}
                />
                <span
                  className="block w-full h-0.5 rounded-full transition-all duration-350"
                  style={{
                    backgroundColor: menuOpen ? "rgb(6, 182, 212)" : "currentColor",
                    opacity: menuOpen ? 0 : 1,
                  }}
                />
                <span
                  className="block w-full h-0.5 rounded-full transition-all duration-350"
                  style={{
                    backgroundColor: menuOpen ? "rgb(6, 182, 212)" : "currentColor",
                    transform: menuOpen ? "translateY(-6.5px) rotate(-45deg)" : "none",
                  }}
                />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Dropdown */}
        {username && menuOpen && (
          <div className="md:hidden border-t border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-950/40 px-5 pt-4 pb-5 flex flex-col gap-4 animate-slideDown">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 rounded-xl text-[0.95rem] font-bold transition-all duration-200 border ${
                    pathname === link.href
                      ? "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-500/[0.05] border-cyan-500/20 dark:border-cyan-500/20"
                      : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/[0.02] dark:hover:border-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-slate-200/80 dark:border-white/10 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                <span>{username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-xl hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </header>
  );
}
