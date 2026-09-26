// src/components/Header.tsx
"use client";

import React from "react";
import { Shield, User, LogOut } from "lucide-react";
import { UserSession } from "@/components/LoginView";
import { OneDeskLogo } from "@/components/OneDeskLogo";

interface HeaderProps {
  userSession: UserSession;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userSession, onSignOut }) => {
  const isAdmin = userSession.role === "admin";

  return (
    <header
      style={{
        height: "3.5rem",
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        padding: "0 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 30,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Left: Brand — Crisp SVG Vector Logo Mark */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <OneDeskLogo size={28} textSize={15} badgeSize={10} />
      </div>

      {/* Center: Active Role Badge (Strict Role Separation - Dynamic per Department) */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {isAdmin ? (
          (() => {
            const domain = userSession.adminDomain;
            let label = "Master Multi-Department Admin Console";
            let bg = "#FAF5FF";
            let border = "#E9D5FF";
            let color = "#9333EA";

            if (domain === "IT") {
              label = "IT Infrastructure Admin Console";
              bg = "#EFF6FC";
              border = "#C7E0F4";
              color = "#0078D4";
            } else if (domain === "HR") {
              label = "HR & People Operations Admin Console";
              bg = "#F0FDF4";
              border = "#BBF7D0";
              color = "#16A34A";
            } else if (domain === "Finance") {
              label = "Finance & Expense Admin Console";
              bg = "#ECFDF5";
              border = "#A7F3D0";
              color = "#059669";
            } else if (domain === "Facilities") {
              label = "Facilities & Security Admin Console";
              bg = "#FFF7ED";
              border = "#FED7AA";
              color = "#EA580C";
            }

            return (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 14px",
                  backgroundColor: bg,
                  border: `1px solid ${border}`,
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: color,
                }}
              >
                <Shield style={{ width: "13px", height: "13px" }} />
                <span>{label}</span>
              </div>
            );
          })()
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 14px",
              backgroundColor: "#EFF6FC",
              border: "1px solid #C7E0F4",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#0078D4",
            }}
          >
            <User style={{ width: "13px", height: "13px" }} />
            <span>Employee Self-Service Workspace</span>
          </div>
        )}
      </div>

      {/* Right: Live Cloud Status + Profile + Sign Out */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Supabase Live Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            backgroundColor: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderRadius: "999px",
            fontSize: "11px",
            color: "#15803D",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "#22C55E",
            }}
          ></span>
          Live Sync Active
        </div>

        {/* User Profile */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            paddingLeft: "12px",
            borderLeft: "1px solid #E2E8F0",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: isAdmin
                ? userSession.adminDomain === "IT"
                  ? "#0078D4"
                  : userSession.adminDomain === "HR"
                  ? "#16A34A"
                  : userSession.adminDomain === "Finance"
                  ? "#059669"
                  : userSession.adminDomain === "Facilities"
                  ? "#EA580C"
                  : "#9333EA"
                : "#0078D4",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
            }}
          >
            {userSession.avatar || userSession.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
            <span style={{ fontWeight: 600, fontSize: "12px", color: "#1E293B" }}>{userSession.name}</span>
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>
              {isAdmin ? `${userSession.department}` : userSession.department}
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={onSignOut}
          title="Sign out"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            backgroundColor: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#64748B",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#FEE2E2";
            e.currentTarget.style.borderColor = "#FECACA";
            e.currentTarget.style.color = "#DC2626";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#F8FAFC";
            e.currentTarget.style.borderColor = "#E2E8F0";
            e.currentTarget.style.color = "#64748B";
          }}
        >
          <LogOut style={{ width: "13px", height: "13px" }} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
