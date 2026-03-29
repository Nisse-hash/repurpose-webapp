"use client";

import { useState, useEffect, use } from "react";
import { UserButton } from "@clerk/nextjs";
import { Zap, Check, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

const GOLD = "#C9A84C";

const STEP_ICONS = [
  "📥", "🔍", "✍️", "🎨", "🖼️", "📊",
  "🌄", "🎬", "📱", "🎥", "☁️", "💾", "📧",
];

interface JobStatus {
  jobId: string;
  status: "queued" | "processing" | "done" | "error";
  step: string | null;
  stepNumber: number;
  totalSteps: number;
  progress: number;
  error?: string;
  results?: {
    posts?: Record<string, string>;
    assets?: Array<{ name: string; url: string; type: string }>;
  };
}

export default function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const [job, setJob] = useState<JobStatus | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/job/${jobId}`);
        const data = await res.json();
        setJob(data);
        if (data.status === "done" || data.status === "error") return;
      } catch (err) {
        console.error("Poll error:", err);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [jobId]);

  const steps = [
    "Extracting content",
    "Detecting content type",
    "Generating social posts",
    "Creating PIL visuals",
    "Creating Canva visuals",
    "Creating Gamma slides",
    "Generating AI scene images",
    "Animating scenes",
    "Rendering vertical shorts",
    "Rendering YouTube video",
    "Uploading files",
    "Saving to Airtable",
    "Sending notification",
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${GOLD}20, ${GOLD}08)`,
              border: `1.5px solid ${GOLD}30`,
            }}
          >
            <Zap size={18} color={GOLD} />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Job Progress
          </span>
        </div>
        <UserButton />
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {!job ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin" color={GOLD} />
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/50 text-sm">
                  {job.status === "done" ? "Complete" : job.status === "error" ? "Error" : job.step || "Queued"}
                </span>
                <span className="text-sm font-bold" style={{ color: GOLD }}>
                  {job.progress}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${job.progress}%`,
                    background: job.status === "error"
                      ? "#ef4444"
                      : `linear-gradient(90deg, ${GOLD}, #F0B429)`,
                    boxShadow: `0 0 15px ${GOLD}40`,
                  }}
                />
              </div>
            </div>

            {/* Step timeline */}
            <div className="space-y-2">
              {steps.map((stepName, i) => {
                const stepNum = i + 1;
                const isDone = job.stepNumber > stepNum || job.status === "done";
                const isActive = job.stepNumber === stepNum && job.status === "processing";
                const isPending = job.stepNumber < stepNum && job.status !== "done";

                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-5 py-3 rounded-xl transition-all"
                    style={{
                      background: isActive
                        ? `radial-gradient(circle at 20% 50%, ${GOLD}08, #13131a)`
                        : isDone
                        ? "rgba(201,168,76,0.03)"
                        : "transparent",
                      border: isActive ? `1px solid ${GOLD}20` : "1px solid transparent",
                      boxShadow: isActive ? `0 0 20px ${GOLD}08` : "none",
                    }}
                  >
                    {/* Step indicator */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                      style={{
                        background: isDone
                          ? `${GOLD}20`
                          : isActive
                          ? `${GOLD}15`
                          : "rgba(255,255,255,0.03)",
                        border: isActive ? `1.5px solid ${GOLD}50` : "1.5px solid transparent",
                      }}
                    >
                      {isDone ? (
                        <Check size={14} color={GOLD} />
                      ) : isActive ? (
                        <Loader2 size={14} className="animate-spin" color={GOLD} />
                      ) : (
                        <span className="text-xs text-white/20">{STEP_ICONS[i]}</span>
                      )}
                    </div>

                    {/* Step name */}
                    <span
                      className={`text-sm font-medium ${
                        isDone ? "text-white/60" : isActive ? "text-white" : "text-white/20"
                      }`}
                    >
                      {stepName}
                    </span>

                    {/* Active glow dot */}
                    {isActive && (
                      <div
                        className="ml-auto w-2 h-2 rounded-full"
                        style={{
                          background: GOLD,
                          boxShadow: `0 0 8px ${GOLD}`,
                          animation: "glow-pulse 2s ease-in-out infinite",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Error message */}
            {job.status === "error" && (
              <div className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{job.error || "An unknown error occurred"}</p>
              </div>
            )}

            {/* Done state */}
            {job.status === "done" && (
              <div
                className="mt-10 p-6 rounded-2xl border text-center"
                style={{
                  background: `radial-gradient(circle at 50% 30%, ${GOLD}08, #13131a)`,
                  borderColor: `${GOLD}20`,
                  boxShadow: `0 0 30px ${GOLD}08`,
                }}
              >
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-xl font-bold text-white mb-2">All done.</h3>
                <p className="text-white/40 text-sm">
                  Your content has been repurposed across all platforms.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
