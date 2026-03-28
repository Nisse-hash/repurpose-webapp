"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

const GOLD = "#C9A84C";
const GOLD_BRIGHT = "#F0B429";
const PARTICLE_COUNT = 80;

interface ParticleButtonProps {
  visible: boolean;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}

interface Particle {
  sx: number;
  sy: number;
  fx: number;
  fy: number;
  size: number;
  hue: number;
  delay: number;
}

export function ParticleButton({ visible, onClick, disabled, label }: ParticleButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"hidden" | "assembling" | "solidifying" | "ready">("hidden");
  const prevVisible = useRef(false);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });

  const generateParticles = useCallback((w: number, h: number): Particle[] => {
    const btnH = 56;
    const btnY = (h - btnH) / 2;
    const btnR = 16;

    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const fx = btnR + Math.random() * (w - btnR * 2);
      const fy = btnY + 4 + Math.random() * (btnH - 8);

      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 300;
      const sx = w / 2 + Math.cos(angle) * dist;
      const sy = h / 2 + Math.sin(angle) * dist;

      return {
        sx, sy, fx, fy,
        size: 1.5 + Math.random() * 3.5,
        hue: 36 + Math.random() * 14,
        delay: (i / PARTICLE_COUNT) * 0.5,
      };
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        sizeRef.current = { w, h };
        particlesRef.current = generateParticles(w, h);
        if (canvasRef.current) {
          canvasRef.current.width = w * 2;
          canvasRef.current.height = h * 2;
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [generateParticles]);

  // Trigger on visibility change
  useEffect(() => {
    if (visible && !prevVisible.current) {
      setPhase("assembling");
      const { w, h } = sizeRef.current;
      if (w > 0) particlesRef.current = generateParticles(w, h);
    }
    if (!visible && prevVisible.current) {
      setPhase("hidden");
      cancelAnimationFrame(animRef.current);
    }
    prevVisible.current = visible;
  }, [visible, generateParticles]);

  // Canvas animation
  useEffect(() => {
    if (phase !== "assembling") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let startTime: number | null = null;
    const DURATION = 1800;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const rawProgress = Math.min(elapsed / DURATION, 1);

      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w * 2, h * 2);
      ctx.save();
      ctx.scale(2, 2);

      const particles = particlesRef.current;
      const btnH = 56;
      const btnY = (h - btnH) / 2;
      const btnR = 16;

      // Draw growing button shape as particles land (faint fill)
      if (rawProgress > 0.3) {
        const fillAlpha = Math.min((rawProgress - 0.3) / 0.7 * 0.15, 0.15);
        ctx.beginPath();
        ctx.roundRect(2, btnY, w - 4, btnH, btnR);
        ctx.fillStyle = `rgba(201, 168, 76, ${fillAlpha})`;
        ctx.fill();
      }

      for (const p of particles) {
        const localT = Math.max(0, Math.min(1, (rawProgress - p.delay) / (1 - p.delay)));
        const t = easeOutCubic(localT);

        const x = p.sx + (p.fx - p.sx) * t;
        const y = p.sy + (p.fy - p.sy) * t;

        // Trail line from current to start (fading)
        if (t < 0.8 && t > 0) {
          const trailX = p.sx + (p.fx - p.sx) * Math.max(0, t - 0.15);
          const trailY = p.sy + (p.fy - p.sy) * Math.max(0, t - 0.15);
          ctx.beginPath();
          ctx.moveTo(trailX, trailY);
          ctx.lineTo(x, y);
          ctx.strokeStyle = `hsla(${p.hue}, 80%, 60%, ${(1 - t) * 0.3})`;
          ctx.lineWidth = p.size * 0.5;
          ctx.stroke();
        }

        // Outer glow
        ctx.beginPath();
        ctx.arc(x, y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${0.08 + t * 0.05})`;
        ctx.fill();

        // Core particle
        ctx.beginPath();
        ctx.arc(x, y, p.size * (0.4 + t * 0.6), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, ${55 + t * 15}%, ${0.4 + t * 0.6})`;
        ctx.fill();

        // Bright center when nearly landed
        if (t > 0.8) {
          ctx.beginPath();
          ctx.arc(x, y, p.size * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 100%, 85%, ${(t - 0.8) * 5})`;
          ctx.fill();
        }
      }

      ctx.restore();

      if (rawProgress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setPhase("solidifying");
        setTimeout(() => setPhase("ready"), 400);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  return (
    <div
      ref={containerRef}
      className="relative w-full mt-4"
      style={{
        height: 56,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.3s, transform 0.3s",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          opacity: phase === "ready" ? 0 : 1,
          transition: "opacity 0.5s ease",
        }}
      />

      {/* Solid button materializes */}
      <button
        onClick={onClick}
        disabled={disabled}
        className="absolute inset-0 w-full h-full rounded-2xl text-lg font-bold tracking-wide transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed"
        style={{
          background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`,
          color: "#0a0a0f",
          boxShadow: phase === "ready"
            ? `0 0 40px ${GOLD}40, 0 4px 20px rgba(0,0,0,0.4)`
            : `0 0 20px ${GOLD}20`,
          opacity: phase === "solidifying" || phase === "ready" ? 1 : 0,
          transform: phase === "ready" ? "scale(1)" : "scale(0.97)",
          transition: "opacity 0.5s ease, transform 0.5s ease, box-shadow 0.5s ease",
        }}
      >
        {label}
      </button>
    </div>
  );
}
