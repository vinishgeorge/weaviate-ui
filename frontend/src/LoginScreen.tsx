import React, { useEffect, useRef } from "react";
import { Button } from "antd";
import { login } from "./authClient";
import { WEAVIATE_LOGO_DATA } from "./assets/logo";

function useParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    let width = 0;
    let height = 0;
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const count = Math.min(80, Math.floor((width * height) / 18000));
    const particles = Array.from({ length: count }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: 1.2 + Math.random() * 1.6,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      // gradient background glow
      const grd = ctx.createLinearGradient(0, 0, width, height);
      grd.addColorStop(0, "rgba(99, 102, 241, 0.10)");
      grd.addColorStop(1, "rgba(16, 185, 129, 0.10)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, width, height);

      // lines
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 120 * 120) {
            const alpha = 1 - Math.sqrt(dist2) / 120;
            ctx.strokeStyle = `rgba(148, 163, 184, ${alpha * 0.35})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      // points
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.beginPath();
        ctx.fillStyle = "#a3bffa";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return canvasRef;
}

export default function LoginScreen() {
  const canvasRef = useParticles();
  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        minHeight: 520,
        overflow: "hidden",
        borderRadius: 12,
        background:
          "radial-gradient(1200px 600px at 10% 0%, rgba(99,102,241,0.12), transparent), radial-gradient(1200px 600px at 90% 100%, rgba(16,185,129,0.12), transparent)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            width: 440,
            maxWidth: "90vw",
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "saturate(180%) blur(8px)",
            WebkitBackdropFilter: "saturate(180%) blur(8px)",
            border: "1px solid rgba(148,163,184,0.25)",
            borderRadius: 16,
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
            padding: 28,
            textAlign: "center",
          }}
        >
          <img
            src={WEAVIATE_LOGO_DATA}
            alt="Weaviate"
            style={{ width: 56, height: 56, borderRadius: 12 }}
          />
          <h1 style={{ margin: "16px 0 4px", fontSize: 28 }}>Weaviate UI</h1>
          <p style={{ margin: 0, opacity: 0.75 }}>
            Sign in to explore your collections, search data, and manage
            objects.
          </p>
          <div style={{ height: 20 }} />
          <Button
            type="primary"
            size="large"
            style={{
              background:
                "linear-gradient(90deg, #6366F1 0%, #10B981 100%)",
              border: "none",
              boxShadow: "0 6px 16px rgba(99,102,241,0.25)",
            }}
            onClick={() => login()}
          >
            Sign in with Microsoft
          </Button>
          <div style={{ height: 8 }} />
          <small style={{ display: "block", opacity: 0.6 }}>
            You’ll be redirected to Microsoft to authenticate safely.
          </small>
        </div>
      </div>
    </div>
  );
}
