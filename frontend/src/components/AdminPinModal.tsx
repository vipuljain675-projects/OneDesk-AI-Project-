// src/components/AdminPinModal.tsx
"use client";

import React, { useState } from "react";
import { Shield, AlertCircle, X, KeyRound } from "lucide-react";

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.toLowerCase() === "admin123" || pin.toLowerCase() === "onedesk" || pin.trim() === "1234") {
      setError(false);
      setPin("");
      onSuccess();
    } else {
      setError(true);
    }
  };

  const handleQuickUnlock = () => {
    setError(false);
    setPin("");
    onSuccess();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="fade-in"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          maxWidth: "420px",
          width: "100%",
          padding: "24px",
          boxShadow: "0 20px 60px -10px rgba(0,0,0,0.18), 0 8px 20px -4px rgba(0,0,0,0.10)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              backgroundColor: "#EFF6FC", border: "1px solid #C7E0F4",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#0078D4",
            }}>
              <Shield style={{ width: "20px", height: "20px" }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#0F172A" }}>IT Helpdesk Authorization</div>
              <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                Restricted to IT Support & Operations personnel
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: "#94A3B8", background: "none", border: "none", cursor: "pointer", padding: "4px" }}
          >
            <X style={{ width: "18px", height: "18px" }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
            Staff Passcode / Security PIN
          </label>
          <div style={{ position: "relative", marginBottom: "8px" }}>
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(false); }}
              placeholder="Enter passcode (e.g. admin123)"
              autoFocus
              style={{
                width: "100%",
                padding: "10px 12px 10px 36px",
                borderRadius: "8px",
                border: error ? "1.5px solid #F87171" : "1.5px solid #CBD5E1",
                fontSize: "13px",
                outline: "none",
                backgroundColor: error ? "#FFF5F5" : "#F8FAFC",
                color: "#0F172A",
                transition: "border-color 0.15s",
              }}
              onFocus={e => { if (!error) e.target.style.borderColor = "#0078D4"; e.target.style.backgroundColor = "#FFFFFF"; }}
              onBlur={e => { e.target.style.borderColor = error ? "#F87171" : "#CBD5E1"; }}
            />
            <KeyRound style={{
              position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)",
              width: "15px", height: "15px", color: "#94A3B8",
            }} />
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#DC2626", marginBottom: "12px" }}>
              <AlertCircle style={{ width: "13px", height: "13px" }} />
              Invalid passcode. Try "admin123" or use Quick Demo Unlock.
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <button
              type="submit"
              style={{
                flex: 1,
                backgroundColor: "#0078D4",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#106EBE"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#0078D4"}
            >
              Verify & Enter Console
            </button>
            <button
              type="button"
              onClick={handleQuickUnlock}
              style={{
                padding: "10px 14px",
                backgroundColor: "#F1F5F9",
                color: "#374151",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#E2E8F0"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#F1F5F9"}
            >
              Quick Demo Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
