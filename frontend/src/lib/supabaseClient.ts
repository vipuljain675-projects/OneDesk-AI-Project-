// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kywqmkjnavtbpkiarwxt.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_6sV0j01bazYGTYzqJpDSXg_DeThY8Hk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Trigger Google OAuth via Supabase
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Trigger Microsoft / Azure AD SSO via Supabase
 */
export async function signInWithAzure() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      scopes: "email profile openid",
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Standard Email & Password Sign Up
 */
export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email.split("@")[0],
      },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Standard Email & Password Sign In
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * Sign Out from Supabase Auth
 */
export async function signOutSupabase() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Error signing out:", error);
}

// ── User Profile helpers ──────────────────────────────────────────────────────

export interface UserProfileData {
  email: string;
  full_name?: string;
  avatar?: string;
  role?: string;
  department?: string;
  employee_id?: string;
  job_title?: string;
  phone?: string;
  location?: string;
  age?: number;
  joined_at?: string;  // ISO date string e.g. "2024-01-15"
}

/**
 * Upsert user profile into the user_profiles table.
 * Creates on first login, updates on every subsequent login.
 */
export async function upsertUserProfile(profile: UserProfileData): Promise<void> {
  const { error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        email: profile.email,
        full_name: profile.full_name || "",
        avatar: profile.avatar || "",
        role: profile.role || "employee",
        department: profile.department || "General",
        employee_id: profile.employee_id || null,
        job_title: profile.job_title || null,
        phone: profile.phone || null,
        location: profile.location || null,
        age: profile.age || null,
        joined_at: profile.joined_at || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }   // upsert on email uniqueness
    );

  if (error) throw error;
}

/**
 * Fetch the stored profile for a given email.
 * Returns null if no profile row exists yet.
 */
export async function fetchUserProfile(email: string): Promise<UserProfileData | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // row not found
    throw error;
  }
  return data as UserProfileData;
}
