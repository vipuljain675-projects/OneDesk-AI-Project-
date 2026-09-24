// src/components/MyRequestsView.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Ticket as TicketIcon,
  Calendar,
  Building,
  CreditCard,
  UserCheck,
  Users,
  RefreshCw,
  CheckCircle2,
  Clock,
  Search,
} from "lucide-react";
import {
  fetchTickets,
  fetchLeaves,
  fetchBookings,
  fetchExpenses,
  fetchVisitorPasses,
  fetchReferrals,
  Ticket,
  LeaveRequest,
  RoomBooking,
  ExpenseClaim,
  VisitorPass,
  CandidateReferral,
} from "@/lib/api";

/** Format any UTC timestamp as IST date + time */
const toIST = (ts: string | undefined | null): string => {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

type MyRequestsTab = "tickets" | "leaves" | "expenses" | "bookings" | "visitors" | "referrals";

interface MyRequestsViewProps {
  employeeId?: string;
}

export const MyRequestsView: React.FC<MyRequestsViewProps> = ({ employeeId }) => {
  const [activeTab, setActiveTab] = useState<MyRequestsTab>("tickets");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [visitors, setVisitors] = useState<VisitorPass[]>([]);
  const [referrals, setReferrals] = useState<CandidateReferral[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [tData, lData, eData, bData, vData, rData] = await Promise.all([
        fetchTickets(employeeId).catch(() => []),
        fetchLeaves(employeeId).catch(() => []),
        fetchExpenses(employeeId).catch(() => []),
        fetchBookings(employeeId).catch(() => []),
        fetchVisitorPasses(employeeId).catch(() => []),
        fetchReferrals(employeeId).catch(() => []),
      ]);
      setTickets(tData);
      setLeaves(lData);
      setExpenses(eData);
      setBookings(bData);
      setVisitors(vData);
      setReferrals(rData);
    } catch (e) {
      console.error("Error loading user requests:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [employeeId]);

  const getStatusBadge = (status: string) => {
    const s = (status || "open").toLowerCase();
    switch (s) {
      case "open":
      case "pending":
      case "submitted":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: 600,
              backgroundColor: "#EFF6FC",
              color: "#0078D4",
              border: "1px solid #C7E0F4",
            }}
          >
            <Clock style={{ width: "12px", height: "12px" }} />
            {s === "open" ? "Open" : s === "pending" ? "Pending Approval" : "Submitted"}
          </span>
        );
      case "in_progress":
      case "in_review":
      case "interviewing":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: 600,
              backgroundColor: "#FFFBEB",
              color: "#D97706",
              border: "1px solid #FDE68A",
            }}
          >
            <RefreshCw style={{ width: "12px", height: "12px" }} />
            {s.replace("_", " ").toUpperCase()}
          </span>
        );
      case "resolved":
      case "confirmed":
      case "approved":
      case "reimbursed":
      case "checked_in":
      case "hired":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: 600,
              backgroundColor: "#F0FDF4",
              color: "#16A34A",
              border: "1px solid #BBF7D0",
            }}
          >
            <CheckCircle2 style={{ width: "12px", height: "12px" }} />
            {s.replace("_", " ").toUpperCase()}
          </span>
        );
      case "issued":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: 600,
              backgroundColor: "#FFF7ED",
              color: "#EA580C",
              border: "1px solid #FED7AA",
            }}
          >
            <UserCheck style={{ width: "12px", height: "12px" }} />
            ISSUED (ACTIVE)
          </span>
        );
      case "rejected":
      case "cancelled":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: 600,
              backgroundColor: "#FEF2F2",
              color: "#DC2626",
              border: "1px solid #FECACA",
            }}
          >
            {s.toUpperCase()}
          </span>
        );
      default:
        return (
          <span
            style={{
              display: "inline-flex",
              padding: "3px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: 600,
              backgroundColor: "#F1F5F9",
              color: "#475569",
            }}
          >
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    const p = (priority || "medium").toLowerCase();
    const isHigh = p === "high";
    const isMed = p === "medium";

    return (
      <span
        style={{
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          padding: "2px 8px",
          borderRadius: "4px",
          backgroundColor: isHigh ? "#FEF2F2" : isMed ? "#FFFBEB" : "#F1F5F9",
          color: isHigh ? "#DC2626" : isMed ? "#D97706" : "#475569",
          border: isHigh ? "1px solid #FECACA" : isMed ? "1px solid #FDE68A" : "1px solid #E2E8F0",
        }}
      >
        {priority || "Medium"}
      </span>
    );
  };

  const sLower = search.toLowerCase();

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px 32px",
        backgroundColor: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
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
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
              My Enterprise Service Requests
            </h1>
            <p style={{ fontSize: "12.5px", color: "#64748B", margin: "2px 0 0 0" }}>
              Live tracking across IT tickets, HR leaves, expense claims, visitor passes, room bookings, and candidate referrals
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 14px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: "8px",
              fontSize: "12px",
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
            <span>Refresh Live</span>
          </button>
        </div>

        {/* ── Tabs & Search Bar ────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            borderBottom: "1px solid #E2E8F0",
            paddingBottom: "12px",
          }}
        >
          {/* Tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto" }}>
            <button
              onClick={() => setActiveTab("tickets")}
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
                backgroundColor: activeTab === "tickets" ? "#EFF6FC" : "transparent",
                color: activeTab === "tickets" ? "#0078D4" : "#64748B",
                boxShadow: activeTab === "tickets" ? "inset 0 0 0 1.5px #C7E0F4" : "none",
                whiteSpace: "nowrap",
              }}
            >
              <TicketIcon style={{ width: "14px", height: "14px" }} />
              <span>IT Tickets</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", backgroundColor: activeTab === "tickets" ? "#0078D4" : "#E2E8F0", color: activeTab === "tickets" ? "#FFFFFF" : "#475569" }}>
                {tickets.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("leaves")}
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
                backgroundColor: activeTab === "leaves" ? "#F0FDF4" : "transparent",
                color: activeTab === "leaves" ? "#16A34A" : "#64748B",
                boxShadow: activeTab === "leaves" ? "inset 0 0 0 1.5px #BBF7D0" : "none",
                whiteSpace: "nowrap",
              }}
            >
              <Calendar style={{ width: "14px", height: "14px" }} />
              <span>HR Leaves</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", backgroundColor: activeTab === "leaves" ? "#16A34A" : "#E2E8F0", color: activeTab === "leaves" ? "#FFFFFF" : "#475569" }}>
                {leaves.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("expenses")}
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
                backgroundColor: activeTab === "expenses" ? "#ECFDF5" : "transparent",
                color: activeTab === "expenses" ? "#059669" : "#64748B",
                boxShadow: activeTab === "expenses" ? "inset 0 0 0 1.5px #A7F3D0" : "none",
                whiteSpace: "nowrap",
              }}
            >
              <CreditCard style={{ width: "14px", height: "14px" }} />
              <span>Expenses</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", backgroundColor: activeTab === "expenses" ? "#059669" : "#E2E8F0", color: activeTab === "expenses" ? "#FFFFFF" : "#475569" }}>
                {expenses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("bookings")}
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
                backgroundColor: activeTab === "bookings" ? "#FAF5FF" : "transparent",
                color: activeTab === "bookings" ? "#9333EA" : "#64748B",
                boxShadow: activeTab === "bookings" ? "inset 0 0 0 1.5px #E9D5FF" : "none",
                whiteSpace: "nowrap",
              }}
            >
              <Building style={{ width: "14px", height: "14px" }} />
              <span>Room Bookings</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", backgroundColor: activeTab === "bookings" ? "#9333EA" : "#E2E8F0", color: activeTab === "bookings" ? "#FFFFFF" : "#475569" }}>
                {bookings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("visitors")}
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
                backgroundColor: activeTab === "visitors" ? "#FFF7ED" : "transparent",
                color: activeTab === "visitors" ? "#EA580C" : "#64748B",
                boxShadow: activeTab === "visitors" ? "inset 0 0 0 1.5px #FED7AA" : "none",
                whiteSpace: "nowrap",
              }}
            >
              <UserCheck style={{ width: "14px", height: "14px" }} />
              <span>Visitor Badges</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", backgroundColor: activeTab === "visitors" ? "#EA580C" : "#E2E8F0", color: activeTab === "visitors" ? "#FFFFFF" : "#475569" }}>
                {visitors.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("referrals")}
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
                backgroundColor: activeTab === "referrals" ? "#F5F3FF" : "transparent",
                color: activeTab === "referrals" ? "#7C3AED" : "#64748B",
                boxShadow: activeTab === "referrals" ? "inset 0 0 0 1.5px #DDD6FE" : "none",
                whiteSpace: "nowrap",
              }}
            >
              <Users style={{ width: "14px", height: "14px" }} />
              <span>Referrals</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", backgroundColor: activeTab === "referrals" ? "#7C3AED" : "#E2E8F0", color: activeTab === "referrals" ? "#FFFFFF" : "#475569" }}>
                {referrals.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: "8px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <Search style={{ width: "14px", height: "14px", color: "#94A3B8" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your requests..."
              style={{
                border: "none",
                outline: "none",
                fontSize: "12px",
                color: "#0F172A",
                width: "170px",
                backgroundColor: "transparent",
              }}
            />
          </div>
        </div>

        {/* ── Tab 1: IT Tickets Table ──────────────────────────────────────── */}
        {activeTab === "tickets" && (
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 18px" }}>Ticket ID</th>
                  <th style={{ padding: "12px 18px" }}>Issue Description</th>
                  <th style={{ padding: "12px 18px" }}>Priority</th>
                  <th style={{ padding: "12px 18px" }}>Status</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Created At</th>
                </tr>
              </thead>
              <tbody>
                {tickets
                  .filter((t) => (t.issue || "").toLowerCase().includes(sLower) || (t.ticket_number || "").toLowerCase().includes(sLower))
                  .map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "14px 18px", fontFamily: "monospace", fontWeight: 700, color: "#0078D4" }}>{t.ticket_number}</td>
                      <td style={{ padding: "14px 18px", color: "#0F172A", fontWeight: 500, maxWidth: "400px" }}>{t.issue}</td>
                      <td style={{ padding: "14px 18px" }}>{getPriorityBadge(t.priority)}</td>
                      <td style={{ padding: "14px 18px" }}>{getStatusBadge(t.status)}</td>
                      <td style={{ padding: "14px 18px", textAlign: "right", color: "#64748B", fontSize: "11.5px" }}>{toIST(t.created_at)}</td>
                    </tr>
                  ))}
                {tickets.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>No support tickets logged. Tell OneDeskAI "Raise an IT ticket" to create one.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab 2: HR Leaves Table ───────────────────────────────────────── */}
        {activeTab === "leaves" && (
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 18px" }}>Leave Type</th>
                  <th style={{ padding: "12px 18px" }}>Dates</th>
                  <th style={{ padding: "12px 18px" }}>Reason</th>
                  <th style={{ padding: "12px 18px" }}>Status</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {leaves
                  .filter((l) => (l.leave_type || "").toLowerCase().includes(sLower) || (l.reason || "").toLowerCase().includes(sLower))
                  .map((l) => (
                    <tr key={l.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "14px 18px", fontWeight: 700, color: "#0F172A", textTransform: "capitalize" }}>{l.leave_type} Leave</td>
                      <td style={{ padding: "14px 18px", color: "#475569" }}>{l.start_date} to {l.end_date}</td>
                      <td style={{ padding: "14px 18px", color: "#64748B" }}>{l.reason || "Personal"}</td>
                      <td style={{ padding: "14px 18px" }}>{getStatusBadge(l.status)}</td>
                      <td style={{ padding: "14px 18px", textAlign: "right", color: "#64748B", fontSize: "11.5px" }}>{toIST(l.created_at)}</td>
                    </tr>
                  ))}
                {leaves.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>No leave requests found. Ask OneDeskAI "Apply for leave" to submit one.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab 3: Finance Expense Claims ────────────────────────────────── */}
        {activeTab === "expenses" && (
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 18px" }}>Claim #</th>
                  <th style={{ padding: "12px 18px" }}>Amount</th>
                  <th style={{ padding: "12px 18px" }}>Category</th>
                  <th style={{ padding: "12px 18px" }}>Description</th>
                  <th style={{ padding: "12px 18px" }}>Status</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Filed At</th>
                </tr>
              </thead>
              <tbody>
                {expenses
                  .filter((e) => (e.claim_number || "").toLowerCase().includes(sLower) || (e.description || "").toLowerCase().includes(sLower))
                  .map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "14px 18px", fontFamily: "monospace", fontWeight: 700, color: "#059669" }}>{e.claim_number}</td>
                      <td style={{ padding: "14px 18px", fontWeight: 700, color: "#0F172A" }}>{e.amount}</td>
                      <td style={{ padding: "14px 18px", color: "#334155" }}>{e.category}</td>
                      <td style={{ padding: "14px 18px", color: "#64748B" }}>
                        <div>{e.description}</div>
                        <div style={{ fontSize: "11px", color: "#94A3B8" }}>Date: {e.expense_date}</div>
                      </td>
                      <td style={{ padding: "14px 18px" }}>{getStatusBadge(e.status)}</td>
                      <td style={{ padding: "14px 18px", textAlign: "right", color: "#64748B", fontSize: "11.5px" }}>{toIST(e.created_at)}</td>
                    </tr>
                  ))}
                {expenses.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>No expense claims filed yet. Try saying: "I spent ₹4,200 on client dinner yesterday, file a reimbursement".</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab 4: Room Bookings Table ───────────────────────────────────── */}
        {activeTab === "bookings" && (
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 18px" }}>Room</th>
                  <th style={{ padding: "12px 18px" }}>Date</th>
                  <th style={{ padding: "12px 18px" }}>Time Slot</th>
                  <th style={{ padding: "12px 18px" }}>Purpose</th>
                  <th style={{ padding: "12px 18px" }}>Status</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Created At</th>
                </tr>
              </thead>
              <tbody>
                {bookings
                  .filter((b) => (b.room_name || "").toLowerCase().includes(sLower) || (b.purpose || "").toLowerCase().includes(sLower))
                  .map((b) => (
                    <tr key={b.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "14px 18px", fontWeight: 700, color: "#9333EA" }}>{b.room_name}</td>
                      <td style={{ padding: "14px 18px", color: "#475569" }}>{b.booking_date}</td>
                      <td style={{ padding: "14px 18px", color: "#64748B" }}>{b.time_slot}</td>
                      <td style={{ padding: "14px 18px", color: "#64748B" }}>{b.purpose || "Meeting"}</td>
                      <td style={{ padding: "14px 18px" }}>{getStatusBadge(b.status)}</td>
                      <td style={{ padding: "14px 18px", textAlign: "right", color: "#64748B", fontSize: "11.5px" }}>{toIST(b.created_at)}</td>
                    </tr>
                  ))}
                {bookings.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>No room reservations found. Ask OneDeskAI "Book conference room B for 3 PM"!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab 5: Campus Visitor Badges ─────────────────────────────────── */}
        {activeTab === "visitors" && (
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 18px" }}>Pass #</th>
                  <th style={{ padding: "12px 18px" }}>Visitor Name</th>
                  <th style={{ padding: "12px 18px" }}>Visit Date</th>
                  <th style={{ padding: "12px 18px" }}>Time Slot</th>
                  <th style={{ padding: "12px 18px" }}>Purpose</th>
                  <th style={{ padding: "12px 18px" }}>Status</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Issued At</th>
                </tr>
              </thead>
              <tbody>
                {visitors
                  .filter((v) => (v.visitor_name || "").toLowerCase().includes(sLower) || (v.pass_number || "").toLowerCase().includes(sLower))
                  .map((v) => (
                    <tr key={v.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "14px 18px", fontFamily: "monospace", fontWeight: 700, color: "#EA580C" }}>{v.pass_number}</td>
                      <td style={{ padding: "14px 18px", fontWeight: 600, color: "#0F172A" }}>
                        <div>{v.visitor_name}</div>
                        {v.visitor_email && <div style={{ fontSize: "11px", color: "#94A3B8" }}>{v.visitor_email}</div>}
                      </td>
                      <td style={{ padding: "14px 18px", color: "#334155" }}>{v.visit_date}</td>
                      <td style={{ padding: "14px 18px", color: "#334155" }}>{v.time_slot}</td>
                      <td style={{ padding: "14px 18px", color: "#64748B" }}>{v.purpose || "Campus Visit"}</td>
                      <td style={{ padding: "14px 18px" }}>{getStatusBadge(v.status)}</td>
                      <td style={{ padding: "14px 18px", textAlign: "right", color: "#64748B", fontSize: "11.5px" }}>{toIST(v.created_at)}</td>
                    </tr>
                  ))}
                {visitors.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>No visitor badges issued yet. Try saying: "My client Rahul Sharma is visiting campus tomorrow at 2 PM, generate a visitor badge".</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab 6: Candidate Referrals ───────────────────────────────────── */}
        {activeTab === "referrals" && (
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 18px" }}>Referral #</th>
                  <th style={{ padding: "12px 18px" }}>Candidate</th>
                  <th style={{ padding: "12px 18px" }}>Target Role</th>
                  <th style={{ padding: "12px 18px" }}>Notes / Summary</th>
                  <th style={{ padding: "12px 18px" }}>Status</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Referred At</th>
                </tr>
              </thead>
              <tbody>
                {referrals
                  .filter((r) => (r.candidate_name || "").toLowerCase().includes(sLower) || (r.role || "").toLowerCase().includes(sLower))
                  .map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "14px 18px", fontFamily: "monospace", fontWeight: 700, color: "#7C3AED" }}>{r.referral_number}</td>
                      <td style={{ padding: "14px 18px", fontWeight: 600, color: "#0F172A" }}>
                        <div>{r.candidate_name}</div>
                        {r.candidate_email && <div style={{ fontSize: "11px", color: "#94A3B8" }}>{r.candidate_email}</div>}
                      </td>
                      <td style={{ padding: "14px 18px", color: "#334155", fontWeight: 500 }}>{r.role}</td>
                      <td style={{ padding: "14px 18px", color: "#64748B", maxWidth: "300px" }}>{r.notes || "—"}</td>
                      <td style={{ padding: "14px 18px" }}>{getStatusBadge(r.status)}</td>
                      <td style={{ padding: "14px 18px", textAlign: "right", color: "#64748B", fontSize: "11.5px" }}>{toIST(r.created_at)}</td>
                    </tr>
                  ))}
                {referrals.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>No referrals submitted yet. Try saying: "Refer Priya Verma for Full Stack Developer role".</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};
