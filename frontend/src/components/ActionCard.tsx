// src/components/ActionCard.tsx
"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Ticket,
  Building2,
  AlertTriangle,
  Loader2,
  Shield,
  Receipt,
  UserCheck,
  Users,
  Mail,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Send,
} from "lucide-react";
import { confirmAction } from "@/lib/api";

interface ActionCardProps {
  proposal: {
    action_type: string;
    display_name: string;
    description: string;
    details: Record<string, any>;
    executed?: boolean;       // persisted flag — card already done
    result_message?: string;  // persisted success message
    ticket_number?: string;   // persisted ticket number
  };
  employeeId?: string;
  userName?: string;
  userEmail?: string;
  authProvider?: string;
  threadId?: string;
  messageId?: string;
  onActionConfirmed?: (result: any) => void;
}

const ACTION_META: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  apply_leave: {
    color: "#16A34A",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    icon: <Calendar style={{ width: 16, height: 16, color: "#16A34A" }} />,
  },
  raise_ticket: {
    color: "#0078D4",
    bg: "#EFF6FC",
    border: "#C7E0F4",
    icon: <Ticket style={{ width: 16, height: 16, color: "#0078D4" }} />,
  },
  book_room: {
    color: "#9333EA",
    bg: "#FAF5FF",
    border: "#E9D5FF",
    icon: <Building2 style={{ width: 16, height: 16, color: "#9333EA" }} />,
  },
  submit_expense: {
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    icon: <Receipt style={{ width: 16, height: 16, color: "#059669" }} />,
  },
  request_visitor_pass: {
    color: "#EA580C",
    bg: "#FFF7ED",
    border: "#FED7AA",
    icon: <UserCheck style={{ width: 16, height: 16, color: "#EA580C" }} />,
  },
  submit_referral: {
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    icon: <Users style={{ width: 16, height: 16, color: "#7C3AED" }} />,
  },
};

