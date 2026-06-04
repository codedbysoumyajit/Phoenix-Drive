"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Shimmer loader skeleton cards for folder/file loading states
const FolderSkeleton = () => (
  <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 rounded-xl animate-pulse">
    <div className="flex items-center gap-3 w-3/4">
      <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
    </div>
    <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800" />
  </div>
);

const FileSkeleton = () => (
  <div className="bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
    <div className="aspect-[4/3] bg-slate-200/50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-center" />
    <div className="flex justify-between items-start gap-2">
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
      </div>
      <div className="w-4 h-6 bg-slate-200 dark:bg-slate-800" />
    </div>
    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
  </div>
);

const getFileKind = (filename = "") => {
  const extension = filename.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp", "ico"].includes(extension)) return "image";
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(extension)) return "video";
  if (["mp3", "wav", "ogg", "aac", "flac", "m4a"].includes(extension)) return "audio";
  if (extension === "pdf") return "pdf";
  return "file";
};

const FileKindIcon = ({ filename, className = "w-12 h-12" }) => {
  const kind = getFileKind(filename);

  if (kind === "image") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="3" fill="currentColor" opacity="0.14" />
        <path d="M7 15l2.5-2.5L12 15l2.5-3L17 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="9" r="1.2" fill="currentColor" />
        <path d="M6 7.5C6 6.12 7.12 5 8.5 5h7C16.88 5 18 6.12 18 7.5v9c0 1.38-1.12 2.5-2.5 2.5h-7C7.12 19 6 17.88 6 16.5v-9Z" stroke="currentColor" strokeWidth="1.6" opacity="0.9" />
      </svg>
    );
  }

  if (kind === "video") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="6" width="13" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M17 10l3-2v8l-3-2v-4Z" fill="currentColor" opacity="0.9" />
        <path d="M10 10.75v2.5c0 .4.45.64.78.43l2.02-1.25a.5.5 0 0 0 0-.86l-2.02-1.25a.5.5 0 0 0-.78.43Z" fill="currentColor" />
      </svg>
    );
  }

  if (kind === "audio") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M10 16.5a2.5 2.5 0 1 1-1.5-2.29V8.3l6-1.5v6.22A2.5 2.5 0 1 1 13 11V7.7l-4 1V16.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "pdf") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 3.75h7.5L19 8.25V20.25A1.75 1.75 0 0 1 17.25 22.0H7A1.75 1.75 0 0 1 5.25 20.25V5.5A1.75 1.75 0 0 1 7 3.75Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M14.5 3.75v4.5H19" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M8 15.5h8M8 12.5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 4.5h6l4 4V19.5A1.5 1.5 0 0 1 15.5 21h-8A1.5 1.5 0 0 1 6 19.5v-15A1.5 1.5 0 0 1 7.5 3h-.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M13 4.5V9h4.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 14h6M9 11h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef(null);
  
  // Current active folder state, default is "root"
  const [currentFolder, setCurrentFolder] = useState("root");
  const [files, setFiles] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([{ filename: "root", originalName: "Root" }]);
  const [username, setUsername] = useState("");
  const [storageSummary, setStorageSummary] = useState({
    totalBytes: 0,
    totalFilesCount: 0,
    storageFootprint: "0 KB",
    storageUsagePercent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  
  // View mode toggling (Google Drive style list/grid toggle)
  const [viewMode, setViewMode] = useState("grid");
  
  // Dynamic client-side search filtering
  const [searchQuery, setSearchQuery] = useState("");
  
  // Floating upload queue overlay states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Modals & Menu States
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [qrModal, setQrModal] = useState({ show: false, url: "", qrImage: "", name: "" });
  const [createModal, setCreateModal] = useState({ open: false, folderName: "" });
  const [moveModal, setMoveModal] = useState({ open: false, item: null, destination: "root" });
  const [activeMenuFileId, setActiveMenuFileId] = useState(null);
  const [newDropdownOpen, setNewDropdownOpen] = useState(false);
  const [mobileFabOpen, setMobileFabOpen] = useState(false);

  // Sync theme changes dynamically
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Close menus on click-away
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveMenuFileId(null);
      setNewDropdownOpen(false);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  // Read folder parameter from search query
  useEffect(() => {
    const folderParam = searchParams.get("folder") || "root";
    if (folderParam !== currentFolder) {
      setIsFetching(true);
      setCurrentFolder(folderParam);
    }
  }, [searchParams]);

  // Toast notifier
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
        setFiles(data.files || []);
        setBreadcrumbs(data.breadcrumbs || [{ filename: "root", originalName: "Root" }]);
        setStorageSummary(
          data.storageSummary || {
            totalBytes: 0,
            totalFilesCount: 0,
            storageFootprint: "0 KB",
            storageUsagePercent: 0,
          },
        );
      }
    } catch (err) {
      showToast("Failed to fetch folder contents.", "error");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentFolder, router]);

  // Navigate folder contents
  const navigateToFolder = (folderFilename) => {
    setIsFetching(true);
    setCurrentFolder(folderFilename);
    router.push(`/dashboard?folder=${folderFilename}`, { scroll: false });
  };

  // Create Virtual Directory
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!createModal.folderName.trim()) return;

    try {
      const res = await fetch("/api/files/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          folderName: createModal.folderName.trim(),
          parentFolder: currentFolder
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create folder.");
      }

      showToast(`Created folder "${createModal.folderName.trim()}" successfully.`);
      setCreateModal({ open: false, folderName: "" });
      fetchDashboardData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Purge file or folder
  const handleDeleteItem = async (filename, isFolder, originalName) => {
    const confirmMessage = isFolder 
      ? `Permanently delete folder "${originalName}" and ALL its contents?`
      : `Permanently delete file "${originalName}"?`;
      
    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/files/delete/${filename}`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete item.");
      }

      showToast("Item deleted successfully.");
      setFiles((prev) => prev.filter((f) => f.filename !== filename));
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Relocate asset to another folder
  const handleMoveItem = async (e) => {
    e.preventDefault();
    if (!moveModal.item) return;

    try {
      const res = await fetch(`/api/files/move/${moveModal.item.filename}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          destinationFolder: moveModal.destination
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to relocate item.");
      }

      showToast(`Moved "${moveModal.item.originalName}" successfully.`);
      setMoveModal({ open: false, item: null, destination: "root" });
      fetchDashboardData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Copy shareable download url
  const handleCopyLink = (filename) => {
    const shareLink = `${window.location.origin}/download/${filename}`;
    navigator.clipboard.writeText(shareLink);
    showToast("Download link copied to clipboard!");
  };

  // Open QR options modal
  const handleShowQR = async (file) => {
    const qrDownloadLink = `${window.location.origin}/cdn/${file.filename}`;
    try {
      const qrBg = theme === "dark" ? "0f172a" : "ffffff";
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=06b6d4&bgcolor=${qrBg}&data=${encodeURIComponent(qrDownloadLink)}`;
      
      setQrModal({
        show: true,
        url: `${window.location.origin}/download/${file.filename}`,
        qrImage: qrImageUrl,
        name: file.originalName || file.filename
      });
    } catch (err) {
      showToast("Failed to generate QR code.", "error");
    }
  };

  // Direct Upload flow (Google Drive native bottom widget)
  const handleDirectUpload = async (fileList) => {
    if (fileList.length === 0) return;
    setUploading(true);
    setUploadQueue(Array.from(fileList).map(f => f.name));

    const formData = new FormData();
    Array.from(fileList).forEach((file) => {
      formData.append("file", file);
    });
    formData.append("parentFolder", currentFolder);

    try {
      setUploadProgress(0);
      const data = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open("POST", "/api/files/upload");
        xhr.withCredentials = true;

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable || event.total <= 0) return;
          const percent = Math.min(99, Math.max(1, Math.round((event.loaded / event.total) * 100)));
          setUploadProgress(percent);
        };

        xhr.onload = () => {
          try {
            const responseData = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(responseData);
              return;
            }
            reject(new Error(responseData.error || "File upload failed."));
          } catch {
            reject(new Error("File upload failed."));
          }
        };

        xhr.onerror = () => reject(new Error("File upload failed due to a network error."));
        xhr.onabort = () => reject(new Error("File upload was cancelled."));

        xhr.send(formData);
      });

      setUploadProgress(100);
      showToast(`Successfully uploaded ${fileList.length} file(s)!`);
      fetchDashboardData();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setUploadQueue([]);
      }, 1200);
    }
  };

  // Total size calculations
  const calculateTotalSize = (fileArray) => {
    let totalMB = 0;
    fileArray.forEach(f => {
      if (f.isFolder || !f.fileSize) return;
      const val = parseFloat(f.fileSize);
      if (isNaN(val)) return;
      if (f.fileSize.includes("KB")) {
        totalMB += val / 1024;
      } else if (f.fileSize.includes("MB")) {
        totalMB += val;
      } else if (f.fileSize.includes("GB")) {
        totalMB += val * 1024;
      }
    });
    return totalMB < 0.1 ? `${(totalMB * 1024).toFixed(1)} KB` : `${totalMB.toFixed(1)} MB`;
  };

  const getMoveDestinations = () => {
    return files.filter(f => f.isFolder && (!moveModal.item || f.filename !== moveModal.item.filename));
  };

  // Separate files and folders list
  const folders = files.filter(f => f.isFolder);
  const filesOnly = files.filter(f => !f.isFolder);

  // Search filtering
  const filteredFolders = folders.filter(f => 
    f.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFiles = filesOnly.filter(f => 
    f.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalFilesCount = storageSummary.totalFilesCount || filesOnly.length;
  const storageFootprint = storageSummary.storageFootprint || calculateTotalSize(filesOnly);
  const storageUsagePercent = storageSummary.storageUsagePercent || 0;

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
          <p className="mt-4 text-slate-400 dark:text-slate-500 text-sm font-semibold tracking-wide">CONNECTING TO STORAGE MATRIX...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-[85vh] w-full max-w-none px-4 py-4 sm:px-6 lg:px-8 lg:py-6 flex flex-col items-start lg:flex-row gap-6 relative overflow-x-clip"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          setIsDragging(true);
        }
      }}
    >
      {/* Hidden file input for file uploading */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleDirectUpload(e.target.files);
          }
        }} 
        multiple 
        className="hidden" 
      />

      {/* DRAG AND DROP OVERLAY SCREEN */}
      {isDragging && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[3000] border-4 border-dashed border-cyan-500/40 m-6 rounded-3xl flex flex-col items-center justify-center transition-all duration-300"
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleDirectUpload(e.dataTransfer.files);
            }
          }}
        >
          <div className="text-center p-6 space-y-4 pointer-events-none">
            <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10 animate-bounce">
              <svg className="w-10 h-10 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white">Drop files to upload</h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Files will be uploaded directly into: <span className="text-cyan-400 font-bold">{currentFolder === "root" ? "Home" : breadcrumbs[breadcrumbs.length - 1]?.originalName || "Active Folder"}</span>
            </p>
          </div>
        </div>
      )}

      {/* LEFT COLUMN: GOOGLE DRIVE STYLE SIDEBAR (HIDDEN ON MOBILE) */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-6 self-start">
        {/* NEW BUTTON & DROPDOWN ACCORDION */}
        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setNewDropdownOpen(!newDropdownOpen);
            }}
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold px-6 py-4 rounded-2xl w-full transition-all duration-200 shadow-lg shadow-cyan-500/15 hover:shadow-cyan-500/25 active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="text-sm tracking-wide">New</span>
          </button>
          
          {newDropdownOpen && (
            <div 
              className="absolute left-0 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in-up"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => {
                  setCreateModal({ open: true, folderName: "" });
                  setNewDropdownOpen(false);
                }}
                className="w-full text-left px-5 py-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <svg className="w-5 h-5 text-cyan-500 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3h-6m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
                New folder
              </button>
              <button 
                onClick={() => {
                  fileInputRef.current?.click();
                  setNewDropdownOpen(false);
                }}
                className="w-full text-left px-5 py-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <svg className="w-5 h-5 text-purple-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Upload files
              </button>
            </div>
          )}
        </div>

        {/* SIDE BAR NAVIGATION LINKS */}
        <nav className="flex flex-col gap-1">
          <button
            onClick={() => navigateToFolder("root")}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left border cursor-pointer ${
              currentFolder === "root"
                ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 shadow-sm"
                : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.03]"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            My Drive
          </button>
          
          <button
            onClick={() => router.push("/console")}
            className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.03] border border-transparent cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Console Settings
          </button>
        </nav>

        {/* SIDE BAR STORAGE METER */}
        <div className="mt-auto bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4.5 space-y-3.5 shadow-sm dark:shadow-none animate-fade-in-up">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <svg className="w-4 h-4 text-cyan-500 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
            </svg>
            <span>Storage footprint</span>
          </div>
          
          <div className="space-y-1.5">
            <div className="w-full h-1.5 bg-slate-250 dark:bg-white/5 rounded-full overflow-hidden border border-slate-300/30 dark:border-white/5">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                style={{ width: `${storageUsagePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold">
              <span>{totalFilesCount} Items</span>
              <span className="text-slate-700 dark:text-slate-300">{storageFootprint}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT COLUMN: MAIN CONTENT ZONE */}
      <main className="flex-1 min-w-0 w-full flex flex-col gap-5 animate-fade-in-up self-start">
        {/* UPPER MOBILE STORAGE BAR CARD */}
        <section className="lg:hidden bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex w-full flex-col gap-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <svg className="w-4 h-4 text-cyan-500 dark:text-cyan-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
            </svg>
            <span>Storage Used: <span className="text-slate-800 dark:text-slate-200 font-extrabold">{storageFootprint}</span></span>
          </div>
          <span className="self-start sm:self-auto text-xs font-bold text-slate-450 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/5">{totalFilesCount} Items</span>
        </section>

        {/* ALIGNED TOOLBAR: BREADCRUMBS & COMPACT SEARCH BAR & VIEW MODE CONTROLLER */}
        <section className="flex flex-col gap-4 border-b border-slate-200 dark:border-white/5 pb-4 md:flex-row md:items-center md:justify-between">
          {/* Left: Location breadcrumbs path */}
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm font-semibold">
            <span className="text-slate-450 dark:text-slate-550 uppercase tracking-widest text-[10px] mr-1.5 pl-1 select-none">Location:</span>
            {breadcrumbs.map((crumb, idx) => (
              <div key={crumb.filename} className="flex items-center gap-1.5">
                {idx > 0 && <span className="text-slate-400 dark:text-slate-600 font-extrabold">›</span>}
                <button
                  onClick={() => navigateToFolder(crumb.filename)}
                  className={`transition-colors font-bold px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer ${
                    idx === breadcrumbs.length - 1
                      ? "text-cyan-600 dark:text-cyan-400 font-extrabold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {crumb.originalName}
                </button>
              </div>
            ))}
          </div>

          {/* Right: Search box, layout toggle & Share button */}
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
            {/* Centered Search Box */}
            <div className="relative min-w-0 w-full md:w-72 lg:w-96">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-9.5 pr-8 py-2 text-xs font-semibold bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Layout view toggle button */}
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="p-2.5 bg-white dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm shrink-0 cursor-pointer"
                title={viewMode === "grid" ? "Switch to List View" : "Switch to Grid View"}
              >
                {viewMode === "grid" ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                )}
              </button>

              {/* Folder sharing options button */}
              {currentFolder !== "root" && (
                <button
                  onClick={() => handleCopyLink(currentFolder)}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
                  title="Copy share link for folder"
                >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 13.5a3 3 0 0 1 0-4.243l2.12-2.121a3 3 0 0 1 4.243 4.243l-.87.87" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5a3 3 0 0 1 0 4.243l-2.12 2.121a3 3 0 1 1-4.243-4.243l.87-.87" />
                  </svg>
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* LOADING STATE PLACEHOLDER */}
        {isFetching ? (
          <div className="space-y-8 animate-pulse">
            <div>
              <div className="h-4 bg-slate-200 dark:bg-slate-900 rounded w-20 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 2 }).map((_, i) => <FolderSkeleton key={i} />)}
              </div>
            </div>
            <div>
              <div className="h-4 bg-slate-200 dark:bg-slate-900 rounded w-20 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => <FileSkeleton key={i} />)}
              </div>
            </div>
          </div>
        ) : files.length === 0 ? (
          /* EMPTY FOLDER STATE VIEW */
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl p-12 text-center bg-slate-100/30 dark:bg-slate-900/10 animate-fade-in-up">
            <div className="w-16 h-16 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center mb-5 text-slate-400 dark:text-slate-500 shadow-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18a2.25 2.25 0 012.25 2.25v4.25a2.25 2.25 0 01-2.25 2.25H2.25A2.25 2.25 0 010 18v-4.25A2.25 2.25 0 012.25 13.5zM3 10.5h18" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Folder is empty</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
              Drag & drop files onto this window, or create virtual directories to keep assets organized.
            </p>
            
            <div className="flex flex-wrap gap-3 justify-center">
              <button 
                onClick={() => setCreateModal({ open: true, folderName: "" })}
                className="px-5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-all active:scale-[0.98] shadow-sm cursor-pointer"
              >
                + New Folder
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                📤 Upload Files
              </button>
            </div>
          </div>
        ) : (
          /* ACTUAL FOLDERS & FILES GRID/LIST CONTAINER */
          <div className="space-y-8">
            {/* DIRECTORIES SECTION */}
            {filteredFolders.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 select-none">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 pl-1 shrink-0">Folders</h3>
                  <span className="h-[1px] flex-1 bg-slate-200 dark:bg-white/5 rounded-full" />
                </div>
                {/* Responsive grid column sizing prevents card stretching on wide screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {filteredFolders.map((file) => (
                    <div 
                      key={file._id}
                      className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/70 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 rounded-2xl transition-all cursor-pointer group shadow-sm"
                      onClick={() => navigateToFolder(file.filename)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <svg className="w-[22px] h-[22px] text-cyan-500 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M10 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" />
                        </svg>
                        <span className="font-semibold text-sm truncate text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" title={file.originalName}>
                          {file.originalName}
                        </span>
                      </div>
                      
                      <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-white transition-all cursor-pointer"
                          onClick={() => setActiveMenuFileId(activeMenuFileId === file.filename ? null : file.filename)}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </button>
                        {activeMenuFileId === file.filename && (
                          <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl py-1.5 z-30 animate-fade-in-up">
                            <button 
                              className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer"
                              onClick={() => { handleCopyLink(file.filename); setActiveMenuFileId(null); }}
                            >
                              Copy Link
                            </button>
                            <button 
                              className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer"
                              onClick={() => { setMoveModal({ open: true, item: file, destination: "root" }); setActiveMenuFileId(null); }}
                            >
                              Move
                            </button>
                            <hr className="border-slate-100 dark:border-white/5 my-1" />
                            <button 
                              className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-450 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all flex items-center gap-2 cursor-pointer"
                              onClick={() => { handleDeleteItem(file.filename, true, file.originalName); setActiveMenuFileId(null); }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FILES SECTION */}
            {filteredFiles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 select-none">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 pl-1 shrink-0">Files</h3>
                  <span className="h-[1px] flex-1 bg-slate-200 dark:bg-white/5 rounded-full" />
                </div>
                
                {viewMode === "grid" ? (
                  /* GRID VIEW CARDS (Staggered grid prevents horizontal column stretching) */
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    {filteredFiles.map((file) => (
                      <div 
                        key={file._id}
                        className="bg-white dark:bg-slate-900/30 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 border border-slate-200 dark:border-white/5 hover:border-cyan-500/30 dark:hover:border-cyan-500/20 rounded-2xl p-4.5 transition-all flex flex-col group relative shadow-sm"
                      >
                        {/* Card Visual Thumb Preview Area */}
                        <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-center relative overflow-hidden mb-3">
                          {getFileKind(file.originalName) === "image" ? (
                            <img 
                              src={`/cdn/${file.filename}`} 
                              alt={file.originalName}
                              className="w-full h-full object-cover group-hover:scale-102 transition-all duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
                              <div className="text-slate-400 dark:text-slate-500 group-hover:scale-105 transition-transform duration-300">
                                <FileKindIcon filename={file.originalName} className="w-12 h-12" />
                              </div>
                              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 bg-slate-200/50 dark:bg-white/5 px-2 py-0.5 rounded border border-slate-300/30 dark:border-white/5">
                                {getFileKind(file.originalName) === "file" ? (file.originalName.split('.').pop() || 'FILE') : getFileKind(file.originalName)}
                              </span>
                            </div>
                          )}
                          
                          {/* Encryption Mode Badge */}
                          <span className={`absolute top-2 left-2 text-[9px] font-extrabold tracking-widest px-2 py-0.5 rounded-full border ${
                            file.encryption === "true" 
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20" 
                              : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20"
                          }`}>
                            {file.encryption === "true" ? "AES" : "RAW"}
                          </span>
                        </div>

                        {/* Title text & context button */}
                        <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm truncate text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" title={file.originalName}>
                              {file.originalName}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                              <span>{file.fileSize}</span>
                              <span>•</span>
                              <span className="truncate">{file.uploadTime.split(" ")[1] || file.uploadTime}</span>
                            </div>
                          </div>
                          
                          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button 
                              className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-white transition-all cursor-pointer"
                              onClick={() => setActiveMenuFileId(activeMenuFileId === file.filename ? null : file.filename)}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                              </svg>
                            </button>
                            
                            {activeMenuFileId === file.filename && (
                              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl py-1.5 z-30 animate-fade-in-up">
                                <button 
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer"
                                  onClick={() => { handleCopyLink(file.filename); setActiveMenuFileId(null); }}
                                >
                                  Copy share URL
                                </button>
                                <button 
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer"
                                  onClick={() => { handleShowQR(file); setActiveMenuFileId(null); }}
                                >
                                  Show QR Code
                                </button>
                                <button 
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer"
                                  onClick={() => { setMoveModal({ open: true, item: file, destination: "root" }); setActiveMenuFileId(null); }}
                                >
                                  Move
                                </button>
                                <hr className="border-slate-100 dark:border-white/5 my-1" />
                                <button 
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-450 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-505/10 transition-all flex items-center gap-2 cursor-pointer"
                                  onClick={() => { handleDeleteItem(file.filename, false, file.originalName); setActiveMenuFileId(null); }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Direct action access */}
                        <button 
                          onClick={() => router.push(`/view/${file.filename}`)}
                          className="mt-auto w-full py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-cyan-500/10 dark:hover:bg-cyan-500/10 text-slate-600 dark:text-slate-300 hover:text-cyan-655 dark:hover:text-cyan-400 border border-slate-200 dark:border-white/5 hover:border-cyan-500/20 dark:hover:border-cyan-500/20 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Preview & Details
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* LIST VIEW TABLE (Responsive width columns hide layout on narrow mobile viewports) */
                  <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.01]">
                            <th className="px-5 py-4.5 text-xs font-bold uppercase tracking-wider text-slate-505 dark:text-slate-400">Name</th>
                            <th className="px-5 py-4.5 text-xs font-bold uppercase tracking-wider text-slate-505 dark:text-slate-400">Size</th>
                            <th className="px-5 py-4.5 text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 hidden sm:table-cell">Modified</th>
                            <th className="px-5 py-4.5 text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 hidden md:table-cell">Security</th>
                            <th className="px-5 py-4.5 text-xs font-bold text-right uppercase tracking-wider text-slate-550 dark:text-slate-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                          {filteredFiles.map((file) => (
                            <tr 
                              key={file._id}
                              className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                              onClick={() => router.push(`/view/${file.filename}`)}
                            >
                              <td className="px-5 py-4 min-w-[150px] max-w-[320px] truncate">
                                <div className="flex items-center gap-3">
                                  <span className="text-xl shrink-0">
                                    <FileKindIcon filename={file.originalName} className="w-5 h-5" />
                                  </span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white transition-colors truncate" title={file.originalName}>
                                    {file.originalName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">
                                {file.fileSize}
                              </td>
                              <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap hidden sm:table-cell">
                                {file.uploadTime.split(" ").slice(0, 2).join(" ")}
                              </td>
                              <td className="px-5 py-4 hidden md:table-cell">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                                  file.encryption === "true" 
                                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20" 
                                    : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-505/20"
                                }`}>
                                  {file.encryption === "true" ? "AES" : "RAW"}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <div className="relative inline-block text-left">
                                  {/* Dot Actions Button prevents mobile layout squeeze */}
                                  <button 
                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-white transition-all cursor-pointer"
                                    onClick={() => setActiveMenuFileId(activeMenuFileId === file.filename ? null : file.filename)}
                                  >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                    </svg>
                                  </button>
                                  {activeMenuFileId === file.filename && (
                                    <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl py-1.5 z-30 animate-fade-in-up text-left">
                                      <button 
                                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer"
                                        onClick={() => { handleCopyLink(file.filename); setActiveMenuFileId(null); }}
                                      >
                                        Copy Link
                                      </button>
                                      <button 
                                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer"
                                        onClick={() => { handleShowQR(file); setActiveMenuFileId(null); }}
                                      >
                                        QR Code
                                      </button>
                                      <button 
                                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer"
                                        onClick={() => { setMoveModal({ open: true, item: file, destination: "root" }); setActiveMenuFileId(null); }}
                                      >
                                        Move
                                      </button>
                                      <hr className="border-slate-100 dark:border-white/5 my-1" />
                                      <button 
                                        className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-455 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all flex items-center gap-2 cursor-pointer"
                                        onClick={() => { handleDeleteItem(file.filename, false, file.originalName); setActiveMenuFileId(null); }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MOBILE RESPONSIVE FLOATING ACTION BUTTON (FAB) */}
      <div className="fixed bottom-4 right-4 lg:hidden z-40">
        <button 
          onClick={() => setMobileFabOpen(!mobileFabOpen)}
          className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/20 active:scale-95 transition-all text-white border border-cyan-400/20 cursor-pointer"
        >
              <svg className={`w-6 h-6 transition-transform duration-200 ${mobileFabOpen ? "rotate-45" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        
        {mobileFabOpen && (
          <div className="absolute bottom-16 right-0 w-48 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in-up">
            <button 
              onClick={() => {
                setCreateModal({ open: true, folderName: "" });
                setMobileFabOpen(false);
              }}
              className="w-full text-left px-5 py-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <svg className="w-5 h-5 text-cyan-500 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3h-6m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
              New folder
            </button>
            <button 
              onClick={() => {
                fileInputRef.current?.click();
                setMobileFabOpen(false);
              }}
              className="w-full text-left px-5 py-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <svg className="w-5 h-5 text-purple-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Upload files
            </button>
            <button 
              onClick={() => {
                router.push("/console");
                setMobileFabOpen(false);
              }}
              className="w-full text-left px-5 py-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-t border-slate-100 dark:border-white/5 mt-1 cursor-pointer"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              </svg>
              Settings
            </button>
          </div>
        )}
      </div>

      {/* FLOATING REAL-TIME UPLOAD PANEL IN BOTTOM-RIGHT */}
      {uploading && (
        <div className="fixed bottom-4 left-4 right-4 max-w-[calc(100vw-2rem)] sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-none sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 z-[2000] animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-500 dark:text-cyan-400 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
              </svg>
              Uploading {uploadQueue.length} {uploadQueue.length === 1 ? "file" : "files"}
            </h4>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 dark:border-cyan-500/25">
              {uploadProgress}%
            </span>
          </div>
          
          <div className="w-full h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden mb-3 border border-slate-300/30 dark:border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 ease-out rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>

          <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {uploadQueue.map((name, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                <span className="truncate" title={name}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE FOLDER MODAL CONTAINER */}
      {createModal.open && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[2100] flex items-center justify-center p-4"
          onClick={() => setCreateModal({ open: false, folderName: "" })}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-5 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Create new folder</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                Add a virtual subfolder inside this active folder directory path.
              </p>
            </div>

            <form onSubmit={handleCreateFolder} className="flex flex-col gap-4">
              <input
                type="text"
                className="w-full px-4.5 py-3 text-sm font-semibold bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                placeholder="Folder name"
                value={createModal.folderName}
                onChange={(e) => setCreateModal((prev) => ({ ...prev, folderName: e.target.value }))}
                required
                autoFocus
              />

              <div className="flex gap-2">
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white text-xs font-bold rounded-2xl transition-all shadow-md cursor-pointer"
                >
                  Create
                </button>
                <button 
                  type="button" 
                  onClick={() => setCreateModal({ open: false, folderName: "" })}
                  className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-2xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RELOCATE / MOVE MODAL CONTAINER */}
      {moveModal.open && moveModal.item && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[2100] flex items-center justify-center p-4"
          onClick={() => setMoveModal({ open: false, item: null, destination: "root" })}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-5 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Move item</h3>
              <p className="text-slate-505 dark:text-slate-400 text-xs leading-relaxed truncate" title={moveModal.item.originalName}>
                Choose target folder for: <strong className="text-cyan-600 dark:text-cyan-400 font-bold">"{moveModal.item.originalName}"</strong>
              </p>
            </div>

            <form onSubmit={handleMoveItem} className="flex flex-col gap-4">
              <div className="relative">
                <select
                  className="w-full px-4.5 py-3 text-sm font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white appearance-none focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all pr-10 cursor-pointer"
                  value={moveModal.destination}
                  onChange={(e) => setMoveModal((prev) => ({ ...prev, destination: e.target.value }))}
                >
                  <option value="root">/ ROOT DIRECTORY</option>
                  {getMoveDestinations().map(f => (
                    <option key={f.filename} value={f.filename}>
                      📂 {f.originalName.toUpperCase()}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 dark:text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white text-xs font-bold rounded-2xl transition-all shadow-md cursor-pointer"
                >
                  Relocate
                </button>
                <button 
                  type="button" 
                  onClick={() => setMoveModal({ open: false, item: null, destination: "root" })}
                  className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-250 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-2xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE QR CODE OPTIONS MODAL */}
      {qrModal.show && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[2100] flex items-center justify-center p-4"
          onClick={() => setQrModal((prev) => ({ ...prev, show: false }))}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center gap-5 text-center animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">QR Code Share</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs truncate w-full px-4" title={qrModal.name}>
                {qrModal.name}
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-center shadow-inner">
              <img 
                src={qrModal.qrImage} 
                alt="Sharing QR Code representation" 
                className="w-56 h-56 object-contain rounded-lg"
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Scan this code with a mobile device camera to directly decrypt and access/download the shared asset.
            </p>

            <div className="flex gap-2 w-full">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(qrModal.url);
                  showToast("Share URL copied!");
                }}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white text-xs font-bold rounded-2xl transition-all shadow-md cursor-pointer"
              >
                Copy Link
              </button>
              <button 
                onClick={() => setQrModal((prev) => ({ ...prev, show: false }))}
                className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GENERAL FLOATING SCREEN NOTIFICATIONS TOAST */}
      {toast.show && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl shadow-2xl z-[3000] border backdrop-blur-md transition-all duration-300 animate-fade-in-up ${
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

// Default export wrapper containing suspense fallback logic to avoid static compilation bail out errors
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
          <p className="mt-4 text-slate-400 dark:text-slate-500 text-sm font-semibold tracking-wide">CONNECTING TO STORAGE MATRIX...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
