// src/components/DashboardCards.tsx
"use client";

import React from "react";
import { TrendingUp, Star, Activity, ChevronDown, ChevronUp } from "lucide-react";

export interface DashboardStats {
  totalQueries: number;
  mostUsedDomain: string;
  mostUsedCount: number;
  helpfulRate: number;
}

export interface TrendingQuestion {
  question: string;
  count: number;
  domain: string;
}

export interface SavedAnswer {
  title: string;
  savedDate: Date;
}

interface DashboardCardsProps {
  stats: DashboardStats;
  trending: TrendingQuestion[];
  saved: SavedAnswer[];
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onTrendingClick?: (question: string) => void;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  stats,
  trending,
  saved,
  isMinimized,
  onToggleMinimize,
  onTrendingClick,
}) => {
  if (isMinimized) {
    return (
      <div
        style={{
          padding: "8px 24px",
          background: "#F8FAFC",
          borderBottom: "1px solid #E2E8F0",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <button
          onClick={onToggleMinimize}
          style={{
            padding: "6px 16px",
            fontSize: "11px",
            fontWeight: 600,
            background: "white",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#64748B",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#F8FAFC";
            e.currentTarget.style.borderColor = "#CBD5E1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "white";
            e.currentTarget.style.borderColor = "#E2E8F0";
          }}
        >
          <ChevronDown style={{ width: "14px", height: "14px" }} />
          <span>Show Dashboard</span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "16px 24px",
        background: "#F8FAFC",
        borderBottom: "1px solid #E2E8F0",
      }}
    >
      {/* Toggle Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "12px",
        }}
      >
        <button
          onClick={onToggleMinimize}
          style={{
            padding: "4px 12px",
            fontSize: "11px",
            fontWeight: 600,
            background: "white",
            border: "1px solid #E2E8F0",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: "#64748B",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#F8FAFC";
            e.currentTarget.style.borderColor = "#CBD5E1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "white";
            e.currentTarget.style.borderColor = "#E2E8F0";
          }}
        >
          <ChevronUp style={{ width: "12px", height: "12px" }} />
          <span>Hide</span>
        </button>
      </div>

      {/* Cards Container */}
      <div
        style={{
          display: "flex",
          gap: "14px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {/* Card 1: My Stats */}
        <div
          style={{
            minWidth: "220px",
            background: "white",
            border: "1px solid #E2E8F0",
            borderRadius: "14px",
            padding: "16px 18px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <Activity style={{ width: "16px", height: "16px", color: "#0078D4" }} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#64748B",
              }}
            >
              My Activity
            </span>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1,
              }}
            >
              {stats.totalQueries}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#64748B",
                marginTop: "2px",
              }}
            >
              Questions Asked
            </div>
          </div>

          <div
            style={{
              padding: "8px 0",
              borderTop: "1px solid #F1F5F9",
              marginTop: "8px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#475569",
                marginBottom: "4px",
              }}
            >
              Most Used: <strong style={{ color: "#0078D4" }}>{stats.mostUsedDomain}</strong> ({stats.mostUsedCount})
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#475569",
              }}
            >
              Helpful Rate: <strong style={{ color: "#16A34A" }}>{stats.helpfulRate}%</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Trending Questions */}
        <div
          style={{
            minWidth: "280px",
            background: "white",
            border: "1px solid #E2E8F0",
            borderRadius: "14px",
            padding: "16px 18px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <TrendingUp style={{ width: "16px", height: "16px", color: "#F25022" }} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#64748B",
              }}
            >
              Trending Today
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {trending.length === 0 ? (
              <div style={{ fontSize: "11px", color: "#94A3B8", padding: "8px 0" }}>
                No trending questions yet
              </div>
            ) : (
              trending.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onTrendingClick && onTrendingClick(item.question)}
                  style={{
                    padding: "8px 10px",
                    background: "#F8FAFC",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#EFF6FC";
                    e.currentTarget.style.borderColor = "#C7E0F4";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#F8FAFC";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "2px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#0078D4",
                      }}
                    >
                      {idx + 1}.
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "#334155",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.question}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#64748B",
                      marginLeft: "16px",
                    }}
                  >
                    {item.count} people asked • {item.domain}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 3: Saved Answers */}
        <div
          style={{
            minWidth: "200px",
            background: "white",
            border: "1px solid #E2E8F0",
            borderRadius: "14px",
            padding: "16px 18px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <Star style={{ width: "16px", height: "16px", color: "#FFB900" }} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#64748B",
              }}
            >
              Saved Answers
            </span>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1,
              }}
            >
              {saved.length}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#64748B",
                marginTop: "2px",
              }}
            >
              Bookmarked
            </div>
          </div>

          {saved.length > 0 && (
            <div
              style={{
                padding: "8px 0",
                borderTop: "1px solid #F1F5F9",
                marginTop: "8px",
              }}
            >
              {saved.slice(0, 2).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: "11px",
                    color: "#475569",
                    marginBottom: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  • {item.title}
                </div>
              ))}
              <div
                style={{
                  fontSize: "11px",
                  color: "#0078D4",
                  fontWeight: 600,
                  marginTop: "8px",
                  cursor: "pointer",
                }}
              >
                View all →
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
