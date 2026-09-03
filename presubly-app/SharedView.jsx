import React, { useState, useEffect } from "react";
import { Logo, Wordmark } from "./Brand.jsx";
import { ReadinessReport, downloadReport } from "./Report.jsx";
import { SimReport, downloadSim } from "./SimReport.jsx";
import { getComments, CommentCards } from "./Comments.jsx";
import { makeQR } from "./exports.js";

/* Public, no-auth view for a shared report: #share-<id>.
   Rendered by AuthGate before the sign-in gate. */
export default function SharedView({ id }) {
  const [state, setState] = useState({ loading: true });
  const [qr, setQr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/share?id=${encodeURIComponent(id)}`);
        const d = await r.json();
        if (!r.ok) setState({ error: d.error || "Rapor bulunamadı." });
        else setState({ report: d.data, title: d.title, views: d.views });
      } catch { setState({ error: "Bağlantı hatası." }); }
      try { setQr(await makeQR(window.location.href)); } catch { /* optional */ }
    })();
  }, [id]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper2)" }}>
      <div style={{ height: 60, borderBottom: "1px solid var(--ln)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Wordmark size={18} /></div>
        <a href="/" style={{ fontSize: 13, fontWeight: 600 }}>Presubly'yi dene →</a>
      </div>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {state.loading && <div className="card"><div className="empty">Yükleniyor…</div></div>}
        {state.error && <div className="card" style={{ padding: 18 }}><div className="err-box">{state.error}</div></div>}
        {state.report && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div className="tool-h">{state.title || "Uyumluluk Raporu"}</div>
                <div className="tool-sub">Presubly ile paylaşıldı · {state.views} görüntülenme</div>
              </div>
              {qr && (
                <div style={{ textAlign: "center", fontFamily: "var(--fm)", fontSize: 9.5, color: "var(--k4)" }}>
                  <img src={qr} alt="QR" style={{ width: 84, height: 84, border: "1px solid var(--ln)", borderRadius: 9, padding: 4, background: "#fff" }} /><br />QR ile doğrula
                </div>
              )}
            </div>
            {Array.isArray(state.report?.dimensions)
              ? <SimReport sim={state.report} onDownload={() => downloadSim(state.report)} />
              : <ReadinessReport report={state.report} onDownload={() => downloadReport(state.report)} />}
            <CommentCards comments={getComments(state.report)} />
          </>
        )}
      </div>
    </div>
  );
}
