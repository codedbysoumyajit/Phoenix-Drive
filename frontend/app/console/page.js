"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SystemConsole() {
  const [username, setUsername] = useState("");
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [storageProvider, setStorageProvider] = useState("local");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const router = useRouter();

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    // 1. Fetch user session and storage data
    fetch("/api/files")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUsername(data.username);
          setEncryptionEnabled(data.encryptionEnabled);
          setDomain(data.domain || window.location.origin);
        }
      })
      .catch(() => {});

    // 2. Fetch config details
    fetch("/api/auth/config")
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="container-center" style={{ minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="loader-spinner" />
          <p style={{ marginTop: "16px", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>LOADING DIAGNOSTICS...</p>
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
      <main className="dashboard-container" style={{ maxWidth: "900px" }}>
        
        {/* Diagnostics Card */}
        <section className="panel-card" style={{ padding: "40px" }}>
          <div style={{ marginBottom: "8px" }}>
            <h2 style={{ fontSize: "1.85rem", fontWeight: "800" }}>System Console</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Active diagnostics and cryptography settings for the local node
            </p>
          </div>

          {/* Grid layout of status indicators */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginTop: "12px"
          }}>
            <div style={{
              background: "rgba(255,255,255,0.01)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: "700", letterSpacing: "0.05em" }}>DATABASE NODE</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="glow-online-dot"></span>
                <span style={{ fontSize: "1.1rem", fontWeight: "750" }}>MONGODB ONLINE</span>
              </div>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.01)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: "700", letterSpacing: "0.05em" }}>CRYPT INTERFACE</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="glow-online-dot" style={{ backgroundColor: "var(--accent-magenta)", boxShadow: "0 0 10px var(--accent-magenta)" }}></span>
                <span style={{ fontSize: "1.1rem", fontWeight: "750" }}>AES-256 ACTIVE</span>
              </div>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.01)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: "700", letterSpacing: "0.05em" }}>ACTIVE STORAGE</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="glow-online-dot" style={{ backgroundColor: "var(--accent-cyan)", boxShadow: "0 0 10px var(--accent-cyan)" }}></span>
                <span style={{ fontSize: "1.1rem", fontWeight: "750" }}>LOCAL DISK</span>
              </div>
            </div>
          </div>

          {/* Config Specs list */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            borderTop: "1px solid var(--border-color)",
            paddingTop: "28px",
            marginTop: "12px"
          }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "750", color: "var(--text-primary)" }}>Node Specifications</h3>
            
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              background: "rgba(0,0,0,0.15)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "20px",
              fontSize: "0.95rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "10px" }}>
                <span style={{ color: "var(--text-secondary)" }}>AUTHORIZED OPERATIVE</span>
                <span style={{ fontWeight: "700" }}>{username.toUpperCase()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "10px" }}>
                <span style={{ color: "var(--text-secondary)" }}>NODE DOMAIN GATEWAY</span>
                <span style={{ fontWeight: "700", color: "var(--accent-cyan)", fontFamily: "monospace" }}>{domain}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "10px" }}>
                <span style={{ color: "var(--text-secondary)" }}>CIPHER CONFIGURATION</span>
                <span style={{ fontWeight: "700" }}>{encryptionEnabled ? "AES-256-GCM LOCAL-DECRYPT" : "RAW RAW-STREAM"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "10px" }}>
                <span style={{ color: "var(--text-secondary)" }}>PWA REGISTER SCOPE</span>
                <span style={{ fontWeight: "700", color: "var(--accent-magenta)" }}>127.0.0.1:3000/</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>NODE STATUS</span>
                <span style={{ fontWeight: "700", color: "var(--accent-emerald)" }}>TRANSMITTING STABLE</span>
              </div>
            </div>
          </div>

          <button onClick={() => showToast("SYSTEM CONFIGURATIONS LOCK-ENGAGED", "success")} className="btn-submit" style={{ marginTop: "12px" }}>
            Re-Key Cryptography Nodes
          </button>
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
