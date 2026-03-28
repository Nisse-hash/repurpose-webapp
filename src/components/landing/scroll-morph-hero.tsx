"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, useTransform, useSpring, useMotionValue } from "framer-motion";
import {
  Briefcase, Camera, AtSign, Users, Play, Pin,
  MessageCircle, Cloud, Video, FileText, Image, Music,
  Sparkles, Palette,
} from "lucide-react";

type AnimationPhase = "scatter" | "line" | "circle" | "grid";

const GOLD = "#C9A84C";
const GOLD_BRIGHT = "#F0B429";
const DARK = "#0a0a0f";
const CARD_BG = "#13131A";

const OUTPUT_CARDS = [
  { label: "LinkedIn", icon: Briefcase, color: "#0A66C2" },
  { label: "Instagram", icon: Camera, color: "#E1306C" },
  { label: "X / Twitter", icon: AtSign, color: "#1DA1F2" },
  { label: "Facebook", icon: Users, color: "#1877F2" },
  { label: "TikTok", icon: Video, color: "#FF0050" },
  { label: "YouTube", icon: Play, color: "#FF0000" },
  { label: "Pinterest", icon: Pin, color: "#E60023" },
  { label: "Threads", icon: MessageCircle, color: "#FFFFFF" },
  { label: "Bluesky", icon: Cloud, color: "#0085FF" },
  { label: "PIL Visuals", icon: Image, color: GOLD },
  { label: "Canva", icon: Palette, color: "#7B2FF2" },
  { label: "Gamma Slides", icon: FileText, color: "#FF6B35" },
  { label: "5 Shorts", icon: Video, color: GOLD_BRIGHT },
  { label: "YouTube Video", icon: Play, color: "#FF0000" },
  { label: "AI Scenes", icon: Image, color: GOLD },
  { label: "Audio Extract", icon: Music, color: "#1DB954" },
];

const CARD_W = 90;
const CARD_H = 110;
const TOTAL = OUTPUT_CARDS.length;
const MAX_SCROLL = 1200;

const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

function OutputCard({
  card,
  index,
  target,
}: {
  card: (typeof OUTPUT_CARDS)[number];
  index: number;
  target: { x: number; y: number; rotation: number; scale: number; opacity: number };
}) {
  const Icon = card.icon;

  return (
    <motion.div
      animate={{
        x: target.x,
        y: target.y,
        rotate: target.rotation,
        scale: target.scale,
        opacity: target.opacity,
      }}
      transition={{ type: "spring", stiffness: 35, damping: 18 }}
      style={{
        position: "absolute",
        width: CARD_W,
        height: CARD_H,
      }}
    >
      <div
        className="h-full w-full rounded-2xl flex flex-col items-center justify-center gap-2 border"
        style={{
          background: `radial-gradient(circle at 40% 30%, #1e1e2a, ${CARD_BG})`,
          borderColor: `${card.color}30`,
          boxShadow: `0 0 15px ${card.color}15, 0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)`,
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: `${card.color}15`,
            border: `1.5px solid ${card.color}40`,
            boxShadow: `0 0 10px ${card.color}20`,
          }}
        >
          <Icon size={18} color={card.color} />
        </div>
        <span className="text-[10px] font-medium text-white/70 text-center leading-tight px-1">
          {card.label}
        </span>
      </div>
    </motion.div>
  );
}

