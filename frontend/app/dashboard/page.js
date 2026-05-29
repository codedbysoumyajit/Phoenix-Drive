"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Shimmer loader component for seamless folder transitions
const FolderSkeleton = () => (
  <div className="archive-card skeleton-card">
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "75%" }}>
          <div className="skeleton-circle skeleton-shimmer" />
          <div className="skeleton-line short skeleton-shimmer" />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
        <div className="skeleton-line skeleton-shimmer" />
        <div className="skeleton-line skeleton-shimmer" />
      </div>
    </div>
    <div className="card-actions">
      <div className="skeleton-btn wide skeleton-shimmer" />
      <div className="skeleton-btn skeleton-shimmer" />
      <div className="skeleton-btn skeleton-shimmer" />
      <div className="skeleton-btn skeleton-shimmer" />
    </div>
  </div>
);

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Current active folder state, default is "root"
  const [currentFolder, setCurrentFolder] = useState("root");
  const [files, setFiles] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([{ filename: "root", originalName: "Root" }]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  
  // Modal & Popup States
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [qrModal, setQrModal] = useState({ show: false, url: "", qrImage: "", name: "" });
  
  // Folder Creation Modal State
  const [createModal, setCreateModal] = useState({ open: false, folderName: "" });
  
  // Move Item Modal State
  const [moveModal, setMoveModal] = useState({ open: false, item: null, destination: "root" });

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
      const res = await fetch(`/api/files?folder=${currentFolder}`);
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setUsername(data.username);
        setFiles(data.files || []);
        setBreadcrumbs(data.breadcrumbs || [{ filename: "root", originalName: "Root" }]);
      }
    } catch (err) {
      showToast("Failed to fetch node folder contents.", "error");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentFolder, router]);

  // Handle double clicking or clicking a folder
  const navigateToFolder = (folderFilename) => {
    setIsFetching(true);
    setCurrentFolder(folderFilename);
    router.push(`/dashboard?folder=${folderFilename}`, { scroll: false });
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!createModal.folderName.trim()) return;

    try {
      const res = await fetch("/api/files/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const handleDeleteItem = async (filename, isFolder, originalName) => {
    const confirmMessage = isFolder 
      ? `WARNING: This will permanently delete the folder "${originalName}" and ALL files recursively contained inside it! Are you sure?`
      : `Are you sure you want to permanently delete the file "${originalName}"?`;
      
    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/files/delete/${filename}`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete item.");
      }

      showToast("Item purged successfully.");
      setFiles((prev) => prev.filter((f) => f.filename !== filename));
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleMoveItem = async (e) => {
    e.preventDefault();
    if (!moveModal.item) return;

    try {
      const res = await fetch(`/api/files/move/${moveModal.item.filename}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationFolder: moveModal.destination
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to relocate item.");
      }

      showToast(`Successfully moved "${moveModal.item.originalName}"!`);
      setMoveModal({ open: false, item: null, destination: "root" });
      fetchDashboardData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleCopyLink = (filename) => {
    const shareLink = `${window.location.origin}/download/${filename}`;
    navigator.clipboard.writeText(shareLink);
    showToast("Share link copied to clipboard!");
  };

  const handleShowQR = async (file) => {
    const qrDownloadLink = `${window.location.origin}/cdn/${file.filename}`;
    try {
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=06b6d4&bgcolor=03060f&data=${encodeURIComponent(qrDownloadLink)}`;
      
      setQrModal({
        show: true,
        url: `${window.location.origin}/download/${file.filename}`,
        qrImage: qrImageUrl,
        name: file.originalName || file.filename
      });
    } catch (err) {
      showToast("Failed to generate sharing options.", "error");
    }
  };

  // Helper dynamic analytics
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

  // Get only all folders created by user (excluding current item) to offer as move options
  const getMoveDestinations = () => {
    return files.filter(f => f.isFolder && (!moveModal.item || f.filename !== moveModal.item.filename));
  };

  if (loading) {
    return (
      <div className="container-center" style={{ minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="loader-spinner" />
          <p style={{ marginTop: "16px", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>ESTABLISHING SYSTEM SHELL...</p>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          .loader-spinner {
            width: 44px;
            height: 44px;
            border: 2px solid rgba(6, 182, 212, 0.1);
            border-top-color: var(--accent-cyan);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column" }} className="animate-entrance">
      <main className="dashboard-container">
        
        {/* Dynamic Navigation Breadcrumbs */}
        <section className="panel-card" style={{ padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "0.95rem" }}>
            <span style={{ color: "var(--text-muted)", marginRight: "4px", fontWeight: "700" }}>LOCATION:</span>
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.filename} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {index > 0 && <span style={{ color: "var(--text-muted)" }}>›</span>}
                <button
                  onClick={() => navigateToFolder(crumb.filename)}
                  style={{
                    background: "none",
                    border: "none",
                    color: index === breadcrumbs.length - 1 ? "var(--accent-cyan)" : "var(--text-secondary)",
                    fontWeight: index === breadcrumbs.length - 1 ? "800" : "600",
                    cursor: "pointer",
                    outline: "none",
                    fontSize: "0.95rem"
                  }}
                >
                  {crumb.originalName.toUpperCase()}
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Dynamic Storage Footprint Matrix */}
        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "4px"
        }}>
          <div className="panel-card" style={{ padding: "20px 24px", flexDirection: "row", alignItems: "center", gap: "20px" }}>
            <div style={{ fontSize: "2rem", filter: "drop-shadow(0 0 10px rgba(6,182,212,0.3))" }}>🗂</div>
            <div>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: "700", letterSpacing: "0.05em", display: "block" }}>DIRECTORY ITEMS</span>
              <span style={{ fontSize: "1.5rem", fontWeight: "850" }}>{files.length} Items</span>
            </div>
          </div>

          <div className="panel-card" style={{ padding: "20px 24px", flexDirection: "row", alignItems: "center", gap: "20px" }}>
            <div style={{ fontSize: "2rem", filter: "drop-shadow(0 0 10px rgba(217,70,239,0.3))" }}>💾</div>
            <div>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: "700", letterSpacing: "0.05em", display: "block" }}>FOLDER CAPACITY</span>
              <span style={{ fontSize: "1.5rem", fontWeight: "850" }}>{calculateTotalSize(files)}</span>
            </div>
          </div>

          <div className="panel-card" style={{ padding: "20px 24px", flexDirection: "row", alignItems: "center", gap: "20px" }}>
            <div style={{ fontSize: "2rem", filter: "drop-shadow(0 0 10px rgba(16,185,129,0.3))" }}>🛡</div>
            <div>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: "700", letterSpacing: "0.05em", display: "block" }}>CIPHER NODES</span>
              <span style={{ fontSize: "1.5rem", fontWeight: "850", color: "var(--accent-cyan)" }}>
                {files.filter(f => !f.isFolder && f.encryption === "true").length} Secure
              </span>
            </div>
          </div>
        </section>

        {/* File Vault Panel */}
        <section className="panel-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
            <div>
              <h2 style={{ fontSize: "1.7rem", fontWeight: "800" }}>
                {breadcrumbs[breadcrumbs.length - 1]?.originalName || "Vault Archive"}
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                Perform secure directory tasks, link routing, or folder sharing
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }} className="mobile-actions-wrapper">
              <button 
                onClick={() => setCreateModal({ open: true, folderName: "" })} 
                className="btn-action-secondary" 
                style={{ padding: "10px 20px", fontSize: "0.85rem" }}
              >
                + New Folder
              </button>
              
              <button 
                onClick={() => router.push(`/upload?folder=${currentFolder}`)} 
                className="btn-submit" 
                style={{ width: "auto", padding: "10px 24px", fontSize: "0.85rem", margin: "0" }}
              >
                + Upload Files
              </button>
              
              {currentFolder !== "root" && (
                <button
                  onClick={() => handleCopyLink(currentFolder)}
                  className="btn-action-cyan"
                  style={{ gridColumn: "auto", width: "auto", padding: "10px 20px", fontSize: "0.85rem" }}
                  title="Copy shareable download link for the active folder"
                >
                  🔗 Copy Folder Link
                </button>
              )}
            </div>
          </div>

          {isFetching ? (
            <div className="archive-grid">
              {Array.from({ length: 4 }).map((_, idx) => (
                <FolderSkeleton key={idx} />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "72px 24px",
              color: "var(--text-secondary)",
              border: "1px dashed var(--border-color)",
              borderRadius: "var(--radius-lg)"
            }}>
              <p style={{ fontSize: "1.1rem", marginBottom: "8px", fontWeight: "600" }}>Directory is empty.</p>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "20px" }}>Ready to receive secure uploads or folders.</p>
              <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                <button onClick={() => setCreateModal({ open: true, folderName: "" })} className="btn-action-secondary" style={{ padding: "12px 24px" }}>
                  Create Folder
                </button>
                <button onClick={() => router.push(`/upload?folder=${currentFolder}`)} className="btn-submit" style={{ width: "auto", padding: "12px 28px" }}>
                  Upload Files
                </button>
              </div>
            </div>
          ) : (
            <div className="archive-grid">
              {files.map((file) => (
                <div 
                  key={file._id} 
                  className="archive-card" 
                  style={{ 
                    cursor: file.isFolder ? "pointer" : "default",
                    borderColor: file.isFolder ? "rgba(6, 182, 212, 0.15)" : "rgba(255, 255, 255, 0.05)"
                  }}
                  onClick={() => file.isFolder && navigateToFolder(file.filename)}
                >
                  <div>
                    {/* Header Title & Badges */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", maxWidth: "75%" }}>
                        {file.isFolder ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ shrink: 0, filter: "drop-shadow(0 0 5px rgba(6,182,212,0.4))" }}>
                            <path d="M20 6H12L10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6Z" fill="#06b6d4" fillOpacity="0.15" stroke="#06b6d4" strokeWidth="2" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <span style={{ fontSize: "1.4rem" }}>
                            {file.originalName.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) ? "🖼" : 
                             file.originalName.match(/\.(mp4|webm|mov|avi)$/i) ? "🎬" :
                             file.originalName.match(/\.(mp3|wav|ogg|aac)$/i) ? "🎵" :
                             file.originalName.match(/\.pdf$/i) ? "📕" : "📄"}
                          </span>
                        )}
                        
                        <h3 style={{
                          fontSize: "1.02rem",
                          fontWeight: "750",
                          color: file.isFolder ? "var(--accent-cyan)" : "var(--text-primary)",
                          lineHeight: "1.4",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          wordBreak: "break-all"
                        }} title={file.originalName}>
                          {file.originalName}
                        </h3>
                      </div>
                      
                      {!file.isFolder && (
                        file.encryption === "true" ? (
                          <span className="badge-capsule badge-purple">AES</span>
                        ) : (
                          <span className="badge-capsule badge-cyan">RAW</span>
                        )
                      )}
                      {file.isFolder && (
                        <span className="badge-capsule badge-cyan" style={{ borderColor: "rgba(6,182,212,0.45)" }}>DIR</span>
                      )}
                    </div>

                    {/* Metadata details */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>SIZE</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: "650" }}>
                          {file.isFolder ? "Directory" : file.fileSize}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>DATE</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: "650", textAlign: "right" }}>{file.uploadTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                    {file.isFolder ? (
                      <>
                        <button 
                          onClick={() => navigateToFolder(file.filename)} 
                          className="btn-action-cyan"
                          style={{ gridColumn: "span 2" }}
                        >
                          Enter Folder
                        </button>
                        
                        <button 
                          onClick={() => handleCopyLink(file.filename)} 
                          className="btn-action-secondary"
                        >
                          Copy Link
                        </button>
                        
                        <button 
                          onClick={() => setMoveModal({ open: true, item: file, destination: "root" })}
                          className="btn-action-secondary"
                        >
                          Relocate
                        </button>

                        <button 
                          onClick={() => handleDeleteItem(file.filename, true, file.originalName)} 
                          className="btn-action-rose"
                        >
                          Purge Folder
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => router.push(`/view/${file.filename}`)} 
                          className="btn-action-cyan"
                          style={{ gridColumn: "span 2" }}
                        >
                          View & Preview
                        </button>

                        <button 
                          onClick={() => handleCopyLink(file.filename)} 
                          className="btn-action-secondary"
                        >
                          Copy Link
                        </button>
                        
                        <button 
                          onClick={() => handleShowQR(file)} 
                          className="btn-action-secondary"
                        >
                          QR Share
                        </button>
                        
                        <button 
                          onClick={() => setMoveModal({ open: true, item: file, destination: "root" })}
                          className="btn-action-secondary"
                        >
                          Relocate File
                        </button>

                        <button 
                          onClick={() => handleDeleteItem(file.filename, false, file.originalName)} 
                          className="btn-action-rose"
                          style={{ gridColumn: "auto" }}
                        >
                          Purge Asset
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* CREATE FOLDER MODAL */}
      {createModal.open && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(3, 6, 15, 0.85)",
          backdropFilter: "blur(12px)",
          zIndex: 2100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px"
        }} onClick={() => setCreateModal({ open: false, folderName: "" })}>
          <div 
            className="panel-card animate-entrance" 
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "36px",
              gap: "24px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: "800", marginBottom: "4px" }}>CREATE DIRECTORY</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Add a new virtual folder inside the active directory
              </p>
            </div>

            <form onSubmit={handleCreateFolder} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="form-group">
                <label htmlFor="fName" className="form-label">FOLDER NAME</label>
                <input
                  id="fName"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Invoices"
                  value={createModal.folderName}
                  onChange={(e) => setCreateModal((prev) => ({ ...prev, folderName: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" className="btn-submit" style={{ flex: 1, margin: "0" }}>
                  Create Folder
                </button>
                <button 
                  type="button" 
                  onClick={() => setCreateModal({ open: false, folderName: "" })}
                  className="btn-action-secondary"
                  style={{ padding: "12px 18px" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVE ITEM MODAL */}
      {moveModal.open && moveModal.item && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(3, 6, 15, 0.85)",
          backdropFilter: "blur(12px)",
          zIndex: 2100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px"
        }} onClick={() => setMoveModal({ open: false, item: null, destination: "root" })}>
          <div 
            className="panel-card animate-entrance" 
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "36px",
              gap: "24px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: "800", marginBottom: "4px" }}>RELOCATE ASSET</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", wordBreak: "break-all" }}>
                Choose the destination directory for "{moveModal.item.originalName}"
              </p>
            </div>

            <form onSubmit={handleMoveItem} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="form-group">
                <label htmlFor="destFolder" className="form-label">DESTINATION DIRECTORY</label>
                <select
                  id="destFolder"
                  className="form-input"
                  style={{
                    appearance: "none",
                    background: "var(--bg-input) url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\") no-repeat right 16px center",
                    backgroundSize: "16px"
                  }}
                  value={moveModal.destination}
                  onChange={(e) => setMoveModal((prev) => ({ ...prev, destination: e.target.value }))}
                >
                  <option value="root">ROOT DIRECTORY</option>
                  {getMoveDestinations().map(f => (
                    <option key={f.filename} value={f.filename}>
                      {f.originalName.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" className="btn-submit" style={{ flex: 1, margin: "0" }}>
                  Relocate
                </button>
                <button 
                  type="button" 
                  onClick={() => setMoveModal({ open: false, item: null, destination: "root" })}
                  className="btn-action-secondary"
                  style={{ padding: "12px 18px" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share QR Modal */}
      {qrModal.show && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(3, 6, 15, 0.85)",
          backdropFilter: "blur(12px)",
          zIndex: 2100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px"
        }} onClick={() => setQrModal((prev) => ({ ...prev, show: false }))}>
          <div 
            className="panel-card animate-entrance" 
            style={{
              width: "100%",
              maxWidth: "380px",
              padding: "36px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 style={{ fontSize: "1.4rem", fontWeight: "700", marginBottom: "6px" }}>QR TRANSMISSION</h3>
              <p style={{
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "280px"
              }} title={qrModal.name}>
                {qrModal.name}
              </p>
            </div>

            <div style={{
              width: "250px",
              height: "250px",
              background: "var(--bg-deep)",
              border: "1px solid rgba(6, 182, 212, 0.25)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              padding: "10px"
            }}>
              <img src={qrModal.qrImage} alt="Share QR Code" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Scan to decrypt asset directly onto mobile
            </p>

            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(qrModal.url);
                  showToast("Copied sharing URL!");
                }}
                className="btn-submit"
                style={{ flex: 1, padding: "12px", fontSize: "0.85rem", margin: "0" }}
              >
                Copy Link
              </button>
              
              <button 
                onClick={() => setQrModal((prev) => ({ ...prev, show: false }))}
                className="btn-action-secondary"
                style={{ padding: "12px 18px", fontSize: "0.85rem" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Success/Error Alert toast */}
      {toast.show && (
        <div className={`toast-premium ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
          <span style={{ fontSize: "0.95rem", fontWeight: "650", letterSpacing: "0.03em" }}>
            {toast.message.toUpperCase()}
          </span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 640px) {
          .mobile-actions-wrapper {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          
          .mobile-actions-wrapper .btn-action-secondary,
          .mobile-actions-wrapper .btn-submit,
          .mobile-actions-wrapper .btn-action-cyan {
            width: 100% !important;
            padding: 12px !important;
          }
        }

        /* Skeleton Shimmer Loading */
        .skeleton-card {
          pointer-events: none;
          border-color: rgba(255, 255, 255, 0.03) !important;
        }

        .skeleton-shimmer {
          position: relative;
          overflow: hidden;
          background-color: rgba(255, 255, 255, 0.015) !important;
          border-radius: 4px;
        }

        .skeleton-shimmer::after {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          transform: translateX(-100%);
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(6, 182, 212, 0.04) 20%,
            rgba(6, 182, 212, 0.08) 60%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer 1.6s infinite;
        }

        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }

        .skeleton-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }

        .skeleton-line {
          height: 12px;
          border-radius: 4px;
          width: 100%;
        }

        .skeleton-line.short {
          width: 60%;
        }

        .skeleton-btn {
          height: 38px;
          border-radius: var(--radius-md);
          width: 100%;
        }

        .skeleton-btn.wide {
          grid-column: span 2;
        }
      `}} />
    </div>
  );
}

// Default export wrapped in a Suspense boundary to prevent statically generated bail-out build crashes
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="container-center" style={{ minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "44px",
            height: "44px",
            border: "2px solid rgba(6, 182, 212, 0.1)",
            borderTopColor: "var(--accent-cyan)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            display: "inline-block"
          }} />
          <p style={{ marginTop: "16px", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>ESTABLISHING SYSTEM SHELL...</p>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
