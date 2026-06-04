"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const PreviewFallbackIcon = ({ kind }) => {
  if (kind === "audio") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16 text-cyan-500 dark:text-cyan-400" aria-hidden="true">
        <path d="M10 16.5a2.5 2.5 0 1 1-1.5-2.29V8.3l6-1.5v6.22A2.5 2.5 0 1 1 13 11V7.7l-4 1V16.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16 text-cyan-500 dark:text-cyan-400" aria-hidden="true">
      <path d="M7 4.5h6l4 4V19.5A1.5 1.5 0 0 1 15.5 21h-8A1.5 1.5 0 0 1 6 19.5v-15A1.5 1.5 0 0 1 7.5 3h-.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M13 4.5V9h4.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 14h6M9 11h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
};

const getFileType = (filename) => {
  if (!filename) return "other";
  const ext = filename.split('.').pop().toLowerCase();

  const images = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'];
  const videos = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
  const audio = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];
  const pdfs = ['pdf'];
  const text = ['txt', 'md', 'json', 'js', 'css', 'html', 'py', 'go', 'sh', 'xml'];

  if (images.includes(ext)) return 'image';
  if (videos.includes(ext)) return 'video';
  if (audio.includes(ext)) return 'audio';
  if (pdfs.includes(ext)) return 'pdf';
  if (text.includes(ext)) return 'text';

  return 'other';
};

export default function ViewPage({ params }) {
  const unwrappedParams = React.use ? React.use(params) : params;
  const { fileName } = unwrappedParams;

  const [metadata, setMetadata] = useState(null);
  const [textContent, setTextContent] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!fileName) return;

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setIsLoggedIn(data.loggedIn);
      })
      .catch(() => {});

    fetch(`/api/files/metadata/${fileName}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Metadata could not be found.");
        }
        return res.json();
      })
      .then((data) => {
        setMetadata(data);

        const fileType = getFileType(data.originalName || fileName);
        if (fileType === 'text') {
          return fetch(`/cdn/${fileName}`)
            .then((res) => res.text())
            .then((text) => setTextContent(text))
            .catch(() => setTextContent("Unable to load text contents."));
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fileName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0c0f17] px-4">
        <div className="text-center">
          <div className="w-11 h-11 border-2 border-cyan-500/15 border-t-cyan-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading asset preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0c0f17] px-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-xl shadow-black/[0.03] dark:shadow-black/20 text-center animate-fade-in-up">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <path d="M12 8v5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              <circle cx="12" cy="16.5" r="1" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Error</h2>
          <p className="text-slate-550 dark:text-slate-400 text-sm mb-6 font-semibold">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold rounded-2xl text-center transition-all shadow-md cursor-pointer"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const fileType = getFileType(metadata.originalName || fileName);
  const mediaUrl = `/cdn/${metadata.fileName}`;

  return (
    <div className="min-h-[85vh] flex flex-col p-4 md:p-6 animate-fade-in-up gap-6 max-w-4xl mx-auto w-full">
      {/* Header Nav Bar sub-element */}
      <header className="w-full bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 flex items-center gap-4 shadow-sm dark:shadow-none">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest block mb-0.5">Preview asset</span>
          <h1 className="text-sm md:text-base font-bold text-slate-800 dark:text-white truncate" title={metadata.originalName}>
            {metadata.originalName}
          </h1>
        </div>

        <div className="flex gap-2.5 shrink-0">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-center cursor-pointer"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href={`/download/${metadata.fileName}`}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-center cursor-pointer"
            >
              Back
            </Link>
          )}

          <a
            href={mediaUrl}
            className="px-4 py-2 text-xs font-bold text-cyan-600 dark:text-cyan-450 border border-cyan-500/20 dark:border-cyan-500/30 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/5 hover:bg-cyan-500/15 dark:hover:bg-cyan-500/10 transition-all text-center cursor-pointer"
          >
            Download
          </a>
        </div>
      </header>

      {/* Main Preview Container */}
      <main className="flex-1 w-full flex flex-col gap-6">
        {/* Preview Frame */}
        <section className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex items-center justify-center min-h-[420px] max-h-[75vh] overflow-hidden shadow-xl shadow-black/[0.02] dark:shadow-black/20">

          {fileType === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt={metadata.originalName}
              className="max-w-full max-h-[65vh] object-contain rounded-2xl shadow-lg dark:shadow-[0_15px_40px_rgba(0,0,0,0.6)]"
            />
          )}

          {fileType === "video" && (
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="max-w-full max-h-[65vh] rounded-2xl outline-none"
            />
          )}

          {fileType === "audio" && (
            <div className="w-full max-w-md px-6 py-12 text-center flex flex-col items-center gap-6">
              <PreviewFallbackIcon kind="audio" />
              <audio
                src={mediaUrl}
                controls
                autoPlay
                className="w-full"
              />
            </div>
          )}

          {fileType === "pdf" && (
            <iframe
              src={`${mediaUrl}#toolbar=0`}
              width="100%"
              height="600px"
              className="border-none rounded-2xl bg-white"
            />
          )}

          {fileType === "text" && (
            <pre className="w-full h-full min-h-[380px] max-h-[60vh] overflow-auto font-mono text-sm leading-relaxed text-cyan-600 dark:text-sky-400 bg-slate-50 dark:bg-slate-950/95 border border-slate-200 dark:border-white/10 rounded-2xl p-6 whitespace-pre-wrap break-all shadow-inner">
              <code>{textContent}</code>
            </pre>
          )}

          {fileType === "other" && (
            <div className="text-center px-4 py-10">
              <PreviewFallbackIcon kind="file" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2.5">
                Preview not available
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[360px] mx-auto mb-7 font-semibold">
                The file format ({metadata.originalName.split('.').pop() || "unknown"}) can&apos;t be previewed in the browser.
              </p>
              <a
                href={mediaUrl}
                className="inline-block px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold rounded-2xl transition-all shadow-md cursor-pointer"
              >
                Download File
              </a>
            </div>
          )}

        </section>

        {/* Specs Grid */}
        <section className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-7 grid grid-cols-2 lg:grid-cols-4 gap-6 shadow-sm dark:shadow-black/20">
          <div>
            <span className="block text-xs font-bold text-slate-400 dark:text-slate-600 mb-1.5 tracking-wider uppercase">Size</span>
            <span className="text-sm font-extrabold text-slate-850 dark:text-white">{metadata.fileSize}</span>
          </div>

          <div>
            <span className="block text-xs font-bold text-slate-400 dark:text-slate-600 mb-1.5 tracking-wider uppercase">Encryption</span>
            <span className={`text-sm font-extrabold ${metadata.encryption === "true" ? "text-purple-600 dark:text-purple-400" : "text-slate-500 dark:text-slate-400"}`}>
              {metadata.encryption === "true" ? "AES-256" : "None"}
            </span>
          </div>

          <div>
            <span className="block text-xs font-bold text-slate-400 dark:text-slate-600 mb-1.5 tracking-wider uppercase">File ID</span>
            <span className="text-sm font-mono text-cyan-600 dark:text-cyan-400 font-bold">
              {metadata.fileName.split('-').pop().split('.')[0]?.toUpperCase() || "UNKNOWN"}
            </span>
          </div>

          <div>
            <span className="block text-xs font-bold text-slate-400 dark:text-slate-600 mb-1.5 tracking-wider uppercase">Status</span>
            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-extrabold">
              ✓ Verified Active
            </span>
          </div>
        </section>

      </main>
    </div>
  );
}
