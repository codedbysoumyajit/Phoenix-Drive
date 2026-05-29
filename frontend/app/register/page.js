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
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          router.replace("/dashboard");
        }
      })
      .catch(() => {});

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
            Operative Signup
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: "650", letterSpacing: "0.05em" }}>
            REGISTER SECURE CREDENTIALS
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

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              CHOOSE USERNAME
            </label>
            <input
              id="username"
              type="text"
              className="form-input"
              placeholder="Min 3 characters"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              CHOOSE PASSWORD
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              CONFIRM PASSWORD
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {secretRequired && (
            <div className="form-group">
              <label htmlFor="registrationSecret" className="form-label" style={{ color: "var(--accent-magenta)" }}>
                GATEWAY ACCESS SECRET
              </label>
              <input
                id="registrationSecret"
                type="text"
                className="form-input"
                style={{ borderColor: "rgba(217, 70, 239, 0.25)" }}
                placeholder="Required secret invite code"
                value={registrationSecret}
                onChange={(e) => setRegistrationSecret(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
            style={{ marginTop: "10px" }}
          >
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="btn-spinner" />
                <span>Generating credentials...</span>
              </div>
            ) : (
              "Initialize operative"
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          Already registered?{" "}
          <Link href="/login" style={{ color: "var(--accent-cyan)", textDecoration: "none", fontWeight: "750" }}>
            Sign In
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
