"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const getDownloadIcon = (isFolder) => (
  isFolder ? (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" aria-hidden="true">
      <path d="M4.5 7.5A2.5 2.5 0 0 1 7 5h3l2 2h5A2.5 2.5 0 0 1 19.5 9.5v7A2.5 2.5 0 0 1 17 19h-10A2.5 2.5 0 0 1 4.5 16.5v-9Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 10v5m0 0 2.5-2.5M12 15l-2.5-2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" aria-hidden="true">
      <path d="M12 4v10m0 0 3.5-3.5M12 14l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 17.5A2.5 2.5 0 0 0 7.5 20h9A2.5 2.5 0 0 0 19 17.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
);

export default function DownloadPage({ params }) {
  const unwrappedParams = React.use ? React.use(params) : params;
  const { fileName } = unwrappedParams;

  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    if (!fileName) return;

    fetch(`/api/files/metadata/${fileName}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("File not found or metadata missing.");
        }
        return res.json();
      })
      .then((data) => {
        setMetadata(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fileName]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0c0f17] px-4">
        <div className="text-center">
          <div className="w-11 h-11 border-2 border-cyan-500/15 border-t-cyan-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading download metadata...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0c0f17] px-4 relative">
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

        <div className="w-full max-w-md bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-xl shadow-black/[0.03] dark:shadow-black/20 text-center animate-fade-in-up">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <path d="M12 8v5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              <circle cx="12" cy="16.5" r="1" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">File Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-7 font-semibold">{error}</p>
          <Link
            href="/login"
            className="inline-block w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold rounded-2xl text-center transition-all shadow-md cursor-pointer"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0c0f17] px-4 py-12 relative">
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

      <div className="w-full max-w-md bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-xl shadow-black/[0.03] dark:shadow-black/20 space-y-6 animate-fade-in-up">

        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 dark:to-purple-500 rounded-xl flex items-center justify-center font-extrabold text-sm text-white shadow-md">
            P
          </div>
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-purple-400 bg-clip-text text-transparent">
            Phoenix Drive
          </h1>
        </div>

        {/* Icon + Title */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 inline-flex items-center justify-center text-cyan-500 dark:text-cyan-400 mb-5 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            {getDownloadIcon(metadata.isFolder)}
          </div>

          <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-snug break-all px-1">
            {metadata.originalName}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-semibold">
            {metadata.isFolder ? "Folder download" : "Ready to download"}
          </p>
        </div>

        {/* File Details Box */}
        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-4.5 space-y-3.5 text-sm shadow-inner dark:shadow-none">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">{metadata.isFolder ? "Type" : "Size"}</span>
            <span className="text-slate-800 dark:text-white font-bold">{metadata.isFolder ? "Directory Archive" : metadata.fileSize}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Date</span>
            <span className="text-slate-800 dark:text-white font-bold">{metadata.uploadTime.split(" ").slice(0,2).join(" ")}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Uploaded by</span>
            <span className="text-slate-800 dark:text-white font-bold">{metadata.uploader.toUpperCase()}</span>
          </div>

          {metadata.isFolder ? (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Packaging</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                Auto ZIP
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Security</span>
              {metadata.encryption === "true" ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
                  AES Encrypted
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5">
                  Standard
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <a
            href={metadata.isFolder ? `/api/files/zip/${metadata.fileName}` : `/cdn/${metadata.fileName}`}
            className="block w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold rounded-2xl text-center transition-all shadow-md cursor-pointer text-sm tracking-wide"
          >
            {metadata.isFolder ? "Download as ZIP" : "Download File"}
          </a>

          {!metadata.isFolder && (
            <Link
              href={`/view/${metadata.fileName}`}
              className="block w-full py-3.5 border border-slate-200 dark:border-cyan-500/30 text-slate-600 dark:text-cyan-400 hover:bg-slate-50 dark:hover:bg-cyan-500/10 font-bold rounded-2xl text-center transition-all cursor-pointer text-sm"
            >
              Preview File
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
