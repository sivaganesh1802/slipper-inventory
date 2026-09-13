"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Footprints, Lock, User, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Invalid username or password");
    }
  };

  return (
    <div
      className="login-fullscreen"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        padding: "16px",
        zIndex: 9999,
        overflowY: "auto",
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "380px",
          padding: "24px 28px",
          backgroundColor: "#ffffff",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: "#0284c7",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              marginBottom: "10px",
            }}
          >
            <Footprints size={24} />
          </div>
          <h1
            style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: "3px",
              whiteSpace: "nowrap",
            }}
          >
            SoleTrack Business
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
            Sign in to manage Slipper Inventory & Sales
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              marginBottom: "14px",
              borderRadius: "var(--radius-sm)",
              background: "#ffe4e6",
              border: "1px solid #fecdd3",
              color: "#be123c",
              fontSize: "0.78rem",
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="username">
              Username
            </label>
            <div style={{ position: "relative" }}>
              <User
                size={15}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                id="username"
                type="text"
                className="input-field"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: "32px" }}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: "18px" }}>
            <label className="input-label" htmlFor="password">
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={15}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: "32px" }}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "10px", fontSize: "0.85rem" }}
            disabled={loading}
          >
            {loading ? (
              "Signing In..."
            ) : (
              <>
                <span>Enter Inventory</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