export default function ScrollMorphHero() {
  const [phase, setPhase] = useState<AnimationPhase>("scatter");
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    setContainerSize({
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
    });
    return () => observer.disconnect();
  }, []);

  // Virtual scroll
  const virtualScroll = useMotionValue(0);
  const scrollRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const newScroll = Math.min(Math.max(scrollRef.current + e.deltaY, 0), MAX_SCROLL);
      scrollRef.current = newScroll;
      virtualScroll.set(newScroll);
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const handleTouchMove = (e: TouchEvent) => {
      const delta = touchStartY - e.touches[0].clientY;
      touchStartY = e.touches[0].clientY;
      const newScroll = Math.min(Math.max(scrollRef.current + delta, 0), MAX_SCROLL);
      scrollRef.current = newScroll;
      virtualScroll.set(newScroll);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [virtualScroll]);

  // Morph progress: 0 (circle) → 1 (grid)
  const morphProgress = useTransform(virtualScroll, [0, MAX_SCROLL], [0, 1]);
  const smoothMorph = useSpring(morphProgress, { stiffness: 35, damping: 20 });

  // Intro sequence
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("line"), 400);
    const t2 = setTimeout(() => setPhase("circle"), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Scatter positions
  const scatterPositions = useMemo(
    () => OUTPUT_CARDS.map(() => ({
      x: (Math.random() - 0.5) * 1200,
      y: (Math.random() - 0.5) * 800,
      rotation: (Math.random() - 0.5) * 120,
      scale: 0.5,
      opacity: 0,
    })),
    []
  );

  // Subscribe to morph value
  const [morphValue, setMorphValue] = useState(0);
  useEffect(() => {
    const unsub = smoothMorph.on("change", setMorphValue);
    return () => unsub();
  }, [smoothMorph]);

  // Content fade
  const contentOpacity = useTransform(smoothMorph, [0.7, 1], [0, 1]);
  const contentY = useTransform(smoothMorph, [0.7, 1], [30, 0]);

  // Hero text fade out
  const heroOpacity = useTransform(smoothMorph, [0, 0.3], [1, 0]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: `radial-gradient(ellipse at 50% 40%, #12121a, ${DARK})` }}
    >
      {/* Hero text (fades out on scroll) */}
      <motion.div
        style={{ opacity: heroOpacity }}
        className="absolute z-0 flex flex-col items-center justify-center text-center pointer-events-none inset-0"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={phase === "circle" ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="text-2xl md:text-4xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <span className="text-white">1 Input.</span>
          <br />
          <span style={{ color: GOLD }}>16 Outputs.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={phase === "circle" ? { opacity: 0.6 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-4 text-xs font-bold tracking-[0.25em] text-white/50 uppercase"
        >
          Scroll to explore
        </motion.p>
      </motion.div>

      {/* Grid state content (fades in) */}
      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="absolute top-[6%] z-10 flex flex-col items-center text-center pointer-events-none px-4 w-full"
      >
        <h2
          className="text-3xl md:text-5xl font-bold tracking-tight mb-3"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <span className="text-white">Drop a URL.</span>{" "}
          <span style={{ color: GOLD }}>Get everything.</span>
        </h2>
        <p className="text-sm md:text-base text-white/50 max-w-lg">
          Social posts, branded visuals, vertical shorts, and a full YouTube video.
          All from one piece of content.
        </p>
      </motion.div>

      {/* CTA button (visible in grid state) */}
      <motion.div
        style={{ opacity: contentOpacity }}
        className="absolute bottom-[8%] z-20 flex justify-center w-full"
      >
        <a
          href="/dashboard"
          className="px-8 py-4 rounded-full text-lg font-bold tracking-wide transition-all hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`,
            color: DARK,
            boxShadow: `0 0 30px ${GOLD}40, 0 4px 20px rgba(0,0,0,0.4)`,
          }}
        >
          Start Repurposing
        </a>
      </motion.div>

      {/* Cards */}
      <div className="relative flex items-center justify-center w-full h-full">
        {OUTPUT_CARDS.map((card, i) => {
          let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };

          if (phase === "scatter") {
            target = scatterPositions[i];
          } else if (phase === "line") {
            const spacing = 65;
            const totalW = TOTAL * spacing;
            target = { x: i * spacing - totalW / 2, y: 0, rotation: 0, scale: 1, opacity: 1 };
          } else {
            // Circle position
            const circleRadius = Math.min(containerSize.width, containerSize.height) * 0.42;
            const circleAngle = (i / TOTAL) * 360;
            const circleRad = (circleAngle * Math.PI) / 180;
            const circlePos = {
              x: Math.cos(circleRad) * circleRadius,
              y: Math.sin(circleRad) * circleRadius,
              rotation: circleAngle + 90,
            };

            // Grid position (4 columns x 4 rows)
            const cols = 4;
            const gapX = 110;
            const gapY = 130;
            const col = i % cols;
            const row = Math.floor(i / cols);
            const gridX = (col - (cols - 1) / 2) * gapX;
            const gridY = (row - 1.5) * gapY;
            const gridPos = { x: gridX, y: gridY, rotation: 0 };

            target = {
              x: lerp(circlePos.x, gridPos.x, morphValue),
              y: lerp(circlePos.y, gridPos.y, morphValue),
              rotation: lerp(circlePos.rotation, gridPos.rotation, morphValue),
              scale: lerp(0.9, 1, morphValue),
              opacity: 1,
            };
          }

          return <OutputCard key={i} card={card} index={i} target={target} />;
        })}
      </div>
    </div>
  );
}
