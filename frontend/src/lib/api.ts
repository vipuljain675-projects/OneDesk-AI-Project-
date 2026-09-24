// src/lib/api.ts
const API_BASE = "http://localhost:8000";

export interface QueryResponse {
  answer: string;
  domain: string;
  confidence: number;
  routing_decision: string;
  sources: Array<{
    filename: string;
    text: string;
    score: number;
    domain: string;
  }>;
  action_proposal: {
    action_type: string;
    display_name: string;
    description: string;
    details: Record<string, any>;
  } | null;
  session_id: string;
  message_id?: number;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  issue: string;
  priority: string;
  status: string;
  employee_id?: string;
  created_at: string;
}

export interface LeaveRequest {
  id: number;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: string;
  created_at: string;
}

export interface RoomBooking {
  id: number;
  room_name: string;
  booking_date: string;
  time_slot: string;
  purpose: string;
  employee_id?: string;
  status: string;
  created_at: string;
}


export interface ExpenseClaim {
  id: number;
  claim_number: string;
  employee_id: string;
  amount: string;
  category: string;
  expense_date: string;
  description: string;
  status: string;
  created_at: string;
}

export interface VisitorPass {
  id: number;
  pass_number: string;
  employee_id: string;
  visitor_name: string;
  visitor_email?: string;
  visit_date: string;
  time_slot: string;
  purpose?: string;
  status: string;
  created_at: string;
}

export interface CandidateReferral {
  id: number;
  referral_number: string;
  employee_id: string;
  candidate_name: string;
  candidate_email?: string;
  role: string;
  notes?: string;
  status: string;
  created_at: string;
}


export interface AnalyticsData {
  total_queries: number;
  avg_confidence: number;
  routing_accuracy: number;
  high_confidence_count: number;
  domain_breakdown: Record<string, { count: number; percentage: number }>;
}

export interface OneDeskUser {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  auth_provider: string;
  created_at: string;
}

// ── Thread types ───────────────────────────────────────────────────────────────

export interface ChatThread {
  thread_id: string;
  title: string;
  employee_id: string;
  user_email?: string;
  user_name?: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatMessage {
  id: number;
  thread_id: string;
  sender: "user" | "bot";
  text: string;
  user_email?: string;
  user_name?: string;
  domain?: string;
  confidence?: number;
  sources?: Array<{ filename: string; text: string; score: number; domain: string }>;
  action_proposal?: any;
  created_at: string;
}

// ── Query ──────────────────────────────────────────────────────────────────────

export async function sendQuery(
  query: string,
  sessionId?: string,
  forceDomain?: string,
  history?: Array<{ sender: "user" | "bot"; text: string }>,
  threadId?: string,
  userName?: string,
  department?: string,
  employeeId?: string
): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      session_id: sessionId || undefined,
      thread_id: threadId || undefined,
      force_domain: forceDomain || undefined,
      history: history || undefined,
      user_name: userName || "Employee",
      department: department || "General",
      employee_id: employeeId || "EMP001",
    }),
  });
  if (!res.ok) throw new Error(`Query failed: ${res.statusText}`);
  return res.json();
}

// ── Thread CRUD ────────────────────────────────────────────────────────────────

export async function fetchThreads(employeeId = "EMP001"): Promise<ChatThread[]> {
  const res = await fetch(`${API_BASE}/api/threads?employee_id=${employeeId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch threads");
  return res.json();
}

export async function createThread(
  title = "New Chat",
  employeeId = "EMP001",
  userName = "",
  userEmail = ""
): Promise<ChatThread> {
  const res = await fetch(`${API_BASE}/api/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      employee_id: employeeId,
      user_email: userEmail || employeeId,  // email is the unique ID
      user_name: userName,
    }),
  });
  if (!res.ok) throw new Error("Failed to create thread");
  return res.json();
}

