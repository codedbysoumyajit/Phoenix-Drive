"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Popups
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [qrModal, setQrModal] = useState({ show: false, url: "", qrImage: "", name: "" });

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
      }
    } catch (err) {
      showToast("Failed to fetch dashboard assets.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [router]);

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
      if (!f.fileSize) return;
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

  const calculateCryptIntegrity = (fileArray) => {
    if (fileArray.length === 0) return "100%";
    const encCount = fileArray.filter(f => f.encryption === "true").length;
    return `${Math.round((encCount / fileArray.length) * 100)}%`;
  };

  if (loading) {
    return (
      <div className="container-center" style={{ minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="loader-spinner" />
          <p style={{ marginTop: "16px", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>CONNECTING VAULT CORE...</p>
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
        
        {/* Dynamic Analytics Stats Matrix */}
        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "8px"
        }}>
          <div className="panel-card" style={{ padding: "20px 24px", flexDirection: "row", alignItems: "center", gap: "20px" }}>
            <div style={{ fontSize: "2.2rem", background: "var(--gradient-cyber)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: "800" }}>
              🗄
            </div>
            <div>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: "700", letterSpacing: "0.05em", display: "block" }}>SECURED ASSETS</span>
              <span style={{ fontSize: "1.6rem", fontWeight: "850" }}>{files.length} Files</span>
            </div>
          </div>

          <div className="panel-card" style={{ padding: "20px 24px", flexDirection: "row", alignItems: "center", gap: "20px" }}>
            <div style={{ fontSize: "2.2rem", background: "var(--gradient-cyber)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: "800" }}>
              💾
            </div>
            <div>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: "700", letterSpacing: "0.05em", display: "block" }}>STORAGE CAPACITY</span>
              <span style={{ fontSize: "1.6rem", fontWeight: "850" }}>{calculateTotalSize(files)}</span>
            </div>
          </div>

          <div className="panel-card" style={{ padding: "20px 24px", flexDirection: "row", alignItems: "center", gap: "20px" }}>
            <div style={{ fontSize: "2.2rem", background: "var(--gradient-cyber)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: "800" }}>
              🛡
            </div>
            <div>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: "700", letterSpacing: "0.05em", display: "block" }}>CRYPT INTEGRITY</span>
              <span style={{ fontSize: "1.6rem", fontWeight: "850", color: "var(--accent-cyan)" }}>{calculateCryptIntegrity(files)}</span>
            </div>
          </div>
        </section>

        {/* Dashboard Archive Card Grid */}
        <section className="panel-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
            <div>
              <h2 style={{ fontSize: "1.7rem", fontWeight: "700" }}>Vault Archive</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                Select files to share, preview, or remove from local node
              </p>
            </div>

            <button onClick={() => router.push("/upload")} className="btn-submit" style={{ width: "auto", padding: "10px 24px", fontSize: "0.85rem", margin: "0" }}>
              + Upload Portal
            </button>
          </div>

          {files.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "72px 24px",
              color: "var(--text-secondary)",
              border: "1px dashed var(--border-color)",
              borderRadius: "var(--radius-lg)"
            }}>
              <p style={{ fontSize: "1.1rem", marginBottom: "8px", fontWeight: "600" }}>Your Vault is empty.</p>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "20px" }}>Secure file encryption uploads await.</p>
              <button onClick={() => router.push("/upload")} className="btn-submit" style={{ width: "auto", padding: "12px 28px" }}>
                Open Upload Portal
              </button>
            </div>
          ) : (
            <div className="archive-grid">
              {files.map((file) => (
                <div key={file._id} className="archive-card">
                  <div>
                    {/* Header Title and Capsule */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "16px" }}>
                      <h3 style={{
                        fontSize: "1.05rem",
                        fontWeight: "700",
                        color: "var(--text-primary)",
                        lineHeight: "1.4",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        wordBreak: "break-all"
                      }} title={file.originalName}>
                        {file.originalName || file.filename}
                      </h3>
                      
                      {file.encryption === "true" ? (
                        <span className="badge-capsule badge-purple">AES</span>
                      ) : (
                        <span className="badge-capsule badge-cyan">RAW</span>
                      )}
                    </div>

                    {/* Metadata specs */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>SIZE</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: "650" }}>{file.fileSize}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>DATE</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: "650", textAlign: "right" }}>{file.uploadTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="card-actions">
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
                      onClick={() => router.push(`/view/${file.filename}`)} 
                      className="btn-action-cyan"
                    >
                      View & Preview
                    </button>

                    <button 
                      onClick={() => handleDeleteFile(file.filename)} 
                      className="btn-action-rose"
                    >
                      Purge Asset
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

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
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
    </div>
  );
}
