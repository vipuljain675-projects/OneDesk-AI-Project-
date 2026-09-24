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
} from "lucide-react";
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
}

interface AdminDeptConfig {
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
    id: "IT",
    name: "IT Infrastructure",
    label: "IT Admin",
    passcode: "1234",
    leadName: "IT Operations Lead",
    email: "it-admin@campus-enterprise.com",
    department: "IT Infrastructure & Security",
    avatar: "IT",
    color: "#0078D4",
    bg: "#EFF6FC",
    border: "#C7E0F4",
  },
  {
    id: "HR",
    name: "People & Talent Ops",
    label: "HR Admin",
    passcode: "2345",
    leadName: "HR Director",
    email: "hr-admin@campus-enterprise.com",
    department: "People & Talent Operations",
    avatar: "HR",
    color: "#16A34A",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  {
    id: "Finance",
    name: "Finance & Accounts",
    label: "Finance Admin",
    passcode: "3456",
    leadName: "Finance Controller",
    email: "finance-admin@campus-enterprise.com",
    department: "Finance & Accounts Payable",
    avatar: "FA",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
  {
    id: "Facilities",
    name: "Facilities & Campus Security",
    label: "Facilities Admin",
    passcode: "4567",
    leadName: "Facilities Lead",
    email: "facilities-admin@campus-enterprise.com",
    department: "Facilities & Campus Operations",
    avatar: "FC",
    color: "#EA580C",
    bg: "#FFF7ED",
    border: "#FED7AA",
  },
  {
    id: "ALL",
    name: "Executive Management",
    label: "Master Admin (All)",
    passcode: "9999",
    leadName: "Chief Operations Officer",
    email: "master-admin@campus-enterprise.com",
    department: "Executive Operations",
    avatar: "OP",
    color: "#9333EA",
    bg: "#FAF5FF",
    border: "#E9D5FF",
  },
];

interface LoginViewProps {
  onLogin: (session: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<"employee" | "admin">("employee");
  const [selectedDeptId, setSelectedDeptId] = useState<"IT" | "HR" | "Finance" | "Facilities" | "ALL">("IT");
  const [authMethod, setAuthMethod] = useState<"oauth" | "email">("oauth");
  const [emailMode, setEmailMode] = useState<"signin" | "signup">("signin");

  // Email/Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status & error state
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Admin passcode state
  const [adminPasscode, setAdminPasscode] = useState("");
  const [adminError, setAdminError] = useState("");

  const currentDept = ADMIN_DEPTS.find((d) => d.id === selectedDeptId) || ADMIN_DEPTS[0];

  // ── Google OAuth via Supabase ───────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setAuthError("");
    setAuthSuccess("");
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Supabase redirects to Google consent page
    } catch (err: any) {
      console.error("Google OAuth error:", err);
      setAuthError(
        err?.message ||
          "Google Sign-In requires Client ID & Secret configured in your Supabase Dashboard."
      );
      setIsLoading(false);
    }
  };

  // ── Microsoft / Azure AD SSO via Supabase ──────────────────────────────
  const handleAzureLogin = async () => {
    setAuthError("");
    setAuthSuccess("");
    setIsLoading(true);
    try {
      await signInWithAzure();
      // Supabase redirects to Microsoft Entra ID consent page
    } catch (err: any) {
      console.error("Azure OAuth error:", err);
      setAuthError(
        err?.message ||
          "Azure SSO requires Client ID & Tenant ID configured in your Supabase Dashboard."
      );
      setIsLoading(false);
    }
  };

  // ── Email / Password Sign In & Sign Up ──────────────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!email.trim() || !password.trim()) {
      setAuthError("Please provide both email and password.");
      return;
    }

    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      if (emailMode === "signup") {
        const res = await signUpWithEmail(email.trim(), password, fullName.trim());
        if (res.user) {
          if (res.session) {
            const userName = fullName.trim() || email.split("@")[0];
            onLogin({
              name: userName,
              email: email.trim(),
              role: "employee",
              department: "Product Engineering",
              avatar: userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "VJ",
            });
          } else {
            setAuthSuccess(
              "Account created! Please check your email to confirm registration or sign in."
            );
            setEmailMode("signin");
          }
        }
      } else {
        const res = await signInWithEmail(email.trim(), password);
        if (res.user) {
          const userName =
            res.user.user_metadata?.full_name || email.split("@")[0];
          onLogin({
            name: userName,
            email: res.user.email || email.trim(),
            role: "employee",
            department: "Product Engineering",
            avatar: userName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "VJ",
          });
        }
      }
    } catch (err: any) {
      console.error("Email auth error:", err);
      setAuthError(err?.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Quick Demo Login Bypass (For Testing / Hackathon Demos) ─────────────
  const handleQuickDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        name: "Vipul Jain",
        email: "vipul.jain@campus-enterprise.com",
        role: "employee",
        department: "Product Engineering",
        avatar: "VJ",
      });
      setIsLoading(false);
    }, 300);
  };

  // ── Department Admin Passcode Login ─────────────────────────────────────
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");

    const code = adminPasscode.trim();
    if (!code) {
      setAdminError(`Please enter the passcode for ${currentDept.label}. (Demo: ${currentDept.passcode})`);
      return;
    }

    // Check if entered code matches current department OR any configured admin department
    const matchedDept = ADMIN_DEPTS.find((d) => d.passcode === code);
    const targetDept = matchedDept || currentDept;

    if (code === targetDept.passcode || code === "admin2026") {
      setIsLoading(true);
      setTimeout(() => {
        onLogin({
          name: targetDept.leadName,
          email: targetDept.email,
          role: "admin",
          department: targetDept.department,
          adminDomain: targetDept.id,
          avatar: targetDept.avatar,
        });
        setIsLoading(false);
      }, 300);
    } else {
      setAdminError(`Invalid passcode for ${currentDept.label}. Expected demo passcode: ${currentDept.passcode}`);
    }
  };


  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Subtle Gradient Blobs */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          right: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0, 120, 212, 0.08) 0%, rgba(248, 250, 252, 0) 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          left: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0, 164, 239, 0.08) 0%, rgba(248, 250, 252, 0) 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Main Container Card */}
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          backgroundColor: "#FFFFFF",
          borderRadius: "20px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)",
          overflow: "hidden",
          zIndex: 10,
        }}
      >
        {/* Card Header with Microsoft Branding */}
        <div
          style={{
            padding: "28px 32px 20px 32px",
            borderBottom: "1px solid #F1F5F9",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {/* Microsoft 4-Color Logo */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "3px",
              width: "22px",
              height: "22px",
            }}
          >
            <div style={{ backgroundColor: "#F25022", borderRadius: "1.5px" }}></div>
            <div style={{ backgroundColor: "#7FBA00", borderRadius: "1.5px" }}></div>
            <div style={{ backgroundColor: "#00A4EF", borderRadius: "1.5px" }}></div>
            <div style={{ backgroundColor: "#FFB900", borderRadius: "1.5px" }}></div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px", margin: 0 }}>
                OneDesk
              </h1>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#0078D4",
                  backgroundColor: "#EFF6FC",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  border: "1px solid #C7E0F4",
                }}
              >
                Enterprise AI
              </span>
            </div>
            <p style={{ fontSize: "12.5px", color: "#64748B", margin: "4px 0 0 0" }}>
              Unified IT, HR, Finance & Facilities Workspace
            </p>
          </div>

          {/* Role Switcher Tabs (Employee vs Admin) */}
          <div
            style={{
              display: "flex",
              width: "100%",
              backgroundColor: "#F1F5F9",
              borderRadius: "10px",
              padding: "4px",
              gap: "4px",
              marginTop: "6px",
            }}
          >
            <button
              onClick={() => {
                setActiveTab("employee");
                setAdminError("");
                setAuthError("");
              }}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: activeTab === "employee" ? 700 : 500,
                backgroundColor: activeTab === "employee" ? "#FFFFFF" : "transparent",
                color: activeTab === "employee" ? "#0078D4" : "#64748B",
                border: "none",
                cursor: "pointer",
                boxShadow: activeTab === "employee" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <User style={{ width: "14px", height: "14px" }} />
              Employee Portal
            </button>

            <button
              onClick={() => {
                setActiveTab("admin");
                setAdminError("");
                setAuthError("");
              }}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: activeTab === "admin" ? 700 : 500,
                backgroundColor: activeTab === "admin" ? "#0078D4" : "transparent",
                color: activeTab === "admin" ? "#FFFFFF" : "#64748B",
                border: "none",
                cursor: "pointer",
                boxShadow: activeTab === "admin" ? "0 1px 4px rgba(0,120,212,0.3)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Shield style={{ width: "14px", height: "14px" }} />
              Admin Consoles
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: "24px 32px 30px 32px" }}>
          {/* Error / Success Banners */}
          {authError && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                padding: "10px 14px",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "10px",
                color: "#DC2626",
                fontSize: "12px",
                marginBottom: "14px",
                lineHeight: 1.5,
              }}
            >
              <AlertCircle style={{ width: "16px", height: "16px", flexShrink: 0, marginTop: "2px" }} />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                padding: "10px 14px",
                backgroundColor: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: "10px",
                color: "#16A34A",
                fontSize: "12px",
                marginBottom: "14px",
                lineHeight: 1.5,
              }}
            >
              <CheckCircle2 style={{ width: "16px", height: "16px", flexShrink: 0, marginTop: "2px" }} />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* ── Mode 1: Employee Workspace Sign-In ───────────────────────── */}
          {activeTab === "employee" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Method Switcher: OAuth vs Email */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid #E2E8F0",
                  paddingBottom: "10px",
                  marginBottom: "4px",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#1E293B" }}>
                  {authMethod === "oauth" ? "Single Sign-On (SSO)" : emailMode === "signin" ? "Sign In with Email" : "Create New Account"}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod(authMethod === "oauth" ? "email" : "oauth");
                    setAuthError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0078D4",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  {authMethod === "oauth" ? "Use Email & Password" : "Use Google / Azure SSO"}
                </button>
              </div>

              {/* ── Option A: Google & Azure OAuth ── */}
              {authMethod === "oauth" && (
                <>
                  {/* Google OAuth Button */}
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "12px",
                      padding: "11px 16px",
                      backgroundColor: "#FFFFFF",
                      border: "1.5px solid #CBD5E1",
                      borderRadius: "10px",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#1E293B",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = "#F8FAFC";
                        e.currentTarget.style.borderColor = "#94A3B8";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = "#FFFFFF";
                        e.currentTarget.style.borderColor = "#CBD5E1";
                      }
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {/* Microsoft Azure AD OAuth Button */}
                  <button
                    onClick={handleAzureLogin}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "12px",
                      padding: "11px 16px",
                      backgroundColor: "#FFFFFF",
                      border: "1.5px solid #CBD5E1",
                      borderRadius: "10px",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#1E293B",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = "#F8FAFC";
                        e.currentTarget.style.borderColor = "#94A3B8";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = "#FFFFFF";
                        e.currentTarget.style.borderColor = "#CBD5E1";
                      }
                    }}
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
                      <div style={{ backgroundColor: "#F25022" }}></div>
                      <div style={{ backgroundColor: "#7FBA00" }}></div>
                      <div style={{ backgroundColor: "#00A4EF" }}></div>
                      <div style={{ backgroundColor: "#FFB900" }}></div>
                    </div>
                    <span>Sign in with Microsoft / Azure AD</span>
                  </button>
                </>
              )}

              {/* ── Option B: Standard Email & Password Form ── */}
              {authMethod === "email" && (
                <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {emailMode === "signup" && (
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                        Full Name
                      </label>
                      <div style={{ position: "relative" }}>
                        <User style={{ position: "absolute", left: "10px", top: "10px", width: "16px", height: "16px", color: "#94A3B8" }} />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Vipul Jain"
                          required
                          style={{
                            width: "100%",
                            padding: "9px 12px 9px 34px",
                            border: "1px solid #CBD5E1",
                            borderRadius: "8px",
                            fontSize: "13px",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                      Work Email
                    </label>
                    <div style={{ position: "relative" }}>
                      <Mail style={{ position: "absolute", left: "10px", top: "10px", width: "16px", height: "16px", color: "#94A3B8" }} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        required
                        style={{
                          width: "100%",
                          padding: "9px 12px 9px 34px",
                          border: "1px solid #CBD5E1",
                          borderRadius: "8px",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                      Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <Lock style={{ position: "absolute", left: "10px", top: "10px", width: "16px", height: "16px", color: "#94A3B8" }} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        style={{
                          width: "100%",
                          padding: "9px 34px 9px 34px",
                          border: "1px solid #CBD5E1",
                          borderRadius: "8px",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "9px",
                          background: "none",
                          border: "none",
                          color: "#94A3B8",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {showPassword ? <EyeOff style={{ width: "15px", height: "15px" }} /> : <Eye style={{ width: "15px", height: "15px" }} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginTop: "6px",
                      backgroundColor: "#0078D4",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: isLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    {isLoading ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : null}
                    <span>{emailMode === "signin" ? "Sign In" : "Create Account"}</span>
                  </button>

                  <div style={{ textAlign: "center", marginTop: "4px" }}>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                      {emailMode === "signin" ? "Don't have an account? " : "Already registered? "}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailMode(emailMode === "signin" ? "signup" : "signin");
                        setAuthError("");
                        setAuthSuccess("");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0078D4",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {emailMode === "signin" ? "Sign Up" : "Sign In"}
                    </button>
                  </div>
                </form>
              )}

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  margin: "6px 0",
                  color: "#94A3B8",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }}></div>
                <span>Or Hackathon Demo</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }}></div>
              </div>

              {/* 1-Click Fast Demo Sign-In */}
              <button
                onClick={handleQuickDemo}
                disabled={isLoading}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 16px",
                  backgroundColor: "#EFF6FC",
                  border: "1.5px solid #C7E0F4",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#E0EEFA";
                  e.currentTarget.style.borderColor = "#0078D4";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#EFF6FC";
                  e.currentTarget.style.borderColor = "#C7E0F4";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      backgroundColor: "#0078D4",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "11px",
                    }}
                  >
                    VJ
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#0F172A" }}>
                      Vipul Jain (Fast Demo)
                    </div>
                    <div style={{ fontSize: "10.5px", color: "#64748B" }}>
                      Product Engineering • Instant Access
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#0078D4",
                    fontSize: "11.5px",
                    fontWeight: 700,
                  }}
                >
                  <span>Launch</span>
                  <ArrowRight style={{ width: "13px", height: "13px" }} />
                </div>
              </button>
            </div>
          )}

          {/* ── Mode 2: Department Admin Portals ─────────────────────────── */}
          {activeTab === "admin" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ textAlign: "center", marginBottom: "2px" }}>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1E293B", margin: "0 0 3px 0" }}>
                  Department Administrator Portals
                </h2>
                <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
                  Select your department console to authenticate with isolated credentials
                </p>
              </div>

              {/* Department Selection Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "8px",
                }}
              >
                {ADMIN_DEPTS.map((dept) => {
                  const isSelected = selectedDeptId === dept.id;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => {
                        setSelectedDeptId(dept.id);
                        setAdminPasscode(dept.passcode);
                        setAdminError("");
                      }}
                      style={{
                        padding: "10px 6px",
                        borderRadius: "10px",
                        border: isSelected ? `2px solid ${dept.color}` : "1px solid #E2E8F0",
                        backgroundColor: isSelected ? dept.bg : "#FFFFFF",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "5px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        boxShadow: isSelected ? `0 2px 8px ${dept.color}25` : "0 1px 2px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "8px",
                          backgroundColor: isSelected ? dept.color : "#F1F5F9",
                          color: isSelected ? "#FFFFFF" : dept.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        {dept.id === "IT" && <Laptop style={{ width: "15px", height: "15px" }} />}
                        {dept.id === "HR" && <Users style={{ width: "15px", height: "15px" }} />}
                        {dept.id === "Finance" && <CreditCard style={{ width: "15px", height: "15px" }} />}
                        {dept.id === "Facilities" && <Building2 style={{ width: "15px", height: "15px" }} />}
                        {dept.id === "ALL" && <Shield style={{ width: "15px", height: "15px" }} />}
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: isSelected ? 700 : 600,
                          color: isSelected ? dept.color : "#334155",
                          textAlign: "center",
                          lineHeight: 1.2,
                        }}
                      >
                        {dept.label}
                      </span>
                      <span
                        style={{
                          fontSize: "9.5px",
                          fontWeight: 600,
                          color: isSelected ? dept.color : "#94A3B8",
                          backgroundColor: isSelected ? "#FFFFFF" : "#F8FAFC",
                          padding: "1px 5px",
                          borderRadius: "4px",
                          border: isSelected ? `1px solid ${dept.border}` : "1px solid #E2E8F0",
                        }}
                      >
                        Pass: {dept.passcode}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Department Overview Banner */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  backgroundColor: currentDept.bg,
                  border: `1px solid ${currentDept.border}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: currentDept.color,
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {currentDept.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#0F172A" }}>
                      {currentDept.leadName}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748B" }}>
                      {currentDept.department}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    color: currentDept.color,
                    backgroundColor: "#FFFFFF",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    border: `1px solid ${currentDept.border}`,
                  }}
                >
                  Passcode: {currentDept.passcode}
                </span>
              </div>

              {/* Passcode Form */}
              <form onSubmit={handleAdminLogin} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                      {currentDept.label} Security Passcode
                    </label>
                    <button
                      type="button"
                      onClick={() => setAdminPasscode(currentDept.passcode)}
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: currentDept.color,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Fill Demo: {currentDept.passcode}
                    </button>
                  </div>

                  <div style={{ position: "relative" }}>
                    <KeyRound
                      style={{
                        position: "absolute",
                        left: "11px",
                        top: "10px",
                        width: "16px",
                        height: "16px",
                        color: "#94A3B8",
                      }}
                    />
                    <input
                      type="password"
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      placeholder={`Enter passcode (Demo: ${currentDept.passcode})`}
                      autoFocus
                      style={{
                        width: "100%",
                        padding: "9px 12px 9px 34px",
                        border: "1px solid #CBD5E1",
                        borderRadius: "8px",
                        fontSize: "13px",
                        outline: "none",
                        fontFamily: "monospace",
                        letterSpacing: "1px",
                      }}
                    />
                  </div>
                </div>

                {adminError && (
                  <div
                    style={{
                      color: "#DC2626",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: "#FEF2F2",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #FECACA",
                    }}
                  >
                    <AlertCircle style={{ width: "14px", height: "14px", flexShrink: 0 }} />
                    <span>{adminError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    backgroundColor: currentDept.color,
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: `0 2px 6px ${currentDept.color}40`,
                    transition: "all 0.15s ease",
                  }}
                >
                  {isLoading ? (
                    <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                  ) : (
                    <>
                      <span>Launch {currentDept.label}</span>
                      <ArrowRight style={{ width: "14px", height: "14px" }} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
