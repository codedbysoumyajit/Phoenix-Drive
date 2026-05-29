"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          router.replace("/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-center animate-entrance">
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <h1 className="text-gradient" style={{ fontSize: "2.5rem", marginBottom: "8px", fontWeight: "800" }}>
            Phoenix XShare
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: "650", letterSpacing: "0.05em" }}>
            AUTHENTICATING GATEWAY
          </p>
        </div>

        {error && (
          <div className="toast-premium toast-error" style={{
            position: "static",
            boxShadow: "none",
            animation: "none",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            fontSize: "0.9rem"
          }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              OPERATIVE ID
            </label>
            <input
              id="username"
              type="text"
              className="form-input"
              placeholder="Enter credentials"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              ACCESS PASSCODE
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
            style={{ marginTop: "8px" }}
          >
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="btn-spinner" />
                <span>Decrypting Node...</span>
              </div>
            ) : (
              "Authorize Access"
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          New operative?{" "}
          <Link href="/register" style={{ color: "var(--accent-cyan)", textDecoration: "none", fontWeight: "750" }}>
            Create Account
          </Link>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
