"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { FaPaw, FaGift } from "react-icons/fa";
import QRCode from "qrcode";

const API = "http://127.0.0.1:8000";

type Customer = {
  full_name: string;
  phone: string;
  points: number;
};

export default function CustomerCardClient({ phone }: { phone: string }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCustomer() {
      try {
        const res = await axios.get<Customer>(`${API}/customers/by-phone/${phone}`);
        if (!mounted) return;
        setCustomer(res.data);
      } catch {
        if (!mounted) return;
        setCustomer({
          full_name: "Abd Alrahman Naseer",
          phone,
          points: 71,
        });
      }
    }

    loadCustomer();

    return () => {
      mounted = false;
    };
  }, [phone]);

  useEffect(() => {
    const value = customer?.phone || phone;

    QRCode.toDataURL(value)
      .then((url) => {
        setQrCodeUrl(url);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [customer, phone]);

  const points = Number(customer?.points || 0);
  const nextReward = 75;
  const progressPercent = Math.min(100, (points / nextReward) * 100);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#83d1f5",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "10px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          height: "850px",
          backgroundImage: "url('/drinkat-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "top center",
          borderRadius: "50px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          position: "relative",
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "120px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "82%",
            background: "rgb(23 96 117 / 21%)",
            borderRadius: "26px",
            padding: "16px 18px 12px",
            backdropFilter: "blur(8px)",
            color: "white",
            zIndex: 10,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontWeight: 800,
                fontSize: "14px",
                letterSpacing: "0.3px",
              }}
            >
              CAT POINTS
            </span>

            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {points}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  opacity: 0.9,
                }}
              >
                Points
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaPaw
              style={{
                color: "#02c2cf",
                fontSize: "30px",
                filter: "drop-shadow(0 8px 20px #fff)",
              }}
            />
            <div
              style={{
                flex: 1,
                height: "7px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: "rgb(186, 251, 237)",
                  borderRadius: "999px",
                }}
              />
            </div>
            <FaGift
              style={{
                fontSize: "30px",
                color: "#fffb6d",
                filter: "drop-shadow(0 8px 20px #fffb6d)",
              }}
            />
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: "8px",
              fontSize: "17px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Next Reward at {nextReward}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: "245px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          <img
            src="/cat-vip.png"
            alt="Mascot"
            style={{
              width: "250px",
              height: "auto",
              display: "block",
              marginLeft: "160px",
              objectFit: "contain",
              filter: "drop-shadow(0 14px 24px rgba(0,0,0,0.14))",
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            top: "535px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "84%",
            background: "white",
            borderRadius: "15px",
            padding: "10px 10px 10px 8px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
            zIndex: 5,
          }}
        >
          <div
            style={{
              marginBottom: "8px",
              display: "flex",
              alignItems: "baseline",
              gap: "8px",
            }}
          >
            <span style={{ color: "#7bc7da", fontWeight: 600, fontSize: "16px" }}>
              NAME:
            </span>
            <span style={{ color: "#249ec1", fontWeight: 800, fontSize: "18px" }}>
              {customer?.full_name}
            </span>
          </div>

          <div
            style={{
              marginBottom: "10px",
              display: "flex",
              alignItems: "baseline",
              gap: "8px",
            }}
          >
            <span style={{ color: "#7bc7da", fontWeight: 600, fontSize: "16px" }}>
              PHONE:
            </span>
            <span style={{ color: "#249ec1", fontWeight: 800, fontSize: "18px" }}>
              {customer?.phone}
            </span>
          </div>

          <div
            style={{
              width: "100%",
              height: "1px",
              backgroundColor: "#edf3f6",
              margin: "10px 0 12px",
            }}
          />

          <div
            style={{
              textAlign: "center",
              color: "#249ec1",
              fontWeight: 700,
              fontSize: "15px",
            }}
          >
            Scan to Earn{" "}
            <FaPaw
              style={{
                color: "#249ec1",
                fontSize: "16px",
                filter: "drop-shadow(0 8px 20px #fff)",
              }}
            />
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: "690px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 6,
          }}
        >
          <div
            style={{
              width: "140px",
              height: "140px",
              backgroundColor: "white",
              borderRadius: "18px",
              boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              marginTop: "-25px",
            }}
          >
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="QR Code"
                style={{
                  width: "118px",
                  height: "118px",
                  display: "block",
                  objectFit: "contain",
                }}
              />
            ) : null}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "15px",
            width: "100%",
            textAlign: "center",
            color: "white",
            fontSize: "12px",
            fontWeight: 800,
            opacity: 0.9,
          }}
        >
          1 JOD = 1{" "}
          <FaPaw
            style={{
              color: "#fff",
              fontSize: "12px",
              filter: "drop-shadow(0 8px 20px #fff)",
            }}
          />{" "}
          • Valid for 6 Months
        </div>
      </div>
    </div>
  );
}