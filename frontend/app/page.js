"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen px-6">
      <div className="text-center flex flex-col items-center animate-fade-in-up">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Phoenix Drive
        </h1>
        <p className="text-slate-400 text-sm tracking-wide">Connecting...</p>
        <div className="mt-8 w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin-slow" />
      </div>
    </div>
  );
}
