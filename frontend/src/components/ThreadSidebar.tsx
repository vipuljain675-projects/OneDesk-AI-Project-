// src/components/ThreadSidebar.tsx
"use client";

import React from "react";
import { Plus, MessageSquare, Calendar } from "lucide-react";

export interface Thread {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  domain: string;
  messageCount: number;
}

export interface ThreadGroup {
  label: string;
  threads: Thread[];
}

interface ThreadSidebarProps {
  threads: ThreadGroup[];
  activeThreadId: string | null;
  onNewThread: () => void;
  onSelectThread: (threadId: string) => void;
}

export const ThreadSidebar: React.FC<ThreadSidebarProps> = ({
  threads,
  activeThreadId,
  onNewThread,
  onSelectThread,
}) => {
  const domainColors: Record<string, { bg: string; text: string }> = {
    IT: { bg: "#EFF6FC", text: "#0078D4" },
    HR: { bg: "#F0FDF4", text: "#16A34A" },
    Finance: { bg: "#FAF5FF", text: "#9333EA" },
    Facilities: { bg: "#FFFBEB", text: "#D97706" },
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      style={{
        width: "280px",
        height: "100%",
        background: "#FFFFFF",
        borderRight: "1px solid #E2E8F0",
        display: "flex",
        flexDirection: "column",
        boxShadow: "2px 0 4px rgba(0,0,0,0.02)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 16px",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <button
          onClick={onNewThread}
          style={{
            width: "100%",
            padding: "12px",
            background: "#0078D4",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#005A9E")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#0078D4")}
        >
          <Plus style={{ width: "18px", height: "18px" }} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Threads List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 8px",
        }}
      >
        {threads.map((group, groupIdx) => (
          <div key={groupIdx} style={{ marginBottom: "24px" }}>
            {/* Group Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#64748B",
                padding: "0 8px 8px 8px",
                letterSpacing: "0.05em",
              }}
            >
              <Calendar style={{ width: "12px", height: "12px" }} />
              <span>{group.label}</span>
            </div>

            {/* Threads in Group */}
            {group.threads.length === 0 ? (
              <div
                style={{
                  padding: "12px",
                  fontSize: "11px",
                  color: "#94A3B8",
                  textAlign: "center",
                }}
              >
                No conversations yet
              </div>
            ) : (
              group.threads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                const domainColor = domainColors[thread.domain] || { bg: "#F8FAFC", text: "#64748B" };

                return (
                  <div
                    key={thread.id}
                    onClick={() => onSelectThread(thread.id)}
                    style={{
                      padding: "10px 12px",
                      margin: "0 0 4px 0",
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      background: isActive ? "#EFF6FC" : "transparent",
                      border: isActive ? "1px solid #C7E0F4" : "1px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "#F8FAFC";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    {/* Thread Header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      <MessageSquare
                        style={{
                          width: "14px",
                          height: "14px",
                          color: isActive ? "#0078D4" : "#64748B",
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          fontSize: "13px",
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? "#0078D4" : "#334155",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {thread.title}
                      </span>
                    </div>

                    {/* Thread Preview */}
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#64748B",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginBottom: "6px",
                      }}
                    >
                      {thread.preview}
                    </div>

                    {/* Thread Meta */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: "10px",
                          background: domainColor.bg,
                          color: domainColor.text,
                        }}
                      >
                        {thread.domain}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#94A3B8",
                        }}
                      >
                        {getRelativeTime(thread.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
