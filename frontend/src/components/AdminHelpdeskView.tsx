// src/components/AdminHelpdeskView.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  CheckCircle2,
  Clock,
  RefreshCw,
  BarChart3,
  Cpu,
  Layers,
  Database,
  Users,
  Calendar,
  Ticket as TicketIcon,
  CreditCard,
  Building,
  UserCheck,
  Check,
  X,
  AlertTriangle,
  FileText,
} from "lucide-react";
import {
  fetchTickets,
  fetchLeaves,
  fetchBookings,
  fetchExpenses,
  fetchVisitorPasses,
  fetchReferrals,
  fetchAnalytics,
  fetchOneDeskUsers,
  updateTicketStatus,
  updateLeaveStatus,
  updateBookingStatus,
  updateExpenseStatus,
  updateVisitorPassStatus,
  updateReferralStatus,
  Ticket,
  LeaveRequest,
  RoomBooking,
  ExpenseClaim,
  VisitorPass,
  CandidateReferral,
  AnalyticsData,
  OneDeskUser,
} from "@/lib/api";

/** Format any UTC timestamp as IST date + time */
const toIST = (ts: string | undefined | null, dateOnly = false): string => {
  if (!ts) return "—";
  const opts: Intl.DateTimeFormatOptions = dateOnly
    ? { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" }
    : { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false };
  return new Date(ts).toLocaleString("en-IN", opts);
};

export type AdminTab =
  | "it_tickets"
  | "hr_leaves"
  | "finance_expenses"
  | "facilities_bookings"
  | "facilities_visitors"
  | "hr_referrals"
  | "analytics"
  | "users";

interface AdminHelpdeskViewProps {
  activeTab?: string;
  onTabChange?: (tab: any) => void;
  adminDomain?: "IT" | "HR" | "Finance" | "Facilities" | "ALL";
}

export const AdminHelpdeskView: React.FC<AdminHelpdeskViewProps> = ({
  activeTab = "it_tickets",
  onTabChange,
  adminDomain = "ALL",
}) => {
  const isTabAllowed = (tab: AdminTab): boolean => {
    if (!adminDomain || adminDomain === "ALL") return true;
    if (adminDomain === "IT") return ["it_tickets", "analytics", "users"].includes(tab);
    if (adminDomain === "HR") return ["hr_leaves", "hr_referrals", "users"].includes(tab);
    if (adminDomain === "Finance") return ["finance_expenses", "analytics", "users"].includes(tab);
    if (adminDomain === "Facilities") return ["facilities_bookings", "facilities_visitors", "users"].includes(tab);
    return true;
  };

  const getDefaultTabForDomain = (domain?: string): AdminTab => {
    if (domain === "HR") return "hr_leaves";
    if (domain === "Finance") return "finance_expenses";
    if (domain === "Facilities") return "facilities_visitors";
    return "it_tickets";
  };

  // Normalize initial tab
  const getNormalizedTab = (tabStr?: string): AdminTab => {
    let candidate: AdminTab = getDefaultTabForDomain(adminDomain);
    if (tabStr === "queue") candidate = getDefaultTabForDomain(adminDomain);
    else if (tabStr === "analytics") candidate = "analytics";
    else if (tabStr === "users") candidate = "users";
    else if (tabStr && [
      "it_tickets",
      "hr_leaves",
      "finance_expenses",
      "facilities_bookings",
      "facilities_visitors",
      "hr_referrals",
      "analytics",
      "users"
    ].includes(tabStr)) {
      candidate = tabStr as AdminTab;
    }

    if (!isTabAllowed(candidate)) {
      return getDefaultTabForDomain(adminDomain);
    }
    return candidate;
  };

  const [currentTab, setCurrentTab] = useState<AdminTab>(getNormalizedTab(activeTab));
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [visitors, setVisitors] = useState<VisitorPass[]>([]);
  const [referrals, setReferrals] = useState<CandidateReferral[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<OneDeskUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    setCurrentTab(getNormalizedTab(activeTab));
  }, [activeTab, adminDomain]);

  const setTab = (tab: AdminTab) => {
    setCurrentTab(tab);
    setFilterStatus("all");
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [tData, lData, eData, bData, vData, rData, aData, uData] = await Promise.all([
        fetchTickets().catch(() => []),
        fetchLeaves().catch(() => []),
        fetchExpenses().catch(() => []),
        fetchBookings().catch(() => []),
        fetchVisitorPasses().catch(() => []),
        fetchReferrals().catch(() => []),
        fetchAnalytics().catch(() => null),
        fetchOneDeskUsers().catch(() => []),
      ]);
      setTickets(tData);
      setLeaves(lData);
      setExpenses(eData);
      setBookings(bData);
      setVisitors(vData);
      setReferrals(rData);
      setAnalytics(aData);
      setUsers(uData);
    } catch (e) {
      console.error("Error loading admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Status Change Handlers ──────────────────────────────────────────────────
  const handleTicketStatus = async (ticketId: number, nextStatus: string) => {
    setUpdatingId(ticketId);
    try {
      await updateTicketStatus(ticketId, nextStatus);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: nextStatus } : t)));
    } catch {
      alert("Failed to update ticket status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLeaveStatus = async (leaveId: number, nextStatus: string) => {
    setUpdatingId(leaveId);
    try {
      await updateLeaveStatus(leaveId, nextStatus);
      setLeaves((prev) => prev.map((l) => (l.id === leaveId ? { ...l, status: nextStatus } : l)));
    } catch {
      alert("Failed to update leave status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExpenseStatus = async (claimId: number, nextStatus: string) => {
    setUpdatingId(claimId);
    try {
      await updateExpenseStatus(claimId, nextStatus);
      setExpenses((prev) => prev.map((e) => (e.id === claimId ? { ...e, status: nextStatus } : e)));
    } catch {
      alert("Failed to update expense status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBookingStatus = async (bookingId: number, nextStatus: string) => {
    setUpdatingId(bookingId);
    try {
      await updateBookingStatus(bookingId, nextStatus);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: nextStatus } : b)));
    } catch {
      alert("Failed to update room booking status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleVisitorStatus = async (passId: number, nextStatus: string) => {
    setUpdatingId(passId);
    try {
      await updateVisitorPassStatus(passId, nextStatus);
      setVisitors((prev) => prev.map((v) => (v.id === passId ? { ...v, status: nextStatus } : v)));
    } catch {
      alert("Failed to update visitor pass status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReferralStatus = async (referralId: number, nextStatus: string) => {
    setUpdatingId(referralId);
    try {
      await updateReferralStatus(referralId, nextStatus);
      setReferrals((prev) => prev.map((r) => (r.id === referralId ? { ...r, status: nextStatus } : r)));
    } catch {
      alert("Failed to update referral status");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Multi-Department KPI Counts ──────────────────────────────────────────
  const openTicketsCount = tickets.filter((t) => t.status.toLowerCase() === "open").length;
  const pendingLeavesCount = leaves.filter((l) => l.status.toLowerCase() === "pending").length;
  const pendingExpensesCount = expenses.filter((e) => e.status.toLowerCase() === "pending").length;
  const activeVisitorsCount = visitors.filter((v) => v.status.toLowerCase() === "issued" || v.status.toLowerCase() === "checked_in").length;

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px 32px",
        backgroundColor: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <div style={{ maxWidth: "1200px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* ── Top Header ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            paddingBottom: "16px",
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor:
                  adminDomain === "IT"
                    ? "#EFF6FC"
                    : adminDomain === "HR"
                    ? "#F0FDF4"
                    : adminDomain === "Finance"
                    ? "#ECFDF5"
                    : adminDomain === "Facilities"
                    ? "#FFF7ED"
                    : "#FAF5FF",
                border: `1px solid ${
                  adminDomain === "IT"
                    ? "#C7E0F4"
                    : adminDomain === "HR"
                    ? "#BBF7D0"
                    : adminDomain === "Finance"
                    ? "#A7F3D0"
                    : adminDomain === "Facilities"
                    ? "#FED7AA"
                    : "#E9D5FF"
                }`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color:
                  adminDomain === "IT"
                    ? "#0078D4"
                    : adminDomain === "HR"
                    ? "#16A34A"
                    : adminDomain === "Finance"
                    ? "#059669"
                    : adminDomain === "Facilities"
                    ? "#EA580C"
                    : "#9333EA",
                flexShrink: 0,
              }}
            >
              <Shield style={{ width: "24px", height: "24px" }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1 style={{ fontSize: "19px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                  {adminDomain === "IT"
                    ? "IT Infrastructure & Security Operations Center"
                    : adminDomain === "HR"
                    ? "People & Talent Operations Center"
                    : adminDomain === "Finance"
                    ? "Finance & Accounts Payable Control Center"
                    : adminDomain === "Facilities"
                    ? "Facilities & Campus Operations Center"
                    : "Enterprise Multi-Department Operations Center"}
                </h1>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    backgroundColor:
                      adminDomain === "IT"
                        ? "#0078D4"
                        : adminDomain === "HR"
                        ? "#16A34A"
                        : adminDomain === "Finance"
                        ? "#059669"
                        : adminDomain === "Facilities"
                        ? "#EA580C"
                        : "#0F172A",
                    color: "#FFFFFF",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {adminDomain === "IT"
                    ? "IT Admin Console"
                    : adminDomain === "HR"
                    ? "HR Admin Console"
                    : adminDomain === "Finance"
                    ? "Finance Admin Console"
                    : adminDomain === "Facilities"
                    ? "Facilities Admin Console"
                    : "Admin Master Console"}
                </span>
              </div>
              <p style={{ fontSize: "12.5px", color: "#64748B", margin: "2px 0 0 0" }}>
                {adminDomain === "IT"
                  ? "Real-time incident response, network router telemetry, and system diagnostics"
                  : adminDomain === "HR"
                  ? "Employee leave approvals, candidate referral tracking, and employee directory"
                  : adminDomain === "Finance"
                  ? "Expense claim verification, reimbursement disbursement, and corporate spending oversight"
                  : adminDomain === "Facilities"
                  ? "Campus visitor passes, meeting room reservations, and security access management"
                  : "Real-time governance, approval workflows, and router telemetry across IT, HR, Finance, and Facilities"}
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 16px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#334155",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              transition: "all 0.12s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
          >
            <RefreshCw style={{ width: "14px", height: "14px", animation: loading ? "spin 1s linear infinite" : "none" }} />
            <span>Sync Supabase</span>
          </button>
        </div>

        {/* ── Department-Tailored KPI Summary Cards ─────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
          }}
        >
          {/* If IT Admin */}
          {adminDomain === "IT" && (
            <>
              <div
                onClick={() => setTab("it_tickets")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: currentTab === "it_tickets" ? "1.5px solid #0078D4" : "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <span>IT Incidents</span>
                  <TicketIcon style={{ width: "16px", height: "16px", color: "#0078D4" }} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
                  {openTicketsCount} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>/ {tickets.length}</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#0078D4", marginTop: "2px" }}>
                  {openTicketsCount} awaiting resolution
                </div>
              </div>

              <div
                onClick={() => setTab("analytics")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: currentTab === "analytics" ? "1.5px solid #0078D4" : "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <span>Router Network Health</span>
                  <BarChart3 style={{ width: "16px", height: "16px", color: "#0078D4" }} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#16A34A", marginTop: "8px" }}>
                  100% <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>Online</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#16A34A", marginTop: "2px" }}>
                  All network edge nodes nominal
                </div>
              </div>

              <div
                onClick={() => setTab("users")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: currentTab === "users" ? "1.5px solid #0078D4" : "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <span>Directory Personnel</span>
                  <Users style={{ width: "16px", height: "16px", color: "#0078D4" }} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
                  {users.length} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>Users</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#0078D4", marginTop: "2px" }}>
                  Registered Active Directory users
                </div>
              </div>
            </>
          )}

          {/* If HR Admin */}
          {adminDomain === "HR" && (
            <>
              <div
                onClick={() => setTab("hr_leaves")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: currentTab === "hr_leaves" ? "1.5px solid #16A34A" : "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <span>HR Leave Requests</span>
                  <Calendar style={{ width: "16px", height: "16px", color: "#16A34A" }} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
                  {pendingLeavesCount} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>/ {leaves.length}</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#16A34A", marginTop: "2px" }}>
                  {pendingLeavesCount} pending approval
                </div>
              </div>

              <div
                onClick={() => setTab("hr_referrals")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: currentTab === "hr_referrals" ? "1.5px solid #7C3AED" : "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <span>Candidate Referrals</span>
                  <Users style={{ width: "16px", height: "16px", color: "#7C3AED" }} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
                  {referrals.length} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>Talent</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#7C3AED", marginTop: "2px" }}>
                  Active recruitment pipeline
                </div>
              </div>

              <div
                onClick={() => setTab("users")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: currentTab === "users" ? "1.5px solid #16A34A" : "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <span>Directory Employees</span>
                  <Users style={{ width: "16px", height: "16px", color: "#16A34A" }} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
                  {users.length} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>Employees</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#16A34A", marginTop: "2px" }}>
                  Corporate roster active
                </div>
              </div>
            </>
          )}

          {/* If Finance Admin */}
          {adminDomain === "Finance" && (
            <>
              <div
                onClick={() => setTab("finance_expenses")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: currentTab === "finance_expenses" ? "1.5px solid #059669" : "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <span>Finance Claims</span>
                  <CreditCard style={{ width: "16px", height: "16px", color: "#059669" }} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
                  {pendingExpensesCount} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>/ {expenses.length}</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#059669", marginTop: "2px" }}>
                  {pendingExpensesCount} awaiting reimbursement
                </div>
              </div>

              <div
                onClick={() => setTab("analytics")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: currentTab === "analytics" ? "1.5px solid #059669" : "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <span>Processed Reimbursements</span>
                  <CheckCircle2 style={{ width: "16px", height: "16px", color: "#059669" }} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#059669", marginTop: "8px" }}>
                  {expenses.filter((e) => e.status.toLowerCase() === "reimbursed").length} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>Settled</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#059669", marginTop: "2px" }}>
                  Disbursement completed
                </div>
              </div>

              <div
                onClick={() => setTab("users")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: currentTab === "users" ? "1.5px solid #059669" : "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <span>Corporate Payees</span>
                  <Users style={{ width: "16px", height: "16px", color: "#059669" }} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
                  {users.length} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>Accounts</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#059669", marginTop: "2px" }}>
                  Eligible expense claimants
                </div>
              </div>
            </>
          )}

          {/* If Facilities Admin */}
          {adminDomain === "Facilities" && (
            <>
              <div
                onClick={() => setTab("facilities_visitors")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: currentTab === "facilities_visitors" ? "1.5px solid #EA580C" : "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <span>Campus Security Badges</span>
                  <UserCheck style={{ width: "16px", height: "16px", color: "#EA580C" }} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
                  {activeVisitorsCount} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>/ {visitors.length}</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#EA580C", marginTop: "2px" }}>
                  Active visitor access passes
                </div>
              </div>

              <div
                onClick={() => setTab("facilities_bookings")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: currentTab === "facilities_bookings" ? "1.5px solid #9333EA" : "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <span>Meeting Room Reservations</span>
                  <Building style={{ width: "16px", height: "16px", color: "#9333EA" }} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
                  {bookings.length} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>Rooms</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#9333EA", marginTop: "2px" }}>
                  Booked conference spaces
                </div>
              </div>

              <div
                onClick={() => setTab("users")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: currentTab === "users" ? "1.5px solid #EA580C" : "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <span>Campus Badge Holders</span>
                  <Users style={{ width: "16px", height: "16px", color: "#EA580C" }} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
                  {users.length} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>Personnel</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#EA580C", marginTop: "2px" }}>
                  Security access active
                </div>
              </div>
            </>
          )}

          {/* If Master Admin (ALL) */}
          {(!adminDomain || adminDomain === "ALL") && (
            <>
              {/* Card 1: IT Incidents */}
              <div
                onClick={() => setTab("it_tickets")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: currentTab === "it_tickets" ? "1.5px solid #0078D4" : "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <span>IT Incidents</span>
                  <TicketIcon style={{ width: "16px", height: "16px", color: "#0078D4" }} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
                  {openTicketsCount} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>/ {tickets.length}</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#0078D4", marginTop: "2px" }}>
                  {openTicketsCount} awaiting resolution
                </div>
              </div>

              {/* Card 2: HR Leaves */}
              <div
                onClick={() => setTab("hr_leaves")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: currentTab === "hr_leaves" ? "1.5px solid #16A34A" : "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <span>HR Leave Requests</span>
                  <Calendar style={{ width: "16px", height: "16px", color: "#16A34A" }} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
                  {pendingLeavesCount} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>/ {leaves.length}</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#16A34A", marginTop: "2px" }}>
                  {pendingLeavesCount} pending approval
                </div>
              </div>

              {/* Card 3: Finance Claims */}
              <div
                onClick={() => setTab("finance_expenses")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: currentTab === "finance_expenses" ? "1.5px solid #059669" : "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <span>Finance Expenses</span>
                  <CreditCard style={{ width: "16px", height: "16px", color: "#059669" }} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
                  {pendingExpensesCount} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>/ {expenses.length}</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#059669", marginTop: "2px" }}>
                  {pendingExpensesCount} awaiting reimbursement
                </div>
              </div>

              {/* Card 4: Facilities Visitors & Rooms */}
              <div
                onClick={() => setTab("facilities_visitors")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: currentTab === "facilities_visitors" ? "1.5px solid #EA580C" : "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
                  <span>Campus Security Badges</span>
                  <UserCheck style={{ width: "16px", height: "16px", color: "#EA580C" }} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
                  {activeVisitorsCount} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>/ {visitors.length}</span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#EA580C", marginTop: "2px" }}>
                  Active visitor access passes
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Multi-Department Navigation Tabs (Filtered by RBAC) ─────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            borderBottom: "1px solid #E2E8F0",
            paddingBottom: "10px",
            overflowX: "auto",
          }}
        >
          {/* IT Incidents Tab */}
          {isTabAllowed("it_tickets") && (
            <button
              onClick={() => setTab("it_tickets")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                backgroundColor: currentTab === "it_tickets" ? "#EFF6FC" : "transparent",
                color: currentTab === "it_tickets" ? "#0078D4" : "#64748B",
                boxShadow: currentTab === "it_tickets" ? "inset 0 0 0 1.5px #C7E0F4" : "none",
                whiteSpace: "nowrap",
              }}
            >
              <TicketIcon style={{ width: "14px", height: "14px" }} />
              <span>IT Incidents</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", backgroundColor: currentTab === "it_tickets" ? "#0078D4" : "#E2E8F0", color: currentTab === "it_tickets" ? "#FFFFFF" : "#475569" }}>
                {tickets.length}
              </span>
            </button>
          )}

          {/* HR Leaves Tab */}
          {isTabAllowed("hr_leaves") && (
            <button
              onClick={() => setTab("hr_leaves")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                backgroundColor: currentTab === "hr_leaves" ? "#F0FDF4" : "transparent",
                color: currentTab === "hr_leaves" ? "#16A34A" : "#64748B",
                boxShadow: currentTab === "hr_leaves" ? "inset 0 0 0 1.5px #BBF7D0" : "none",
                whiteSpace: "nowrap",
              }}
            >
              <Calendar style={{ width: "14px", height: "14px" }} />
              <span>HR Leaves</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", backgroundColor: currentTab === "hr_leaves" ? "#16A34A" : "#E2E8F0", color: currentTab === "hr_leaves" ? "#FFFFFF" : "#475569" }}>
                {leaves.length}
              </span>
            </button>
          )}

          {/* Finance Claims Tab */}
          {isTabAllowed("finance_expenses") && (
            <button
              onClick={() => setTab("finance_expenses")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                backgroundColor: currentTab === "finance_expenses" ? "#ECFDF5" : "transparent",
                color: currentTab === "finance_expenses" ? "#059669" : "#64748B",
                boxShadow: currentTab === "finance_expenses" ? "inset 0 0 0 1.5px #A7F3D0" : "none",
                whiteSpace: "nowrap",
              }}
            >
              <CreditCard style={{ width: "14px", height: "14px" }} />
              <span>Finance Expenses</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", backgroundColor: currentTab === "finance_expenses" ? "#059669" : "#E2E8F0", color: currentTab === "finance_expenses" ? "#FFFFFF" : "#475569" }}>
                {expenses.length}
              </span>
            </button>
          )}

          {/* Room Bookings Tab */}
          {isTabAllowed("facilities_bookings") && (
            <button
              onClick={() => setTab("facilities_bookings")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                backgroundColor: currentTab === "facilities_bookings" ? "#FAF5FF" : "transparent",
                color: currentTab === "facilities_bookings" ? "#9333EA" : "#64748B",
                boxShadow: currentTab === "facilities_bookings" ? "inset 0 0 0 1.5px #E9D5FF" : "none",
                whiteSpace: "nowrap",
              }}
            >
              <Building style={{ width: "14px", height: "14px" }} />
              <span>Room Bookings</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", backgroundColor: currentTab === "facilities_bookings" ? "#9333EA" : "#E2E8F0", color: currentTab === "facilities_bookings" ? "#FFFFFF" : "#475569" }}>
                {bookings.length}
              </span>
            </button>
          )}

          {/* Visitor Badges Tab */}
          {isTabAllowed("facilities_visitors") && (
            <button
              onClick={() => setTab("facilities_visitors")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                backgroundColor: currentTab === "facilities_visitors" ? "#FFF7ED" : "transparent",
                color: currentTab === "facilities_visitors" ? "#EA580C" : "#64748B",
                boxShadow: currentTab === "facilities_visitors" ? "inset 0 0 0 1.5px #FED7AA" : "none",
                whiteSpace: "nowrap",
              }}
            >
              <UserCheck style={{ width: "14px", height: "14px" }} />
              <span>Visitor Badges</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", backgroundColor: currentTab === "facilities_visitors" ? "#EA580C" : "#E2E8F0", color: currentTab === "facilities_visitors" ? "#FFFFFF" : "#475569" }}>
                {visitors.length}
              </span>
            </button>
          )}

          {/* Candidate Referrals Tab */}
          {isTabAllowed("hr_referrals") && (
            <button
              onClick={() => setTab("hr_referrals")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                backgroundColor: currentTab === "hr_referrals" ? "#F5F3FF" : "transparent",
                color: currentTab === "hr_referrals" ? "#7C3AED" : "#64748B",
                boxShadow: currentTab === "hr_referrals" ? "inset 0 0 0 1.5px #DDD6FE" : "none",
                whiteSpace: "nowrap",
              }}
            >
              <Users style={{ width: "14px", height: "14px" }} />
              <span>Candidate Referrals</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", backgroundColor: currentTab === "hr_referrals" ? "#7C3AED" : "#E2E8F0", color: currentTab === "hr_referrals" ? "#FFFFFF" : "#475569" }}>
                {referrals.length}
              </span>
            </button>
          )}

          {/* Telemetry Tab */}
          {isTabAllowed("analytics") && (
            <button
              onClick={() => setTab("analytics")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                backgroundColor: currentTab === "analytics" ? "#EFF6FC" : "transparent",
                color: currentTab === "analytics" ? "#0078D4" : "#64748B",
                boxShadow: currentTab === "analytics" ? "inset 0 0 0 1.5px #C7E0F4" : "none",
                whiteSpace: "nowrap",
              }}
            >
              <BarChart3 style={{ width: "14px", height: "14px" }} />
              <span>Router Telemetry</span>
            </button>
          )}

          {/* Users Tab */}
          {isTabAllowed("users") && (
            <button
              onClick={() => setTab("users")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                backgroundColor: currentTab === "users" ? "#EFF6FC" : "transparent",
                color: currentTab === "users" ? "#0078D4" : "#64748B",
                boxShadow: currentTab === "users" ? "inset 0 0 0 1.5px #C7E0F4" : "none",
                whiteSpace: "nowrap",
              }}
            >
              <Users style={{ width: "14px", height: "14px" }} />
              <span>Users</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", backgroundColor: currentTab === "users" ? "#0078D4" : "#E2E8F0", color: currentTab === "users" ? "#FFFFFF" : "#475569" }}>
                {users.length}
              </span>
            </button>
          )}
        </div>

        {/* ── TAB 1: IT Incidents Queue ───────────────────────────────────── */}
        {currentTab === "it_tickets" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748B" }}>Filter Status:</span>
              {["all", "open", "in_progress", "resolved"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    textTransform: "capitalize",
                    cursor: "pointer",
                    border: "1px solid",
                    backgroundColor: filterStatus === s ? "#0078D4" : "#FFFFFF",
                    color: filterStatus === s ? "#FFFFFF" : "#475569",
                    borderColor: filterStatus === s ? "#0078D4" : "#CBD5E1",
                  }}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 18px" }}>Ticket ID</th>
                    <th style={{ padding: "12px 18px" }}>Issue Description</th>
                    <th style={{ padding: "12px 18px" }}>Employee</th>
                    <th style={{ padding: "12px 18px" }}>Priority</th>
                    <th style={{ padding: "12px 18px" }}>Status</th>
                    <th style={{ padding: "12px 18px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets
                    .filter((t) => filterStatus === "all" || t.status.toLowerCase() === filterStatus.toLowerCase())
                    .map((t) => {
                      const isUp = updatingId === t.id;
                      const s = t.status.toLowerCase();
                      return (
                        <tr key={t.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "14px 18px", fontFamily: "monospace", fontWeight: 700, color: "#0078D4" }}>{t.ticket_number}</td>
                          <td style={{ padding: "14px 18px", color: "#0F172A", fontWeight: 500, maxWidth: "340px" }}>
                            <div>{t.issue}</div>
                            <div style={{ fontSize: "10.5px", color: "#94A3B8", marginTop: "2px" }}>Created: {toIST(t.created_at)}</div>
                          </td>
                          <td style={{ padding: "14px 18px", color: "#475569", fontSize: "11.5px" }}>{t.employee_id || "EMP001"}</td>
                          <td style={{ padding: "14px 18px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", padding: "2px 8px", borderRadius: "4px", backgroundColor: t.priority === "high" ? "#FEF2F2" : t.priority === "medium" ? "#FFFBEB" : "#F1F5F9", color: t.priority === "high" ? "#DC2626" : t.priority === "medium" ? "#D97706" : "#475569", border: t.priority === "high" ? "1px solid #FECACA" : t.priority === "medium" ? "1px solid #FDE68A" : "1px solid #E2E8F0" }}>
                              {t.priority}
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", backgroundColor: s === "open" ? "#EFF6FC" : s === "in_progress" ? "#FFFBEB" : "#F0FDF4", color: s === "open" ? "#0078D4" : s === "in_progress" ? "#D97706" : "#16A34A", border: s === "open" ? "1px solid #C7E0F4" : s === "in_progress" ? "1px solid #FDE68A" : "1px solid #BBF7D0" }}>
                              {s === "in_progress" ? "In Progress" : s.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px", textAlign: "right" }}>
                            {s === "open" && (
                              <button onClick={() => handleTicketStatus(t.id, "in_progress")} disabled={isUp} style={{ padding: "6px 12px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, backgroundColor: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A", cursor: "pointer" }}>
                                {isUp ? "Updating..." : "Start Work"}
                              </button>
                            )}
                            {s === "in_progress" && (
                              <button onClick={() => handleTicketStatus(t.id, "resolved")} disabled={isUp} style={{ padding: "6px 14px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, backgroundColor: "#16A34A", color: "#FFFFFF", border: "none", cursor: "pointer" }}>
                                {isUp ? "Resolving..." : "Mark Resolved"}
                              </button>
                            )}
                            {s === "resolved" && (
                              <button onClick={() => handleTicketStatus(t.id, "open")} disabled={isUp} style={{ fontSize: "11px", color: "#94A3B8", background: "none", border: "none", textDecoration: "underline", cursor: "pointer" }}>
                                Re-open
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: HR Leaves Queue ──────────────────────────────────────── */}
        {currentTab === "hr_leaves" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 18px" }}>Leave Type</th>
                    <th style={{ padding: "12px 18px" }}>Employee</th>
                    <th style={{ padding: "12px 18px" }}>Dates</th>
                    <th style={{ padding: "12px 18px" }}>Reason</th>
                    <th style={{ padding: "12px 18px" }}>Status</th>
                    <th style={{ padding: "12px 18px", textAlign: "right" }}>HR Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>No leave requests found.</td></tr>
                  ) : (
                    leaves.map((l) => {
                      const isUp = updatingId === l.id;
                      const s = l.status.toLowerCase();
                      return (
                        <tr key={l.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "14px 18px", fontWeight: 700, color: "#0F172A", textTransform: "capitalize" }}>{l.leave_type} Leave</td>
                          <td style={{ padding: "14px 18px", color: "#475569", fontSize: "11.5px" }}>{l.employee_id}</td>
                          <td style={{ padding: "14px 18px", color: "#334155" }}>{l.start_date} to {l.end_date}</td>
                          <td style={{ padding: "14px 18px", color: "#64748B", maxWidth: "250px" }}>{l.reason || "Personal"}</td>
                          <td style={{ padding: "14px 18px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", backgroundColor: s === "approved" ? "#F0FDF4" : s === "rejected" ? "#FEF2F2" : "#FFFBEB", color: s === "approved" ? "#16A34A" : s === "rejected" ? "#DC2626" : "#D97706", border: s === "approved" ? "1px solid #BBF7D0" : s === "rejected" ? "1px solid #FECACA" : "1px solid #FDE68A" }}>
                              {s.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px", textAlign: "right" }}>
                            {s === "pending" ? (
                              <div style={{ display: "inline-flex", gap: "6px" }}>
                                <button onClick={() => handleLeaveStatus(l.id, "approved")} disabled={isUp} style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, backgroundColor: "#16A34A", color: "#FFFFFF", border: "none", cursor: "pointer" }}>
                                  Approve
                                </button>
                                <button onClick={() => handleLeaveStatus(l.id, "rejected")} disabled={isUp} style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer" }}>
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: "11px", color: "#94A3B8" }}>Decision Logged</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: Finance Expense Claims ────────────────────────────────── */}
        {currentTab === "finance_expenses" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 18px" }}>Claim #</th>
                    <th style={{ padding: "12px 18px" }}>Employee</th>
                    <th style={{ padding: "12px 18px" }}>Amount</th>
                    <th style={{ padding: "12px 18px" }}>Category</th>
                    <th style={{ padding: "12px 18px" }}>Description</th>
                    <th style={{ padding: "12px 18px" }}>Status</th>
                    <th style={{ padding: "12px 18px", textAlign: "right" }}>Finance Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>No expense claims filed yet.</td></tr>
                  ) : (
                    expenses.map((e) => {
                      const isUp = updatingId === e.id;
                      const s = e.status.toLowerCase();
                      return (
                        <tr key={e.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "14px 18px", fontFamily: "monospace", fontWeight: 700, color: "#059669" }}>{e.claim_number}</td>
                          <td style={{ padding: "14px 18px", color: "#475569", fontSize: "11.5px" }}>{e.employee_id}</td>
                          <td style={{ padding: "14px 18px", fontWeight: 700, color: "#0F172A" }}>{e.amount}</td>
                          <td style={{ padding: "14px 18px", color: "#334155" }}>{e.category}</td>
                          <td style={{ padding: "14px 18px", color: "#64748B", maxWidth: "250px" }}>
                            <div>{e.description}</div>
                            <div style={{ fontSize: "10.5px", color: "#94A3B8" }}>Date: {e.expense_date}</div>
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", backgroundColor: s === "reimbursed" || s === "approved" ? "#ECFDF5" : s === "rejected" ? "#FEF2F2" : "#FFFBEB", color: s === "reimbursed" || s === "approved" ? "#059669" : s === "rejected" ? "#DC2626" : "#D97706", border: s === "reimbursed" || s === "approved" ? "1px solid #A7F3D0" : s === "rejected" ? "1px solid #FECACA" : "1px solid #FDE68A" }}>
                              {s.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px", textAlign: "right" }}>
                            {s === "pending" && (
                              <div style={{ display: "inline-flex", gap: "6px" }}>
                                <button onClick={() => handleExpenseStatus(e.id, "approved")} disabled={isUp} style={{ padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: "#059669", color: "#FFFFFF", border: "none", cursor: "pointer" }}>
                                  Approve
                                </button>
                                <button onClick={() => handleExpenseStatus(e.id, "rejected")} disabled={isUp} style={{ padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer" }}>
                                  Reject
                                </button>
                              </div>
                            )}
                            {s === "approved" && (
                              <button onClick={() => handleExpenseStatus(e.id, "reimbursed")} disabled={isUp} style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: "#16A34A", color: "#FFFFFF", border: "none", cursor: "pointer" }}>
                                Mark Reimbursed
                              </button>
                            )}
                            {s === "reimbursed" && (
                              <span style={{ fontSize: "11px", color: "#059669", fontWeight: 600 }}>Paid Out</span>
                            )}
                            {s === "rejected" && (
                              <span style={{ fontSize: "11px", color: "#94A3B8" }}>Closed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 4: Facilities Room Bookings ─────────────────────────────── */}
        {currentTab === "facilities_bookings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 18px" }}>Room</th>
                    <th style={{ padding: "12px 18px" }}>Host</th>
                    <th style={{ padding: "12px 18px" }}>Date</th>
                    <th style={{ padding: "12px 18px" }}>Time Slot</th>
                    <th style={{ padding: "12px 18px" }}>Purpose</th>
                    <th style={{ padding: "12px 18px" }}>Status</th>
                    <th style={{ padding: "12px 18px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>No room bookings found.</td></tr>
                  ) : (
                    bookings.map((b) => {
                      const isUp = updatingId === b.id;
                      const s = b.status.toLowerCase();
                      return (
                        <tr key={b.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "14px 18px", fontWeight: 700, color: "#9333EA" }}>{b.room_name}</td>
                          <td style={{ padding: "14px 18px", color: "#475569", fontSize: "11.5px" }}>{b.employee_id}</td>
                          <td style={{ padding: "14px 18px", color: "#334155" }}>{b.booking_date}</td>
                          <td style={{ padding: "14px 18px", color: "#334155" }}>{b.time_slot}</td>
                          <td style={{ padding: "14px 18px", color: "#64748B" }}>{b.purpose || "Meeting"}</td>
                          <td style={{ padding: "14px 18px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", backgroundColor: s === "confirmed" ? "#FAF5FF" : "#FEF2F2", color: s === "confirmed" ? "#9333EA" : "#DC2626", border: s === "confirmed" ? "1px solid #E9D5FF" : "1px solid #FECACA" }}>
                              {s.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px", textAlign: "right" }}>
                            {s === "confirmed" ? (
                              <button onClick={() => handleBookingStatus(b.id, "cancelled")} disabled={isUp} style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer" }}>
                                Cancel Slot
                              </button>
                            ) : (
                              <button onClick={() => handleBookingStatus(b.id, "confirmed")} disabled={isUp} style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: "#FAF5FF", color: "#9333EA", border: "1px solid #E9D5FF", cursor: "pointer" }}>
                                Re-confirm
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 5: Facilities Visitor Badges ────────────────────────────── */}
        {currentTab === "facilities_visitors" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 18px" }}>Badge #</th>
                    <th style={{ padding: "12px 18px" }}>Visitor Name</th>
                    <th style={{ padding: "12px 18px" }}>Host Employee</th>
                    <th style={{ padding: "12px 18px" }}>Visit Date & Time</th>
                    <th style={{ padding: "12px 18px" }}>Purpose</th>
                    <th style={{ padding: "12px 18px" }}>Status</th>
                    <th style={{ padding: "12px 18px", textAlign: "right" }}>Security Gate</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>No visitor badges issued yet.</td></tr>
                  ) : (
                    visitors.map((v) => {
                      const isUp = updatingId === v.id;
                      const s = v.status.toLowerCase();
                      return (
                        <tr key={v.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "14px 18px", fontFamily: "monospace", fontWeight: 700, color: "#EA580C" }}>{v.pass_number}</td>
                          <td style={{ padding: "14px 18px", fontWeight: 600, color: "#0F172A" }}>
                            <div>{v.visitor_name}</div>
                            {v.visitor_email && <div style={{ fontSize: "11px", color: "#94A3B8" }}>{v.visitor_email}</div>}
                          </td>
                          <td style={{ padding: "14px 18px", color: "#475569", fontSize: "11.5px" }}>{v.employee_id}</td>
                          <td style={{ padding: "14px 18px", color: "#334155" }}>{v.visit_date} ({v.time_slot})</td>
                          <td style={{ padding: "14px 18px", color: "#64748B" }}>{v.purpose || "Campus Visit"}</td>
                          <td style={{ padding: "14px 18px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", backgroundColor: s === "checked_in" ? "#F0FDF4" : s === "issued" ? "#FFF7ED" : "#F1F5F9", color: s === "checked_in" ? "#16A34A" : s === "issued" ? "#EA580C" : "#64748B", border: s === "checked_in" ? "1px solid #BBF7D0" : s === "issued" ? "1px solid #FED7AA" : "1px solid #E2E8F0" }}>
                              {s === "checked_in" ? "Checked In" : s.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px", textAlign: "right" }}>
                            {s === "issued" && (
                              <button onClick={() => handleVisitorStatus(v.id, "checked_in")} disabled={isUp} style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: "#16A34A", color: "#FFFFFF", border: "none", cursor: "pointer" }}>
                                Check In
                              </button>
                            )}
                            {s === "checked_in" && (
                              <span style={{ fontSize: "11px", color: "#16A34A", fontWeight: 600 }}>On Campus</span>
                            )}
                            {s !== "issued" && s !== "checked_in" && (
                              <span style={{ fontSize: "11px", color: "#94A3B8" }}>Inactive</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 6: HR / Hiring Candidate Referrals ──────────────────────── */}
        {currentTab === "hr_referrals" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 18px" }}>Ref #</th>
                    <th style={{ padding: "12px 18px" }}>Candidate</th>
                    <th style={{ padding: "12px 18px" }}>Target Role</th>
                    <th style={{ padding: "12px 18px" }}>Referred By</th>
                    <th style={{ padding: "12px 18px" }}>Notes</th>
                    <th style={{ padding: "12px 18px" }}>Status</th>
                    <th style={{ padding: "12px 18px", textAlign: "right" }}>Pipeline Action</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>No candidate referrals submitted yet.</td></tr>
                  ) : (
                    referrals.map((r) => {
                      const isUp = updatingId === r.id;
                      const s = r.status.toLowerCase();
                      return (
                        <tr key={r.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "14px 18px", fontFamily: "monospace", fontWeight: 700, color: "#7C3AED" }}>{r.referral_number}</td>
                          <td style={{ padding: "14px 18px", fontWeight: 600, color: "#0F172A" }}>
                            <div>{r.candidate_name}</div>
                            {r.candidate_email && <div style={{ fontSize: "11px", color: "#94A3B8" }}>{r.candidate_email}</div>}
                          </td>
                          <td style={{ padding: "14px 18px", color: "#1E293B", fontWeight: 500 }}>{r.role}</td>
                          <td style={{ padding: "14px 18px", color: "#475569", fontSize: "11.5px" }}>{r.employee_id}</td>
                          <td style={{ padding: "14px 18px", color: "#64748B", maxWidth: "240px" }}>{r.notes || "—"}</td>
                          <td style={{ padding: "14px 18px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", backgroundColor: s === "hired" ? "#F0FDF4" : s === "rejected" ? "#FEF2F2" : "#F5F3FF", color: s === "hired" ? "#16A34A" : s === "rejected" ? "#DC2626" : "#7C3AED", border: s === "hired" ? "1px solid #BBF7D0" : s === "rejected" ? "1px solid #FECACA" : "1px solid #DDD6FE" }}>
                              {s.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px", textAlign: "right" }}>
                            {s === "submitted" && (
                              <button onClick={() => handleReferralStatus(r.id, "in_review")} disabled={isUp} style={{ padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: "#F5F3FF", color: "#7C3AED", border: "1px solid #DDD6FE", cursor: "pointer" }}>
                                Review Candidate
                              </button>
                            )}
                            {s === "in_review" && (
                              <button onClick={() => handleReferralStatus(r.id, "interviewing")} disabled={isUp} style={{ padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: "#EFF6FC", color: "#0078D4", border: "1px solid #C7E0F4", cursor: "pointer" }}>
                                Move to Interview
                              </button>
                            )}
                            {s === "interviewing" && (
                              <div style={{ display: "inline-flex", gap: "5px" }}>
                                <button onClick={() => handleReferralStatus(r.id, "hired")} disabled={isUp} style={{ padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: "#16A34A", color: "#FFFFFF", border: "none", cursor: "pointer" }}>
                                  Mark Hired
                                </button>
                                <button onClick={() => handleReferralStatus(r.id, "rejected")} disabled={isUp} style={{ padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer" }}>
                                  Reject
                                </button>
                              </div>
                            )}
                            {(s === "hired" || s === "rejected") && (
                              <span style={{ fontSize: "11px", color: "#94A3B8" }}>Concluded</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 7: Router Telemetry & Analytics ─────────────────────────── */}
        {currentTab === "analytics" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "22px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Layers style={{ width: "18px", height: "18px", color: "#0078D4" }} />
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", margin: 0 }}>Multi-Domain Routing Distribution</h3>
                </div>
                <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 500 }}>Hybrid Vector Router</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {analytics && analytics.domain_breakdown ? (
                  Object.entries(analytics.domain_breakdown).map(([domain, data]) => {
                    const colorMap: Record<string, string> = {
                      IT: "#0078D4",
                      HR: "#16A34A",
                      Finance: "#059669",
                      Facilities: "#EA580C",
                    };
                    const barColor = colorMap[domain] || "#64748B";
                    return (
                      <div key={domain} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600 }}>
                          <span style={{ color: "#334155" }}>{domain} Department</span>
                          <span style={{ color: "#64748B" }}>{data.count} queries ({data.percentage}%)</span>
                        </div>
                        <div style={{ width: "100%", height: "8px", backgroundColor: "#F1F5F9", borderRadius: "10px", overflow: "hidden" }}>
                          <div style={{ width: `${Math.max(data.percentage, 4)}%`, height: "100%", backgroundColor: barColor, borderRadius: "10px", transition: "width 0.5s ease" }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center", padding: "20px" }}>Loading telemetry metrics...</div>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "22px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Cpu style={{ width: "18px", height: "18px", color: "#16A34A" }} />
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", margin: 0 }}>AI Engine & Router Telemetry</h3>
                </div>
                <span style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: 700, backgroundColor: "#F1F5F9", color: "#334155", padding: "2px 8px", borderRadius: "4px" }}>Groq LPU</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", backgroundColor: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                  <span style={{ color: "#64748B", fontWeight: 500 }}>Routing Accuracy Rate:</span>
                  <span style={{ fontWeight: 700, color: "#0F172A", fontSize: "14px" }}>{analytics ? `${analytics.routing_accuracy}%` : "94.2%"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", backgroundColor: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                  <span style={{ color: "#64748B", fontWeight: 500 }}>Average Confidence Score:</span>
                  <span style={{ fontWeight: 700, color: "#0F172A", fontSize: "14px" }}>{analytics?.avg_confidence ? `${Math.round(analytics.avg_confidence * 100)}%` : "95%"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", backgroundColor: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                  <span style={{ color: "#64748B", fontWeight: 500 }}>Live Cloud Database:</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "#0F172A" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22C55E" }}></span>
                    Supabase PostgreSQL
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 8: Registered Users (onedesk_users) ───────────────────────── */}
        {currentTab === "users" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Database style={{ width: "16px", height: "16px", color: "#0078D4" }} />
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>Supabase PostgreSQL: onedesk_users</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#F0FDF4", color: "#16A34A", padding: "2px 8px", borderRadius: "12px", border: "1px solid #BBF7D0" }}>Live Synced</span>
                </div>
                <p style={{ fontSize: "12px", color: "#64748B", margin: "4px 0 0 0" }}>Employee sign-ins automatically update persistent accounts across Microsoft Entra ID and Google Workspace.</p>
              </div>
              <div style={{ textAlign: "right", padding: "6px 14px", backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "11px", color: "#64748B" }}>Total Users</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#0078D4" }}>{users.length}</div>
              </div>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
              {users.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center", color: "#94A3B8" }}>
                  <Users style={{ width: "36px", height: "36px", margin: "0 auto 12px", opacity: 0.5 }} />
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>No users registered yet</div>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "11.5px", textTransform: "uppercase" }}>
                      <th style={{ padding: "12px 18px", fontWeight: 600 }}>Employee / User</th>
                      <th style={{ padding: "12px 18px", fontWeight: 600 }}>Email Address</th>
                      <th style={{ padding: "12px 18px", fontWeight: 600 }}>Department</th>
                      <th style={{ padding: "12px 18px", fontWeight: 600 }}>Role</th>
                      <th style={{ padding: "12px 18px", fontWeight: 600 }}>Auth Method</th>
                      <th style={{ padding: "12px 18px", fontWeight: 600 }}>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => (
                      <tr key={u.id || idx} style={{ borderBottom: idx < users.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#EFF6FC", color: "#0078D4", border: "1px solid #C7E0F4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
                              {(u.name || u.email || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600, color: "#0F172A" }}>{u.name || "Employee"}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px", color: "#334155" }}>{u.email}</td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ fontSize: "11.5px", padding: "3px 8px", borderRadius: "6px", backgroundColor: "#F1F5F9", color: "#475569", fontWeight: 500 }}>
                            {u.department || "General"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", padding: "2px 8px", borderRadius: "4px", backgroundColor: u.role === "admin" ? "#FEF2F2" : "#EFF6FC", color: u.role === "admin" ? "#DC2626" : "#0078D4" }}>
                            {u.role || "employee"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px", backgroundColor: u.auth_provider === "google" ? "#FEF3C7" : u.auth_provider === "azure" ? "#E0E7FF" : "#F3F4F6", color: u.auth_provider === "google" ? "#D97706" : u.auth_provider === "azure" ? "#4F46E5" : "#374151" }}>
                            {u.auth_provider || "email"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px", color: "#64748B", fontSize: "12px" }}>{toIST(u.created_at, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
