"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { EmployeeLayout } from "@/components/EmployeeLayout";
import { AdminHelpdeskView } from "@/components/AdminHelpdeskView";
import { LoginView, UserSession } from "@/components/LoginView";
import { fetchTickets, upsertOneDeskUser } from "@/lib/api";
import { supabase, signOutSupabase } from "@/lib/supabaseClient";

export default function Home() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [activeAdminView, setActiveAdminView] = useState<"admin_queue" | "admin_analytics" | "admin_users">("admin_queue");
  const [ticketCount, setTicketCount] = useState<number>(0);
  const upsertedEmailRef = useRef<string | null>(null);

  // Helper: map Supabase user → UserSession and persist
  const applySupabaseUser = (user: any) => {
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Employee";

    const avatarInitials =
      fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "ME";

    const provider =
      user.app_metadata?.provider ||
      (user.email?.toLowerCase().includes("@gmail.com")
        ? "google"
        : user.email?.toLowerCase().includes("@outlook.") || user.email?.toLowerCase().includes("@microsoft.")
        ? "azure"
        : "email");

    const mappedSession: UserSession = {
      name: fullName,
      email: user.email || "",
      role: "employee",
      department: user.user_metadata?.department || "Product Engineering",
      avatar: avatarInitials,
      authProvider: provider,
    };

    setUserSession(mappedSession);
    try {
      localStorage.setItem("onedesk_session", JSON.stringify(mappedSession));
    } catch {}

    // Upsert into Supabase onedesk_users table via backend API (non-blocking)
    if (user.email && upsertedEmailRef.current !== user.email) {
      upsertedEmailRef.current = user.email;
      upsertOneDeskUser({
        email: user.email || "",
        name: fullName,
        department: user.user_metadata?.department || "Product Engineering",
        role: "employee",
        auth_provider: user.app_metadata?.provider || "email",
        auth_user_id: user.id || "",
      }).catch(() => {});
    }
  };

  // Initialize session from localStorage and Supabase Auth
  useEffect(() => {
    const init = async () => {
      // 1. Check if there is an active Supabase session (handles refresh correctly)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await applySupabaseUser(session.user);
          // Clean stale OAuth tokens / hashes from browser address bar
          if (typeof window !== "undefined" && (window.location.hash || window.location.search.includes("code="))) {
            window.history.replaceState(null, "", window.location.pathname);
          }
          setIsLoaded(true);
          return;
        }
      } catch {}

      // 2. Fallback: try localStorage (for demo/admin sessions not tied to Supabase Auth)
      try {
        const saved = localStorage.getItem("onedesk_session");
        if (saved) {
          const session: UserSession = JSON.parse(saved);
          setUserSession(session);
          if (session.role === "admin") {
            setActiveAdminView("admin_queue");
          }
        }
      } catch {
        localStorage.removeItem("onedesk_session");
      } finally {
        setIsLoaded(true);
      }
    };

    init();

    // 3. Listen for future auth events (OAuth redirects, sign-out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await applySupabaseUser(session.user);
        if (typeof window !== "undefined" && (window.location.hash || window.location.search.includes("code="))) {
          window.history.replaceState(null, "", window.location.pathname);
        }
        setIsLoaded(true);
      } else if (event === "SIGNED_OUT") {
        setUserSession(null);
        try { localStorage.removeItem("onedesk_session"); } catch {}
        setIsLoaded(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  const loadTicketCount = async () => {
    try {
      const tickets = await fetchTickets();
      setTicketCount(tickets.length);
    } catch {}
  };

  useEffect(() => {
    if (userSession) {
      loadTicketCount();
    }
  }, [userSession]);

  const handleLogin = (session: UserSession) => {
    setUserSession(session);
    try {
      localStorage.setItem("onedesk_session", JSON.stringify(session));
    } catch {}

    // Auto-sync user to Supabase onedesk_users table
    upsertOneDeskUser({
      email: session.email,
      name: session.name,
      department: session.department,
      role: session.role,
      auth_provider: "email",
    }).catch((err) => console.warn("[OneDeskUser] login sync skipped:", err));

    if (session.role === "admin") {
      setActiveAdminView("admin_queue");
    }
  };

  const handleSignOut = async () => {
    setUserSession(null);
    try {
      localStorage.removeItem("onedesk_session");
      await signOutSupabase();
    } catch {}
  };

  // Prevent hydration flash before reading localStorage
  if (!isLoaded) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F8FAFC",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px", width: "24px", height: "24px" }}>
          <div style={{ backgroundColor: "#F25022", borderRadius: "2px" }}></div>
          <div style={{ backgroundColor: "#7FBA00", borderRadius: "2px" }}></div>
          <div style={{ backgroundColor: "#00A4EF", borderRadius: "2px" }}></div>
          <div style={{ backgroundColor: "#FFB900", borderRadius: "2px" }}></div>
        </div>
      </div>
    );
  }

  // If not signed in, show the Login/Sign-In Page
  if (!userSession) {
    return <LoginView onLogin={handleLogin} />;
  }

  const isAdmin = userSession.role === "admin";

  return (
    <div className="portal-wrapper">
      <Header userSession={userSession} onSignOut={handleSignOut} />

      <div className="workspace">
        {/* Employee Layout: Dashboard, Chats, Requests */}
        {!isAdmin && (
          <EmployeeLayout userSession={userSession} onTicketCreated={loadTicketCount} />
        )}

        {/* Admin Layout: Incident Queue & Router Telemetry */}
        {isAdmin && (
          <AdminHelpdeskView
            adminDomain={userSession.adminDomain || "ALL"}
            activeTab={
              activeAdminView === "admin_analytics"
                ? "analytics"
                : activeAdminView === "admin_users"
                ? "users"
                : "queue"
            }
            onTabChange={(tab) =>
              setActiveAdminView(
                tab === "analytics"
                  ? "admin_analytics"
                  : tab === "users"
                  ? "admin_users"
                  : "admin_queue"
              )
            }
          />
        )}
      </div>
    </div>
  );
}
