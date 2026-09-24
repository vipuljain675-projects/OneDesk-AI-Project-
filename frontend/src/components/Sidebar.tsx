// src/components/Sidebar.tsx
"use client";

import React from "react";
import { MessageSquare, ClipboardList, Shield, BarChart2, Laptop, Users, CreditCard, Building2 } from "lucide-react";

interface SidebarProps {
  currentPortal: "employee" | "admin";
  activeView: "chat" | "my_requests" | "admin_queue" | "admin_analytics" | "admin_users";
  onSelectView: (view: "chat" | "my_requests" | "admin_queue" | "admin_analytics" | "admin_users") => void;
  ticketCount?: number;
}

const NavBtn: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
}> = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "9px 12px",
      borderRadius: "8px",
      fontSize: "12px",
      fontWeight: active ? 700 : 500,
      backgroundColor: active ? "#EFF6FC" : "transparent",
      color: active ? "#0078D4" : "#475569",
      border: "none",
      cursor: "pointer",
      transition: "all 0.12s ease",
      textAlign: "left",
      boxShadow: active ? "inset 0 0 0 1px #C7E0F4" : "none",
    }}
    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "#F8FAFC"; }}
    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
  >
    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {icon}
      {label}
    </span>
    {badge}
  </button>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    padding: "0 12px",
    fontSize: "10px",
    fontWeight: 700,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "6px",
  }}>
    {children}
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({
  currentPortal,
  activeView,
  onSelectView,
  ticketCount = 0,
}) => {
  return (
    <aside
      style={{
        width: "220px",
        minWidth: "220px",
        backgroundColor: "#FFFFFF",
        borderRight: "1px solid #E2E8F0",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {currentPortal === "employee" ? (
          <>
            <div>
              <SectionLabel>Employee Workspace</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <NavBtn
                  active={activeView === "chat"}
                  onClick={() => onSelectView("chat")}
                  icon={<MessageSquare style={{ width: "15px", height: "15px" }} />}
                  label="OneDesk Assistant"
                  badge={
                    <span style={{
                      width: "7px", height: "7px", borderRadius: "50%",
                      backgroundColor: "#22C55E", display: "inline-block",
                    }} />
                  }
                />
                <NavBtn
                  active={activeView === "my_requests"}
                  onClick={() => onSelectView("my_requests")}
                  icon={<ClipboardList style={{ width: "15px", height: "15px" }} />}
                  label="My Requests"
                  badge={ticketCount > 0 ? (
                    <span style={{
                      fontSize: "10px", fontWeight: 700,
                      backgroundColor: "#EFF6FC", color: "#0078D4",
                      padding: "1px 6px", borderRadius: "999px",
                      border: "1px solid #C7E0F4",
                    }}>
                      {ticketCount}
                    </span>
                  ) : undefined}
                />
              </div>
            </div>

            <div>
              <SectionLabel>Connected Domains</SectionLabel>
              <div style={{ padding: "0 4px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {[
                  { icon: <Laptop style={{ width: "13px", height: "13px", color: "#0078D4" }} />, label: "IT & Hardware Ops" },
                  { icon: <Users style={{ width: "13px", height: "13px", color: "#16A34A" }} />, label: "HR & Leave Policies" },
                  { icon: <CreditCard style={{ width: "13px", height: "13px", color: "#9333EA" }} />, label: "Finance & Expenses" },
                  { icon: <Building2 style={{ width: "13px", height: "13px", color: "#D97706" }} />, label: "Facilities & Bookings" },
                ].map(({ icon, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 8px", fontSize: "12px", color: "#64748B" }}>
                    {icon}
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div>
            <SectionLabel>IT Helpdesk Operations</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <NavBtn
                active={activeView === "admin_queue"}
                onClick={() => onSelectView("admin_queue")}
                icon={<Shield style={{ width: "15px", height: "15px" }} />}
                label="Incident Queue"
                badge={
                  <span style={{
                    fontSize: "10px", fontWeight: 700,
                    backgroundColor: "#0F172A", color: "#FFFFFF",
                    padding: "1px 7px", borderRadius: "4px",
                  }}>
                    Live
                  </span>
                }
              />
              <NavBtn
                active={activeView === "admin_analytics"}
                onClick={() => onSelectView("admin_analytics")}
                icon={<BarChart2 style={{ width: "15px", height: "15px" }} />}
                label="Router Telemetry"
              />
              <NavBtn
                active={activeView === "admin_users"}
                onClick={() => onSelectView("admin_users")}
                icon={<Users style={{ width: "15px", height: "15px" }} />}
                label="Registered Users"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid #F1F5F9",
        backgroundColor: "#FAFAFA",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}>OneDeskAI Portal</div>
          <div style={{ fontSize: "10px", color: "#94A3B8" }}>Microsoft Hackathon 2026</div>
        </div>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#0078D4" }}>v1.0</span>
      </div>
    </aside>
  );
};
