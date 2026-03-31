"use client";

import { useState, useEffect, use, useRef } from "react";
import { UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Check, Loader2, AlertCircle, ArrowLeft, Copy, ChevronDown,
  Minus, Download, FileText, Headphones, Sparkles, Play, Video,
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
const SIDEBAR_W = "280px";

const PLATFORM_META: Record<string, { label: string; icon: any; color: string; mediaType: "image" | "carousel" | "vertical" | "horizontal" | "none" }> = {
  linkedin:  { label: "LinkedIn",       icon: FaLinkedinIn, color: "#0A66C2", mediaType: "image" },
  x:         { label: "X",              icon: FaXTwitter,   color: "#FFFFFF", mediaType: "image" },
  instagram: { label: "Instagram",      icon: FaInstagram,  color: "#E1306C", mediaType: "carousel" },
  facebook:  { label: "Facebook",       icon: FaFacebook,   color: "#1877F2", mediaType: "carousel" },
  tiktok:    { label: "TikTok",         icon: FaTiktok,     color: "#FF0050", mediaType: "vertical" },
  youtube:   { label: "YouTube",        icon: FaYoutube,    color: "#FF0000", mediaType: "horizontal" },
  threads:   { label: "Threads",        icon: FaThreads,    color: "#FFFFFF", mediaType: "vertical" },
  bluesky:   { label: "Bluesky",        icon: FaBluesky,    color: "#0085FF", mediaType: "image" },
  pinterest: { label: "Pinterest",      icon: FaPinterestP, color: "#E60023", mediaType: "image" },
};

const STEP_NAMES = [
  "Extracting content", "Researching people", "Generating social posts",
  "Creating hero image", "Creating Canva visuals", "Creating Gamma slides",
  "Generating AI scene images", "Animating scenes", "Rendering vertical shorts",
  "Rendering YouTube video", "Uploading files", "Saving to Airtable", "Sending notification",
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
  promoVerticalUrl?: string;
  promoHorizontalUrl?: string;
  srt?: string;
  error?: string;
  results?: { title?: string; posts?: Record<string, string> };
}

// ── PostCard with attached media ───────────────────────────────────────

function PostCard({
  platform, text, heroImageUrl, gammaExportUrl, promoVerticalUrl, promoHorizontalUrl, index,
}: {
  platform: string; text: string; index: number;
  heroImageUrl?: string; gammaExportUrl?: string; promoVerticalUrl?: string; promoHorizontalUrl?: string;
}) {
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

  // Determine which media to show
  let imageUrl: string | undefined;
  let videoUrl: string | undefined;
  if (meta.mediaType === "image") imageUrl = heroImageUrl;
  else if (meta.mediaType === "carousel") { imageUrl = gammaExportUrl; videoUrl = promoVerticalUrl; }
  else if (meta.mediaType === "vertical") videoUrl = promoVerticalUrl;
  else if (meta.mediaType === "horizontal") videoUrl = promoHorizontalUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="rounded-xl overflow-hidden"
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      {/* Header */}
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3 text-left group">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}
        >
          <Icon size={12} color={meta.color} />
        </div>
        <span className="text-sm font-semibold text-white/80 flex-1">{meta.label}</span>
        {(imageUrl || videoUrl) && (
          <div className="flex items-center gap-1 mr-2">
            {imageUrl && <div className="w-1.5 h-1.5 rounded-full bg-green-400" title="Image" />}
            {videoUrl && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Video" />}
          </div>
        )}
        <ChevronDown size={13} className={`text-white/20 transition-transform ${open ? "rotate-180" : ""}`} />
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
            <div className="px-4 pb-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              {/* Post text */}
              <div className="relative pt-3">
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium"
                  style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}20`, color: GOLD }}
                >
                  <Copy size={10} />
                  {copied ? "Copied!" : "Copy"}
                </button>
                <p className="text-xs text-white/50 leading-relaxed whitespace-pre-wrap pr-20 max-h-48 overflow-y-auto">
                  {text}
                </p>
              </div>

              {/* Media */}
              {(imageUrl || videoUrl) && (
                <div className="mt-3 space-y-2">
                  {imageUrl && (
                    <div className="rounded-lg overflow-hidden border" style={{ borderColor: BORDER }}>
                      <img src={imageUrl} alt={`${meta.label} visual`} className="w-full max-h-48 object-cover" />
                      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "#0d0d14" }}>
                        <span className="text-[9px] text-white/30">{meta.mediaType === "carousel" ? "Carousel 4:5" : "Image 16:9"}</span>
                        <a href={imageUrl} download className="text-[9px] font-medium" style={{ color: GOLD }}>
                          <Download size={9} className="inline mr-1" />PNG
                        </a>
                      </div>
                    </div>
                  )}
                  {videoUrl && (
                    <div className="rounded-lg overflow-hidden border" style={{ borderColor: BORDER }}>
                      <video controls className="w-full max-h-48" preload="metadata">
                        <source src={videoUrl} type="video/mp4" />
                      </video>
                      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "#0d0d14" }}>
                        <span className="text-[9px] text-white/30">{meta.mediaType === "horizontal" ? "16:9 promo" : "9:16 vertical"}</span>
                        <a href={videoUrl} download className="text-[9px] font-medium" style={{ color: GOLD }}>
                          <Download size={9} className="inline mr-1" />MP4
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [srtOpen, setSrtOpen] = useState(false);

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

  const posts = job?.posts || job?.results?.posts || null;
  const title = job?.title || job?.results?.title || "";
  const isDone = job?.status === "done";
  const isProcessing = job?.status === "processing";

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b z-50" style={{ borderColor: BORDER, background: "rgba(10,10,15,0.9)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-white/25 hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-px h-5 bg-white/10" />
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}20` }}>
            <Zap size={13} color={GOLD} />
          </div>
          <div>
            <p className="text-xs font-bold text-white/85 truncate max-w-[300px]" style={{ fontFamily: "var(--font-heading)" }}>
              {title || "Processing..."}
            </p>
            <p className="text-[9px] text-white/25 font-mono">{jobId.substring(0, 8)}</p>
          </div>
        </div>
        <UserButton />
      </header>

      {!job ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin" color={GOLD} />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* ── LEFT SIDEBAR ──────────────────────────────── */}
          <aside
            className="hidden md:flex flex-col border-r overflow-y-auto"
            style={{ width: SIDEBAR_W, minWidth: SIDEBAR_W, borderColor: BORDER, background: "rgba(10,10,15,0.5)" }}
          >
            <div className="p-4 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/25 mb-3">Pipeline</p>
              <div className="space-y-0.5">
                {STEP_NAMES.map((stepName, i) => {
                  const stepNum = i + 1;
                  const completed = job.completedSteps || [];
                  const stepDone = completed.includes(stepNum);
                  const isActive = job.stepNumber === stepNum && isProcessing;
                  const isSkipped = isDone && !stepDone;

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px]"
                      style={{
                        background: isActive ? `${GOLD}08` : "transparent",
                        border: isActive ? `1px solid ${GOLD}15` : "1px solid transparent",
                        opacity: isSkipped ? 0.2 : 1,
                      }}
                    >
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: stepDone ? `${GOLD}20` : isActive ? `${GOLD}12` : "rgba(255,255,255,0.03)" }}
                      >
                        {stepDone ? <Check size={8} color={GOLD} />
                          : isActive ? <Loader2 size={8} className="animate-spin" color={GOLD} />
                          : <Minus size={8} className="text-white/10" />}
                      </div>
                      <span className={stepDone ? "text-white/50" : isActive ? "text-white/90 font-medium" : isSkipped ? "text-white/10 line-through" : "text-white/20"}>
                        {stepName}
                      </span>
                      {isActive && <div className="ml-auto w-1 h-1 rounded-full" style={{ background: GOLD, boxShadow: `0 0 4px ${GOLD}` }} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress bar at bottom */}
            <div className="p-4 border-t" style={{ borderColor: BORDER }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] text-white/30">{isDone ? "Complete" : job.step || "Queued"}</span>
                <span className="text-[9px] font-bold" style={{ color: GOLD }}>{job.progress}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${job.progress}%` }}
                  transition={{ duration: 0.6 }}
                  style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})`, boxShadow: `0 0 12px ${GOLD}25` }}
                />
              </div>
            </div>
          </aside>

          {/* ── RIGHT CONTENT PANEL ───────────────────────── */}
          <main className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Mobile: compact progress bar (hidden on desktop) */}
            <div className="md:hidden mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/40">{isDone ? "Complete" : job.step || "Queued"}</span>
                <span className="text-[10px] font-bold" style={{ color: GOLD }}>{job.progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${job.progress}%`, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})` }} />
              </div>
            </div>

            {/* Audio Player */}
            {job.audioUrl && (
              <div className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#1DB95415", border: "1px solid #1DB95425" }}>
                  <Headphones size={14} color="#1DB954" />
                </div>
                <audio controls className="flex-1 h-8 [&::-webkit-media-controls-panel]:bg-[#1a1a24]">
                  <source src={job.audioUrl} type="audio/mpeg" />
                </audio>
                <a href={job.audioUrl} download className="text-[10px] font-medium flex-shrink-0" style={{ color: GOLD }}>
                  <Download size={10} className="inline mr-0.5" />MP3
                </a>
              </div>
            )}

            {/* Transcript (collapsible) */}
            {job.srt && (
              <div className="rounded-xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                <button onClick={() => setSrtOpen(!srtOpen)} className="w-full flex items-center justify-between px-4 py-2.5 text-left">
                  <div className="flex items-center gap-2">
                    <FileText size={12} className="text-white/30" />
                    <span className="text-[11px] text-white/50">Transcript (SRT)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const blob = new Blob([job.srt!], { type: "text/srt" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url; a.download = `${title || "transcript"}.srt`; a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-[10px] font-medium" style={{ color: GOLD }}
                    >
                      <Download size={10} className="inline mr-0.5" />SRT
                    </button>
                    <ChevronDown size={12} className={`text-white/20 transition-transform ${srtOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {srtOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <pre className="px-4 pb-3 text-[10px] text-white/35 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap font-mono" style={{ borderTop: `1px solid ${BORDER}` }}>
                        {job.srt.substring(0, 2000)}{job.srt.length > 2000 ? "\n..." : ""}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Posts with media */}
            {posts && Object.keys(posts).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={12} color={GOLD} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                    Social Posts
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${GOLD}12`, color: GOLD }}>
                    {Object.keys(posts).filter(k => posts[k]).length}
                  </span>
                </div>
                <div className="space-y-2">
                  {Object.keys(PLATFORM_META).map((key, i) => {
                    const text = posts[key];
                    if (!text) return null;
                    return (
                      <PostCard
                        key={key}
                        platform={key}
                        text={text}
                        index={i}
                        heroImageUrl={job.heroImageUrl || undefined}
                        gammaExportUrl={job.gammaExportUrl || undefined}
                        promoVerticalUrl={job.promoVerticalUrl || undefined}
                        promoHorizontalUrl={job.promoHorizontalUrl || undefined}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error */}
            {job.status === "error" && (
              <div className="p-4 rounded-xl bg-red-500/[0.06] border border-red-500/15 flex items-start gap-2">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300/80">{job.error || "An unknown error occurred"}</p>
              </div>
            )}

            {/* Done */}
            {isDone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="p-6 rounded-xl text-center"
                style={{ background: `radial-gradient(circle at 50% 20%, ${GOLD}05, ${CARD_BG})`, border: `1px solid ${GOLD}12` }}
              >
                <p className="text-2xl mb-2">✦</p>
                <p className="text-sm font-bold text-white/90" style={{ fontFamily: "var(--font-heading)" }}>Content repurposed.</p>
                <p className="text-[10px] text-white/30 mt-1">Expand each post to copy text and download media.</p>
              </motion.div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
