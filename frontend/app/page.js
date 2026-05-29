"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          router.replace("/upload");
        } else {
          router.replace("/login");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  return (
    <div className="container-center" style={{ minHeight: "100vh" }}>
      <div className="text-center animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1 className="text-gradient animate-pulse-slow" style={{ fontSize: "2.8rem", marginBottom: "8px" }}>
          Phoenix XShare
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", fontWeight: "300", letterSpacing: "0.05em" }}>
          ESTABLISHING SECURE GATEWAY
        </p>
        <div style={{
          marginTop: "32px",
          width: "40px",
          height: "40px",
          border: "2px solid rgba(6, 182, 212, 0.1)",
          borderTopColor: "var(--accent-cyan)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }}></div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    </div>
  );
}
