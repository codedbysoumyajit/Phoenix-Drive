"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registrationSecret, setRegistrationSecret] = useState("");
  const [secretRequired, setSecretRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // 1. If user is already logged in, redirect to upload
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          router.replace("/upload");
        }
      })
      .catch(() => {});

    // 2. Fetch server registration settings
    fetch("/api/auth/config")
      .then((res) => res.json())
      .then((data) => {
        setSecretRequired(data.secretRequired);
      })
      .catch(() => {});
  }, [router]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const bodyPayload = {
        username,
        password,
        confirmPassword,
        ...(secretRequired && { registrationSecret })
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      // Registration & Auto-login successful
      router.push("/upload");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-center animate-fade-in" style={{ minHeight: "100vh" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "460px", padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 className="text-gradient" style={{ fontSize: "2.4rem", marginBottom: "8px" }}>
            Create Account
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", fontWeight: "300" }}>
            Join Phoenix XShare and share files seamlessly
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

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="username" style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>
              Username
            </label>
            <input
              id="username"
              type="text"
              className="input-control"
              placeholder="Min 3 characters"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="password" style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input-control"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="confirmPassword" style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="input-control"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {secretRequired && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="registrationSecret" style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--accent-cyan)" }}>
                System Access Secret
              </label>
              <input
                id="registrationSecret"
                type="text"
                className="input-control"
                style={{ borderColor: "rgba(6, 182, 212, 0.25)" }}
                placeholder="Required secret invite code"
                value={registrationSecret}
                onChange={(e) => setRegistrationSecret(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: "10px", position: "relative" }}
          >
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div className="btn-spinner" />
                <span>Creating Account...</span>
              </div>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div style={{ marginTop: "32px", textAlign: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent-cyan)", textDecoration: "none", fontWeight: "600" }}>
            Sign In
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
