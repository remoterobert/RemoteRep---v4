"use client";

import { useEffect, useRef } from "react";

/**
 * A spinning dotted globe with glowing markers on the US (emphasized) and
 * countries worldwide, and gold "signal" dots that travel along arcs from the
 * US out to the world — symbolizing RemoteRep connecting companies with remote
 * reps globally. Pure 2D canvas (no 3D library), and it self-suspends when its
 * container is hidden (e.g. the marketing panel on mobile), so it costs nothing
 * on small screens.
 */

type Vec = { x: number; y: number; z: number };
type Marker = { lat: number; lng: number; us?: boolean };

// The US is the emphasis (several hubs); plus countries around the world.
const MARKERS: Marker[] = [
  { lat: 40.71, lng: -74.0, us: true }, // New York
  { lat: 34.05, lng: -118.24, us: true }, // Los Angeles
  { lat: 41.88, lng: -87.63, us: true }, // Chicago
  { lat: 25.76, lng: -80.19, us: true }, // Miami
  { lat: 32.78, lng: -96.8, us: true }, // Dallas
  { lat: 47.61, lng: -122.33, us: true }, // Seattle
  { lat: 56.13, lng: -106.35 }, // Canada
  { lat: 23.63, lng: -102.55 }, // Mexico
  { lat: 4.57, lng: -74.3 }, // Colombia
  { lat: 18.11, lng: -77.3 }, // Jamaica
  { lat: -14.24, lng: -51.93 }, // Brazil
  { lat: -33.45, lng: -70.66 }, // Chile
  { lat: 51.51, lng: -0.13 }, // London
  { lat: 52.52, lng: 13.4 }, // Berlin
  { lat: 40.42, lng: -3.7 }, // Madrid
  { lat: 48.86, lng: 2.35 }, // Paris
  { lat: 6.52, lng: 3.38 }, // Lagos
  { lat: -26.2, lng: 28.05 }, // Johannesburg
  { lat: 25.2, lng: 55.27 }, // Dubai
  { lat: 28.61, lng: 77.21 }, // Delhi
  { lat: 14.6, lng: 120.98 }, // Manila
  { lat: -8.34, lng: 115.09 }, // Bali
  { lat: 35.68, lng: 139.65 }, // Tokyo
  { lat: -33.87, lng: 151.21 }, // Sydney
];

const HUB: Marker = { lat: 39.5, lng: -98.35 }; // US center — signals radiate from here
const D2R = Math.PI / 180;

function vec(lat: number, lng: number): Vec {
  const a = lat * D2R;
  const o = lng * D2R;
  return {
    x: Math.cos(a) * Math.sin(o),
    y: Math.sin(a),
    z: Math.cos(a) * Math.cos(o),
  };
}
function rotY(v: Vec, r: number): Vec {
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}
function slerp(a: Vec, b: Vec, f: number): Vec {
  const dot = Math.min(1, Math.max(-1, a.x * b.x + a.y * b.y + a.z * b.z));
  const om = Math.acos(dot);
  if (om < 1e-6) return { ...a };
  const s = Math.sin(om);
  const k0 = Math.sin((1 - f) * om) / s;
  const k1 = Math.sin(f * om) / s;
  return {
    x: a.x * k0 + b.x * k1,
    y: a.y * k0 + b.y * k1,
    z: a.z * k0 + b.z * k1,
  };
}

