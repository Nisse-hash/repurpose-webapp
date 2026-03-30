"use client";

import { useState, useEffect, use } from "react";
import { UserButton } from "@clerk/nextjs";
import { Zap, Check, Loader2, AlertCircle, ArrowLeft, Copy, ChevronDown, Minus } from "lucide-react";
import Link from "next/link";

const GOLD = "#C9A84C";

const STEP_ICONS = [
  "📥", "🔍", "✍️", "🎨", "🖼️", "📊",
  "🌄", "🎬", "📱", "🎥", "☁️", "💾", "📧",
];

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  x: "X (Twitter)",
  facebook: "Facebook",
  tiktok: "TikTok",
  threads: "Threads",
  bluesky: "Bluesky",
  youtube: "YouTube Shorts",
  pinterest: "Pinterest",
};

interface JobStatus {
  jobId: string;
  status: "queued" | "processing" | "done" | "error";
  step: string | null;
  stepNumber: number;
  totalSteps: number;
  progress: number;
  completedSteps?: number[];
  posts?: Record<string, string>;
  title?: string;
  error?: string;
  results?: {
    title?: string;
    posts?: Record<string, string>;
  };
}

function PostCard({ platform, text }: { platform: string; text: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        background: "#13131a",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm font-semibold text-white/80">
          {PLATFORM_LABELS[platform] || platform}
        </span>
        <ChevronDown
          size={16}
          className={`text-white/30 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 relative">
          <button
            onClick={handleCopy}
            className="absolute top-0 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: `${GOLD}15`,
              border: `1px solid ${GOLD}40`,
              color: GOLD,
            }}
          >
            <Copy size={12} />
            {copied ? "Copied!" : "Copy"}
          </button>
          <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap pr-20 max-h-64 overflow-y-auto">
            {text}
          </p>
        </div>
      )}
    </div>
  );
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

  // Get posts from metadata (live) or results (final)
  const posts = job?.posts || job?.results?.posts || null;
  const title = job?.title || job?.results?.title || "";

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
            {title || "Job Progress"}
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
                const completed = job.completedSteps || [];
                const isDone = completed.includes(stepNum);
                const isActive = job.stepNumber === stepNum && job.status === "processing";
                const isSkipped = job.status === "done" && !isDone;

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
                      opacity: isSkipped ? 0.3 : 1,
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
                      ) : isSkipped ? (
                        <Minus size={14} className="text-white/15" />
                      ) : (
                        <span className="text-xs text-white/20">{STEP_ICONS[i]}</span>
                      )}
                    </div>

                    {/* Step name */}
                    <span
                      className={`text-sm font-medium ${
                        isDone ? "text-white/60" : isActive ? "text-white" : isSkipped ? "text-white/15 line-through" : "text-white/20"
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

            {/* Posts results */}
            {posts && Object.keys(posts).length > 0 && (
              <div className="mt-10">
                <h3
                  className="text-sm font-semibold uppercase tracking-wider mb-4"
                  style={{ color: `${GOLD}90` }}
                >
                  Social Posts
                </h3>
                <div className="space-y-2">
                  {Object.entries(PLATFORM_LABELS).map(([key, label]) => {
                    const text = posts[key];
                    if (!text) return null;
                    return <PostCard key={key} platform={key} text={text} />;
                  })}
                </div>
              </div>
            )}

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
                  Your content has been repurposed. Expand each post above to copy it.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
