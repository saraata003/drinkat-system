"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
const API = process.env.NEXT_PUBLIC_API_URL!;
const STAMP_POINTS = 10;

type Tx = {
  id: number;
  amount: number;
  points_earned: number;
  branch: string;
  receipt_no: string;
  created_at: string;
};

type Reward = {
  id: number;
  reward_type: string;
  points_used: number;
  created_at: string;
};

export default function CashierPage() {
  // auth
  const [pin, setPin] = useState("");
  const [token, setToken] = useState("");

  // txn
  const [phone, setPhone] = useState("0781020200");
  const [amount, setAmount] = useState("5");
  const [branch, setBranch] = useState("drinkat airport street");
  const [receipt, setReceipt] = useState("");

  // redeem
  const [rewardType, setRewardType] = useState("SMALL_DRINK");

  // ui
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // data
  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  function toast(ok: boolean, text: string) {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 2500);
  }

  async function login() {
    try {
      setBusy(true);
      const res = await axios.post(`${API}/auth/login`, { pin });
      setToken(res.data.access_token);
      toast(true, "Logged in ✅");
    } catch {
      toast(false, "Login failed (check PIN) ❌");
    } finally {
      setBusy(false);
    }
  }

  async function loadHistory() {
    if (!token) return toast(false, "Login first");
    try {
      setBusy(true);
      const res = await axios.get(`${API}/history/by-phone/${phone}`, { headers });
      setCustomer(res.data.customer);
      setTransactions(res.data.transactions || []);
      setRewards(res.data.rewards || []);
      toast(true, "History loaded ✅");
    } catch {
      toast(false, "History not found / check backend route");
    } finally {
      setBusy(false);
    }
  }

  async function addPoints() {
    if (!token) return toast(false, "Login first");
    if (!receipt) return toast(false, "Receipt required");
    try {
      setBusy(true);
      const res = await axios.post(
        `${API}/transactions`,
        {
          phone,
          amount: Number(amount),
          branch,
          receipt_no: receipt,
        },
        { headers }
      );

      const pointsAdded = res.data.points_added;
      toast(true, `✅ Points Added: ${pointsAdded}`);
      // refresh history
      await loadHistory();
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 409) return toast(false, "Duplicate receipt (409) ❌");
      toast(false, "Add points failed ❌");
    } finally {
      setBusy(false);
    }
  }

  async function redeem() {
    if (!token) return toast(false, "Login first");
    try {
      setBusy(true);
      await axios.post(
        `${API}/rewards/redeem`,
        { phone, reward_type: rewardType },
        { headers }
      );
      toast(true, "Redeemed ✅");
      await loadHistory();
    } catch {
      toast(false, "Redeem failed ❌ (not enough points?)");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // optional auto-load if token موجود
  }, []);

  return (
    <div className="container">
      <div className="cardWrap">
        <div className="memberCard">
          <div className="topStrip">
            <div>
              <div className="pill">Cashier</div>
              <div className="brandTitle">DRINKAT POS</div>
              <div className="brandSub">Login • Add Points • Redeem • History</div>
            </div>
            <div className="metaRight">
              <div className="metaLine">
                <span className="metaLabel">STAMP</span>
                <span>{STAMP_POINTS} pts</span>
              </div>
            </div>
          </div>

          <div className="body">
            {msg && (
              <div className="error" style={{ background: msg.ok ? "rgba(0,0,0,0.14)" : "rgba(0,0,0,0.22)" }}>
                {msg.text}
              </div>
            )}

            {/* LOGIN */}
            <div className="stampsBox" style={{ marginTop: 0 }}>
              <div className="stampsHeader">
                <span>Login</span>
                <span>{token ? "✅" : "—"}</span>
              </div>

              <input
                placeholder="PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 12, border: "none", marginBottom: 10 }}
              />

              <button className="btn primary" onClick={login} disabled={busy}>
                {busy ? "..." : "Login"}
              </button>
            </div>

            {/* CUSTOMER + ACTIONS */}
            <div className="stampsBox">
              <div className="stampsHeader">
                <span>Customer</span>
                <span>{customer?.points ?? "—"} pts</span>
              </div>

              <input
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 12, border: "none", marginBottom: 10 }}
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn primary" onClick={loadHistory} disabled={busy} style={{ flex: 1 }}>
                  Load History
                </button>
                <a
                  className="btn primary"
                  href={`/card/${encodeURIComponent(phone)}`}
                  style={{ flex: 1, textDecoration: "none", display: "grid", placeItems: "center" }}
                >
                  Open Card
                </a>
              </div>
            </div>

            {/* ADD POINTS */}
            <div className="stampsBox">
              <div className="stampsHeader">
                <span>Add Points</span>
                <span>Receipt + Branch</span>
              </div>

              <input
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 12, border: "none", marginBottom: 10 }}
              />
              <input
                placeholder="Branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 12, border: "none", marginBottom: 10 }}
              />
              <input
                placeholder="Receipt No"
                value={receipt}
                onChange={(e) => setReceipt(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 12, border: "none", marginBottom: 10 }}
              />

              <button className="btn primary" onClick={addPoints} disabled={busy}>
                {busy ? "..." : "Add Points"}
              </button>
            </div>

            {/* REDEEM */}
            <div className="stampsBox">
              <div className="stampsHeader">
                <span>Redeem</span>
                <span>1 tap</span>
              </div>

              <select
                value={rewardType}
                onChange={(e) => setRewardType(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 12, border: "none", marginBottom: 10 }}
              >
                <option value="SMALL_DRINK">SMALL_DRINK</option>
                <option value="MEDIUM_DRINK">MEDIUM_DRINK</option>
                <option value="LARGE_DRINK">LARGE_DRINK</option>
              </select>

              <button className="btn primary" onClick={redeem} disabled={busy}>
                {busy ? "..." : "Redeem"}
              </button>
            </div>

            {/* HISTORY LIST */}
            <div className="stampsBox">
              <div className="stampsHeader">
                <span>Latest Transactions</span>
                <span>{transactions.length}</span>
              </div>

              {transactions.slice(0, 6).map((t) => (
                <div key={t.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                  <div style={{ fontWeight: 900 }}>
                    +{t.points_earned} pts — {t.amount} JD
                  </div>
                  <div className="sub">
                    {t.branch} • {t.receipt_no}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 12, fontWeight: 900 }}>Latest Rewards</div>
              {rewards.slice(0, 4).map((r) => (
                <div key={r.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                  <div style={{ fontWeight: 900 }}>
                    -{r.points_used} pts — {r.reward_type}
                  </div>
                  <div className="sub">{r.created_at}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}