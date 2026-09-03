import React from "react";

/* Presubly — Official Brand Kit v1.0 (Green & Gold).
   Deep Teal #0A3D3D · Amber #E8970A · Sage #F2F7F5 · Ink #0A1A14
   Playfair Display (display) · DM Sans (UI) · DM Mono (data/labels)
   Mark: three descending bars (100% · 80% · 53%), last bar amber, on a
   teal rounded square. Wordmark: "Pre" ink + "subly" amber italic. */

export const BRAND = {
  teal: "#0A3D3D", tealMid: "#0D4F4F", tealLight: "#156B6B",
  amber: "#E8970A", amber3: "#FBCA5C", amberSoft: "#FEF8E8", amberDark: "#8A5A00",
  sage: "#F2F7F5", sageDark: "#DCE9E3", ink: "#0A1A14",
};
export const FONTS = {
  d: "'Playfair Display',Georgia,serif",
  u: "'DM Sans',-apple-system,sans-serif",
  m: "'DM Mono',ui-monospace,monospace",
};

/* `dark` → for placing the mark on a teal surface (inverted tint). */
export const Logo = ({ size = 40, dark = false }) => {
  const b1 = dark ? "rgba(242,247,245,.65)" : "rgba(242,247,245,.88)";
  const b2 = dark ? "rgba(242,247,245,.35)" : "rgba(242,247,245,.5)";
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden>
      <rect width="96" height="96" rx="21" fill={dark ? "rgba(242,247,245,.1)" : BRAND.teal} stroke={dark ? "rgba(242,247,245,.15)" : "none"} />
      <rect x="22" y="30" width="52" height="9" rx="4.5" fill={b1} />
      <rect x="22" y="44" width="42" height="9" rx="4.5" fill={b2} />
      <rect x="22" y="58" width="28" height="9" rx="4.5" fill={BRAND.amber} />
    </svg>
  );
};

/* Two-tone wordmark: Pre (ink / light on dark) + subly (amber italic). */
export const Wordmark = ({ size = 20, variant = "light" }) => {
  const onDark = variant === "dark";
  return (
    <span style={{ fontFamily: FONTS.d, fontWeight: 700, fontSize: size, letterSpacing: "-0.02em", lineHeight: 1 }}>
      <span style={{ color: onDark ? "#EAF2EE" : BRAND.ink }}>Pre</span>
      <span style={{ color: onDark ? BRAND.amber3 : BRAND.amber, fontStyle: "italic" }}>subly</span>
    </span>
  );
};
