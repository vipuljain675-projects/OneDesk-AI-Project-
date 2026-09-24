// src/components/EmployeeDashboard.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  TrendingUp,
  MessageSquare,
  Clock,
  CheckCircle2,
  Laptop,
  Users,
  DollarSign,
  Building2,
  Search,
  FileText,
  CalendarDays,
  Zap,
  BookOpen,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Loader2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import {
  fetchEmployeeDashboardStats,
  EmployeeDashboardData,
  DashboardActivityItem,
  DashboardTrendingItem,
} from "@/lib/api";

interface DashboardProps {
  userName?: string;
  employeeId?: string;
  onNavigate?: (view: "chats" | "requests", queryOrThreadId?: string) => void;
}

export const EmployeeDashboard: React.FC<DashboardProps> = ({
  userName = "Employee",
  employeeId = "EMP001",
  onNavigate,
}) => {
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredDomain, setHoveredDomain] = useState<number | null>(null);
  const [hoveredRag, setHoveredRag] = useState<number | null>(null);

  const loadData = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchEmployeeDashboardStats(employeeId);
      setData(res);
    } catch (err) {
      console.error("Failed to load employee dashboard stats:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [employeeId]);

  const domainColors: Record<string, { bg: string; color: string; border: string }> = {
    IT: { bg: "#EFF6FC", color: "#0078D4", border: "#C7E0F4" },
    HR: { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
    Finance: { bg: "#FAF5FF", color: "#9333EA", border: "#E9D5FF" },
    Facilities: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
    General: { bg: "#F1F5F9", color: "#475569", border: "#E2E8F0" },
  };

  const domains = [
    {
      icon: Laptop,
      label: "IT & Hardware",
      key: "IT",
      desc: "Laptops, monitors, VPN access & credentials",
      prompt: "I need help with an IT hardware or software issue",
      color: "#0078D4",
      bg: "#EFF6FC",
    },
    {
      icon: Users,
      label: "HR & Policies",
      key: "HR",
      desc: "Leave entitlement, payroll & benefits",
      prompt: "What is the policy for annual and sick leaves?",
      color: "#16A34A",
      bg: "#F0FDF4",
    },
    {
      icon: DollarSign,
      label: "Finance",
      key: "Finance",
      desc: "Expenses, reimbursements & travel allowance",
      prompt: "I spent ₹4,200 on client dinner yesterday, file a reimbursement",
      color: "#9333EA",
      bg: "#FAF5FF",
    },
    {
      icon: Building2,
      label: "Facilities",
      key: "Facilities",
      desc: "Meeting rooms, visitor badges & campus",
      prompt: "My client Rahul Sharma is visiting campus tomorrow at 2 PM, generate a visitor badge",
      color: "#D97706",
      bg: "#FFFBEB",
    },
  ];


  const ragCapabilities = [
    {
      icon: Search,
      title: "Instant Policy Search",
      desc: "Find any HR or IT company policy from the vector database",
      prompt: "Explain the remote work and attendance policy",
      color: "#0078D4",
      bg: "#EFF6FC",
    },
    {
      icon: FileText,
      title: "Raise IT Tickets",
      desc: "Auto-create support tickets with SLA response tracking",
      prompt: "Raise an IT ticket for my flickering laptop screen",
      color: "#16A34A",
      bg: "#F0FDF4",
    },
    {
      icon: CalendarDays,
      title: "Apply for Leaves",
      desc: "Check balance and execute sick or casual leave requests",
      prompt: "Apply for 2 days of casual leave starting next Monday",
      color: "#9333EA",
      bg: "#FAF5FF",
    },
    {
      icon: Building2,
      title: "Room Booking",
      desc: "Reserve conference rooms across company campus",
      prompt: "Book a meeting room for 4 people today at 4 PM",
      color: "#D97706",
      bg: "#FFFBEB",
    },
    {
      icon: DollarSign,
      title: "Finance & Expenses",
      desc: "Reimbursement rules, per-diem limits and allowances",
      prompt: "What is the daily food and travel allowance on official trips?",
      color: "#059669",
      bg: "#ECFDF5",
    },
    {
      icon: BookOpen,
      title: "RAG Multi-Domain Search",
      desc: "Synthesized answers cited directly from enterprise docs",
      prompt: "What health insurance and medical benefits are provided?",
      color: "#DC2626",
      bg: "#FEF2F2",
    },
  ];

  const stats = [
    {
      icon: MessageSquare,
      value: loading ? "..." : String(data?.stats.questions_asked ?? 0),
      label: "Questions Asked",
      sub: `Top: ${data?.stats.most_used_domain || "IT"} Department`,
      subColor: "#0078D4",
      bg: "#EFF6FC",
      iconColor: "#0078D4",
    },
    {
      icon: CheckCircle2,
      value: loading ? "..." : String(data?.stats.resolved_queries ?? 0),
      label: "Resolved Services",
      sub: `${data?.stats.helpful_rate || "100%"} resolution rate`,
      subColor: "#16A34A",
      bg: "#F0FDF4",
      iconColor: "#16A34A",
    },
    {
      icon: Clock,
      value: loading ? "..." : String(data?.stats.open_requests ?? 0),
      label: "Active Requests",
      sub: `${data?.stats.total_requests ?? 0} total lifetime requests`,
      subColor: "#D97706",
      bg: "#FFFBEB",
      iconColor: "#D97706",
    },
    {
      icon: Activity,
      value: data?.stats.status || "Active",
      label: "System Status",
      sub: "Avg Response: < 1s",
      subColor: "#059669",
      bg: "#ECFDF5",
      iconColor: "#059669",
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowY: "auto",
        overflowX: "hidden",
        padding: "24px 28px",
        backgroundColor: "#F8FAFC",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#0F172A",
              marginBottom: "4px",
              letterSpacing: "-0.5px",
            }}
          >
            Welcome back, {userName}! 👋
          </h1>
          <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
            Live enterprise workspace • Real-time telemetry from Supabase
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Refresh Button */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#334155",
              cursor: refreshing || loading ? "not-allowed" : "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
          >
            <RefreshCw
              style={{
                width: "14px",
                height: "14px",
                color: "#64748B",
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh Live"}</span>
          </button>

          {/* Live Sync Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: "10px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#16A34A",
                display: "inline-block",
                boxShadow: "0 0 6px rgba(22,163,74,0.6)",
              }}
            />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#15803D" }}>
              Live Sync Active
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats Row (4 Real Metric Cards) ─────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "22px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              style={{
                minWidth: 0,
                boxSizing: "border-box",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.03)";
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: s.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <Icon style={{ width: "20px", height: "20px", color: s.iconColor }} />
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#0F172A",
                  lineHeight: 1,
                  marginBottom: "4px",
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "6px" }}>
                {s.label}
              </div>
              <div style={{ fontSize: "11px", color: s.subColor, fontWeight: 700 }}>
                {s.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Middle Row: Live Recent Activity + RAG Capabilities ────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)",
          gap: "16px",
          marginBottom: "22px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Real Live Recent Activity */}
        <div
          style={{
            minWidth: 0,
            width: "100%",
            boxSizing: "border-box",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "16px",
            padding: "22px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background: "#EFF6FC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Activity style={{ width: "18px", height: "18px", color: "#0078D4" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                  Live Activity Audit
                </h3>
                <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0 }}>
                  Real-time tickets, leaves &amp; agentic actions from Supabase
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate?.("requests")}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#0078D4",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FC")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              View Requests <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
            {loading && (
              <div style={{ padding: "30px", textAlign: "center", color: "#94A3B8", fontSize: "12.5px" }}>
                <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
                Loading live activity...
              </div>
            )}

            {!loading && (!data?.recent_activity || data.recent_activity.length === 0) && (
              <div
                style={{
                  padding: "36px 20px",
                  textAlign: "center",
                  background: "#F8FAFC",
                  borderRadius: "12px",
                  border: "1px dashed #CBD5E1",
                }}
              >
                <Sparkles style={{ width: "24px", height: "24px", color: "#94A3B8", margin: "0 auto 8px" }} />
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  No activity recorded yet
                </div>
                <div style={{ fontSize: "11.5px", color: "#94A3B8", marginBottom: "12px" }}>
                  Ask a question or perform an action to populate your live audit stream.
                </div>
                <button
                  onClick={() => onNavigate?.("chats", "Raise an IT ticket for my laptop screen")}
                  style={{
                    padding: "6px 14px",
                    background: "#0078D4",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Start First Action
                </button>
              </div>
            )}

            {!loading &&
              data?.recent_activity &&
              data.recent_activity.map((a: DashboardActivityItem) => {
                const dc = domainColors[a.domain] || domainColors.General;
                const isResolved = a.status.toLowerCase() === "resolved" || a.status.toLowerCase() === "approved" || a.status.toLowerCase() === "completed";
                const isOpen = a.status.toLowerCase() === "open" || a.status.toLowerCase() === "pending";

                return (
                  <div
                    key={a.id}
                    onClick={() => {
                      if (a.link_type === "requests") {
                        onNavigate?.("requests");
                      } else if (a.link_type === "chats" && a.thread_id) {
                        onNavigate?.("chats", a.thread_id);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      background: "#F8FAFC",
                      borderRadius: "10px",
                      border: "1px solid #E2E8F0",
                      cursor: "pointer",
                      transition: "all 0.12s",
                      minWidth: 0,
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#EFF6FC";
                      e.currentTarget.style.borderColor = "#C7E0F4";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#F8FAFC";
                      e.currentTarget.style.borderColor = "#E2E8F0";
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        backgroundColor: dc.bg,
                        color: dc.color,
                        border: `1px solid ${dc.border}`,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {a.domain}
                    </span>

                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: "12.5px",
                        fontWeight: 500,
                        color: "#0F172A",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.title}
                    </span>

                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "capitalize",
                        padding: "2px 8px",
                        borderRadius: "8px",
                        background: isResolved ? "#F0FDF4" : isOpen ? "#FFFBEB" : "#F1F5F9",
                        color: isResolved ? "#16A34A" : isOpen ? "#D97706" : "#64748B",
                        border: `1px solid ${isResolved ? "#BBF7D0" : isOpen ? "#FDE68A" : "#E2E8F0"}`,
                        flexShrink: 0,
                      }}
                    >
                      {a.status}
                    </span>

                    <span style={{ fontSize: "11px", color: "#94A3B8", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {a.time}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Interactive RAG Capabilities */}
        <div
          style={{
            minWidth: 0,
            width: "100%",
            boxSizing: "border-box",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "16px",
            padding: "22px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #EFF6FC, #FAF5FF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap style={{ width: "18px", height: "18px", color: "#0078D4" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                Interactive Workflows
              </h3>
              <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0 }}>
                Click any capability to trigger the AI assistant
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "10px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {ragCapabilities.map((r, i) => {
              const Icon = r.icon;
              const isHov = hoveredRag === i;
              return (
                <div
                  key={i}
                  onClick={() => onNavigate?.("chats", r.prompt)}
                  style={{
                    minWidth: 0,
                    boxSizing: "border-box",
                    padding: "12px",
                    background: isHov ? r.bg : "#F8FAFC",
                    borderRadius: "10px",
                    border: `1px solid ${isHov ? r.color + "55" : "#E2E8F0"}`,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={() => setHoveredRag(i)}
                  onMouseLeave={() => setHoveredRag(null)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <Icon style={{ width: "14px", height: "14px", color: r.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A" }}>
                      {r.title}
                    </span>
                  </div>
                  <p style={{ fontSize: "11px", color: "#64748B", margin: 0, lineHeight: 1.4 }}>
                    {r.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Trending Questions + Knowledge Domains ─────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 1fr)",
          gap: "16px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Real Live Trending Questions (Clickable) */}
        <div
          style={{
            minWidth: 0,
            width: "100%",
            boxSizing: "border-box",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "16px",
            padding: "22px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                background: "#FEF2F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp style={{ width: "18px", height: "18px", color: "#DC2626" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                Trending Organization Queries
              </h3>
              <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0 }}>
                Click to ask OneDesk AI instantly
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
            {loading && (
              <div style={{ padding: "20px", textAlign: "center", color: "#94A3B8", fontSize: "12px" }}>
                Loading trending topics...
              </div>
            )}

            {!loading &&
              data?.trending_questions &&
              data.trending_questions.map((item: DashboardTrendingItem, idx: number) => {
                const dc = domainColors[item.domain] || domainColors.General;
                return (
                  <div
                    key={idx}
                    onClick={() => onNavigate?.("chats", item.question)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      background: "#F8FAFC",
                      borderRadius: "10px",
                      border: "1px solid #E2E8F0",
                      cursor: "pointer",
                      transition: "all 0.12s",
                      minWidth: 0,
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#EFF6FC";
                      e.currentTarget.style.borderColor = "#0078D4";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#F8FAFC";
                      e.currentTarget.style.borderColor = "#E2E8F0";
                    }}
                  >
                    <span
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "6px",
                        background: idx < 3 ? "#EFF6FC" : "#F1F5F9",
                        color: idx < 3 ? "#0078D4" : "#64748B",
                        fontSize: "11px",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>

                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: "12.5px",
                        fontWeight: 500,
                        color: "#0F172A",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.question}
                    </span>

                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: "6px",
                        backgroundColor: dc.bg,
                        color: dc.color,
                        border: `1px solid ${dc.border}`,
                        flexShrink: 0,
                      }}
                    >
                      {item.domain}
                    </span>

                    <ArrowRight style={{ width: 13, height: 13, color: "#94A3B8", flexShrink: 0 }} />
                  </div>
                );
              })}
          </div>
        </div>

        {/* Knowledge Domains with Live Interaction Counts */}
        <div
          style={{
            minWidth: 0,
            width: "100%",
            boxSizing: "border-box",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "16px",
            padding: "22px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                background: "#F0FDF4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen style={{ width: "18px", height: "18px", color: "#16A34A" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                Enterprise Knowledge Domains
              </h3>
              <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0 }}>
                Click a department to launch domain RAG chat
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
            {domains.map((d, i) => {
              const Icon = d.icon;
              const isHov = hoveredDomain === i;
              const count = data?.domain_counts?.[d.key] ?? 0;

              return (
                <div
                  key={i}
                  onClick={() => onNavigate?.("chats", d.prompt)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    background: isHov ? d.bg : "#F8FAFC",
                    borderRadius: "12px",
                    border: `1px solid ${isHov ? d.color + "55" : "#E2E8F0"}`,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    minWidth: 0,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  onMouseEnter={() => setHoveredDomain(i)}
                  onMouseLeave={() => setHoveredDomain(null)}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: d.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: `1px solid ${d.color}22`,
                    }}
                  >
                    <Icon style={{ width: "18px", height: "18px", color: d.color }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                        {d.label}
                      </span>
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: "6px",
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          color: "#64748B",
                          flexShrink: 0,
                        }}
                      >
                        {count} records
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.desc}
                    </div>
                  </div>

                  <ArrowRight
                    style={{
                      width: "15px",
                      height: "15px",
                      color: isHov ? d.color : "#CBD5E1",
                      transition: "all 0.15s",
                      transform: isHov ? "translateX(2px)" : "translateX(0)",
                      flexShrink: 0,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
