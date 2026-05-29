"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function UploadDashboard() {
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
        setEncryptToggleAllowed(data.encryptionEnabled);
        setEncryptionEnabled(data.encryptionEnabled);
      }
    } catch (err) {
      showToast("Failed to fetch node session details.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [router]);

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
      
      // Auto redirect to vault dashboard on successful upload so the user can immediately view/manage their files!
      setTimeout(() => {
        router.push("/dashboard");
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
      <div className="container-center" style={{ minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="loader-spinner" />
          <p style={{ marginTop: "16px", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>CONNECTING TRANSMISSION MATRIX...</p>
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
      {/* Main Structural Container */}
      <main className="dashboard-container" style={{ maxWidth: "800px" }}>
        
        {/* Upload Panel Card */}
        <section className="panel-card" style={{ padding: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.85rem", fontWeight: "800" }}>Transmit Assets</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Secure, encrypted file upload portal</p>
            </div>
            
            {/* Encryption Switch */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "700", letterSpacing: "0.05em" }}>
                AUTO ENCRYPTION
              </span>
              <button 
                onClick={() => encryptToggleAllowed && setEncryptionEnabled(!encryptionEnabled)}
                disabled={!encryptToggleAllowed}
                style={{
                  width: "52px",
                  height: "28px",
                  borderRadius: "15px",
                  backgroundColor: encryptionEnabled ? "rgba(6, 182, 212, 0.15)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${encryptionEnabled ? "var(--accent-cyan)" : "var(--border-color)"}`,
                  position: "relative",
                  cursor: encryptToggleAllowed ? "pointer" : "not-allowed",
                  padding: "0",
                  transition: "var(--transition-fast)"
                }}
              >
                <div style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: encryptionEnabled ? "var(--accent-cyan)" : "var(--text-muted)",
                  position: "absolute",
                  top: "3px",
                  left: encryptionEnabled ? "27px" : "3px",
                  transition: "left var(--transition-smooth)",
                  boxShadow: encryptionEnabled ? "0 0 12px var(--accent-cyan)" : "none"
                }} />
              </button>
            </div>
          </div>

          {/* Upload Drop Zone */}
          <div
            className={`upload-dropzone ${isDragging ? "dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: "64px 24px" }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              style={{ display: "none" }}
            />
            
            <div className="upload-arrow" style={{ fontSize: "3.5rem", marginBottom: "16px" }}>⇪</div>
            
            <h3 style={{ fontSize: "1.35rem", fontWeight: "800", marginBottom: "4px" }}>
              Drag & Drop files here or <span style={{ color: "var(--accent-cyan)", textDecoration: "underline" }}>browse</span>
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", fontWeight: "400" }}>
              Local client-side cryptography locks files before upload
            </p>
          </div>

          {/* Selected Files Queue list */}
          {selectedFiles.length > 0 && (
            <div className="queue-container" style={{ marginTop: "12px" }}>
              <h4 style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
                TRANSMISSION QUEUE ({selectedFiles.length})
              </h4>
              <div className="queue-scroll">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="queue-row">
                    <span style={{
                      maxWidth: "70%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: "500"
                    }}>
                      {file.name}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
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
                          fontSize: "1.3rem",
                          lineHeight: "1"
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress and Confirm button */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {uploading && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--accent-cyan)", fontWeight: "700" }}>
                      <span>PREPARING DATA TRANSMISSION FLOW...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div style={{
                      width: "100%",
                      height: "8px",
                      backgroundColor: "rgba(255,255,255,0.02)",
                      borderRadius: "4px",
                      overflow: "hidden",
                      border: "1px solid var(--border-color)"
                    }}>
                      <div style={{
                        width: `${uploadProgress}%`,
                        height: "100%",
                        backgroundColor: "var(--accent-cyan)",
                        boxShadow: "0 0 15px var(--accent-cyan)",
                        transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                      }} />
                    </div>
                  </div>
                )}

                <button 
                  onClick={triggerUpload} 
                  className="btn-submit" 
                  disabled={uploading}
                >
                  {uploading ? "TRANSMITTING..." : `CONFIRM SECURE TRANSMISSION (${selectedFiles.length} FILES)`}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Floating Success/Error Alert toast */}
      {toast.show && (
        <div className={`toast-premium ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
          <span style={{ fontSize: "0.95rem", fontWeight: "650", letterSpacing: "0.03em" }}>
            {toast.message.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
