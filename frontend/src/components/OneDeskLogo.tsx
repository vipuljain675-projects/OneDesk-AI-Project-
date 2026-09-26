// src/components/OneDeskLogo.tsx
"use client";

import React from "react";

interface OneDeskLogoProps {
  size?: number;
  showText?: boolean;
  textSize?: number;
  badgeSize?: number;
}

export const OneDeskBrandMark: React.FC<{ size?: number }> = ({ size = 36 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: "drop-shadow(0 4px 10px rgba(0, 120, 212, 0.35))",
        flexShrink: 0,
      }}
    >
      <defs>
        {/* Desk Top Gradient (Futuristic Glass Surface) */}
        <linearGradient id="odDeskSurface" x1="6" y1="8" x2="38" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00A4EF" />
          <stop offset="0.6" stopColor="#0078D4" />
          <stop offset="1" stopColor="#004E8C" />
        </linearGradient>

        {/* Lower Foundation Gradient */}
        <linearGradient id="odBaseGrad" x1="4" y1="16" x2="40" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#005A9E" />
          <stop offset="1" stopColor="#002050" />
        </linearGradient>

        {/* Central AI Glowing Core */}
        <radialGradient id="odAiOrb" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="30%" stopColor="#60CDFF" />
          <stop offset="70%" stopColor="#0078D4" />
          <stop offset="100%" stopColor="#004E8C" />
        </radialGradient>

        {/* Soft Glow Filter */}
        <filter id="odOrbGlow" x="12" y="8" width="20" height="20" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 3D Isometric Computer Desk Surface */}
      <path
        d="M22 6L40 16.5L22 27L4 16.5L22 6Z"
        fill="url(#odDeskSurface)"
        stroke="#60CDFF"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Desk Left Bevel Thickness */}
      <path
        d="M4 16.5V23.5L22 34V27L4 16.5Z"
        fill="url(#odBaseGrad)"
        stroke="#0078D4"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* Desk Right Bevel Thickness */}
      <path
        d="M40 16.5V23.5L22 34V27L40 16.5Z"
        fill="#002B5C"
        stroke="#005A9E"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* 4 Multi-Department Radiant Data Conduits (IT Blue, HR Green, Finance Amber, Product Purple) */}
      <circle cx="9" cy="14" r="1.8" fill="#60CDFF" />
      <line x1="9" y1="14" x2="22" y2="16.5" stroke="#60CDFF" strokeWidth="1.2" strokeOpacity="0.85" strokeDasharray="1.5 1.5" />

      <circle cx="35" cy="14" r="1.8" fill="#C084FC" />
      <line x1="35" y1="14" x2="22" y2="16.5" stroke="#C084FC" strokeWidth="1.2" strokeOpacity="0.85" strokeDasharray="1.5 1.5" />

      <circle cx="12" cy="22" r="1.8" fill="#4ADE80" />
      <line x1="12" y1="22" x2="22" y2="16.5" stroke="#4ADE80" strokeWidth="1.2" strokeOpacity="0.85" strokeDasharray="1.5 1.5" />

      <circle cx="32" cy="22" r="1.8" fill="#FBBF24" />
      <line x1="32" y1="22" x2="22" y2="16.5" stroke="#FBBF24" strokeWidth="1.2" strokeOpacity="0.85" strokeDasharray="1.5 1.5" />

      {/* Central Floating AI Intelligent Core (The AI Orb on the Desk) */}
      <circle cx="22" cy="16.5" r="5" fill="url(#odAiOrb)" filter="url(#odOrbGlow)" />
      <circle cx="22" cy="16.5" r="2.2" fill="#FFFFFF" />
    </svg>
  );
};

export const OneDeskLogo: React.FC<OneDeskLogoProps> = ({
  size = 36,
  showText = true,
  textSize = 22,
  badgeSize = 11,
}) => {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
      <OneDeskBrandMark size={size} />
      {showText && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontSize: `${textSize}px`,
              fontWeight: 800,
              color: "#0F172A",
              letterSpacing: "-0.5px",
              lineHeight: 1,
            }}
          >
            OneDesk
          </span>
          <span
            style={{
              fontSize: `${badgeSize}px`,
              fontWeight: 800,
              color: "#FFFFFF",
              backgroundColor: "#0078D4",
              padding: "2px 7px",
              borderRadius: "6px",
              letterSpacing: "0.4px",
              lineHeight: 1.2,
            }}
          >
            AI
          </span>
        </div>
      )}
    </div>
  );
};

export default OneDeskLogo;
