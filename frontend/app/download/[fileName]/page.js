"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function DownloadPage({ params }) {
  const unwrappedParams = React.use ? React.use(params) : params;
  const { fileName } = unwrappedParams;

  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          <p style={{ marginTop: "16px", color: "var(--text-secondary)" }}>FETCHING CREDENTIALS...</p>
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
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", color: "var(--accent-rose)", marginBottom: "16px" }}>⚠</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "8px" }}>Secure Gateway Error</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "28px" }}>{error}</p>
          <Link href="/login" className="btn-submit" style={{ textDecoration: "none" }}>
            Return to Gateway
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-center animate-entrance" style={{ minHeight: "100vh" }}>
      <div className="auth-card">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center", marginBottom: "8px" }}>
          <div style={{
            width: "30px",
            height: "30px",
            background: "var(--gradient-cyber)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            fontSize: "0.9rem"
          }}>P</div>
          <h1 className="text-gradient" style={{ fontSize: "1.5rem", fontWeight: "800" }}>Phoenix XShare</h1>
        </div>

        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(6, 182, 212, 0.08)",
            border: "1px solid rgba(6, 182, 212, 0.25)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.8rem",
            color: "var(--accent-cyan)",
            marginBottom: "20px",
            boxShadow: "0 0 20px rgba(6, 182, 212, 0.15)"
          }}>
            {metadata.isFolder ? "🗂" : "⇩"}
          </div>
          
          <h2 style={{
            fontSize: "1.25rem",
            fontWeight: "750",
            color: "var(--text-primary)",
            lineHeight: "1.4",
            wordBreak: "break-all",
            padding: "0 4px"
          }}>
            {metadata.originalName}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "6px", fontWeight: "650", letterSpacing: "0.05em" }}>
            {metadata.isFolder ? "SECURE DIRECTORY PIPELINE ACTIVE" : "TRANSMISSION GATEWAY ACTIVE"}
          </p>
        </div>

        {/* File Details Box */}
        <div style={{
          background: "rgba(255,255,255,0.01)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          padding: "18px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          fontSize: "0.9rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>{metadata.isFolder ? "ITEM TYPE" : "FILE SIZE"}</span>
            <span style={{ color: "var(--text-primary)", fontWeight: "700" }}>{metadata.isFolder ? "Directory Archive" : metadata.fileSize}</span>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>TIMESTAMP</span>
            <span style={{ color: "var(--text-primary)", fontWeight: "700" }}>{metadata.uploadTime}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>OPERATIVE</span>
            <span style={{ color: "var(--text-primary)", fontWeight: "700" }}>{metadata.uploader.toUpperCase()}</span>
          </div>

          {metadata.isFolder ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)" }}>PACKAGING</span>
              <span className="badge-capsule badge-cyan">Auto ZIP Compression</span>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)" }}>DECRYPT STATE</span>
              {metadata.encryption === "true" ? (
                <span className="badge-capsule badge-purple">AES Secured</span>
              ) : (
                <span className="badge-capsule badge-cyan">Raw Buffer</span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <a 
            href={metadata.isFolder ? `/api/files/zip/${metadata.fileName}` : `/cdn/${metadata.fileName}`}
            className="btn-submit"
            style={{ 
              textDecoration: "none", 
              textAlign: "center",
              margin: "0"
            }}
          >
            {metadata.isFolder ? "Download ZIP Archive" : "Download Payload"}
          </a>

          {!metadata.isFolder && (
            <Link 
              href={`/view/${metadata.fileName}`}
              className="btn-action-cyan"
              style={{ 
                textDecoration: "none", 
                textAlign: "center"
              }}
            >
              Preview Media Asset
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
