"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";

const API = process.env.NEXT_PUBLIC_API_URL!;

type VipLevel = {
  key: "rookie" | "explorer" | "star" | "vip";
  label: string;
  emoji: string;
  start: number;
  nextAt: number | null; // بداية المستوى القادم (10/25/50) أو null لآخر مستوى
  mascotSrc: string; // صورة مختلفة لكل مستوى
};

const LEVELS: VipLevel[] = [
  { key: "rookie", label: "Cat Rookie", emoji: "🐾", start: 0, nextAt: 10, mascotSrc: "/cat-rookie.png" },
  { key: "explorer", label: "Cat Explorer", emoji: "😎", start: 10, nextAt: 25, mascotSrc: "/cat-explorer.png" },
  { key: "star", label: "Cat Star", emoji: "🎩", start: 25, nextAt: 50, mascotSrc: "/cat-star.png" },
  { key: "vip", label: "VIP Cat", emoji: "👑", start: 50, nextAt: null, mascotSrc: "/cat-vip.png" },
];

function getVip(points: number): VipLevel {
  if (points >= 50) return LEVELS[3];
  if (points >= 25) return LEVELS[2];
  if (points >= 10) return LEVELS[1];
  return LEVELS[0];
}

function maskPhone(phone: string) {
  // 0781••••200
  if (!phone || phone.length < 7) return phone;
  const left = phone.slice(0, 4);
  const right = phone.slice(-3);
  return `${left}••••${right}`;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function fmtMMYYYY(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${yyyy}`;
}

function pseudoCardNumberFromPhone(phone: string) {
  const digits = (phone || "").replace(/\D/g, "");
  const last = digits.slice(-6).padStart(6, "0");
  return `DRK •••• ${last}`;
}

export default function CustomerCardClient({ phone }: { phone: string }) {
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [err, setErr] = useState("");

  // optional bearer from query ?token=...
  const bearer = useMemo(() => {
    if (typeof window === "undefined") return "";
    const t = new URLSearchParams(window.location.search).get("token");
    return t ? `Bearer ${t}` : "";
  }, []);

  async function load() {
    try {
      setErr("");
      setLoading(true);

      const headers: any = {};
      if (bearer) headers.Authorization = bearer;

      const res = await axios.get(`${API}/customers/by-phone/${encodeURIComponent(phone)}`, { headers });
      setCustomer(res.data);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Failed to load customer");
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const points: number = Number(customer?.points ?? 0);
  const vip = useMemo(() => getVip(points), [points]);

  const nextLabel = useMemo(() => {
    if (!vip.nextAt) return "";
    const next = vip.key === "rookie" ? "Cat Explorer" : vip.key === "explorer" ? "Cat Star" : "VIP Cat";
    return next;
  }, [vip]);

  const progress = useMemo(() => {
    if (!vip.nextAt) return 1;
    const p = (points - vip.start) / (vip.nextAt - vip.start);
    return Math.max(0, Math.min(1, p));
  }, [points, vip]);

  const ptsToNext = useMemo(() => {
    if (!vip.nextAt) return 0;
    return Math.max(0, vip.nextAt - points);
  }, [points, vip]);

  const lastActivityRaw =
    customer?.last_purchase_at ||
    customer?.last_transaction_at ||
    customer?.updated_at ||
    customer?.created_at ||
    null;

  const expiry = useMemo(() => {
    const now = new Date();
    const last = lastActivityRaw ? new Date(lastActivityRaw) : now;
    return addMonths(last, 6);
  }, [lastActivityRaw]);

  const qrValue = customer?.qr_token || `drinkat:${phone}`;
  const cardNumber = pseudoCardNumberFromPhone(phone);

  // animation خفيف عند تغير النقاط
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (!customer) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 420);
    return () => clearTimeout(t);
  }, [points, customer]);

  return (
    <div style={styles.page}>
      <div style={styles.cardWrap}>
        {/* ✅ طبقات الخلفية */}
        <div style={styles.bgGradient} />
        <div style={styles.bgLogo} />

        {/* ✅ Top strip */}
        <div style={styles.topBar}>
          <div style={styles.topLeft}>Member Card</div>

          <div style={styles.topRight}>
            <div style={styles.smallLabel}>CARD</div>
            <div style={styles.mono}>{cardNumber}</div>
            <div style={{ height: 6 }} />
            <div style={styles.smallLabel}>EXPIRY</div>
            <div style={styles.mono}>{fmtMMYYYY(expiry)}</div>
          </div>
        </div>

        {/* ✅ Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoText}>DRINKAT</div>
          <div style={styles.logoSub}>LOYALTY</div>
        </div>

        {/* ✅ Level تحت اللوجو */}
        <div style={styles.vipRow}>
          <span style={{ fontSize: 18 }}>{vip.emoji}</span>
          <span style={styles.vipText}>{vip.label}</span>
        </div>

        {/* ✅ نقاط كبيرة في المنتصف */}
        <div style={styles.pointsBlock}>
          <div
            style={{
              ...styles.pointsNumber,
              transform: pulse ? "scale(1.05)" : "scale(1)",
            }}
          >
            {loading ? "…" : points}
          </div>
          <div style={styles.pointsLabel}>🐾 Cat Points</div>

          {/* ✅ Progress to next level */}
          <div style={styles.progressWrap}>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${progress * 100}%` }} />
            </div>

            <div style={styles.progressHint}>
              {vip.nextAt ? (
                <span>
                  {ptsToNext} pts to <b>{nextLabel}</b>
                </span>
              ) : (
                <span>
                  You’re at the top level <b>VIP Cat</b>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ✅ Mascot: صورة مختلفة حسب المرحلة */}
        <div style={styles.mascotArea}>
          <div style={styles.mascotFrame}>
            <img
              src={vip.mascotSrc}
              alt="vip mascot"
              style={styles.mascotImg as any}
              onError={(e) => {
                // fallback لو الصور مش موجودة
                (e.currentTarget as any).src = "/mascot.png";
              }}
            />
          </div>
        </div>

        {/* ✅ Info pill */}
        <div style={styles.infoPill}>
          <div style={styles.nameLine}>
            <span style={styles.nameLabel}>NAME:</span>{" "}
            <span style={styles.nameValue}>{customer?.full_name || (loading ? "Loading…" : "—")}</span>
          </div>
          <div style={styles.phoneLine}>
            <span style={styles.nameLabel}>PHONE:</span>{" "}
            <span style={styles.phoneValue}>{maskPhone(customer?.phone || phone)}</span>
          </div>
        </div>

        {/* ✅ QR */}
        <div style={styles.qrWrap}>
          <div style={styles.qrBox}>
            <QRCodeCanvas value={qrValue} size={190} includeMargin={true} />
          </div>
          <div style={styles.qrHint}>Scan at cashier</div>
        </div>

        {/* ✅ Level legend ثابت */}
        <div style={styles.legend}>
          <div style={styles.legendItem}>10 → 😎 Explorer</div>
          <div style={styles.legendItem}>25 → 🎩 Star</div>
          <div style={styles.legendItem}>50 → 👑 VIP</div>
        </div>

        {/* ✅ Footer */}
        <div style={styles.footer}>1 JOD = 1 Point • Valid for 6 Months</div>

        {/* ✅ Errors */}
        {err ? <div style={styles.error}>{err}</div> : null}
      </div>
    </div>
  );
}