export default function GlobeConnections({
  className = "",
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Non-null aliases so the animation closures keep the narrowed types.
    const el: HTMLCanvasElement = canvas;
    const c: CanvasRenderingContext2D = ctx;

    const hubV = vec(HUB.lat, HUB.lng);
    const markerV = MARKERS.map((m) => ({ v: vec(m.lat, m.lng), us: !!m.us }));
    const targets = MARKERS.filter((m) => !m.us);
    const arcs = targets.map((m, i) => ({
      end: vec(m.lat, m.lng),
      phase: i / targets.length, // staggered signal starts
      speed: 0.12 + (i % 4) * 0.02, // slight variety
    }));

    // Faint dotted sphere (graticule).
    const grid: Vec[] = [];
    for (let la = -84; la <= 84; la += 12) {
      for (let lo = -180; lo < 180; lo += 12) grid.push(vec(la, lo));
    }

    let raf = 0;
    let rot = 98 * D2R; // start facing the US
    let W = 0;
    let H = 0;
    let dpr = 1;
    let last = performance.now();

    function resize() {
      const parent = el.parentElement ?? el;
      const rect = parent.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.max(1, Math.floor(W * dpr));
      el.height = Math.max(1, Math.floor(H * dpr));
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (W === 0 || H === 0) {
        resize();
        if (W === 0 || H === 0) return; // container hidden (mobile) — idle
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      rot += dt * 0.18; // spin speed
      const tsec = now / 1000;

      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);

      const cx = W * 0.5;
      const cy = H * 0.5;
      const R = Math.min(W, H) * 0.42;

      // Globe body glow.
      const grad = c.createRadialGradient(
        cx - R * 0.3,
        cy - R * 0.3,
        R * 0.2,
        cx,
        cy,
        R,
      );
      grad.addColorStop(0, "rgba(30,64,140,0.32)");
      grad.addColorStop(1, "rgba(8,14,36,0.04)");
      c.fillStyle = grad;
      c.beginPath();
      c.arc(cx, cy, R, 0, Math.PI * 2);
      c.fill();

      // Dotted sphere surface.
      for (const g of grid) {
        const v = rotY(g, rot);
        if (v.z <= 0) continue;
        const sx = cx + R * v.x;
        const sy = cy - R * v.y;
        c.fillStyle = `rgba(120,170,235,${0.1 + v.z * 0.18})`;
        c.fillRect(sx, sy, 1.3, 1.3);
      }

      // Connection arcs + travelling signal dots.
      c.lineWidth = 1;
      for (const arc of arcs) {
        c.beginPath();
        let started = false;
        const STEPS = 40;
        for (let s = 0; s <= STEPS; s++) {
          const f = s / STEPS;
          const p = slerp(hubV, arc.end, f);
          const lift = 1 + 0.35 * Math.sin(Math.PI * f);
          const v = rotY(p, rot);
          const sx = cx + R * lift * v.x;
          const sy = cy - R * lift * v.y;
          if (v.z > -0.15) {
            if (!started) {
              c.moveTo(sx, sy);
              started = true;
            } else {
              c.lineTo(sx, sy);
            }
          } else {
            started = false;
          }
        }
        c.strokeStyle = "rgba(120,170,235,0.22)";
        c.stroke();

        const tt = (tsec * arc.speed + arc.phase) % 1;
        const p = slerp(hubV, arc.end, tt);
        const lift = 1 + 0.35 * Math.sin(Math.PI * tt);
        const v = rotY(p, rot);
        if (v.z > 0) {
          const sx = cx + R * lift * v.x;
          const sy = cy - R * lift * v.y;
          c.beginPath();
          c.arc(sx, sy, 2.6, 0, Math.PI * 2);
          c.fillStyle = "#fbdc3b";
          c.shadowColor = "rgba(251,220,59,0.9)";
          c.shadowBlur = 8;
          c.fill();
          c.shadowBlur = 0;
        }
      }

      // Country markers (US emphasized + pulsing).
      const pulse = 0.5 + 0.5 * Math.sin(tsec * 2);
      for (const m of markerV) {
        const v = rotY(m.v, rot);
        if (v.z <= 0) continue;
        const sx = cx + R * v.x;
        const sy = cy - R * v.y;
        const r = m.us ? 3.2 + pulse * 1.1 : 2.1;
        c.beginPath();
        c.arc(sx, sy, r + 3, 0, Math.PI * 2);
        c.fillStyle = m.us
          ? "rgba(251,220,59,0.18)"
          : "rgba(120,170,235,0.14)";
        c.fill();
        c.beginPath();
        c.arc(sx, sy, r, 0, Math.PI * 2);
        c.fillStyle = m.us ? "#fbdc3b" : "#8fc0ff";
        c.shadowColor = m.us
          ? "rgba(251,220,59,0.8)"
          : "rgba(143,192,255,0.6)";
        c.shadowBlur = m.us ? 10 : 5;
        c.fill();
        c.shadowBlur = 0;
      }

      // Rim.
      c.beginPath();
      c.arc(cx, cy, R, 0, Math.PI * 2);
      c.strokeStyle = "rgba(140,180,240,0.15)";
      c.stroke();
    }

    resize();
    const ro = new ResizeObserver(resize);
    if (el.parentElement) ro.observe(el.parentElement);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
