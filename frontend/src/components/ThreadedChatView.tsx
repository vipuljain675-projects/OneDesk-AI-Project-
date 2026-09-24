// src/components/ThreadedChatView.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Ticket,
  Calendar,
  Building,
  Laptop,
  Plus,
} from "lucide-react";
import { sendQuery, fetchMessages, createThread, QueryResponse, ChatMessage as ApiChatMessage, markMessageExecuted } from "@/lib/api";
import { ActionCard } from "./ActionCard";
import { UserSession } from "./LoginView";

export interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  user_name?: string;
  user_email?: string;
  domain?: string;
  confidence?: number;
  routingDecision?: string;
  sources?: Array<{
    filename: string;
    text: string;
    score: number;
    domain: string;
  }>;
  actionProposal?: any;
}

interface ThreadedChatViewProps {
  activeThreadId: string | null;
  userSession?: UserSession;
  pendingPrompt?: string | null;
  onClearPendingPrompt?: () => void;
  onNewThread: () => void;
  onSelectThread: (threadId: string) => void;
  onTicketCreated?: () => void;
  onThreadsChanged?: () => void;
}

export const ThreadedChatView: React.FC<ThreadedChatViewProps> = ({
  activeThreadId,
  userSession,
  pendingPrompt,
  onClearPendingPrompt,
  onNewThread,
  onSelectThread,
  onTicketCreated,
  onThreadsChanged,
}) => {
  const [mounted, setMounted] = useState(false);
  // messages per thread — keyed by threadId
  const [threadMessages, setThreadMessages] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sessionIds, setSessionIds] = useState<Record<string, string>>({});
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load messages from DB whenever active thread changes
  useEffect(() => {
    if (!activeThreadId) return;
    // Already loaded for this thread — skip
    if (threadMessages[activeThreadId] !== undefined) return;

    const load = async () => {
      setLoadingMessages(true);
      try {
        const msgs: ApiChatMessage[] = await fetchMessages(activeThreadId);
        const converted: Message[] = msgs.map((m) => ({
          id: String(m.id),
          sender: m.sender as "user" | "bot",
          text: m.text,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          user_name: m.user_name || undefined,
          user_email: m.user_email || undefined,
          domain: m.domain || undefined,
          confidence: m.confidence || undefined,
          sources: m.sources || undefined,
          actionProposal: m.action_proposal || undefined,
        }));
        setThreadMessages((prev) => ({ ...prev, [activeThreadId]: converted }));
      } catch (e) {
        console.error("Failed to load messages", e);
        setThreadMessages((prev) => ({ ...prev, [activeThreadId]: [] }));
      } finally {
        setLoadingMessages(false);
      }
    };
    load();
  }, [activeThreadId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [threadMessages, loading, activeThreadId]);

  useEffect(() => {
    if (pendingPrompt && mounted) {
      handleSend(pendingPrompt);
      onClearPendingPrompt?.();
    }
  }, [pendingPrompt, mounted]);

  const currentMessages = activeThreadId ? threadMessages[activeThreadId] || null : [];

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleSend = async (customQuery?: string) => {
    const queryText = (customQuery || input).trim();
    if (!queryText || loading) return;

    let targetThreadId = activeThreadId;

    // If no active thread yet, auto-create one in Supabase for this user
    if (!targetThreadId) {
      try {
        const newThread = await createThread(
          queryText.slice(0, 35),
          userSession?.email || "EMP001",
          userSession?.name || "",
          userSession?.email || ""
        );
        targetThreadId = newThread.thread_id;
        onSelectThread(targetThreadId);
        onThreadsChanged?.();
      } catch (err) {
        console.error("Failed to auto-create thread", err);
        return;
      }
    }

    const userMsgId = `u_${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      user_name: userSession?.name,
      user_email: userSession?.email,
    };

    setThreadMessages((prev) => ({
      ...prev,
      [targetThreadId!]: [...(prev[targetThreadId!] || []), userMsg],
    }));
    if (!customQuery) setInput("");
    setLoading(true);

    const currentMsgs = threadMessages[targetThreadId!] || [];
    const history = currentMsgs
      .slice(-6)
      .map((m) => ({ sender: m.sender, text: m.text }));

    try {
      const sessionId = sessionIds[targetThreadId!];
      const res: QueryResponse = await sendQuery(
        queryText,
        sessionId,
        undefined,
        history,
        targetThreadId!,
        userSession?.name,
        userSession?.department,
        userSession?.email
      );

      if (res.session_id) {
        setSessionIds((prev) => ({ ...prev, [targetThreadId!]: res.session_id }));
      }

      const botMsg: Message = {
        id: res.message_id ? String(res.message_id) : `b_${Date.now()}`,
        sender: "bot",
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        domain: res.domain,
        confidence: res.confidence,
        routingDecision: res.routing_decision,
        sources: res.sources,
        actionProposal: res.action_proposal,
      };

      setThreadMessages((prev) => ({
        ...prev,
        [targetThreadId!]: [...(prev[targetThreadId!] || []), botMsg],
      }));

      // Refresh thread list so title updates
      onThreadsChanged?.();
    } catch (error) {
      console.error("Error in query:", error);
      setThreadMessages((prev) => ({
        ...prev,
        [targetThreadId!]: [
          ...(prev[targetThreadId!] || []),
          {
            id: `err_${Date.now()}`,
            sender: "bot",
            text: "Sorry, I ran into an error connecting to the backend server.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      }));
    } finally {
      setLoading(false);
    }
  };

  const starterPrompts = [
    {
      icon: <Laptop style={{ width: "16px", height: "16px", color: "#0078D4" }} />,
      label: "Troubleshoot Screen",
      query: "My laptop screen is flickering, what can I do to fix it?",
    },
    {
      icon: <Ticket style={{ width: "16px", height: "16px", color: "#F25022" }} />,
      label: "Raise IT Ticket",
      query: "Raise an IT ticket for my flickering laptop screen",
    },
    {
      icon: <Calendar style={{ width: "16px", height: "16px", color: "#16A34A" }} />,
      label: "Check Leaves",
      query: "How many sick and casual leaves do I get per year?",
    },
    {
      icon: <Building style={{ width: "16px", height: "16px", color: "#9333EA" }} />,
      label: "Book Room",
      query: "Book conference room B for tomorrow at 3 PM",
    },
  ];

  const renderFormattedText = (text: string) => {
    return text.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} style={{ height: "6px" }} />;
      const parts = trimmed.split(/(\*\*.*?\*\*)/g).map((p, pi) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={pi} style={{ fontWeight: 600, color: "#0F172A" }}>
            {p.slice(2, -2)}
          </strong>
        ) : (
          p
        )
      );
      return (
        <div key={i} style={{ lineHeight: "1.65", color: "#1E293B" }}>
          {parts}
        </div>
      );
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", flex: 1, minWidth: 0, background: "#FFFFFF" }}>
      {/* Messages Area */}
      <div style={{ flex: 1, width: "100%", overflowY: "auto", padding: "28px 32px" }}>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Loading messages from DB */}
          {loadingMessages && (
            <div style={{ textAlign: "center", padding: "40px", color: "#94A3B8", fontSize: "13px" }}>
              Loading conversation...
            </div>
          )}

          {/* Welcome screen — new/empty thread */}
          {!loadingMessages && currentMessages !== null && currentMessages.length === 0 && (
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "20px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)",
                padding: "28px 32px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "24px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #0078D4 0%, #00A4EF 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0,120,212,0.3)",
                  }}
                >
                  <Sparkles style={{ width: "24px", height: "24px", color: "#FFFFFF" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A", margin: "0 0 4px" }}>
                    OneDesk AI — Enterprise Worksuite
                  </h2>
                  <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
                    Unified AI Assistant powered by multi-domain RAG across IT, HR, Finance, and Facilities.
                  </p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
                {starterPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.query)}
                    style={{
                      padding: "14px 16px",
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "14px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#FFFFFF";
                      e.currentTarget.style.borderColor = "#0078D4";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,120,212,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#F8FAFC";
                      e.currentTarget.style.borderColor = "#E2E8F0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      {p.icon}
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>{p.label}</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>"{p.query}"</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {!loadingMessages && currentMessages && currentMessages.length > 0 &&
            currentMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: msg.sender === "user" ? "row-reverse" : "row",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: msg.sender === "user" ? "#0078D4" : "#FFFFFF",
                    color: msg.sender === "user" ? "#FFFFFF" : "#0078D4",
                    border: msg.sender === "user" ? "none" : "1px solid #E2E8F0",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                    fontSize: "11px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {msg.sender === "user" ? (userSession?.avatar || "ME") : <Sparkles style={{ width: "16px", height: "16px" }} />}
                </div>

                {/* Bubble Container */}
                <div
                  style={{
                    flex: 1,
                    maxWidth: msg.sender === "user" ? "76%" : "88%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  {/* Sender Metadata Bar (Visible Name & ID/Email) */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "4px",
                      fontSize: "11px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: msg.sender === "user" ? "#0078D4" : "#1E293B",
                      }}
                    >
                      {msg.sender === "user"
                        ? (msg.user_name || userSession?.name || "Employee")
                        : "OneDesk AI"}
                    </span>
                    {msg.sender === "user" && (msg.user_email || userSession?.email) && (
                      <span
                        style={{
                          fontSize: "10.5px",
                          color: "#64748B",
                          background: "#F1F5F9",
                          padding: "1px 6px",
                          borderRadius: "6px",
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        {msg.user_email || userSession?.email}
                      </span>
                    )}
                    <span style={{ fontSize: "10px", color: "#94A3B8" }}>
                      • {mounted ? msg.timestamp : ""}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div
                    style={{
                      width: "100%",
                      borderRadius: "18px",
                      padding: "14px 18px",
                      background: msg.sender === "user" ? "#0078D4" : "#F8FAFC",
                      color: msg.sender === "user" ? "#FFFFFF" : "#0F172A",
                      border: msg.sender === "user" ? "none" : "1px solid #E2E8F0",
                      boxShadow:
                        msg.sender === "user"
                          ? "0 4px 12px rgba(0,120,212,0.2)"
                          : "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Domain + Confidence badges */}
                    {msg.sender === "bot" && msg.domain && msg.domain !== "General" && (
                      <div style={{ marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid #E2E8F0" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: "20px",
                            background: "#EFF6FC",
                            color: "#0078D4",
                            border: "1px solid #C7E0F4",
                          }}
                        >
                          {msg.domain}
                        </span>
                        {msg.confidence !== undefined && (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "3px 9px",
                              borderRadius: "20px",
                              background: "#F0FDF4",
                              color: "#16A34A",
                              border: "1px solid #BBF7D0",
                              marginLeft: "6px",
                            }}
                          >
                            {Math.round(msg.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message text */}
                    <div style={{ fontSize: "13.5px", lineHeight: 1.6 }}>
                      {msg.sender === "user" ? msg.text : renderFormattedText(msg.text)}
                    </div>

                    {/* Action card */}
                    {msg.actionProposal && (
                      <ActionCard
                        proposal={msg.actionProposal}
                        employeeId={userSession?.email || "EMP001"}
                        userName={userSession?.name || "Vipul Jain"}
                        userEmail={userSession?.email || "healthmate05@gmail.com"}
                        authProvider={userSession?.authProvider}
                        threadId={activeThreadId || undefined}
                        messageId={msg.id}
                        onActionConfirmed={(result) => {
                          const ticketNum = result?.ticket_number || result?.booking_id || undefined;
                          const resMsg = result?.message || "";
                          // 1. Patch in-memory state immediately so UI updates cleanly
                          setThreadMessages((prev) => ({
                            ...prev,
                            [activeThreadId!]: (prev[activeThreadId!] || []).map((m) =>
                              m.id === msg.id
                                ? {
                                    ...m,
                                    actionProposal: {
                                      ...m.actionProposal,
                                      executed: true,
                                      result_message: resMsg,
                                      ticket_number: ticketNum,
                                    },
                                  }
                                : m
                            ),
                          }));
                          // 2. Persist to DB so it survives remount/refresh
                          markMessageExecuted(
                            msg.id,
                            resMsg,
                            ticketNum || "",
                            activeThreadId || undefined
                          );
                          if (onTicketCreated) onTicketCreated();
                        }}
                      />
                    )}

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #E2E8F0" }}>
                        <button
                          onClick={() => toggleSources(msg.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#0078D4",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          <BookOpen style={{ width: "13px", height: "13px" }} />
                          {msg.sources.length} Sources
                          {expandedSources[msg.id] ? (
                            <ChevronUp style={{ width: "12px", height: "12px" }} />
                          ) : (
                            <ChevronDown style={{ width: "12px", height: "12px" }} />
                          )}
                        </button>
                        {expandedSources[msg.id] && (
                          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                            {msg.sources.map((s, i) => (
                              <div
                                key={i}
                                style={{
                                  padding: "8px 10px",
                                  background: "#FFFFFF",
                                  borderRadius: "8px",
                                  border: "1px solid #E2E8F0",
                                  fontSize: "11px",
                                  color: "#475569",
                                }}
                              >
                                <span style={{ fontWeight: 600, color: "#0078D4" }}>{s.filename}</span>
                                <span style={{ color: "#94A3B8" }}> — {s.text.slice(0, 80)}...</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles style={{ width: "16px", height: "16px", color: "#0078D4" }} />
              </div>
              <div
                style={{
                  padding: "14px 18px",
                  background: "#F8FAFC",
                  borderRadius: "18px",
                  border: "1px solid #E2E8F0",
                }}
              >
                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: "#0078D4",
                        animation: `pulse 1.4s ease-in-out ${i * 0.25}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div
        style={{
          width: "100%",
          padding: "16px 32px 20px",
          borderTop: "1px solid #E2E8F0",
          background: "#FFFFFF",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask anything about IT, HR, Finance, or Facilities..."
            style={{
              flex: 1,
              padding: "14px 18px",
              border: "1px solid #CBD5E1",
              borderRadius: "14px",
              fontSize: "14px",
              outline: "none",
              transition: "border 0.2s, box-shadow 0.2s",
              background: "#F8FAFC",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#0078D4";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,120,212,0.1)";
              e.currentTarget.style.background = "#FFFFFF";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#CBD5E1";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.background = "#F8FAFC";
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            style={{
              padding: "14px 24px",
              background: input.trim() && !loading ? "#0078D4" : "#E2E8F0",
              color: input.trim() && !loading ? "#FFFFFF" : "#94A3B8",
              border: "none",
              borderRadius: "14px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            <Send style={{ width: "16px", height: "16px" }} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
