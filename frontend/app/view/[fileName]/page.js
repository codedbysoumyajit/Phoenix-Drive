"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

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
      <div className="container-center" style={{ minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="loader-spinner" />
          <p style={{ marginTop: "16px", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>INITIALIZING MEDIA NODE...</p>
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
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "8px" }}>Media Portal Error</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "24px" }}>{error}</p>
          <Link href="/" className="btn-submit" style={{ display: "inline-flex", textDecoration: "none" }}>
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const fileType = getFileType(metadata.originalName || fileName);
  const mediaUrl = `/cdn/${metadata.fileName}`;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "24px 16px" }} className="animate-entrance">
      
      {/* Header Nav Bar */}
      <header className="nav-bar" style={{
        maxWidth: "960px",
        width: "100%",
        margin: "0 auto 24px auto"
      }}>
        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: "800", letterSpacing: "0.05em" }}>PREVIEW INTERFACE</span>
          <h1 style={{ fontSize: "1.15rem", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)" }}>
            {metadata.originalName}
          </h1>
        </div>

        <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
          {isLoggedIn ? (
            <Link href="/upload" className="btn-logout" style={{ textDecoration: "none", textAlign: "center" }}>
              Dashboard
            </Link>
          ) : (
            <Link href={`/download/${metadata.fileName}`} className="btn-logout" style={{ textDecoration: "none", textAlign: "center" }}>
              Back
            </Link>
          )}

          <a 
            href={mediaUrl} 
            className="btn-logout" 
            style={{ 
              textDecoration: "none", 
              textAlign: "center",
              borderColor: "rgba(6, 182, 212, 0.4)",
              color: "var(--accent-cyan)",
              background: "rgba(6, 182, 212, 0.05)"
            }}
          >
            Download
          </a>
        </div>
      </header>

      {/* Main Preview Container */}
      <main style={{
        flex: 1,
        maxWidth: "960px",
        width: "100%",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>
        
        {/* Render Preview Frame */}
        <section className="panel-card" style={{
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "420px",
          maxHeight: "75vh",
          overflow: "hidden",
          background: "rgba(3, 6, 15, 0.55)"
        }}>
          
          {fileType === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={mediaUrl} 
              alt={metadata.originalName} 
              style={{
                maxWidth: "100%",
                maxHeight: "65vh",
                objectFit: "contain",
                borderRadius: "var(--radius-sm)",
                boxShadow: "0 15px 40px rgba(0,0,0,0.6)"
              }}
            />
          )}

          {fileType === "video" && (
            <video 
              src={mediaUrl} 
              controls 
              autoPlay
              style={{
                maxWidth: "100%",
                maxHeight: "65vh",
                borderRadius: "var(--radius-sm)",
                outline: "none"
              }}
            />
          )}

          {fileType === "audio" && (
            <div style={{
              width: "100%",
              maxWidth: "500px",
              padding: "48px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px"
            }}>
              <div style={{ fontSize: "4.5rem", animation: "pulse 2s infinite ease-in-out" }}>🎵</div>
              <audio 
                src={mediaUrl} 
                controls 
                autoPlay 
                style={{ width: "100%" }}
              />
            </div>
          )}

          {fileType === "pdf" && (
            <iframe 
              src={`${mediaUrl}#toolbar=0`} 
              width="100%" 
              height="600px" 
              style={{
                border: "none",
                borderRadius: "var(--radius-sm)",
                background: "#ffffff"
              }}
            />
          )}

          {fileType === "text" && (
            <pre style={{
              width: "100%",
              height: "100%",
              minHeight: "380px",
              maxHeight: "60vh",
              overflow: "auto",
              fontFamily: "monospace",
              fontSize: "0.9rem",
              lineHeight: "1.6",
              color: "#38bdf8",
              backgroundColor: "rgba(3, 6, 15, 0.95)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "24px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all"
            }}>
              <code>{textContent}</code>
            </pre>
          )}

          {fileType === "other" && (
            <div style={{ textAlign: "center", padding: "40px 16px" }}>
              <div style={{ fontSize: "4.5rem", marginBottom: "20px" }}>📄</div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "10px" }}>
                Preview Not Available
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "360px", margin: "0 auto 28px auto" }}>
                Format extension ({metadata.originalName.split('.').pop() || "unknown"}) does not support native browser display rendering.
              </p>
              <a href={mediaUrl} className="btn-submit" style={{ textDecoration: "none" }}>
                Download Payload
              </a>
            </div>
          )}

        </section>

        {/* Tech Specifications Matrix */}
        <section className="panel-card" style={{
          padding: "28px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "24px"
        }}>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px", fontWeight: "700", letterSpacing: "0.05em" }}>BUFFER CAPACITY</span>
            <span style={{ fontSize: "1.05rem", fontWeight: "700" }}>{metadata.fileSize}</span>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px", fontWeight: "700", letterSpacing: "0.05em" }}>ENCRYPT PROTOCOL</span>
            <span style={{ 
              fontSize: "1rem", 
              fontWeight: "750",
              color: metadata.encryption === "true" ? "var(--accent-magenta)" : "var(--text-secondary)"
            }}>
              {metadata.encryption === "true" ? "AES-256 (Locked)" : "Standard RAW"}
            </span>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px", fontWeight: "700", letterSpacing: "0.05em" }}>TRANS-HEX ID</span>
            <span style={{ fontSize: "0.95rem", fontFamily: "monospace", color: "var(--accent-cyan)", fontWeight: "600" }}>
              {metadata.fileName.split('-').pop().split('.')[0]?.toUpperCase() || "UNKNOWN"}
            </span>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px", fontWeight: "700", letterSpacing: "0.05em" }}>NODE AUTH STATE</span>
            <span style={{ fontSize: "1rem", color: "var(--accent-emerald)", fontWeight: "700" }}>
              ✓ Verified Operative
            </span>
          </div>
        </section>

      </main>
    </div>
  );
}
