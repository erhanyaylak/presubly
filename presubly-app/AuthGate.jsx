import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient.js";
import { AuthContext } from "./authContext.js";
import Landing from "./Landing.jsx";
import SharedView from "./SharedView.jsx";

/* Signed-out visitors see the marketing Landing (which hosts the Supabase
   email/password auth screen). Once Supabase confirms a session, we load the
   user's own credit/profile row from /api/me and expose it — plus getToken/
   signOut — via AuthContext. A #share-<id> URL renders a public report,
   bypassing auth entirely. */
export default function AuthGate({ children }) {
  const shareMatch = (typeof window !== "undefined" ? window.location.hash : "").match(/^#share-(.+)$/);

  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (shareMatch) return <SharedView id={shareMatch[1]} />;
  if (session === undefined) return <Spinner />;
  if (!session) return <Landing />;
  return <SignedInProvider session={session}>{children}</SignedInProvider>;
}

function Spinner() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F3EE", color: "#7A766B", gap: 10, fontFamily: "'Public Sans',system-ui,sans-serif", fontSize: 13 }}>
      <span className="spin" style={{ borderColor: "rgba(122,118,107,.3)", borderTopColor: "#C97B5A" }} />
      Yükleniyor…
    </div>
  );
}

/* Map the Supabase user onto the Clerk-shaped object the app already reads
   (primaryEmailAddress / fullName / unsafeMetadata / update). Keeps Presubly.jsx
   unchanged. Metadata (institution, orcid) lives in user_metadata. */
function shimUser(u) {
  if (!u) return null;
  const md = u.user_metadata || {};
  const fullName = md.full_name || md.name || "";
  return {
    id: u.id,
    primaryEmailAddress: { emailAddress: u.email || md.email || "" },
    fullName,
    firstName: (fullName || "").split(" ")[0] || "",
    unsafeMetadata: md,
    update: async ({ unsafeMetadata }) => {
      await supabase.auth.updateUser({ data: unsafeMetadata });
    },
  };
}

function SignedInProvider({ session, children }) {
  const [profile, setProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const user = shimUser(session.user);

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const token = await getToken();
      const email = session.user?.email || null;
      const r = await fetch("/api/me", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (r.ok) setProfile(await r.json());
    } catch { /* keep previous profile */ }
    setLoaded(true);
  }, [getToken, session]);

  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  const isAdmin = !!profile?.is_admin;
  const plan = isAdmin ? "enterprise" : (profile?.plan || "free");
  const value = {
    user,
    profile,
    credits: profile?.credits ?? 0,
    uses: profile?.uses ?? 0,
    plan,
    isAdmin,
    isPro: !!profile?.is_pro || isAdmin, // admins get every Pro feature
    getToken,
    refreshProfile,
    signOut: () => supabase.auth.signOut(),
  };

  if (!loaded) return <Spinner />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
