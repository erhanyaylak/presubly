/* Plan tiers + feature gating — the single source of truth for what each
   package unlocks. Kept deliberately small and mirrored server-side in
   functions/api/_db.ts (PLAN_RANK / FEATURE_MIN) so gating can't be bypassed
   from the client. Admins are treated as 'enterprise' everywhere. */

export const PLAN_RANK = { free: 0, academic: 1, pro: 2, enterprise: 3 };

/* Minimum plan rank required per feature. Higher tiers inherit everything
   below them (cumulative). */
export const FEATURE_MIN = {
  // Academic (cheapest paid)
  journals: 1,   // dergi profili kütüphanesi
  docx: 1,       // .docx / .pdf yükleme
  history: 1,    // rapor arşivi
  // Pro
  diff: 2,       // yeniden tarama / karşılaştırma
  citecheck: 2,  // atıf–kaynakça denetimi (araç)
  coverletter: 2,// kapak mektubu üretici (araç)
  team: 2,       // ekip & yorum sistemi
  // Enterprise
  share: 3,      // paylaşılabilir rapor linki
  api: 3,        // API erişimi + OJS/DergiPark
  pdf: 3,        // PDF rapor çıktısı
};

export const PLAN_LABEL = { free: "Ücretsiz", academic: "Akademik", pro: "Pro", enterprise: "Kurumsal" };

export function planRank(plan, isAdmin) {
  if (isAdmin) return 3;
  return PLAN_RANK[plan] ?? 0;
}

export function can(plan, isAdmin, feature) {
  return planRank(plan, isAdmin) >= (FEATURE_MIN[feature] ?? 99);
}

/* Which plan a feature first appears in — used for "Yükselt: Pro" labels. */
export function requiredPlanLabel(feature) {
  const min = FEATURE_MIN[feature] ?? 99;
  const entry = Object.entries(PLAN_RANK).find(([, r]) => r === min);
  return entry ? PLAN_LABEL[entry[0]] : "Kurumsal";
}

/* Marketing feature lists per tier (Billing + Landing). */
export const PLAN_FEATURES = {
  free: ["Ayda 3 tarama", "Uyumluluk Taraması (temel)", "Metin yapıştırma", "Rapor .md indirme"],
  academic: ["Sınırsız tarama", "Dergi profili kütüphanesi", ".docx / .pdf yükleme", "Rapor arşivi & ilerleme", "6 araç tam erişim"],
  pro: ["Akademik + tümü", "Yeniden tarama & karşılaştırma", "Atıf–kaynakça denetimi", "Kapak mektubu üretici", "Ekip & yorum sistemi", "Öncelikli işlem"],
  enterprise: ["Pro + tümü", "Paylaşılabilir rapor linki", "PDF rapor çıktısı", "API erişimi (OJS/DergiPark)", "SLA + öncelikli destek"],
};

export const PLAN_PRICE = {
  free: { m: "$0", y: "$0", note: "Sonsuza kadar ücretsiz" },
  academic: { m: "$9", y: "$90", note: "yıllıkta 2 ay bedava" },
  pro: { m: "$19", y: "$190", note: "yıllıkta 2 ay bedava" },
  enterprise: { m: "Teklif", y: "Teklif", note: "Üniversite / araştırma merkezi" },
};

/* Who each tier is for — shown on the pricing cards. */
export const PLAN_TAGLINE = {
  free: "Denemek isteyenler için",
  academic: "Bireysel araştırmacı",
  pro: "Yoğun kullanım & küçük ekipler",
  enterprise: "Dergi & üniversite",
};

/* — English variants (landing pricing only; app keeps the TR ones above). — */
export const PLAN_LABEL_EN = { free: "Free", academic: "Academic", pro: "Pro", enterprise: "Enterprise" };
export const PLAN_FEATURES_EN = {
  free: ["3 scans / month", "Readiness Scan (basic)", "Paste text", "Report .md download"],
  academic: ["Unlimited scans", "Journal profile library", ".docx / .pdf upload", "Report archive & progress", "Full access to 6 tools"],
  pro: ["Everything in Academic", "Re-scan & comparison", "Citation–reference check", "Cover letter generator", "Team & comment system", "Priority processing"],
  enterprise: ["Everything in Pro", "Shareable report link", "PDF report export", "API access (OJS/DergiPark)", "SLA + priority support"],
};
export const PLAN_PRICE_NOTE_EN = {
  free: "Free forever",
  academic: "2 months free yearly",
  pro: "2 months free yearly",
  enterprise: "University / research center",
};
export const PLAN_TAGLINE_EN = {
  free: "For those who want to try",
  academic: "Individual researcher",
  pro: "Heavy use & small teams",
  enterprise: "Journals & universities",
};