const formatKey = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const ActionCard: React.FC<ActionCardProps> = ({
  proposal,
  employeeId,
  userName,
  userEmail,
  authProvider,
  threadId,
  messageId,
  onActionConfirmed,
}) => {
  // If already executed (loaded from DB), start in confirmed state
  const [status, setStatus] = useState<"pending" | "loading" | "confirmed" | "cancelled">(
    proposal.executed ? "confirmed" : "pending"
  );
  const [resultMessage, setResultMessage] = useState<string>(proposal.result_message || "");
  const [ticketNumber, setTicketNumber] = useState<string>(proposal.ticket_number || "");

  const effectiveName = userName || (employeeId && !employeeId.includes("@") ? employeeId : "Vipul Jain");
  const effectiveEmail = userEmail || (employeeId && employeeId.includes("@") ? employeeId : "healthmate05@gmail.com");

  const lowerEmail = effectiveEmail.toLowerCase();
  const isGoogle =
    authProvider === "google" ||
    lowerEmail.endsWith("@gmail.com") ||
    lowerEmail.includes("google");

  const isMicrosoft =
    authProvider === "azure" ||
    lowerEmail.endsWith("@outlook.com") ||
    lowerEmail.endsWith("@hotmail.com") ||
    lowerEmail.endsWith("@live.com") ||
    lowerEmail.endsWith("@microsoft.com");

  const sanitizeBody = (text: string, name: string) => {
    return text
      .replace(/\[Your Name\]/gi, name)
      .replace(/\[Name\]/gi, name)
      .replace(/\[Employee Name\]/gi, name)
      .replace(/\[Your Designation\]/gi, "Product Engineering")
      .replace(/\[Designation\]/gi, "Product Engineering")
      .replace(/\[Employee ID\]/gi, employeeId || "EMP001")
      .replace(/\[Colleague Name\]/gi, "a team colleague")
      .replace(/\[Colleague's Name\]/gi, "a team colleague");
  };

  // Email drafting & dispatch state for leave applications
  const isLeaveAction = proposal.action_type === "apply_leave";
  const [managerEmail, setManagerEmail] = useState<string>(
    proposal.details?.manager_email || "manager@company.com"
  );
  const [emailSubject, setEmailSubject] = useState<string>(
    proposal.details?.email_subject ||
      `[Leave Application] ${proposal.details?.leave_type || "Casual"} Leave: ${proposal.details?.start_date || "Upcoming"} to ${proposal.details?.end_date || "Upcoming"}`
  );
  const [formalBody, setFormalBody] = useState<string>(() => {
    const raw =
      proposal.details?.formal_body ||
      `Dear Manager,\n\nI would like to request ${proposal.details?.leave_type || "casual"} leave from ${proposal.details?.start_date || "start date"} to ${proposal.details?.end_date || "end date"} due to ${proposal.details?.reason || "personal reasons"}.\n\nI will ensure my pending deliverables are handed over to the team before my leave. In case of emergencies, I remain accessible on mobile.\n\nThank you,\n${effectiveName}`;
    return sanitizeBody(raw, effectiveName);
  });
  const [showEmailDraft, setShowEmailDraft] = useState<boolean>(true);
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);
  const [dispatchedMailto, setDispatchedMailto] = useState<string>(proposal.details?.mailto_url || "");

  const buildMailtoUrl = (to: string, sub: string, body: string) => {
    return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
  };

  // Provider-specific Web Compose deep-links with exact multi-account session binding
  const userAccountParam = effectiveEmail && effectiveEmail.includes("@") ? encodeURIComponent(effectiveEmail) : "";
  const gmailComposeUrl = userAccountParam
    ? `https://mail.google.com/mail/u/${userAccountParam}/?authuser=${userAccountParam}&view=cm&fs=1&to=${encodeURIComponent(managerEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(formalBody)}`
    : `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(managerEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(formalBody)}`;

  const outlookComposeUrl = userAccountParam
    ? `https://outlook.office.com/mail/deeplink/compose?login_hint=${userAccountParam}&to=${encodeURIComponent(managerEmail)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(formalBody)}`
    : `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(managerEmail)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(formalBody)}`;

  const desktopMailtoUrl = buildMailtoUrl(managerEmail, emailSubject, formalBody);

  const primaryWebUrl = isGoogle ? gmailComposeUrl : outlookComposeUrl;
  const primaryProviderLabel = isGoogle ? "Open in Gmail" : "Open in Outlook";
  const primaryProviderTheme = isGoogle
    ? {
        color: "#D93025",
        bg: "#FEF2F2",
        border: "#FECACA",
        hoverBg: "#FEE2E2",
        badge: "Google Account",
      }
    : {
        color: "#0078D4",
        bg: "#EFF6FC",
        border: "#C7E0F4",
        hoverBg: "#E0EFFC",
        badge: "Microsoft Account",
      };

  // Sync state if proposal prop updates (e.g. on in-memory patch or re-render)
  React.useEffect(() => {
    if (proposal.executed) {
      setStatus("confirmed");
      if (proposal.result_message) setResultMessage(proposal.result_message);
      if (proposal.ticket_number) setTicketNumber(proposal.ticket_number);
    }
  }, [proposal.executed, proposal.result_message, proposal.ticket_number]);

  const meta = ACTION_META[proposal.action_type] ?? {
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    icon: <AlertTriangle style={{ width: 16, height: 16, color: "#D97706" }} />,
  };

  const handleConfirm = async () => {
    setStatus("loading");
    try {
      const sanitizedPayloadBody = sanitizeBody(formalBody, effectiveName);
      const payloadDetails = {
        ...proposal.details,
        user_name: effectiveName,
        employee_email: effectiveEmail,
        ...(isLeaveAction
          ? {
              manager_email: managerEmail,
              email_subject: emailSubject,
              formal_body: sanitizedPayloadBody,
            }
          : {}),
      };

      const res = await confirmAction(
        proposal.action_type,
        payloadDetails,
        employeeId,
        threadId,
        messageId
      );
      if (res.success) {
        setStatus("confirmed");
        setResultMessage(res.message);
        const tNum =
          res.ticket_number ||
          res.booking_id ||
          res.claim_id ||
          res.pass_number ||
          res.referral_number ||
          "";
        if (tNum) setTicketNumber(tNum);
        if (res.mailto_url) setDispatchedMailto(res.mailto_url);
        else if (isLeaveAction) setDispatchedMailto(buildMailtoUrl(managerEmail, emailSubject, formalBody));
        if (onActionConfirmed) onActionConfirmed(res);
      } else {
        setStatus("pending");
        alert("Action failed to execute");
      }
    } catch (e: any) {
      console.error(e);
      setStatus("pending");
      alert("Error confirming action: " + e.message);
    }
  };

  const handleCancel = () => setStatus("cancelled");

  /* ── Cancelled State ─────────────────────────────────────────── */
  if (status === "cancelled") {
    return (
      <div
        style={{
          marginTop: "14px",
          padding: "10px 14px",
          backgroundColor: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#64748B",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <XCircle style={{ width: 14, height: 14, color: "#94A3B8" }} />
          Action &quot;{proposal.display_name}&quot; was cancelled.
        </span>
        <button
          onClick={() => setStatus("pending")}
          style={{
            background: "none",
            border: "none",
            fontSize: "12px",
            fontWeight: 600,
            color: "#0078D4",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Undo
        </button>
      </div>
    );
  }

  /* ── Confirmed State ─────────────────────────────────────────── */
  if (status === "confirmed") {
    return (
      <div
        style={{
          marginTop: "14px",
          padding: "14px 16px",
          backgroundColor: "#F0FDF4",
          border: "1px solid #86EFAC",
          borderRadius: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 style={{ width: 18, height: 18, color: "#16A34A", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: "13px", color: "#15803D" }}>
              {proposal.display_name} — Executed Successfully
            </span>
          </div>
          {ticketNumber && (
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "11px",
                fontWeight: 700,
                backgroundColor: "#DCFCE7",
                color: "#15803D",
                padding: "3px 10px",
                borderRadius: "6px",
                border: "1px solid #86EFAC",
              }}
            >
              {ticketNumber}
            </span>
          )}
        </div>
        <p
          style={{
            margin: "8px 0 0 26px",
            fontSize: "12px",
            color: "#166534",
            lineHeight: 1.5,
          }}
        >
          {resultMessage || "Saved to database. Visible in My Requests and IT Helpdesk."}
        </p>

        {/* Provider-aware view / send link */}
        {isLeaveAction && (
          <div style={{ margin: "10px 0 0 26px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <a
              href={primaryWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11.5px",
                fontWeight: 600,
                color: primaryProviderTheme.color,
                backgroundColor: primaryProviderTheme.bg,
                border: `1px solid ${primaryProviderTheme.border}`,
                padding: "5px 12px",
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              <Mail style={{ width: 13, height: 13 }} />
              Open in {primaryProviderLabel.replace("Open in ", "")}
              <ExternalLink style={{ width: 11, height: 11 }} />
            </a>

            {dispatchedMailto && (
              <a
                href={dispatchedMailto}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: "#15803D",
                  backgroundColor: "#DCFCE7",
                  border: "1px solid #86EFAC",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  textDecoration: "none",
                }}
              >
                Desktop App
                <ExternalLink style={{ width: 11, height: 11 }} />
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── Pending / Loading State ─────────────────────────────────── */
  const detailEntries = Object.entries(proposal.details).filter(
    ([key, v]) =>
      v != null &&
      v !== "" &&
      !["manager_email", "email_subject", "formal_body", "mailto_url", "email_dispatched"].includes(key)
  );

  return (
    <div
      style={{
        marginTop: "14px",
        backgroundColor: "#FFFFFF",
        border: `1.5px solid ${meta.border}`,
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      }}
    >
      {/* Card Header */}
      <div
        style={{
          backgroundColor: meta.bg,
          borderBottom: `1px solid ${meta.border}`,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              border: `1px solid ${meta.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {meta.icon}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: 700, fontSize: "13px", color: "#0F172A" }}>
                {proposal.display_name}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: meta.color,
                  backgroundColor: "#FFFFFF",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  border: `1px solid ${meta.border}`,
                }}
              >
                Action Proposal
              </span>
            </div>
            <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
              {proposal.description}
            </div>
          </div>
        </div>

        {/* Requires Confirmation badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            fontWeight: 600,
            color: "#92400E",
            backgroundColor: "#FFFBEB",
            padding: "4px 10px",
            borderRadius: "8px",
            border: "1px solid #FDE68A",
            flexShrink: 0,
            marginLeft: 12,
          }}
        >
          <Shield style={{ width: 12, height: 12 }} />
          Requires Confirmation
        </div>
      </div>

      {/* Details Table */}
      {detailEntries.length > 0 && (
        <div style={{ padding: "12px 16px" }}>
          <div
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            {detailEntries.map(([key, val], idx) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 14px",
                  borderBottom: idx < detailEntries.length - 1 ? "1px solid #E2E8F0" : "none",
                  fontSize: "12.5px",
                }}
              >
                <span style={{ color: "#64748B", fontWeight: 500 }}>{formatKey(key)}:</span>
                {key === "priority" ? (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "2px 10px",
                      borderRadius: "6px",
                      backgroundColor:
                        val === "high" ? "#FEF2F2" : val === "medium" ? "#FFFBEB" : "#F0FDF4",
                      color: val === "high" ? "#DC2626" : val === "medium" ? "#D97706" : "#16A34A",
                      border:
                        val === "high"
                          ? "1px solid #FECACA"
                          : val === "medium"
                          ? "1px solid #FDE68A"
                          : "1px solid #BBF7D0",
                    }}
                  >
                    {val}
                  </span>
                ) : (
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#1E293B",
                      textAlign: "right",
                      maxWidth: "60%",
                    }}
                  >
                    {typeof val === "object" ? JSON.stringify(val) : String(val)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Email Drafting Section (for Apply Leave) */}
      {isLeaveAction && (
        <div style={{ padding: "0 16px 12px 16px" }}>
          <div
            style={{
              backgroundColor: "#F8FAFC",
              border: "1.5px solid #E2E8F0",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            {/* Accordion Header */}
            <div
              onClick={() => setShowEmailDraft(!showEmailDraft)}
              style={{
                padding: "10px 14px",
                backgroundColor: "#F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                borderBottom: showEmailDraft ? "1px solid #E2E8F0" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail style={{ width: 15, height: 15, color: "#0078D4" }} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#1E293B" }}>
                  📧 Auto-Drafted Manager Email (Formal Corporate Application)
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    backgroundColor: "#EFF6FC",
                    color: "#0078D4",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid #C7E0F4",
                  }}
                >
                  Ready to Dispatch
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {showEmailDraft ? (
                  <ChevronUp style={{ width: 14, height: 14, color: "#64748B" }} />
                ) : (
                  <ChevronDown style={{ width: 14, height: 14, color: "#64748B" }} />
                )}
              </div>
            </div>

            {/* Email Form & Preview */}
            {showEmailDraft && (
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* To & Subject Fields */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#64748B", marginBottom: "4px" }}>
                      Recipient Manager Email:
                    </label>
                    <input
                      type="email"
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                      placeholder="manager@company.com"
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        fontSize: "12px",
                        borderRadius: "6px",
                        border: "1px solid #CBD5E1",
                        backgroundColor: "#FFFFFF",
                        color: "#0F172A",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#64748B", marginBottom: "4px" }}>
                      Subject:
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        fontSize: "12px",
                        borderRadius: "6px",
                        border: "1px solid #CBD5E1",
                        backgroundColor: "#FFFFFF",
                        color: "#0F172A",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Body Textarea */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748B" }}>
                      Formal Application Letter:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(formalBody);
                        setCopiedDraft(true);
                        setTimeout(() => setCopiedDraft(false), 2000);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "11px",
                        color: "#0078D4",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: 0,
                      }}
                    >
                      {copiedDraft ? <Check style={{ width: 12, height: 12, color: "#16A34A" }} /> : <Copy style={{ width: 12, height: 12 }} />}
                      {copiedDraft ? "Copied!" : "Copy Text"}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={formalBody}
                    onChange={(e) => setFormalBody(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: "12px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      color: "#334155",
                      lineHeight: 1.5,
                      fontFamily: "inherit",
                      resize: "vertical",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "8px",
        }}
      >
        <button
          onClick={handleCancel}
          disabled={status === "loading"}
          style={{
            padding: "7px 16px",
            fontSize: "12.5px",
            fontWeight: 600,
            color: "#64748B",
            backgroundColor: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.12s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#F1F5F9";
            e.currentTarget.style.color = "#1E293B";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#F8FAFC";
            e.currentTarget.style.color = "#64748B";
          }}
        >
          Cancel
        </button>

        {/* 1-Click Open in Web Mail (Provider-Aware: Gmail / Outlook) */}
        {isLeaveAction && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <a
              href={primaryWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open ready draft in ${primaryProviderLabel.replace("Open in ", "")}`}
              style={{
                padding: "7px 14px",
                fontSize: "12px",
                fontWeight: 600,
                color: primaryProviderTheme.color,
                backgroundColor: primaryProviderTheme.bg,
                border: `1px solid ${primaryProviderTheme.border}`,
                borderRadius: "8px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = primaryProviderTheme.hoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = primaryProviderTheme.bg;
              }}
            >
              <Mail style={{ width: 13, height: 13 }} />
              <span>{primaryProviderLabel}</span>
              <ExternalLink style={{ width: 11, height: 11 }} />
            </a>

            <a
              href={desktopMailtoUrl}
              title="Open draft in native desktop email client (Outlook / Apple Mail)"
              style={{
                padding: "7px 11px",
                fontSize: "12px",
                fontWeight: 500,
                color: "#64748B",
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#F1F5F9";
                e.currentTarget.style.color = "#1E293B";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#F8FAFC";
                e.currentTarget.style.color = "#64748B";
              }}
            >
              <span>Desktop App</span>
            </a>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={status === "loading"}
          style={{
            padding: "7px 18px",
            fontSize: "12.5px",
            fontWeight: 700,
            color: "#FFFFFF",
            backgroundColor: meta.color,
            border: "none",
            borderRadius: "8px",
            cursor: status === "loading" ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            boxShadow: `0 2px 8px ${meta.color}44`,
            opacity: status === "loading" ? 0.8 : 1,
            transition: "all 0.12s ease",
          }}
          onMouseEnter={(e) => {
            if (status !== "loading") e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          {status === "loading" ? (
            <>
              <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
              <span>Executing…</span>
            </>
          ) : (
            <>
              {isLeaveAction ? <Send style={{ width: 14, height: 14 }} /> : <CheckCircle2 style={{ width: 14, height: 14 }} />}
              <span>{isLeaveAction ? "Confirm & Dispatch" : "Confirm & Execute"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
