// src/components/EmployeeLayout.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import { OneDeskBrandMark } from "./OneDeskLogo";
import { EmployeeDashboard } from "./EmployeeDashboard";
import { ThreadedChatView } from "./ThreadedChatView";
import { MyRequestsView } from "./MyRequestsView";
import {
  ChatThread,
  fetchThreads,
  createThread,
  deleteThread,
} from "@/lib/api";

import { UserSession } from "./LoginView";

type EmployeeView = "dashboard" | "chats" | "requests";

interface EmployeeLayoutProps {
  userSession?: UserSession;
  onTicketCreated?: () => void;
}

export const EmployeeLayout: React.FC<EmployeeLayoutProps> = ({ userSession, onTicketCreated }) => {
  const [activeView, setActiveView] = useState<EmployeeView>("chats");
  const [chatsExpanded, setChatsExpanded] = useState(true);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadMenuOpen, setThreadMenuOpen] = useState<string | null>(null);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentUserId = userSession?.email || "EMP001";

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setThreadMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load threads on mount / user change and auto-select latest thread if available
  const loadThreads = async (autoSelect = false) => {
    setLoadingThreads(true);
    try {
      const data = await fetchThreads(currentUserId);
      setThreads(data);
      if (autoSelect && data.length > 0) {
        setActiveThreadId(data[0].thread_id);
      } else if (data.length === 0) {
        setActiveThreadId(null);
      }
    } catch (e) {
      console.error("Failed to load threads", e);
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    setActiveThreadId(null);
    loadThreads(true);
  }, [currentUserId]);

  const handleChatsRowClick = () => {
    setActiveView("chats");
    if (!chatsExpanded) {
      setChatsExpanded(true);
      loadThreads();
    }
  };

  const handleToggleAccordion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setChatsExpanded((prev) => !prev);
  };

  const handleNewThread = async () => {
    try {
      const thread = await createThread(
        "New Chat",
        currentUserId,
        userSession?.name || "",
        userSession?.email || ""
      );
      setThreads((prev) => [thread, ...prev]);
      setActiveThreadId(thread.thread_id);
      setActiveView("chats");
      setChatsExpanded(true);
    } catch (e) {
      console.error("Failed to create thread", e);
    }
  };

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setActiveView("chats");
  };

  const handleDashboardNavigate = (view: "chats" | "requests", queryOrThreadId?: string) => {
    if (view === "requests") {
      setActiveView("requests");
    } else if (view === "chats") {
      setActiveView("chats");
      if (queryOrThreadId) {
        const found = threads.find((t) => t.thread_id === queryOrThreadId);
        if (found) {
          setActiveThreadId(queryOrThreadId);
        } else {
          setChatsExpanded(true);
          setPendingPrompt(queryOrThreadId);
        }
      }
    }
  };

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreadMenuOpen(null);
    try {
      await deleteThread(threadId);
      setThreads((prev) => prev.filter((t) => t.thread_id !== threadId));
      if (activeThreadId === threadId) {
        const remaining = threads.filter((t) => t.thread_id !== threadId);
        setActiveThreadId(remaining.length > 0 ? remaining[0].thread_id : null);
      }
    } catch (e) {
      console.error("Failed to delete thread", e);
    }
  };

  // Group threads by date
  const groupThreads = (threads: ChatThread[]) => {
    const now = new Date();
    const today: ChatThread[] = [];
    const yesterday: ChatThread[] = [];
    const older: ChatThread[] = [];

    threads.forEach((t) => {
      const d = new Date(t.updated_at);
      const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diffDays === 0) today.push(t);
      else if (diffDays === 1) yesterday.push(t);
      else older.push(t);
    });

    return { today, yesterday, older };
  };

  const grouped = groupThreads(threads);

  const renderThreadItem = (thread: ChatThread) => {
    const isActive = activeThreadId === thread.thread_id;
    const isMenuOpen = threadMenuOpen === thread.thread_id;

    return (
      <div
        key={thread.thread_id}
        onClick={() => handleSelectThread(thread.thread_id)}
        style={{
          position: "relative",
          padding: "8px 10px",
          marginBottom: "2px",
          borderRadius: "8px",
          cursor: "pointer",
          background: isActive ? "#EFF6FC" : "transparent",
          border: isActive ? "1px solid #C7E0F4" : "1px solid transparent",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = "#F1F5F9";
          const btn = e.currentTarget.querySelector(".thread-menu-btn") as HTMLElement;
          if (btn) btn.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = "transparent";
          if (!isMenuOpen) {
            const btn = e.currentTarget.querySelector(".thread-menu-btn") as HTMLElement;
            if (btn) btn.style.opacity = "0";
          }
        }}
      >
        <MessageSquare
          style={{
            width: "13px",
            height: "13px",
            color: isActive ? "#0078D4" : "#94A3B8",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            flex: 1,
            fontSize: "12.5px",
            fontWeight: isActive ? 600 : 400,
            color: isActive ? "#0078D4" : "#334155",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {thread.title}
        </span>

        {/* 3-dot menu button */}
        <button
          className="thread-menu-btn"
          onClick={(e) => {
            e.stopPropagation();
            setThreadMenuOpen(isMenuOpen ? null : thread.thread_id);
          }}
          style={{
            opacity: isMenuOpen ? 1 : 0,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            transition: "opacity 0.1s",
          }}
        >
          <MoreHorizontal style={{ width: "14px", height: "14px", color: "#64748B" }} />
        </button>

        {/* Dropdown menu */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            style={{
              position: "absolute",
              top: "100%",
              right: "4px",
              zIndex: 100,
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              minWidth: "140px",
              overflow: "hidden",
            }}
          >
            <button
              onClick={(e) => handleDeleteThread(thread.thread_id, e)}
              style={{
                width: "100%",
                padding: "9px 14px",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12.5px",
                color: "#DC2626",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <Trash2 style={{ width: "14px", height: "14px" }} />
              Delete chat
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderThreadGroup = (label: string, items: ChatThread[]) => {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#94A3B8",
            letterSpacing: "0.06em",
            padding: "0 10px 6px",
          }}
        >
          {label}
        </div>
        {items.map(renderThreadItem)}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", flex: 1, minWidth: 0, background: "#F8FAFC" }}>
      {/* ── Left Navigation Sidebar ─────────────────────────────────────── */}
      <div
        style={{
          width: "220px",
          background: "#FFFFFF",
          borderRight: "1px solid #E2E8F0",
          display: "flex",
          flexDirection: "column",
          boxShadow: "2px 0 4px rgba(0,0,0,0.02)",
          flexShrink: 0,
        }}
      >
        {/* Logo area */}
        <div
          style={{
            padding: "18px 16px 14px",
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <OneDeskBrandMark size={32} />
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", lineHeight: 1 }}>
                OneDesk AI
              </div>
              <div style={{ fontSize: "10px", color: "#94A3B8" }}>Employee Workspace</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>

          {/* Dashboard */}
          <div
            onClick={() => setActiveView("dashboard")}
            style={{
              padding: "10px 12px",
              marginBottom: "2px",
              borderRadius: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: activeView === "dashboard" ? "#EFF6FC" : "transparent",
              border: activeView === "dashboard" ? "1px solid #C7E0F4" : "1px solid transparent",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              if (activeView !== "dashboard") e.currentTarget.style.background = "#F8FAFC";
            }}
            onMouseLeave={(e) => {
              if (activeView !== "dashboard") e.currentTarget.style.background = "transparent";
            }}
          >
            <LayoutDashboard
              style={{ width: "16px", height: "16px", color: activeView === "dashboard" ? "#0078D4" : "#64748B", flexShrink: 0 }}
            />
            <span style={{ fontSize: "13px", fontWeight: activeView === "dashboard" ? 600 : 500, color: activeView === "dashboard" ? "#0078D4" : "#334155" }}>
              Dashboard
            </span>
          </div>

          {/* My Chats — with accordion */}
          <div style={{ marginBottom: "2px" }}>
            <div
              onClick={handleChatsRowClick}
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: activeView === "chats" ? "#EFF6FC" : "transparent",
                border: activeView === "chats" ? "1px solid #C7E0F4" : "1px solid transparent",
                userSelect: "none",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => {
                if (activeView !== "chats") e.currentTarget.style.background = "#F8FAFC";
              }}
              onMouseLeave={(e) => {
                if (activeView !== "chats") e.currentTarget.style.background = "transparent";
              }}
            >
              <MessageSquare
                style={{ width: "16px", height: "16px", color: activeView === "chats" ? "#0078D4" : "#64748B", flexShrink: 0 }}
              />
              <span style={{ flex: 1, fontSize: "13px", fontWeight: activeView === "chats" ? 600 : 500, color: activeView === "chats" ? "#0078D4" : "#334155" }}>
                My Chats
              </span>
              <button
                type="button"
                onClick={handleToggleAccordion}
                aria-label={chatsExpanded ? "Collapse chats" : "Expand chats"}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "2px 4px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748B",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#E2E8F0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {chatsExpanded
                  ? <ChevronDown style={{ width: "15px", height: "15px" }} />
                  : <ChevronRight style={{ width: "15px", height: "15px" }} />
                }
              </button>
            </div>

            {/* Thread accordion */}
            {chatsExpanded && (
              <div style={{ marginTop: "4px", paddingLeft: "8px" }}>
                {/* New Chat button */}
                <button
                  onClick={handleNewThread}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    marginBottom: "8px",
                    background: "#F1F5F9",
                    border: "1px dashed #CBD5E1",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#EFF6FC";
                    e.currentTarget.style.borderColor = "#0078D4";
                    e.currentTarget.style.color = "#0078D4";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#F1F5F9";
                    e.currentTarget.style.borderColor = "#CBD5E1";
                    e.currentTarget.style.color = "#475569";
                  }}
                >
                  <Plus style={{ width: "13px", height: "13px" }} />
                  New Chat
                </button>

                {loadingThreads ? (
                  <div style={{ padding: "8px 10px", fontSize: "11px", color: "#94A3B8" }}>
                    Loading chats...
                  </div>
                ) : threads.length === 0 ? (
                  <div style={{ padding: "8px 10px", fontSize: "11px", color: "#94A3B8", textAlign: "center" }}>
                    No chats yet. Start a new one!
                  </div>
                ) : (
                  <>
                    {renderThreadGroup("Today", grouped.today)}
                    {renderThreadGroup("Yesterday", grouped.yesterday)}
                    {renderThreadGroup("Older", grouped.older)}
                  </>
                )}
              </div>
            )}
          </div>

          {/* My Requests */}
          <div
            onClick={() => setActiveView("requests")}
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: activeView === "requests" ? "#EFF6FC" : "transparent",
              border: activeView === "requests" ? "1px solid #C7E0F4" : "1px solid transparent",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              if (activeView !== "requests") e.currentTarget.style.background = "#F8FAFC";
            }}
            onMouseLeave={(e) => {
              if (activeView !== "requests") e.currentTarget.style.background = "transparent";
            }}
          >
            <FileText
              style={{ width: "16px", height: "16px", color: activeView === "requests" ? "#0078D4" : "#64748B", flexShrink: 0 }}
            />
            <span style={{ fontSize: "13px", fontWeight: activeView === "requests" ? 600 : 500, color: activeView === "requests" ? "#0078D4" : "#334155" }}>
              My Requests
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #F1F5F9",
          }}
        >
          <div style={{ fontSize: "10px", color: "#94A3B8" }}>Powered by RAG + Groq</div>
        </div>
      </div>

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <div style={{ flex: 1, width: "100%", minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeView === "dashboard" && (
          <EmployeeDashboard
            userName={userSession?.name || "Employee"}
            employeeId={currentUserId}
            onNavigate={handleDashboardNavigate}
          />
        )}
        <div style={{ display: activeView === "chats" ? "flex" : "none", flex: 1, width: "100%", height: "100%", minWidth: 0, flexDirection: "column" }}>
          <ThreadedChatView
            activeThreadId={activeThreadId}
            userSession={userSession}
            pendingPrompt={pendingPrompt}
            onClearPendingPrompt={() => setPendingPrompt(null)}
            onNewThread={handleNewThread}
            onSelectThread={handleSelectThread}
            onTicketCreated={onTicketCreated}
            onThreadsChanged={() => loadThreads(false)}
          />
        </div>
        {activeView === "requests" && <MyRequestsView employeeId={currentUserId} />}
      </div>
    </div>
  );
};
