"use client";

import { useState, useEffect, use, useRef } from "react";
import { UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Check, Loader2, AlertCircle, ArrowLeft, Copy, ChevronDown,
  Minus, Download, FileText, Image as ImageIcon, Music, ExternalLink,
  Headphones, Sparkles,
} from "lucide-react";
import {
  FaLinkedinIn, FaInstagram, FaXTwitter, FaFacebook, FaTiktok,
  FaYoutube, FaPinterestP, FaThreads, FaBluesky,
} from "react-icons/fa6";
import Link from "next/link";

const GOLD = "#C9A84C";
const GOLD_BRIGHT = "#F0B429";
const CARD_BG = "#13131A";
const BORDER = "rgba(255,255,255,0.06)";

const PLATFORM_META: Record<string, { label: string; icon: any; color: string }> = {
  linkedin: { label: "LinkedIn", icon: FaLinkedinIn, color: "#0A66C2" },
  instagram: { label: "Instagram", icon: FaInstagram, color: "#E1306C" },
  x: { label: "X", icon: FaXTwitter, color: "#FFFFFF" },
  facebook: { label: "Facebook", icon: FaFacebook, color: "#1877F2" },
  tiktok: { label: "TikTok", icon: FaTiktok, color: "#FF0050" },
  threads: { label: "Threads", icon: FaThreads, color: "#FFFFFF" },
  bluesky: { label: "Bluesky", icon: FaBluesky, color: "#0085FF" },
  youtube: { label: "YouTube", icon: FaYoutube, color: "#FF0000" },
  pinterest: { label: "Pinterest", icon: FaPinterestP, color: "#E60023" },
};

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
  completedSteps?: number[];
  posts?: Record<string, string>;
  title?: string;
  gammaUrl?: string;
  gammaExportUrl?: string;
  heroImageUrl?: string;
  audioUrl?: string;
  srt?: string;
  error?: string;
  results?: { title?: string; posts?: Record<string, string> };
}

// ── Reusable Section Header ────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, count }: { icon: any; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}20` }}
      >
        <Icon size={13} color={GOLD} />
      </div>
      <h3 className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: `${GOLD}` }}>
        {label}
      </h3>
      {count !== undefined && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${GOLD}15`, color: GOLD }}>
          {count}
        </span>
      )}
    </div>
  );
}

// ── GlowCard wrapper ───────────────────────────────────────────────────

function GlowCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onMouseMove={(e) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setMouse({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background: CARD_BG,
        border: `1px solid ${BORDER}`,
      }}
    >
      {/* Cursor glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(300px circle at ${mouse.x}px ${mouse.y}px, ${GOLD}08, transparent)`,
        }}
      />
      {children}
    </motion.div>
  );
}

// ── Post Card ──────────────────────────────────────────────────────────