const styles: Record<string, any> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 18,
    // تركواز قريب من اللي بعثتيه (مش أزرق)
    background: "radial-gradient(circle at 20% 10%, #39E6E3 0%, #14C7C3 45%, #0AAFAF 100%)",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },

  cardWrap: {
    position: "relative",
    width: "min(420px, 92vw)",
    borderRadius: 34,
    overflow: "hidden",
    padding: 20,
    boxShadow: "0 28px 90px rgba(0,0,0,0.35)",
    color: "white",
  },

  bgGradient: {
    position: "absolute",
    inset: 0,
    // نفس الهوية + نعومة
    background: "linear-gradient(135deg, #22E5E1 0%, #12CFCB 40%, #0CB5B5 100%)",
    opacity: 0.92,
    zIndex: 0,
  },

  bgLogo: {
    position: "absolute",
    inset: 0,
    // ✅ خلفية الشعار
    backgroundImage: "url(/drinkat-bg.png)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    // خفيفة جداً (لو مش موجودة رح يضل طبيعي)
    opacity: 0.12,
    zIndex: 0,
    filter: "blur(0.4px)",
  },

  topBar: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    padding: "6px 6px 0 6px",
  },

  topLeft: {
    fontWeight: 800,
    fontSize: 14,
    letterSpacing: 0.4,
    opacity: 0.95,
  },

  topRight: {
    textAlign: "right",
    lineHeight: 1.15,
  },

  smallLabel: {
    fontSize: 11,
    opacity: 0.88,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  mono: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 12,
    opacity: 0.95,
  },

  logoRow: {
    position: "relative",
    zIndex: 2,
    textAlign: "center",
    marginTop: 10,
  },

  logoText: {
    fontWeight: 950,
    fontSize: 32,
    letterSpacing: 1.2,
  },

  logoSub: {
    marginTop: -6,
    fontWeight: 900,
    fontSize: 14,
    letterSpacing: 2.4,
    opacity: 0.96,
  },

  vipRow: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },

  vipText: {
    fontWeight: 900,
    fontSize: 16,
    letterSpacing: 0.2,
  },

  pointsBlock: {
    position: "relative",
    zIndex: 2,
    marginTop: 12,
    textAlign: "center",
    padding: "10px 6px 0",
  },

  pointsNumber: {
    fontWeight: 1000,
    fontSize: 58,
    lineHeight: 1,
    transition: "transform 220ms ease",
    textShadow: "0 14px 45px rgba(0,0,0,0.22)",
  },

  pointsLabel: {
    marginTop: 6,
    fontWeight: 900,
    opacity: 0.98,
    letterSpacing: 0.3,
    fontSize: 15,
  },

  progressWrap: {
    marginTop: 14,
  },

  progressTrack: {
    height: 12,
    borderRadius: 999,
    background: "rgba(255,255,255,0.22)",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.25)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    background: "rgba(255,255,255,0.9)",
    transition: "width 320ms ease",
  },

  progressHint: {
    marginTop: 9,
    fontSize: 13,
    opacity: 0.96,
    fontWeight: 700,
  },

  mascotArea: {
    position: "relative",
    zIndex: 2,
    display: "grid",
    placeItems: "center",
    marginTop: 16,
  },

  mascotFrame: {
    position: "relative",
    width: 220,
    height: 220,
    borderRadius: 999,
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.22)",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    boxShadow: "0 18px 55px rgba(0,0,0,0.22)",
  },

  mascotImg: {
    width: 220,
    height: 220,
    objectFit: "cover",
  },

  infoPill: {
    position: "relative",
    zIndex: 2,
    marginTop: 16,
    background: "rgba(255,255,255,0.94)",
    color: "#067F7F",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 18px 55px rgba(0,0,0,0.16)",
  },

  nameLine: {
    fontSize: 18,
    fontWeight: 950,
  },

  phoneLine: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: 900,
    opacity: 0.95,
  },

  nameLabel: {
    fontWeight: 950,
    letterSpacing: 0.3,
  },

  nameValue: {
    fontWeight: 1000,
  },

  phoneValue: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontWeight: 950,
  },

  qrWrap: {
    position: "relative",
    zIndex: 2,
    marginTop: 14,
    display: "grid",
    placeItems: "center",
  },

  qrBox: {
    background: "white",
    borderRadius: 22,
    padding: 12,
    boxShadow: "0 18px 60px rgba(0,0,0,0.22)",
  },

  qrHint: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.95,
    fontWeight: 800,
  },

  legend: {
    position: "relative",
    zIndex: 2,
    marginTop: 14,
    display: "flex",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
    opacity: 0.98,
  },

  legendItem: {
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 999,
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 900,
  },

  footer: {
    position: "relative",
    zIndex: 2,
    marginTop: 12,
    textAlign: "center",
    fontSize: 12,
    fontWeight: 900,
    opacity: 0.94,
  },

  error: {
    position: "relative",
    zIndex: 2,
    marginTop: 12,
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 14,
    padding: 10,
    fontSize: 12,
  },
};