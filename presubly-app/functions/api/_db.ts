/// <reference types="@cloudflare/workers-types" />
/* Data helpers for credits, plans, and tiered features — Supabase (PostgREST). */
import { type Env, sbSelectOne, sbInsert, sbRpc } from "./_supabase";

export interface Profile {
  id: string;
  email: string | null;
  credits: number;
  plan: string;
  is_pro: boolean;
  is_admin: boolean;
}

/* Mirror of plans.js — server-authoritative gating. */
export const PLAN_RANK: Record<string, number> = { free: 0, academic: 1, pro: 2, enterprise: 3 };
export const FEATURE_MIN: Record<string, number> = {
  journals: 1, docx: 1, history: 1,
  diff: 2, citecheck: 2, coverletter: 2, team: 2,
  share: 3, api: 3, pdf: 3,
};
export function planRankOf(p: Profile | null): number {
  if (!p) return 0;
  if (p.is_admin) return 3;
  return PLAN_RANK[p.plan] ?? 0;
}
export function canUse(p: Profile | null, feature: string): boolean {
  return planRankOf(p) >= (FEATURE_MIN[feature] ?? 99);
}

/** Create the profile row on first sight (idempotent — trigger also covers signup). */
export async function ensureProfile(env: Env, userId: string, email: string | null): Promise<void> {
  await sbInsert(env, "profiles", { id: userId, email, credits: 6 }, true);
}

export async function getProfile(env: Env, userId: string): Promise<Profile | null> {
  return sbSelectOne<Profile>(env, `profiles?id=eq.${userId}&select=id,email,credits,plan,is_pro,is_admin`);
}

/** Atomically deduct `amount` if the balance is sufficient. Returns remaining, or null if insufficient. */
export async function deductCredits(env: Env, userId: string, amount: number): Promise<number | null> {
  const remaining = await sbRpc<number | null>(env, "deduct_credits", { p_user: userId, p_amount: amount });
  return remaining ?? null;
}

export async function addCredits(env: Env, userId: string, amount: number): Promise<void> {
  await sbRpc(env, "add_credits", { p_user: userId, p_amount: amount });
}

export async function logUsage(env: Env, userId: string, action: string, cost: number): Promise<void> {
  await sbInsert(env, "usage_logs", { user_id: userId, product: "presubly", action, cost });
}

/* ── SHA-256 hex, for API keys (never store the raw key) ── */
export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