function PostCard({ platform, text, index }: { platform: string; text: string; index: number }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const meta = PLATFORM_META[platform];
  if (!meta) return null;
  const Icon = meta.icon;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <GlowCard delay={index * 0.04}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left group"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
          style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}
        >
          <Icon size={14} color={meta.color} />
        </div>
        <span className="text-sm font-semibold text-white/80 flex-1">{meta.label}</span>
        <span className="text-[10px] text-white/20 mr-2">{text.length} chars</span>
        <ChevronDown
          size={14}
          className={`text-white/20 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 relative">
              <div className="absolute top-0 left-5 right-5 h-px" style={{ background: BORDER }} />
              <div className="pt-4">
                <button
                  onClick={handleCopy}
                  className="absolute top-4 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                  style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}25`, color: GOLD }}
                >
                  <Copy size={11} />
                  {copied ? "Copied!" : "Copy"}
                </button>
                <p className="text-sm text-white/55 leading-relaxed whitespace-pre-wrap pr-24 max-h-72 overflow-y-auto">
                  {text}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlowCard>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

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
    "Extracting content", "Researching people", "Generating social posts",
    "Creating hero image", "Creating Canva visuals", "Creating Gamma slides",
    "Generating AI scene images", "Animating scenes", "Rendering vertical shorts",
    "Rendering YouTube video", "Uploading files", "Saving to Airtable", "Sending notification",
  ];

  const posts = job?.posts || job?.results?.posts || null;
  const title = job?.title || job?.results?.title || "";
  const isDone = job?.status === "done";
  const isProcessing = job?.status === "processing";

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background ambient glow */}
      {isProcessing && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-[0.04]"
            style={{ background: GOLD }}
          />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 backdrop-blur-xl" style={{ background: "rgba(10,10,15,0.85)", borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-white/30 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-px h-6 bg-white/10" />
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${GOLD}20, ${GOLD}08)`, border: `1px solid ${GOLD}25` }}
          >
            <Zap size={15} color={GOLD} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white/90" style={{ fontFamily: "var(--font-heading)" }}>
              {title || "Processing..."}
            </p>
            <p className="text-[10px] text-white/30 font-mono">{jobId.substring(0, 8)}</p>
          </div>
        </div>
        <UserButton />
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 relative z-10">
        {!job ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 size={28} className="animate-spin" color={GOLD} />
            <p className="text-xs text-white/30">Loading job...</p>
          </div>
        ) : (
          <>
            {/* ── Progress Section ──────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
              {/* Progress bar */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40 font-medium">
                  {isDone ? "Complete" : job.status === "error" ? "Error" : job.step || "Queued"}
                </span>
                <span className="text-xs font-bold tabular-nums" style={{ color: GOLD }}>
                  {job.progress}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden mb-8">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${job.progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{
                    background: job.status === "error" ? "#ef4444" : `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})`,
                    boxShadow: `0 0 20px ${GOLD}30`,
                  }}
                />
              </div>

              {/* Steps grid (compact) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {steps.map((stepName, i) => {
                  const stepNum = i + 1;
                  const completed = job.completedSteps || [];
                  const stepDone = completed.includes(stepNum);
                  const isActive = job.stepNumber === stepNum && isProcessing;
                  const isSkipped = isDone && !stepDone;

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                      style={{
                        background: isActive ? `${GOLD}08` : stepDone ? `${GOLD}04` : "transparent",
                        border: isActive ? `1px solid ${GOLD}20` : `1px solid transparent`,
                        opacity: isSkipped ? 0.2 : 1,
                      }}
                    >
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: stepDone ? `${GOLD}20` : isActive ? `${GOLD}15` : "rgba(255,255,255,0.03)",
                        }}
                      >
                        {stepDone ? <Check size={10} color={GOLD} />
                          : isActive ? <Loader2 size={10} className="animate-spin" color={GOLD} />
                          : isSkipped ? <Minus size={10} className="text-white/10" />
                          : <span className="text-[8px]">{STEP_ICONS[i]}</span>}
                      </div>
                      <span className={`text-[11px] font-medium truncate ${
                        stepDone ? "text-white/50" : isActive ? "text-white/90" : isSkipped ? "text-white/10 line-through" : "text-white/20"
                      }`}>
                        {stepName}
                      </span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: GOLD, boxShadow: `0 0 6px ${GOLD}` }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* ── Media Section (Images + Audio) ───────────── */}
            {(job.heroImageUrl || job.gammaExportUrl || job.audioUrl) && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-12"
              >
                <SectionHeader icon={ImageIcon} label="Media" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hero Image */}
                  {job.heroImageUrl && (
                    <GlowCard delay={0.1}>
                      <div className="aspect-video overflow-hidden rounded-t-2xl">
                        <img src={job.heroImageUrl} alt="Hero image" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-xs font-semibold text-white/70">Hero Image</p>
                          <p className="text-[10px] text-white/30">16:9 for X / LinkedIn</p>
                        </div>
                        <a href={job.heroImageUrl} download className="flex items-center gap-1.5 text-[11px] font-medium transition-colors hover:opacity-80" style={{ color: GOLD }}>
                          <Download size={11} /> PNG
                        </a>
                      </div>
                    </GlowCard>
                  )}

                  {/* Gamma Carousel */}
                  {job.gammaExportUrl && (
                    <GlowCard delay={0.15}>
                      <div className="aspect-video overflow-hidden rounded-t-2xl bg-black/20 flex items-center justify-center">
                        <img src={job.gammaExportUrl} alt="Carousel" className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-xs font-semibold text-white/70">Carousel</p>
                          <p className="text-[10px] text-white/30">4 slides, 4:5 format</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {job.gammaUrl && (
                            <a href={job.gammaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors">
                              <ExternalLink size={10} /> Edit
                            </a>
                          )}
                          <a href={job.gammaExportUrl} download className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: GOLD }}>
                            <Download size={11} /> PNG
                          </a>
                        </div>
                      </div>
                    </GlowCard>
                  )}

                  {/* Audio Player */}
                  {job.audioUrl && (
                    <GlowCard delay={0.2} className="md:col-span-2">
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#1DB95418", border: "1px solid #1DB95430" }}>
                            <Headphones size={18} color="#1DB954" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white/80">Episode Audio</p>
                            <p className="text-[10px] text-white/30">Original podcast recording</p>
                          </div>
                          <a href={job.audioUrl} download className="ml-auto flex items-center gap-1.5 text-[11px] font-medium" style={{ color: GOLD }}>
                            <Download size={11} /> MP3
                          </a>
                        </div>
                        <audio controls className="w-full [&::-webkit-media-controls-panel]:bg-[#1a1a24] rounded-lg" style={{ height: 36 }}>
                          <source src={job.audioUrl} type="audio/mpeg" />
                        </audio>
                      </div>
                    </GlowCard>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Social Posts ──────────────────────────────── */}
            {posts && Object.keys(posts).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <SectionHeader icon={Sparkles} label="Social Posts" count={Object.keys(posts).filter(k => posts[k]).length} />
                <div className="space-y-2">
                  {Object.entries(PLATFORM_META).map(([key], i) => {
                    const text = posts[key];
                    if (!text) return null;
                    return <PostCard key={key} platform={key} text={text} index={i} />;
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Transcript ───────────────────────────────── */}
            {job.srt && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-12"
              >
                <SectionHeader icon={FileText} label="Transcript" />
                <GlowCard>
                  <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <p className="text-xs text-white/50">Timestamped SRT</p>
                    <button
                      onClick={() => {
                        const blob = new Blob([job.srt!], { type: "text/srt" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${title || "transcript"}.srt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-1.5 text-[11px] font-medium transition-colors hover:opacity-80"
                      style={{ color: GOLD }}
                    >
                      <Download size={11} /> Download SRT
                    </button>
                  </div>
                  <pre className="px-5 py-4 text-[11px] text-white/40 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap font-mono">
                    {job.srt.substring(0, 3000)}{job.srt.length > 3000 ? "\n\n..." : ""}
                  </pre>
                </GlowCard>
              </motion.div>
            )}

            {/* ── Error ─────────────────────────────────────── */}
            {job.status === "error" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-12">
                <div className="p-5 rounded-2xl bg-red-500/[0.06] border border-red-500/15 flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300/80">{job.error || "An unknown error occurred"}</p>
                </div>
              </motion.div>
            )}

            {/* ── Done Celebration ──────────────────────────── */}
            {isDone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="p-8 rounded-2xl text-center"
                style={{
                  background: `radial-gradient(circle at 50% 20%, ${GOLD}06, ${CARD_BG})`,
                  border: `1px solid ${GOLD}15`,
                  boxShadow: `0 0 40px ${GOLD}06`,
                }}
              >
                <div className="text-4xl mb-3">✦</div>
                <h3 className="text-lg font-bold text-white mb-1.5" style={{ fontFamily: "var(--font-heading)" }}>
                  Content repurposed.
                </h3>
                <p className="text-xs text-white/35 max-w-sm mx-auto">
                  Everything is saved to Airtable. Expand each post above to copy it, or download the media assets.
                </p>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
