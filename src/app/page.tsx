"use client";

import { Zap } from "lucide-react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
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
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="text-sm text-white/50 hover:text-white transition-colors">
                Sign in
              </button>
            </SignInButton>
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
          </Show>
          <Show when="signed-in">
            <a
              href="/dashboard"
              className="text-sm font-semibold text-white/60 hover:text-white transition-colors mr-2"
            >
              Dashboard
            </a>
            <UserButton />
          </Show>
        </div>
      </nav>

      <ScrollMorphHero />
    </div>
  );
}
