"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          setUsername(data.username);
        } else {
          setUsername("");
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [pathname]);

  // Close dropdown on route transition
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage) return null;

  return (
    <header className="nav-bar-container" style={{ margin: "16px 16px 8px 16px" }}>
      <div className="nav-bar-main">
        {/* Brand logo & title */}
        <div className="nav-brand" style={{ cursor: "pointer" }} onClick={() => router.push(username ? "/dashboard" : "/login")}>
          <div className="nav-logo" style={{
            width: "36px",
            height: "36px",
            background: "var(--gradient-cyber)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px rgba(6, 182, 212, 0.45)",
            flexShrink: 0
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 22h20L12 2zm0 3.99L18.47 19H5.53L12 5.99z" fill="white" />
              <path d="M12 9l-4.5 7.5h9L12 9z" fill="rgba(255, 255, 255, 0.4)" />
            </svg>
          </div>
          <h1 className="nav-title text-gradient" style={{ fontSize: "1.35rem", fontWeight: "800", letterSpacing: "-0.02em" }}>
            Phoenix XShare
          </h1>
        </div>

        {/* Desktop inline nav links */}
        {username && (
          <nav className="desktop-nav-links">
            <Link href="/dashboard" className={`nav-item-link ${pathname === "/dashboard" ? "active" : ""}`}>
              Vault Dashboard
            </Link>
            <Link href="/upload" className={`nav-item-link ${pathname === "/upload" ? "active" : ""}`}>
              Upload Portal
            </Link>
            <Link href="/console" className={`nav-item-link ${pathname === "/console" ? "active" : ""}`}>
              System Console
            </Link>
          </nav>
        )}

        {/* Desktop Profile section */}
        {username ? (
          <div className="desktop-user-section">
            <div className="nav-username">
              <span className="glow-online-dot"></span>
              <span>{username.toUpperCase()}</span>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              Log Out
            </button>
          </div>
        ) : (
          !loading && (
            <Link href="/login" className="desktop-user-section btn-logout" style={{ textDecoration: "none", textAlign: "center" }}>
              Sign In
            </Link>
          )
        )}

        {/* Compact 3-Dot mobile menu button */}
        {username && (
          <button 
            className={`mobile-menu-dots-btn ${menuOpen ? "open" : ""}`} 
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </button>
        )}
      </div>

      {/* Mobile Drawer Dropdown list */}
      {username && menuOpen && (
        <div className="mobile-nav-dropdown animate-slide-down">
          <nav className="mobile-links-stack">
            <Link href="/dashboard" className={`mobile-nav-item ${pathname === "/dashboard" ? "active" : ""}`}>
              Vault Dashboard
            </Link>
            <Link href="/upload" className={`mobile-nav-item ${pathname === "/upload" ? "active" : ""}`}>
              Upload Portal
            </Link>
            <Link href="/console" className={`mobile-nav-item ${pathname === "/console" ? "active" : ""}`}>
              System Console
            </Link>
          </nav>
          
          <div className="mobile-profile-section">
            <div className="nav-username">
              <span className="glow-online-dot"></span>
              <span>{username.toUpperCase()}</span>
            </div>
            <button onClick={handleLogout} className="btn-logout" style={{ width: "auto", padding: "8px 16px" }}>
              Log Out
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .nav-bar-container {
          background: var(--bg-surface);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
          overflow: hidden;
          transition: var(--transition-smooth);
        }

        .nav-bar-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 28px;
        }

        /* Nav links styles */
        .desktop-nav-links {
          display: flex;
          gap: 6px;
        }

        .nav-item-link {
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.88rem;
          text-decoration: none;
          transition: var(--transition-fast);
          border: 1px solid transparent;
        }

        .nav-item-link:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.05);
        }

        .nav-item-link.active {
          color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.06);
          border-color: rgba(6, 182, 212, 0.25);
          box-shadow: 0 0 12px rgba(6, 182, 212, 0.03);
        }

        .desktop-user-section {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        /* Compact 3-Dot Button Styles */
        .mobile-menu-dots-btn {
          display: none;
          flex-direction: column;
          gap: 3.5px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 12px;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
          outline: none;
        }

        .mobile-menu-dots-btn:hover, .mobile-menu-dots-btn.open {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(6, 182, 212, 0.4);
        }

        .mobile-menu-dots-btn .dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: var(--text-primary);
          transition: var(--transition-fast);
        }

        .mobile-menu-dots-btn:hover .dot, .mobile-menu-dots-btn.open .dot {
          background-color: var(--accent-cyan);
          box-shadow: 0 0 8px var(--accent-cyan);
        }

        /* Mobile Dropdown styles */
        .mobile-nav-dropdown {
          border-top: 1px solid var(--border-color);
          background: rgba(9, 13, 22, 0.4);
          padding: 16px 20px 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .mobile-links-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mobile-nav-item {
          padding: 12px 16px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 0.95rem;
          text-decoration: none;
          transition: var(--transition-fast);
          border: 1px solid transparent;
        }

        .mobile-nav-item:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.02);
          border-color: var(--border-color);
        }

        .mobile-nav-item.active {
          color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.05);
          border-color: rgba(6, 182, 212, 0.2);
        }

        .mobile-profile-section {
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .animate-slide-down {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive overrides */
        @media (max-width: 900px) {
          .desktop-nav-links, .desktop-user-section {
            display: none !important;
          }

          .mobile-menu-dots-btn {
            display: flex !important;
          }
        }

        @media (max-width: 640px) {
          .nav-bar-main {
            padding: 12px 18px;
          }
        }
      `}} />
    </header>
  );
}
