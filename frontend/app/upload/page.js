"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function UploadDashboard() {
  const [username, setUsername] = useState("");
  const [files, setFiles] = useState([]);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [encryptToggleAllowed, setEncryptToggleAllowed] = useState(true);
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modals & Popups
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [qrModal, setQrModal] = useState({ show: false, url: "", qrImage: "", name: "" });

  const fileInputRef = useRef(null);
  const router = useRouter();

  // Toast helper
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/files");
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setUsername(data.username);
        setFiles(data.files || []);
        setEncryptToggleAllowed(data.encryptionEnabled);
        setEncryptionEnabled(data.encryptionEnabled);
        setDomain(data.domain || window.location.origin);
      }
    } catch (err) {
      showToast("Failed to fetch dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
      }
    } catch (err) {
      showToast("Logout failed.", "error");
    }
  };

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
    setUploadProgress(10);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("file", file);
    });

    try {
      setUploadProgress(30);
      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(70);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "File upload failed.");
      }

      setUploadProgress(100);
      showToast(`Successfully uploaded ${selectedFiles.length} file(s)!`);
      setSelectedFiles([]);
      fetchDashboardData(); // Refresh list
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleDeleteFile = async (fileName) => {
    if (!confirm("Are you sure you want to permanently delete this file?")) return;

    try {
      const res = await fetch(`/api/files/delete/${fileName}`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete file.");
      }

      showToast("File deleted successfully.");
      setFiles((prev) => prev.filter((f) => f.filename !== fileName));
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleCopyLink = (fileName) => {
    const shareLink = `${window.location.origin}/download/${fileName}`;
    navigator.clipboard.writeText(shareLink);
    showToast("Share link copied to clipboard!");
  };

  const handleShowQR = async (file) => {
    // Generate QR code and open modal
    const qrDownloadLink = `${window.location.origin}/cdn/${file.filename}`;
    try {
      // In Express we generated qrCode.toDataURL(qrdownloadLink)
      // Since NextJS handles QR displays, we can ask backend to get it, or generate a Google Chart / backend source QR.
      // Wait, we can fetch from Express, or make an easy base64 QR or let backend serve it in getFileMetadata.
      // Let's call /api/files/metadata/:fileName to get the qrCode!
      const res = await fetch(`/api/files/metadata/${file.filename}`);
      const data = await res.json();
      
      // Let's use a gorgeous QR API (like qrserver) or just generate client-side!
      // To keep it 100% standalone, we can use 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(qrDownloadLink)
      // This is highly reliable, robust, fast, and does not require complex local canvas rendering!
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=06b6d4&bgcolor=0a0d16&data=${encodeURIComponent(qrDownloadLink)}`;
      
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

  if (loading) {
    return (
      <div className="container-center" style={{ minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="loader-spinner" />
          <p style={{ marginTop: "16px", color: "var(--text-secondary)" }}>Securing Connection...</p>
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Premium Navbar */}
      <header className="glass-panel" style={{
        margin: "16px",
        borderRadius: "var(--radius-md)",
        padding: "16px 28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            background: "var(--gradient-brand)",
            borderRadius: "50%",
            boxShadow: "var(--accent-glow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            fontSize: "0.9rem"
          }}>P</div>
          <h1 className="text-gradient" style={{ fontSize: "1.5rem", fontWeight: "800" }}>
            Phoenix XShare
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--accent-emerald)",
              boxShadow: "0 0 10px var(--accent-emerald)"
            }}></span>
            <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-secondary)" }}>
              {username}
            </span>
          </div>

          <button onClick={handleLogout} className="btn-secondary" style={{
            padding: "8px 16px",
            fontSize: "0.85rem",
            borderRadius: "var(--radius-sm)"
          }}>
            Log Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{
        flex: 1,
        padding: "0 16px 40px 16px",
        maxWidth: "1200px",
        width: "100%",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "24px"
      }}>
        
        {/* Upload Panel & Toggle */}
        <section className="glass-panel" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: "700" }}>Upload Files</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Drag and drop secure file sharing portal</p>
            </div>
            
            {/* Encryption Switch */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: "500" }}>
                Auto Encryption
              </span>
              <button 
                onClick={() => encryptToggleAllowed && setEncryptionEnabled(!encryptionEnabled)}
                disabled={!encryptToggleAllowed}
                style={{
                  width: "50px",
                  height: "26px",
                  borderRadius: "15px",
                  backgroundColor: encryptionEnabled ? "rgba(6, 182, 212, 0.2)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${encryptionEnabled ? "var(--accent-cyan)" : "var(--border-color)"}`,
                  position: "relative",
                  cursor: encryptToggleAllowed ? "pointer" : "not-allowed",
                  padding: "0",
                  transition: "background var(--transition-fast)"
                }}
              >
                <div style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: encryptionEnabled ? "var(--accent-cyan)" : "var(--text-muted)",
                  position: "absolute",
                  top: "3px",
                  left: encryptionEnabled ? "28px" : "4px",
                  transition: "left var(--transition-fast)",
                  boxShadow: encryptionEnabled ? "0 0 10px var(--accent-cyan)" : "none"
                }} />
              </button>
            </div>
          </div>

          {/* Upload Zone */}
          <div
            className={`upload-zone ${isDragging ? "dragging" : ""}`}
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
              style={{ display: "none" }}
            />
            
            <div style={{
              fontSize: "3rem",
              background: "var(--gradient-brand)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "12px",
              display: "inline-block"
            }}>
              ↑
            </div>
            
            <h3 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "6px" }}>
              Drag & Drop files here or <span style={{ color: "var(--accent-cyan)", textDecoration: "underline" }}>browse</span>
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Supports single or batch file secure upload structure
            </p>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                Selected Files ({selectedFiles.length})
              </h4>
              <div style={{
                maxHeight: "150px",
                overflowY: "auto",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "8px"
              }}>
                {selectedFiles.map((file, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderBottom: i === selectedFiles.length - 1 ? "none" : "1px solid var(--border-color)",
                    fontSize: "0.9rem"
                  }}>
                    <span style={{
                      maxWidth: "70%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {file.name}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeSelectedFile(i); }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--accent-rose)",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "1.1rem"
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload actions & progress bar */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                {uploading && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--accent-cyan)" }}>
                      <span>Encrypting and uploading files...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div style={{
                      width: "100%",
                      height: "6px",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderRadius: "3px",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        width: `${uploadProgress}%`,
                        height: "100%",
                        backgroundColor: "var(--accent-cyan)",
                        boxShadow: "0 0 10px var(--accent-cyan)",
                        transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                      }} />
                    </div>
                  </div>
                )}

                <button 
                  onClick={triggerUpload} 
                  className="btn-primary" 
                  disabled={uploading}
                  style={{ width: "100%" }}
                >
                  {uploading ? "Securing uploads..." : `Upload Securely (${selectedFiles.length} files)`}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Dashboard / Files Grid */}
        <section className="glass-panel" style={{ padding: "32px" }}>
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "1.6rem", fontWeight: "700" }}>Your Encrypted Dashboard</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Total uploaded assets: {files.length}
            </p>
          </div>

          {files.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "60px 24px",
              color: "var(--text-muted)",
              border: "1px dashed var(--border-color)",
              borderRadius: "var(--radius-lg)"
            }}>
              <p style={{ fontSize: "1.1rem", marginBottom: "8px", fontWeight: "500" }}>No secure uploads detected.</p>
              <p style={{ fontSize: "0.85rem" }}>Use the upload zone above to share files securely.</p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px"
            }}>
              {files.map((file) => (
                <div 
                  key={file._id} 
                  className="glass-panel glass-panel-hoverable" 
                  style={{
                    padding: "20px",
                    background: "rgba(255,255,255,0.01)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "200px"
                  }}
                >
                  <div>
                    {/* Header: Title and Type */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
                      <h3 style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        wordBreak: "break-all"
                      }} title={file.originalName}>
                        {file.originalName || file.filename}
                      </h3>
                      
                      {/* Encryption badge */}
                      {file.encryption === "true" && (
                        <span style={{
                          fontSize: "0.7rem",
                          fontWeight: "800",
                          backgroundColor: "rgba(168, 85, 247, 0.15)",
                          border: "1px solid rgba(168, 85, 247, 0.3)",
                          color: "var(--accent-purple)",
                          padding: "2px 6px",
                          borderRadius: "4px"
                        }}>ENC</span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Size:</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: "500" }}>{file.fileSize}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Uploaded:</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: "500", textAlign: "right" }}>{file.uploadTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    borderTop: "1px solid var(--border-color)",
                    paddingTop: "16px"
                  }}>
                    <button 
                      onClick={() => handleCopyLink(file.filename)} 
                      className="btn-secondary" 
                      style={{
                        padding: "8px",
                        fontSize: "0.8rem",
                        borderRadius: "var(--radius-sm)"
                      }}
                    >
                      Copy Link
                    </button>
                    
                    <button 
                      onClick={() => handleShowQR(file)} 
                      className="btn-secondary" 
                      style={{
                        padding: "8px",
                        fontSize: "0.8rem",
                        borderRadius: "var(--radius-sm)"
                      }}
                    >
                      QR Code
                    </button>

                    <button 
                      onClick={() => router.push(`/view/${file.filename}`)} 
                      className="btn-secondary" 
                      style={{
                        padding: "8px",
                        fontSize: "0.8rem",
                        borderRadius: "var(--radius-sm)",
                        gridColumn: "span 2",
                        border: "1px solid rgba(6,182,212,0.25)",
                        color: "var(--accent-cyan)",
                        background: "rgba(6,182,212,0.02)"
                      }}
                    >
                      View & Preview
                    </button>

                    <button 
                      onClick={() => handleDeleteFile(file.filename)} 
                      className="btn-secondary" 
                      style={{
                        padding: "8px",
                        fontSize: "0.8rem",
                        borderRadius: "var(--radius-sm)",
                        gridColumn: "span 2",
                        border: "1px solid rgba(244,63,94,0.2)",
                        color: "var(--accent-rose)",
                        background: "rgba(244,63,94,0.01)"
                      }}
                    >
                      Delete Asset
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Glassmorphic QR Share Modal */}
      {qrModal.show && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(5, 7, 12, 0.8)",
          backdropFilter: "blur(8px)",
          zIndex: 1100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px"
        }} onClick={() => setQrModal((prev) => ({ ...prev, show: false }))}>
          <div 
            className="glass-panel animate-fade-in" 
            style={{
              width: "100%",
              maxWidth: "380px",
              padding: "32px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "4px" }}>Share QR Code</h3>
              <p style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "280px"
              }} title={qrModal.name}>
                {qrModal.name}
              </p>
            </div>

            {/* QR Image Box */}
            <div style={{
              width: "250px",
              height: "250px",
              background: "var(--bg-deep)",
              border: "1px solid rgba(6, 182, 212, 0.2)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrModal.qrImage} alt="Share QR Code" style={{ width: "100%", height: "100%" }} />
            </div>

            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Scan this QR to download directly on mobile
            </p>

            <div style={{ display: "flex", gap: "8px", width: "100%" }}>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(qrModal.url);
                  showToast("Copied sharing URL!");
                }}
                className="btn-primary"
                style={{ flex: 1, padding: "10px", fontSize: "0.9rem" }}
              >
                Copy URL
              </button>
              
              <button 
                onClick={() => setQrModal((prev) => ({ ...prev, show: false }))}
                className="btn-secondary"
                style={{ padding: "10px 16px", fontSize: "0.9rem" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Success/Error Alert popup */}
      {toast.show && (
        <div className={`alert-popup ${toast.type === "success" ? "alert-success" : "alert-error"}`}>
          <span style={{ fontSize: "1.1rem" }}>
            {toast.type === "success" ? "✓" : "⚠"}
          </span>
          <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
