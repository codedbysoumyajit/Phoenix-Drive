"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function UploadDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Read active folder query param
  const currentFolder = searchParams.get("folder") || "root";

  const [username, setUsername] = useState("");
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [encryptToggleAllowed, setEncryptToggleAllowed] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modals & Popups
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const fileInputRef = useRef(null);

  // Toast helper
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`/api/files?folder=${currentFolder}`, { credentials: "include" });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setUsername(data.username);
        setEncryptToggleAllowed(data.encryptionEnabled);
        setEncryptionEnabled(data.encryptionEnabled);
      }
    } catch (err) {
      showToast("Failed to fetch session details.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentFolder, router]);

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const triggerUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadProgress(15);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("file", file);
    });
    
    // Append the active parent directory folder path!
    formData.append("parentFolder", currentFolder);

    try {
      setUploadProgress(40);
      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      setUploadProgress(80);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "File upload failed.");
      }

      setUploadProgress(100);
      showToast(`Successfully uploaded ${selectedFiles.length} file(s)!`);
      setSelectedFiles([]);
      
      // Auto redirect back into the exact same folder on success!
      setTimeout(() => {
        router.push(`/dashboard?folder=${currentFolder}`);
      }, 1000);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0c0f17]">
        <div className="text-center">
          <div className="w-11 h-11 border-2 border-cyan-500/15 border-t-cyan-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading upload tools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col animate-fade-in-up">
      {/* Main Container */}
      <main className="max-w-3xl mx-auto w-full px-4 py-6 md:px-6">
        
        {/* Upload Panel Card */}
        <section className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-10 shadow-xl shadow-black/[0.03] dark:shadow-black/20">
          <Link 
            href={`/dashboard?folder=${currentFolder}`}
            className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm font-bold mb-6 transition-all duration-200 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            ← Back to My Files
          </Link>

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Upload Files</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-medium">
                Target Folder: <span className="text-cyan-600 dark:text-cyan-400 font-bold">{currentFolder === "root" ? "Home" : currentFolder.split('-')[1] || "Subfolder"}</span>
              </p>
            </div>
            
            {/* Encryption Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider pl-1">
                Encryption
              </span>
              <button 
                onClick={() => encryptToggleAllowed && setEncryptionEnabled(!encryptionEnabled)}
                disabled={!encryptToggleAllowed}
                className={`relative w-[52px] h-7 rounded-full border p-0 transition-all duration-200 ${
                  encryptionEnabled 
                    ? 'bg-cyan-500/15 border-cyan-500' 
                    : 'bg-slate-200 dark:bg-white/5 border-slate-350 dark:border-white/10'
                } ${encryptToggleAllowed ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              >
                <div className={`absolute top-[3px] w-5 h-5 rounded-full transition-all duration-300 ${
                  encryptionEnabled 
                    ? 'left-[27px] bg-cyan-500 shadow-[0_0_12px_theme(colors.cyan.500)]' 
                    : 'left-[3px] bg-slate-400 dark:bg-slate-600'
                }`} />
              </button>
            </div>
          </div>

          {/* Upload Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-200 py-16 px-6 ${
              isDragging 
                ? 'border-cyan-500 bg-cyan-500/5' 
                : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/[0.02]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
            />
            
            <div className="text-4xl mb-4 text-slate-400 dark:text-slate-500">
              <svg className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
              Drop files here or <span className="text-cyan-600 dark:text-cyan-400 underline">browse</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
              Files are securely encrypted on the server-side
            </p>
          </div>

          {/* Selected Files Queue */}
          {selectedFiles.length > 0 && (
            <div className="mt-6 animate-fade-in-up">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 pl-1">
                Selected Files ({selectedFiles.length})
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2 mb-4 scrollbar-thin">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl px-4 py-2.5 hover:border-slate-300 dark:hover:border-white/10 transition-all duration-200">
                    <span className="max-w-[70%] overflow-hidden text-ellipsis whitespace-nowrap font-bold text-slate-700 dark:text-white text-sm">
                      {file.name}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500 dark:text-slate-400 text-xs font-bold">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeSelectedFile(i); }}
                        className="bg-transparent border-none text-rose-500 hover:text-rose-600 cursor-pointer font-bold text-xl leading-none transition-all duration-200 p-1"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress and Upload button */}
              <div className="flex flex-col gap-3.5 border-t border-slate-250 dark:border-white/5 pt-4">
                {uploading && (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-cyan-600 dark:text-cyan-400 font-bold">
                      <span>Uploading files...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-white/10">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_15px_theme(colors.cyan.500)] transition-all duration-200 ease-out rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button 
                  onClick={triggerUpload} 
                  disabled={uploading}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold rounded-2xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide cursor-pointer"
                >
                  {uploading ? "Uploading..." : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}
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

// Default export wrapped in a Suspense boundary to prevent statically generated bail-out build crashes
export default function UploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0c0f17]">
        <div className="text-center">
          <div className="w-11 h-11 border-2 border-cyan-500/15 border-t-cyan-500 rounded-full animate-spin inline-block" />
          <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading upload tools...</p>
        </div>
      </div>
    }>
      <UploadDashboardContent />
    </Suspense>
  );
}
