"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DownloadPage({ params }) {
  // Use React.use() helper if available (Next.js 15 compatibility) to unwrap route parameters safely
  const unwrappedParams = React.use ? React.use(params) : params;
  const { fileName } = unwrappedParams;

  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!fileName) return;

    fetch(`/api/files/metadata/${fileName}`)
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

  if (loading) {
    return (
      <div className="container-center" style={{ minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="loader-spinner" />
          <p style={{ marginTop: "16px", color: "var(--text-secondary)" }}>Fetching file credentials...</p>
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

  if (error) {
    return (
      <div className="container-center" style={{ minHeight: "100vh" }}>
        <div className="glass-panel" style={{ width: "100%", maxWidth: "440px", padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", color: "var(--accent-rose)", marginBottom: "16px" }}>⚠</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "8px" }}>Secure Gateway Error</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "24px" }}>{error}</p>
          <Link href="/login" className="btn-primary" style={{ display: "inline-flex", textDecoration: "none" }}>
            Return to Gateway
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-center animate-fade-in" style={{ minHeight: "100vh" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "480px", padding: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center", marginBottom: "32px" }}>
          <div style={{
            width: "28px",
            height: "28px",
            background: "var(--gradient-brand)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            fontSize: "0.8rem"
          }}>P</div>
          <h1 className="text-gradient" style={{ fontSize: "1.4rem", fontWeight: "800" }}>Phoenix XShare</h1>
        </div>

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "rgba(6, 182, 212, 0.1)",
            border: "1px solid rgba(6, 182, 212, 0.2)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.8rem",
            color: "var(--accent-cyan)",
            marginBottom: "16px",
            boxShadow: "var(--accent-glow)"
          }}>
            ⇩
          </div>
          
          <h2 style={{
            fontSize: "1.2rem",
            fontWeight: "700",
            color: "var(--text-primary)",
            lineHeight: "1.4",
            wordBreak: "break-all",
            padding: "0 8px"
          }}>
            {metadata.originalName}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
            Ready for secure transmission
          </p>
        </div>

        {/* File specs card */}
        <div style={{
          background: "rgba(255,255,255,0.01)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          fontSize: "0.9rem",
          marginBottom: "28px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>File Size</span>
            <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{metadata.fileSize}</span>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Upload Time</span>
            <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{metadata.uploadTime}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Uploader</span>
            <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{metadata.uploader}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-secondary)" }}>Encryption</span>
            {metadata.encryption === "true" ? (
              <span style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                color: "var(--accent-purple)",
                backgroundColor: "rgba(168, 85, 247, 0.15)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                padding: "2px 8px",
                borderRadius: "4px"
              }}>Active</span>
            ) : (
              <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>None</span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <a 
            href={`/cdn/${metadata.fileName}`}
            className="btn-primary"
            style={{ 
              textDecoration: "none", 
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            Download File
          </a>

          <Link 
            href={`/view/${metadata.fileName}`}
            className="btn-secondary"
            style={{ 
              textDecoration: "none", 
              textAlign: "center",
              border: "1px solid rgba(6, 182, 212, 0.25)",
              color: "var(--accent-cyan)",
              background: "rgba(6, 182, 212, 0.02)"
            }}
          >
            Preview Asset
          </Link>
        </div>
      </div>
    </div>
  );
}
