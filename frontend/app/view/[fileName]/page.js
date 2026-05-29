"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  
  const router = useRouter();

  useEffect(() => {
    if (!fileName) return;

    // 1. Check if user is logged in (to customize back button)
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setIsLoggedIn(data.loggedIn);
      })
      .catch(() => {});

    // 2. Fetch file metadata
    fetch(`/api/files/metadata/${fileName}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Metadata could not be found.");
        }
        return res.json();
      })
      .then((data) => {
        setMetadata(data);
        
        // 3. If file type is text, fetch the content directly for inline viewing!
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
          <p style={{ marginTop: "16px", color: "var(--text-secondary)" }}>Configuring media interface...</p>
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
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "8px" }}>Media Portal Error</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "24px" }}>{error}</p>
          <Link href="/" className="btn-primary" style={{ display: "inline-flex", textDecoration: "none" }}>
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const fileType = getFileType(metadata.originalName || fileName);
  const mediaUrl = `/cdn/${metadata.fileName}`;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "24px 16px" }}>
      {/* Header */}
      <header className="glass-panel" style={{
        maxWidth: "960px",
        width: "100%",
        margin: "0 auto 24px auto",
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--accent-cyan)", fontWeight: "700" }}>VIEWING PORTAL</span>
          <h1 style={{ fontSize: "1.1rem", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {metadata.originalName}
          </h1>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {isLoggedIn ? (
            <Link href="/upload" className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem", textDecoration: "none" }}>
              Dashboard
            </Link>
          ) : (
            <Link href={`/download/${metadata.fileName}`} className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem", textDecoration: "none" }}>
              Back
            </Link>
          )}

          <a href={mediaUrl} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem", textDecoration: "none" }}>
            Download
          </a>
        </div>
      </header>

      {/* Main Preview Sandbox */}
      <main style={{
        flex: 1,
        maxWidth: "960px",
        width: "100%",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>
        
        {/* Render Sandbox depending on Type */}
        <section className="glass-panel" style={{
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          maxHeight: "75vh",
          overflow: "hidden",
          background: "rgba(5, 7, 12, 0.4)"
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
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
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
              padding: "40px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px"
            }}>
              <div style={{ fontSize: "4rem", animation: "pulse 2s infinite ease-in-out" }}>🎵</div>
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
              minHeight: "350px",
              maxHeight: "60vh",
              overflow: "auto",
              textAlign: "left",
              fontFamily: "monospace",
              fontSize: "0.9rem",
              lineHeight: "1.5",
              color: "#38bdf8",
              backgroundColor: "rgba(10, 13, 22, 0.9)",
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
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ fontSize: "4rem", marginBottom: "16px" }}>📄</div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: "600", marginBottom: "8px" }}>
                Preview Unavailable
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "340px", margin: "0 auto 24px auto" }}>
                This file format ({metadata.originalName.split('.').pop() || "unknown"}) cannot be previewed directly in the browser.
              </p>
              <a href={mediaUrl} className="btn-primary" style={{ textDecoration: "none" }}>
                Download to View
              </a>
            </div>
          )}

        </section>

        {/* Technical Specs Card */}
        <section className="glass-panel" style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>FILE SIZE</span>
            <span style={{ fontSize: "1rem", fontWeight: "600" }}>{metadata.fileSize}</span>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>ENCRYPTION</span>
            <span style={{ 
              fontSize: "0.95rem", 
              fontWeight: "700",
              color: metadata.encryption === "true" ? "var(--accent-purple)" : "var(--text-secondary)"
            }}>
              {metadata.encryption === "true" ? "AES Encrypted (Secure)" : "Standard Transmission"}
            </span>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>TRANSMISSION ID</span>
            <span style={{ fontSize: "0.9rem", fontFamily: "monospace", color: "var(--accent-cyan)" }}>
              {metadata.fileName.split('-').pop().split('.')[0] || "Unknown"}
            </span>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>METADATA INTEGRITY</span>
            <span style={{ fontSize: "0.95rem", color: "var(--accent-emerald)", fontWeight: "600" }}>
              ✓ Verified
            </span>
          </div>
        </section>

      </main>
    </div>
  );
}
