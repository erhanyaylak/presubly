import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const api = read("functions/api/operations.ts");
const ui = read("Presubly.jsx");
const css = read("styles.css");
const migration = read("supabase/psb-imp-013-submission-operations.sql");
const schema = read("supabase/schema.sql");

const checks = [
  ["API route exposes GET and PUT handlers", /onRequestGet/.test(api) && /onRequestPut/.test(api)],
  ["API rejects unauthenticated requests", /getUserId\(request, env\)/.test(api) && /401/.test(api)],
  ["Academic history entitlement is enforced", /canUse\(profile, "history"\)/.test(api)],
  ["Supported workflow statuses are allow-listed", /preparing.*ready.*submitted.*revision.*accepted.*closed/.test(api)],
  ["GET queries are scoped to the authenticated user", /manuscript_operations\?user_id=eq\.\$\{auth\.userId\}/.test(api)],
  ["Upsert lookup is scoped by user and title", /user_id=eq\.\$\{auth\.userId\}&manuscript_title=eq\.\$\{encodedTitle\}/.test(api)],
  ["Updates are scoped by record and user", /manuscript_operations\?id=eq\.\$\{existing\.id\}&user_id=eq\.\$\{auth\.userId\}/.test(api)],
  ["Invalid statuses and malformed dates are rejected", /Geçersiz durum/.test(api) && /Geçersiz tarih/.test(api)],
  ["Operations view is routed and labelled", /view === "operations"/.test(ui) && /PSB-IMP-013/.test(ui)],
  ["Empty, loading, filter and editor states exist", /Gönderim hattın henüz boş/.test(ui) && /Gönderim merkezi hazırlanıyor/.test(ui) && /statusFilter/.test(ui) && /ops-editor/.test(ui)],
  ["Responsive operations styles exist", /PSB-IMP-013 — Submission Operations Center/.test(css) && /@media\(max-width:520px\)/.test(css)],
  ["Migration creates the user-owned table", /create table if not exists public\.manuscript_operations/.test(migration) && /references auth\.users \(id\)/.test(migration)],
  ["Migration enforces one record per user and title", /unique \(user_id, manuscript_title\)/.test(migration)],
  ["Migration enables RLS", /enable row level security/.test(migration)],
  ["Default database privileges are explicitly revoked", /revoke all privileges on table public\.manuscript_operations from anon, authenticated, service_role/.test(migration)],
  ["Server role receives only required table operations", /grant select, insert, update on table public\.manuscript_operations to service_role/.test(migration)],
  ["Canonical schema mirrors the migration", schema.includes("revoke all privileges on table public.manuscript_operations from anon, authenticated, service_role") && schema.includes("grant select, insert, update on table public.manuscript_operations to service_role")],
];

for (const [label, passed] of checks) {
  assert.ok(passed, label);
  console.log(`✓ ${label}`);
}

console.log(`\nPSB-IMP-013 source acceptance checks passed: ${checks.length}/${checks.length}`);