export async function deleteThread(threadId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/threads/${threadId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete thread");
}

export async function renameThread(threadId: string, title: string): Promise<ChatThread> {
  const res = await fetch(`${API_BASE}/api/threads/${threadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to rename thread");
  return res.json();
}

export async function fetchMessages(threadId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE}/api/threads/${threadId}/messages`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

// ── Other ──────────────────────────────────────────────────────────────────────

export async function confirmAction(
  actionType: string,
  details: Record<string, any>,
  employeeId?: string,
  threadId?: string,
  messageId?: string | number
): Promise<any> {
  const res = await fetch(`${API_BASE}/api/confirm-action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action_type: actionType,
      details: { ...details, employee_id: employeeId || "EMP001" },  // inject employee_id
      thread_id: threadId || undefined,
      message_id: messageId !== undefined ? String(messageId) : undefined,
    }),
  });
  if (!res.ok) throw new Error(`Confirm action failed: ${res.statusText}`);
  return res.json();
}

export async function fetchTickets(employeeId?: string): Promise<Ticket[]> {
  const params = employeeId ? `?employee_id=${encodeURIComponent(employeeId)}` : "";
  const res = await fetch(`${API_BASE}/api/tickets${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch tickets");
  return res.json();
}

export async function fetchLeaves(employeeId?: string): Promise<LeaveRequest[]> {
  const params = employeeId ? `?employee_id=${encodeURIComponent(employeeId)}` : "";
  const res = await fetch(`${API_BASE}/api/leaves${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch leaves");
  return res.json();
}

export async function fetchBookings(employeeId?: string): Promise<RoomBooking[]> {
  const params = employeeId ? `?employee_id=${encodeURIComponent(employeeId)}` : "";
  const res = await fetch(`${API_BASE}/api/bookings${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
}

export async function fetchExpenses(employeeId?: string): Promise<ExpenseClaim[]> {
  const params = employeeId ? `?employee_id=${encodeURIComponent(employeeId)}` : "";
  const res = await fetch(`${API_BASE}/api/expenses${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json();
}

export async function fetchVisitorPasses(employeeId?: string): Promise<VisitorPass[]> {
  const params = employeeId ? `?employee_id=${encodeURIComponent(employeeId)}` : "";
  const res = await fetch(`${API_BASE}/api/visitors${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch visitor passes");
  return res.json();
}

export async function fetchReferrals(employeeId?: string): Promise<CandidateReferral[]> {
  const params = employeeId ? `?employee_id=${encodeURIComponent(employeeId)}` : "";
  const res = await fetch(`${API_BASE}/api/referrals${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch referrals");
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE}/api/analytics`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export async function updateTicketStatus(ticketId: number, status: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/tickets/${ticketId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update ticket status");
  return res.json();
}

export async function updateLeaveStatus(leaveId: number, status: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/leaves/${leaveId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update leave status");
  return res.json();
}

export async function updateBookingStatus(bookingId: number, status: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update booking status");
  return res.json();
}

export async function updateExpenseStatus(expenseId: number, status: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/expenses/${expenseId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update expense status");
  return res.json();
}

export async function updateVisitorPassStatus(passId: number, status: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/visitors/${passId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update visitor pass status");
  return res.json();
}

export async function updateReferralStatus(referralId: number, status: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/referrals/${referralId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update referral status");
  return res.json();
}

// ── OneDesk Users ─────────────────────────────────────────────────────────────

export async function upsertOneDeskUser(user: {
  email: string;
  name?: string;
  department?: string;
  role?: string;
  auth_provider?: string;
  auth_user_id?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/users/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      name: user.name || "",
      department: user.department || "General",
      role: user.role || "employee",
      auth_provider: user.auth_provider || "email",
      auth_user_id: user.auth_user_id || "",
    }),
  });
  if (!res.ok) throw new Error("Failed to upsert user");
  return res.json();
}

export async function fetchOneDeskUsers(): Promise<OneDeskUser[]> {
  const res = await fetch(`${API_BASE}/api/users`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function markMessageExecuted(
  messageId: string | number,
  resultMessage: string = "",
  ticketNumber: string = "",
  threadId?: string
): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/messages/${encodeURIComponent(String(messageId))}/mark-executed`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        result_message: resultMessage,
        ticket_number: ticketNumber,
        thread_id: threadId || undefined,
      }),
    });
  } catch (err) {
    console.warn("markMessageExecuted failed:", err);
  }
}

// ── Live Employee Dashboard ───────────────────────────────────────────────────

export interface DashboardActivityItem {
  id: string;
  type: "ticket" | "leave" | "booking" | "expense" | "visitor" | "referral" | "chat";
  domain: string;
  title: string;
  status: string;
  created_at: string;
  time: string;
  link_type: "requests" | "chats";
  thread_id?: string;
  badge_color?: string;
}

export interface DashboardTrendingItem {

  question: string;
  domain: string;
  count: number;
}

export interface EmployeeDashboardData {
  stats: {
    questions_asked: number;
    resolved_queries: number;
    open_requests: number;
    total_requests: number;
    most_used_domain: string;
    helpful_rate: string;
    avg_response_time: string;
    status: string;
  };
  recent_activity: DashboardActivityItem[];
  trending_questions: DashboardTrendingItem[];
  domain_counts: Record<string, number>;
}

export async function fetchEmployeeDashboardStats(employeeId?: string): Promise<EmployeeDashboardData> {
  const params = employeeId ? `?employee_id=${encodeURIComponent(employeeId)}` : "";
  const res = await fetch(`${API_BASE}/api/employee/dashboard-stats${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch employee dashboard stats");
  return res.json();
}
