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
    // If user is already logged in, send them straight to upload
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          router.replace("/upload");
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

      // Login successful
      router.push("/upload");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-center animate-fade-in" style={{ minHeight: "100vh" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "440px", padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 className="text-gradient" style={{ fontSize: "2.4rem", marginBottom: "8px" }}>
            Phoenix XShare
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", fontWeight: "300" }}>
            Sign in to access secure file sharing
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.2)",
            color: "var(--accent-rose)",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            fontSize: "0.9rem",
            marginBottom: "24px"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="username" style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>
              Username
            </label>
            <input
              id="username"
              type="text"
              className="input-control"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="password" style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: "8px", position: "relative" }}
          >
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div className="btn-spinner" />
                <span>Authenticating...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div style={{ marginTop: "32px", textAlign: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <Link href="/register" style={{ color: "var(--accent-cyan)", textDecoration: "none", fontWeight: "600" }}>
            Sign Up
          </Link>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .btn-spinner {
          width: 16px;
          height: 16px;
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
