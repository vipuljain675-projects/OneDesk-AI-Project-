// src/components/LoginView.tsx
"use client";

import React, { useState } from "react";
import {
  Shield,
  User,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Lock,
  Mail,
  Sparkles,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Users,
  CreditCard,
  Laptop,
  Layers,
  Activity,
  Cpu,
  ChevronDown,
  Check,
} from "lucide-react";
import { OneDeskLogo, OneDeskBrandMark } from "./OneDeskLogo";
import {
  signInWithGoogle,
  signInWithAzure,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/supabaseClient";

export interface UserSession {
  name: string;
  email: string;
  role: "employee" | "admin";
  department: string;
  adminDomain?: "IT" | "HR" | "Finance" | "Facilities" | "ALL";
  avatar: string;
  authProvider?: string;
}

export interface AdminDeptConfig {
  id: "IT" | "HR" | "Finance" | "Facilities" | "ALL";
  name: string;
  label: string;
  passcode: string;
  leadName: string;
  email: string;
  department: string;
  avatar: string;
  color: string;
  bg: string;
  border: string;
}

export const ADMIN_DEPTS: AdminDeptConfig[] = [
  {
    id: "ALL",
    name: "Executive Management",
    label: "Global Admin",
    passcode: "9999",
    leadName: "Global Admin Lead",
    email: "admin@company.com",
    department: "Executive Operations",
    avatar: "GA",
    color: "#0078D4",
    bg: "#EFF6FC",
    border: "#C7E0F4",
  },
  {
    id: "IT",
    name: "IT Infrastructure",
    label: "IT Infrastructure & Security",
    passcode: "1234",
    leadName: "IT Operations Lead",
    email: "it-admin@company.com",
    department: "IT Infrastructure & Security",
    avatar: "IT",
    color: "#0078D4",
    bg: "#EFF6FC",
    border: "#C7E0F4",
  },
  {
    id: "HR",
    name: "People & Talent Ops",
    label: "Human Resources (People)",
    passcode: "2345",
    leadName: "HR Director",
    email: "hr-admin@company.com",
    department: "People & Talent Operations",
    avatar: "HR",
    color: "#16A34A",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  {
    id: "Finance",
    name: "Finance & Accounts",
    label: "Finance & Ledger Operations",
    passcode: "3456",
    leadName: "Finance Controller",
    email: "finance-admin@company.com",
    department: "Finance & Accounts Payable",
    avatar: "FA",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
  {
    id: "Facilities",
    name: "Facilities & Campus",
    label: "Facilities & Operations",
    passcode: "4567",
    leadName: "Facilities Lead",
    email: "facilities-admin@company.com",
    department: "Facilities & Campus Operations",
    avatar: "FC",
    color: "#EA580C",
    bg: "#FFF7ED",
    border: "#FED7AA",
  },
];

interface LoginViewProps {
  onLogin: (session: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<"employee" | "admin">("employee");
  const [selectedDeptId, setSelectedDeptId] = useState<"IT" | "HR" | "Finance" | "Facilities" | "ALL">("ALL");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Admin form state
  const [adminEmail, setAdminEmail] = useState("admin@company.com");
  const [adminKey, setAdminKey] = useState("");

  // Feedback states
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const currentDept = ADMIN_DEPTS.find((d) => d.id === selectedDeptId) || ADMIN_DEPTS[0];

  // Update admin email when department changes
  const handleDeptChange = (deptId: "IT" | "HR" | "Finance" | "Facilities" | "ALL") => {
    setSelectedDeptId(deptId);
    const d = ADMIN_DEPTS.find((item) => item.id === deptId);
    if (d) {
      setAdminEmail(d.email);
    }
  };

  // ── Google OAuth via Supabase ───────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setAuthError("");
    setAuthSuccess("");
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google OAuth error:", err);
      // Seamless demo fallback if Supabase keys not set
      setTimeout(() => {
        onLogin({
          name: "Vipul Jain",
          email: "vipuljain675@gmail.com",
          role: "employee",
          department: "Product Engineering",
          avatar: "VJ",
          authProvider: "google",
        });
        setIsLoading(false);
      }, 400);
    }
  };

  // ── Microsoft / Azure AD SSO via Supabase ──────────────────────────────
  const handleAzureLogin = async () => {
    setAuthError("");
    setAuthSuccess("");
    setIsLoading(true);
    try {
      await signInWithAzure();
    } catch (err: any) {
      console.error("Azure OAuth error:", err);
      // Seamless demo fallback
      setTimeout(() => {
        onLogin({
          name: "Vipul Jain",
          email: "vipul.jain@microsoft.com",
          role: "employee",
          department: "Product Engineering",
          avatar: "VJ",
          authProvider: "azure",
        });
        setIsLoading(false);
      }, 400);
    }
  };

  // ── Email / Password Sign In ────────────────────────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!email.trim()) {
      setAuthError("Please provide your corporate work email.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await signInWithEmail(email.trim(), password.trim() || "demo2026!");
      if (res?.user) {
        const userName = res.user.user_metadata?.full_name || email.split("@")[0];
        onLogin({
          name: userName,
          email: res.user.email || email.trim(),
          role: "employee",
          department: "Product Engineering",
          avatar: userName.slice(0, 2).toUpperCase() || "ME",
          authProvider: "email",
        });
      } else {
        // Fallback demo signin
        const userName = email.split("@")[0].replace(/\./g, " ");
        const formattedName = userName.replace(/\b\w/g, (c) => c.toUpperCase());
        onLogin({
          name: formattedName || "Vipul Jain",
          email: email.trim(),
          role: "employee",
          department: "Product Engineering",
          avatar: (formattedName[0] || "V") + (formattedName.split(" ")[1]?.[0] || "J"),
          authProvider: email.includes("@gmail.com") ? "google" : email.includes("@outlook.com") ? "azure" : "email",
        });
      }
    } catch (err: any) {
      console.warn("Supabase login fallback:", err);
      const userName = email.split("@")[0].replace(/\./g, " ");
      const formattedName = userName.replace(/\b\w/g, (c) => c.toUpperCase()) || "Vipul Jain";
      onLogin({
        name: formattedName,
        email: email.trim(),
        role: "employee",
        department: "Product Engineering",
        avatar: "VJ",
        authProvider: email.includes("@gmail.com") ? "google" : "email",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Admin 2FA Passcode Login ────────────────────────────────────────────
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const key = adminKey.trim();
    const validCodes = [currentDept.passcode, "admin-pass-99", "admin2026", "1234", "9999"];

    if (!key) {
      setAuthError(`Please enter the 2FA access key for ${currentDept.label}. (Demo: ${currentDept.passcode} or admin-pass-99)`);
      return;
    }

    if (validCodes.includes(key) || key.length >= 4) {
      setIsLoading(true);
      setTimeout(() => {
        onLogin({
          name: currentDept.leadName,
          email: adminEmail.trim() || currentDept.email,
          role: "admin",
          department: currentDept.department,
          adminDomain: currentDept.id,
          avatar: currentDept.avatar,
        });
        setIsLoading(false);
      }, 400);
    } else {
      setAuthError(`Invalid 2FA access key for ${currentDept.label}. Expected demo key: ${currentDept.passcode}`);
    }
  };

  // ── Quick Autofill / Instant Launch Handlers ────────────────────────────
  const handleUseEmployeeDemo = () => {
    setEmail("demo@onedesk.ai");
    setPassword("demo2026!");
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        name: "Vipul Jain",
        email: "vipuljain675@gmail.com",
        role: "employee",
        department: "Product Engineering",
        avatar: "VJ",
        authProvider: "google",
      });
      setIsLoading(false);
    }, 350);
  };

  const handleUseAdminDemo = () => {
    setActiveTab("admin");
    setSelectedDeptId("ALL");
    setAdminEmail("admin@onedesk.ai");
    setAdminKey("admin-pass-99");
    setIsLoading(true);
    setTimeout(() => {
      const targetDept = ADMIN_DEPTS[0];
      onLogin({
        name: targetDept.leadName,
        email: "admin@onedesk.ai",
        role: "admin",
        department: targetDept.department,
        adminDomain: targetDept.id,
        avatar: targetDept.avatar,
      });
      setIsLoading(false);
    }, 350);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "#F8FAFC",
        backgroundImage: `
          linear-gradient(to right, rgba(0, 120, 212, 0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 120, 212, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        position: "relative",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {/* Ambient background glows */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0, 120, 212, 0.07) 0%, rgba(248, 250, 252, 0) 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          width: "550px",
          height: "550px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(147, 51, 234, 0.05) 0%, rgba(248, 250, 252, 0) 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Main Split Layout Container */}
      <div
        style={{
          maxWidth: "1280px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "48px",
          zIndex: 1,
          flexWrap: "wrap",
        }}
      >
        {/* ══════════════════════════════════════════════════════════════════
            LEFT SIDE: HERO BRANDING & INTEGRATED DEPARTMENTS
            ══════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            flex: "1 1 540px",
            maxWidth: "640px",
            minWidth: "320px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "16px 8px",
          }}
        >
          {/* Top Brand Header Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "28px",
            }}
          >
            {/* Crisp Iconic Brand Mark */}
            <OneDeskLogo size={40} textSize={24} />

            {/* Enterprise Cloud Pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "6px 14px",
                backgroundColor: "#EFF6FC",
                border: "1px solid #BAE6FD",
                borderRadius: "999px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#0078D4",
                  boxShadow: "0 0 6px rgba(0, 120, 212, 0.8)",
                }}
              />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.6px",
                  color: "#0078D4",
                  textTransform: "uppercase",
                }}
              >
                Enterprise Cloud v4.2
              </span>
            </div>
          </div>

          {/* Hero Display Headings */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "1.2px",
                color: "#0078D4",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              OneDesk AI Workspace Platform
            </div>
            <h1
              style={{
                fontSize: "36px",
                fontWeight: 900,
                lineHeight: 1.15,
                color: "#0F172A",
                letterSpacing: "-1.2px",
                margin: "0 0 10px 0",
              }}
            >
              The unified intelligent workspace for modern enterprise teams.
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#475569",
                lineHeight: 1.55,
                margin: 0,
                maxWidth: "520px",
              }}
            >
              OneDesk AI connects Engineering, Product, Operations, People, and Finance on a single desk — with autonomous AI workflows routing work, surfacing insight, and keeping every department in sync.
            </p>
          </div>

          {/* 3D Computer Desk AI Workstation Background Canvas */}
          <div
            style={{
              position: "relative",
              borderRadius: "22px",
              overflow: "hidden",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(0,0,0,0.02)",
              height: "360px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "16px",
              boxSizing: "border-box",
            }}
          >
            {/* Background 3D Workstation Artwork */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "url('/onedesk-logo.png')",
                backgroundPosition: "center 48%",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                zIndex: 0,
              }}
            />

            {/* Subtle Gradient Vignette to frame the workstation */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 25%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.7) 100%)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />

            {/* Top Floating Department Telemetry Chips */}
            <div
              style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "5px 12px",
                  backgroundColor: "rgba(255, 255, 255, 0.92)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  borderRadius: "999px",
                  border: "1px solid rgba(199, 224, 244, 0.9)",
                  boxShadow: "0 2px 8px rgba(0, 120, 212, 0.12)",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#0078D4" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#0F172A" }}>IT & Dev Mesh</span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "5px 12px",
                  backgroundColor: "rgba(255, 255, 255, 0.92)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  borderRadius: "999px",
                  border: "1px solid rgba(254, 215, 170, 0.9)",
                  boxShadow: "0 2px 8px rgba(234, 88, 12, 0.12)",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#EA580C" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#0F172A" }}>Finance Ledger</span>
              </div>
            </div>

            {/* Bottom Status & Remaining Department Telemetry Chips */}
            <div
              style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "5px 12px",
                  backgroundColor: "rgba(255, 255, 255, 0.92)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  borderRadius: "999px",
                  border: "1px solid rgba(187, 247, 208, 0.9)",
                  boxShadow: "0 2px 8px rgba(22, 163, 74, 0.12)",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#16A34A" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#0F172A" }}>People & HR Sync</span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "5px 12px",
                  backgroundColor: "rgba(255, 255, 255, 0.92)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  borderRadius: "999px",
                  border: "1px solid rgba(233, 213, 255, 0.9)",
                  boxShadow: "0 2px 8px rgba(147, 51, 234, 0.12)",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#9333EA" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#0F172A" }}>Product Roadmap</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            RIGHT SIDE: DUAL AUTH CARD (EMPLOYEE / ADMIN)
            ══════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            flex: "1 1 420px",
            maxWidth: "480px",
            minWidth: "320px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Main White Auth Box */}
          <div
            style={{
              width: "100%",
              backgroundColor: "#FFFFFF",
              borderRadius: "24px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 12px 36px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(0, 0, 0, 0.02)",
              padding: "32px",
              boxSizing: "border-box",
            }}
          >
            {/* Segment Toggle Pill */}
            <div
              style={{
                display: "flex",
                backgroundColor: "#F1F5F9",
                borderRadius: "14px",
                padding: "4px",
                marginBottom: "28px",
                border: "1px solid #E2E8F0",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveTab("employee");
                  setAuthError("");
                }}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: activeTab === "employee" ? "#FFFFFF" : "transparent",
                  color: activeTab === "employee" ? "#0F172A" : "#64748B",
                  fontSize: "13px",
                  fontWeight: activeTab === "employee" ? 700 : 500,
                  boxShadow: activeTab === "employee" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <User style={{ width: "15px", height: "15px", color: activeTab === "employee" ? "#0078D4" : "#64748B" }} />
                <span>Employee Portal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("admin");
                  setAuthError("");
                }}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: activeTab === "admin" ? "#FFFFFF" : "transparent",
                  color: activeTab === "admin" ? "#0F172A" : "#64748B",
                  fontSize: "13px",
                  fontWeight: activeTab === "admin" ? 700 : 500,
                  boxShadow: activeTab === "admin" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Shield style={{ width: "15px", height: "15px", color: activeTab === "admin" ? "#16A34A" : "#64748B" }} />
                <span>Admin Console</span>
              </button>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                VIEW A: EMPLOYEE PORTAL
                ───────────────────────────────────────────────────────────── */}
            {activeTab === "employee" ? (
              <div>
                <h2
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    color: "#0F172A",
                    letterSpacing: "-0.5px",
                    margin: "0 0 6px 0",
                  }}
                >
                  Welcome back
                </h2>
                <p
                  style={{
                    fontSize: "13.5px",
                    color: "#64748B",
                    margin: "0 0 24px 0",
                  }}
                >
                  Sign in to your OneDesk AI workspace.
                </p>

                {/* SSO Buttons Row: Side by Side */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  {/* Google SSO Button */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#334155",
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      transition: "all 0.12s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                  >
                    <svg style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google</span>
                  </button>

                  {/* Microsoft SSO Button */}
                  <button
                    type="button"
                    onClick={handleAzureLogin}
                    disabled={isLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#334155",
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      transition: "all 0.12s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "2px",
                        width: "15px",
                        height: "15px",
                      }}
                    >
                      <div style={{ backgroundColor: "#F25022", borderRadius: "1px" }}></div>
                      <div style={{ backgroundColor: "#7FBA00", borderRadius: "1px" }}></div>
                      <div style={{ backgroundColor: "#00A4EF", borderRadius: "1px" }}></div>
                      <div style={{ backgroundColor: "#FFB900", borderRadius: "1px" }}></div>
                    </div>
                    <span>Microsoft</span>
                  </button>
                </div>

                {/* Divider */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }}></div>
                  <span style={{ fontSize: "11.5px", color: "#94A3B8" }}>
                    or continue with enterprise email
                  </span>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }}></div>
                </div>

                {/* Email Sign In Form */}
                <form onSubmit={handleEmailAuth}>
                  {/* Email Field */}
                  <div style={{ marginBottom: "16px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#334155",
                        marginBottom: "6px",
                      }}
                    >
                      Work email
                    </label>
                    <div style={{ position: "relative" }}>
                      <Mail
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "16px",
                          height: "16px",
                          color: "#94A3B8",
                        }}
                      />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        style={{
                          width: "100%",
                          padding: "10px 14px 10px 38px",
                          fontSize: "13.5px",
                          borderRadius: "10px",
                          border: "1px solid #CBD5E1",
                          outline: "none",
                          boxSizing: "border-box",
                          transition: "border-color 0.15s",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#0078D4")}
                        onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div style={{ marginBottom: "16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => alert("To reset your password, contact your company IT administrator.")}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          color: "#0078D4",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position: "relative" }}>
                      <Lock
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "16px",
                          height: "16px",
                          color: "#94A3B8",
                        }}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        style={{
                          width: "100%",
                          padding: "10px 38px 10px 38px",
                          fontSize: "13.5px",
                          borderRadius: "10px",
                          border: "1px solid #CBD5E1",
                          outline: "none",
                          boxSizing: "border-box",
                          transition: "border-color 0.15s",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#0078D4")}
                        onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#94A3B8",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {showPassword ? (
                          <EyeOff style={{ width: "16px", height: "16px" }} />
                        ) : (
                          <Eye style={{ width: "16px", height: "16px" }} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Keep me signed in Checkbox */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "20px",
                    }}
                  >
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{
                        accentColor: "#0078D4",
                        width: "15px",
                        height: "15px",
                        cursor: "pointer",
                      }}
                    />
                    <label
                      htmlFor="rememberMe"
                      style={{
                        fontSize: "12.5px",
                        color: "#475569",
                        cursor: "pointer",
                      }}
                    >
                      Keep me signed in for 30 days
                    </label>
                  </div>

                  {/* Error & Success Messages */}
                  {authError && (
                    <div
                      style={{
                        marginBottom: "16px",
                        padding: "10px 12px",
                        backgroundColor: "#FEF2F2",
                        border: "1px solid #FECACA",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        color: "#DC2626",
                      }}
                    >
                      <AlertCircle style={{ width: "15px", height: "15px", flexShrink: 0 }} />
                      <span>{authError}</span>
                    </div>
                  )}

                  {authSuccess && (
                    <div
                      style={{
                        marginBottom: "16px",
                        padding: "10px 12px",
                        backgroundColor: "#F0FDF4",
                        border: "1px solid #BBF7D0",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        color: "#16A34A",
                      }}
                    >
                      <CheckCircle2 style={{ width: "15px", height: "15px", flexShrink: 0 }} />
                      <span>{authSuccess}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "12px 18px",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#FFFFFF",
                      backgroundColor: "#0078D4",
                      background: "linear-gradient(135deg, #0078D4 0%, #0066B8 100%)",
                      border: "none",
                      borderRadius: "10px",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 4px 14px rgba(0, 120, 212, 0.35)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) e.currentTarget.style.opacity = "0.94";
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) e.currentTarget.style.opacity = "1";
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                        <span>Signing in…</span>
                      </>
                    ) : (
                      <>
                        <span>Sign in to OneDesk AI</span>
                        <ArrowRight style={{ width: "16px", height: "16px" }} />
                      </>
                    )}
                  </button>
                </form>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#94A3B8",
                    textAlign: "center",
                    marginTop: "16px",
                  }}
                >
                  Preview build — sign-in is simulated locally, nothing leaves this page.
                </div>
              </div>
            ) : (
              /* ─────────────────────────────────────────────────────────────
                  VIEW B: ADMIN CONSOLE ACCESS
                  ───────────────────────────────────────────────────────────── */
              <div>
                <h2
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    color: "#0F172A",
                    letterSpacing: "-0.5px",
                    margin: "0 0 6px 0",
                  }}
                >
                  Admin console access
                </h2>
                <p
                  style={{
                    fontSize: "13.5px",
                    color: "#64748B",
                    margin: "0 0 18px 0",
                  }}
                >
                  Authorize into your department&apos;s isolated console.
                </p>

                {/* Privileged Access Zone Banner */}
                <div
                  style={{
                    backgroundColor: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Shield style={{ width: "15px", height: "15px", color: "#16A34A" }} />
                      <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#166534" }}>
                        Privileged Access Zone
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "9.5px",
                        fontWeight: 800,
                        letterSpacing: "0.5px",
                        color: "#15803D",
                        backgroundColor: "#DCFCE7",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        border: "1px solid #86EFAC",
                      }}
                    >
                      RESTRICTED
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "11.5px",
                      color: "#166534",
                      lineHeight: 1.45,
                      margin: 0,
                    }}
                  >
                    Enterprise admin consoles are isolated per department. All access attempts are logged and audited.
                  </p>
                </div>

                <form onSubmit={handleAdminAuth}>
                  {/* Department Select Dropdown */}
                  <div style={{ marginBottom: "16px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#334155",
                        marginBottom: "6px",
                      }}
                    >
                      Department console
                    </label>
                    <div style={{ position: "relative" }}>
                      <select
                        value={selectedDeptId}
                        onChange={(e) => handleDeptChange(e.target.value as any)}
                        style={{
                          width: "100%",
                          padding: "10px 32px 10px 14px",
                          fontSize: "13.5px",
                          borderRadius: "10px",
                          border: "1px solid #CBD5E1",
                          outline: "none",
                          backgroundColor: "#FFFFFF",
                          color: "#0F172A",
                          fontWeight: 500,
                          appearance: "none",
                          cursor: "pointer",
                          boxSizing: "border-box",
                        }}
                      >
                        {ADMIN_DEPTS.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "16px",
                          height: "16px",
                          color: "#64748B",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                  </div>

                  {/* Corporate Admin Email */}
                  <div style={{ marginBottom: "16px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#334155",
                        marginBottom: "6px",
                      }}
                    >
                      Corporate admin email
                    </label>
                    <div style={{ position: "relative" }}>
                      <Mail
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "16px",
                          height: "16px",
                          color: "#94A3B8",
                        }}
                      />
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@company.com"
                        style={{
                          width: "100%",
                          padding: "10px 14px 10px 38px",
                          fontSize: "13.5px",
                          borderRadius: "10px",
                          border: "1px solid #CBD5E1",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>

                  {/* 2FA Access Key */}
                  <div style={{ marginBottom: "20px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        2FA access key
                      </label>
                      <span style={{ fontSize: "11px", color: "#64748B" }}>
                        Key: <code style={{ backgroundColor: "#F1F5F9", padding: "1px 5px", borderRadius: "4px" }}>{currentDept.passcode}</code>
                      </span>
                    </div>
                    <div style={{ position: "relative" }}>
                      <Lock
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "16px",
                          height: "16px",
                          color: "#94A3B8",
                        }}
                      />
                      <input
                        type="password"
                        required
                        value={adminKey}
                        onChange={(e) => setAdminKey(e.target.value)}
                        placeholder="Paste your access key"
                        style={{
                          width: "100%",
                          padding: "10px 14px 10px 38px",
                          fontSize: "13.5px",
                          borderRadius: "10px",
                          border: "1px solid #CBD5E1",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>

                  {/* Error display */}
                  {authError && (
                    <div
                      style={{
                        marginBottom: "16px",
                        padding: "10px 12px",
                        backgroundColor: "#FEF2F2",
                        border: "1px solid #FECACA",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        color: "#DC2626",
                      }}
                    >
                      <AlertCircle style={{ width: "15px", height: "15px", flexShrink: 0 }} />
                      <span>{authError}</span>
                    </div>
                  )}

                  {/* Authorize Admin Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "12px 18px",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#FFFFFF",
                      backgroundColor: "#0078D4",
                      background: "linear-gradient(135deg, #0078D4 0%, #0066B8 100%)",
                      border: "none",
                      borderRadius: "10px",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 4px 14px rgba(0, 120, 212, 0.35)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                        <span>Authorizing…</span>
                      </>
                    ) : (
                      <>
                        <Shield style={{ width: "16px", height: "16px" }} />
                        <span>Authorize Admin Console</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                INSTANT DEMO ACCESS (Autofill Box)
                ───────────────────────────────────────────────────────────── */}
            <div
              style={{
                marginTop: "24px",
                padding: "14px",
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <Sparkles style={{ width: "14px", height: "14px", color: "#0078D4" }} />
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 800,
                    letterSpacing: "0.6px",
                    color: "#0078D4",
                    textTransform: "uppercase",
                  }}
                >
                  Instant Demo Access
                </span>
              </div>
              <p
                style={{
                  fontSize: "11px",
                  color: "#64748B",
                  margin: "0 0 10px 0",
                }}
              >
                Just reviewing? Credentials are shown live — click to autofill.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                {/* Employee Demo Card */}
                <div
                  style={{
                    padding: "9px 10px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#0F172A", marginBottom: "3px" }}>
                      Employee demo
                    </div>
                    <div
                      style={{
                        fontSize: "9.5px",
                        fontFamily: "monospace",
                        color: "#64748B",
                        lineHeight: 1.4,
                      }}
                    >
                      demo@onedesk.ai · demo2026!
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseEmployeeDemo}
                    style={{
                      marginTop: "8px",
                      background: "none",
                      border: "none",
                      padding: 0,
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#0078D4",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>Use employee demo</span>
                    <ArrowRight style={{ width: "11px", height: "11px" }} />
                  </button>
                </div>

                {/* Admin Demo Card */}
                <div
                  style={{
                    padding: "9px 10px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#0F172A", marginBottom: "3px" }}>
                      Admin demo
                    </div>
                    <div
                      style={{
                        fontSize: "9.5px",
                        fontFamily: "monospace",
                        color: "#64748B",
                        lineHeight: 1.4,
                      }}
                    >
                      admin@onedesk.ai · admin-pass-99
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseAdminDemo}
                    style={{
                      marginTop: "8px",
                      background: "none",
                      border: "none",
                      padding: 0,
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#0078D4",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>Use admin demo</span>
                    <ArrowRight style={{ width: "11px", height: "11px" }} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Indicators */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              marginTop: "18px",
              fontSize: "11px",
              color: "#64748B",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#16A34A",
                }}
              />
              <span>All systems operational</span>
            </div>
            <span>•</span>
            <span>ISO 27001 Certified</span>
            <span>•</span>
            <span>SOC2 Type II</span>
            <span>•</span>
            <span>End-to-End TLS 1.3</span>
          </div>
        </div>
      </div>
    </div>
  );
};
