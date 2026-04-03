"use client";

import { Zap } from "lucide-react";
import ScrollMorphHero from "@/components/landing/scroll-morph-hero";

const GOLD = "#C9A84C";

export default function LandingPage() {
  return (
    <div className="w-full h-screen relative">
      {/* Floating nav */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
        <a href="/" className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${GOLD}20, ${GOLD}08)`,
              border: `1.5px solid ${GOLD}30`,
            }}
          >
            <Zap size={18} color={GOLD} />
          </div>
          <span
            className="text-lg font-bold tracking-tight text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Repurpose
          </span>
        </a>

        <div className="flex items-center gap-4">
          <a
            href="/dashboard"
            className="text-sm font-semibold px-5 py-2 rounded-full transition-all hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${GOLD}, #F0B429)`,
              color: "#0a0a0f",
            }}
          >
            Get started
          </a>
        </div>
      </nav>

      <ScrollMorphHero />
    </div>
  );
}
