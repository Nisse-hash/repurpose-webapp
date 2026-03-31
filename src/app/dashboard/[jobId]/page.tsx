"use client";

import { useState, useEffect, use, useRef } from "react";
import { UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Check, Loader2, AlertCircle, ArrowLeft, Copy, ChevronDown,
  Minus, Download, FileText, Headphones, Sparkles, Play, Video,
  Clock, Image, Send, CheckCheck, ExternalLink, User2, Briefcase, RefreshCw, X, Maximize2,
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
const SIDEBAR_W = "50%";

// ── Lightbox for click-to-enlarge media ──────────────────────────────
function Lightbox({ src, type, onClose }: { src: string; type: "image" | "video"; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10">
        <X size={20} className="text-white" />
      </button>
      <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {type === "image" ? (
          <img src={src} alt="Full size" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
        ) : (
          <video controls autoPlay className="max-w-full max-h-[85vh] rounded-lg">
            <source src={src} type="video/mp4" />
          </video>
        )}
      </div>
    </motion.div>
  );
}

// Thumbnail wrapper: small preview, click to enlarge
function MediaThumb({ src, type, label, downloadLabel }: { src: string; type: "image" | "video"; label: string; downloadLabel?: string }) {
  const [lightbox, setLightbox] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isZip = src.endsWith(".zip");

  return (
    <>
      <AnimatePresence>{lightbox && !imgError && !isZip && <Lightbox src={src} type={type} onClose={() => setLightbox(false)} />}</AnimatePresence>
      <div
        className="rounded-lg overflow-hidden border cursor-pointer group relative"
        style={{ borderColor: BORDER }}
        onClick={() => !imgError && !isZip && setLightbox(true)}
      >
        {imgError || isZip ? (
          <div className="w-full h-24 flex flex-col items-center justify-center gap-1 bg-white/[0.02]">
            <Image size={16} className="text-white/15" />
            <span className="text-[8px] text-white/20">{isZip ? "ZIP archive" : "Unavailable"}</span>
          </div>
        ) : type === "image" ? (
          <img src={src} alt={label} className="w-full h-24 object-cover" onError={() => setImgError(true)} />
        ) : (
          <video className="w-full h-24 object-cover" preload="metadata" muted>
            <source src={src} type="video/mp4" />
          </video>
        )}
        {!imgError && !isZip && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
            <Maximize2 size={16} className="text-white" />
          </div>
        )}
        <div className="flex items-center justify-between px-2 py-1" style={{ background: "#0d0d14" }}>
          <span className="text-[8px] text-white/30">{label}</span>
          <a href={src} download onClick={(e) => e.stopPropagation()} className="text-[8px] font-medium" style={{ color: GOLD }}>
            <Download size={8} className="inline mr-0.5" />{isZip ? "ZIP" : downloadLabel || (type === "image" ? "PNG" : "MP4")}
          </a>
        </div>
      </div>
    </>
  );
}

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
  "Generating AI scene images", "Animating scenes", "Rendering promos + shorts",
  "Rendering audio shorts", "Rendering full YouTube video", "Saving to Airtable", "Sending notification",
];

interface PersonInfo {
  name: string;
  bio?: string;
  photoUrl?: string;
  linkedinUrl?: string;
}

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
  sceneImageUrls?: string[];
  animatedSceneUrls?: string[];
  shortsUrls?: string[];
  fullVideoUrl?: string;
  guest?: PersonInfo | null;
  host?: PersonInfo | null;
  srt?: string;
  error?: string;
  createdAt?: string;
  results?: { title?: string; posts?: Record<string, string> };
}

// ── Elapsed timer ─────────────────────────────────────────────────────

function ElapsedTime({ startTime, done }: { startTime: string; done: boolean }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const start = new Date(startTime).getTime();
    if (!start) return;

    const tick = () => {
      const diff = (done ? Date.now() : Date.now()) - start;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(`${mins}:${String(secs).padStart(2, "0")}`);
    };
    tick();
    if (done) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime, done]);

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-white/25">
      <Clock size={9} />
      <span className="font-mono">{elapsed}</span>
    </div>
  );
}

// ── Person Card ───────────────────────────────────────────────────────

function PersonCard({ person, role }: { person: PersonInfo; role: "guest" | "host" }) {
  if (!person?.name) return null;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}` }}>
      {person.photoUrl ? (
        <img src={person.photoUrl} alt={person.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-white/10" />
      ) : (
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/10">
          <User2 size={16} className="text-white/20" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white/80">{person.name}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 uppercase tracking-wider">{role}</span>
        </div>
        {person.bio && <p className="text-[10px] text-white/35 mt-0.5 line-clamp-2">{person.bio}</p>}
        {person.linkedinUrl && (
          <a href={person.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 text-[9px] text-[#0A66C2] hover:underline">
            <FaLinkedinIn size={8} /> LinkedIn
            <ExternalLink size={7} />
          </a>
        )}
      </div>
    </div>
  );
}

// ── PostCard with attached media ──────────────────────────────────────

function PostCard({
  platform, text, heroImageUrl, gammaExportUrl, promoVerticalUrl, promoHorizontalUrl, index,
}: {
  platform: string; text: string; index: number;
  heroImageUrl?: string; gammaExportUrl?: string; promoVerticalUrl?: string; promoHorizontalUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  const meta = PLATFORM_META[platform];
  if (!meta) return null;
  const Icon = meta.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const charLimits: Record<string, number> = {
    x: 280, threads: 500, bluesky: 300, tiktok: 2200,
    linkedin: 3000, instagram: 2200, facebook: 63206, youtube: 5000, pinterest: 500,
  };
  const limit = charLimits[platform] || 5000;
  const charCount = text.length;
  const isOver = charCount > limit;

  const validUrl = (u?: string) => u && u.startsWith("http") ? u : undefined;
  let imageUrl: string | undefined;
  let videoUrl: string | undefined;
  if (meta.mediaType === "image") imageUrl = validUrl(heroImageUrl);
  else if (meta.mediaType === "carousel") { imageUrl = validUrl(gammaExportUrl); videoUrl = validUrl(promoVerticalUrl); }
  else if (meta.mediaType === "vertical") videoUrl = validUrl(promoVerticalUrl);
  else if (meta.mediaType === "horizontal") videoUrl = validUrl(promoHorizontalUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="rounded-xl overflow-hidden"
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}
        >
          <Icon size={12} color={meta.color} />
        </div>
        <span className="text-sm font-semibold text-white/80 flex-1">{meta.label}</span>
        <span className={`text-[9px] font-mono mr-1 ${isOver ? "text-red-400" : "text-white/15"}`}>
          {charCount}/{limit}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors"
          style={{ background: copied ? "#1DB95415" : `${GOLD}12`, border: `1px solid ${copied ? "#1DB95425" : `${GOLD}20`}`, color: copied ? "#1DB954" : GOLD }}
        >
          {copied ? <CheckCheck size={10} /> : <Copy size={10} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Always visible content */}
      <div className="px-4 pb-3" style={{ borderTop: `1px solid ${BORDER}` }}>
        {imageUrl && !videoUrl ? (
          /* Single image: side by side with text */
          <div className="flex gap-3 pt-2.5">
            <div className="w-28 flex-shrink-0"><MediaThumb src={imageUrl} type="image" label={meta.mediaType === "carousel" ? "Carousel 4:5" : "Image 16:9"} /></div>
            <p className="text-xs text-white/50 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto flex-1">
              {text}
            </p>
          </div>
        ) : !imageUrl && videoUrl ? (
          /* Single video: side by side with text */
          <div className="flex gap-3 pt-2.5">
            <div className="w-28 flex-shrink-0"><MediaThumb src={videoUrl} type="video" label={meta.mediaType === "horizontal" ? "16:9 promo" : "9:16 vertical"} /></div>
            <p className="text-xs text-white/50 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto flex-1">
              {text}
            </p>
          </div>
        ) : (
          /* Multiple media or no media: text on top, media under */
          <>
            <p className="text-xs text-white/50 leading-relaxed whitespace-pre-wrap pt-2.5 max-h-32 overflow-y-auto">
              {text}
            </p>
            {(imageUrl || videoUrl) && (
              <div className="mt-2 flex gap-2">
                {imageUrl && <div className="w-28"><MediaThumb src={imageUrl} type="image" label={meta.mediaType === "carousel" ? "Carousel 4:5" : "Image 16:9"} /></div>}
                {videoUrl && <div className="w-28"><MediaThumb src={videoUrl} type="video" label={meta.mediaType === "horizontal" ? "16:9 promo" : "9:16 vertical"} /></div>}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [srtOpen, setSrtOpen] = useState(false);
  const [sceneOpen, setSceneOpen] = useState(false);
  const [allCopied, setAllCopied] = useState(false);
  const startTimeRef = useRef<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollNow = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/job/${jobId}`);
      const data = await res.json();
      if (!startTimeRef.current && data.createdAt) startTimeRef.current = data.createdAt;
      setJob(data);
      if ((data.status === "done" || data.status === "error") && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (err) {
      console.error("Poll error:", err);
    }
  };

  useEffect(() => {
    pollNow();
    intervalRef.current = setInterval(pollNow, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [jobId]);

  const posts = job?.posts || job?.results?.posts || null;
  const title = job?.title || job?.results?.title || "";
  const isDone = job?.status === "done";
  const isProcessing = job?.status === "processing";

  // Collect all assets for summary
  const assetCount = [
    job?.heroImageUrl ? 1 : 0,
    job?.gammaExportUrl ? 1 : 0,
    job?.promoVerticalUrl ? 1 : 0,
    job?.promoHorizontalUrl ? 1 : 0,
    ...(job?.sceneImageUrls || []).map(() => 1),
    ...(job?.animatedSceneUrls || []).map(() => 1),
    ...(job?.shortsUrls || []).map(() => 1),
    job?.fullVideoUrl ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const postCount = posts ? Object.values(posts).filter(Boolean).length : 0;

  const handleCopyAll = () => {
    if (!posts) return;
    const allText = Object.entries(PLATFORM_META)
      .map(([key, meta]) => posts[key] ? `--- ${meta.label} ---\n${posts[key]}` : "")
      .filter(Boolean)
      .join("\n\n");
    navigator.clipboard.writeText(allText).then(() => {
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
    });
  };

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
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-white/25 font-mono">{jobId.substring(0, 8)}</p>
              {startTimeRef.current && <ElapsedTime startTime={startTimeRef.current} done={isDone || job?.status === "error"} />}
            </div>
          </div>
          {!isDone && job?.status !== "error" && (
            <button onClick={pollNow} className="ml-2 p-1 rounded-md hover:bg-white/5 transition-colors" title="Refresh">
              <RefreshCw size={11} className="text-white/20 hover:text-white/40" />
            </button>
          )}
        </div>
        <UserButton />
      </header>

      {!job ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Skeleton sidebar */}
          <aside className="hidden md:flex flex-col border-r p-4 space-y-2" style={{ flex: "0 0 50%", borderColor: BORDER, background: "rgba(10,10,15,0.5)" }}>
            <div className="h-3 w-16 rounded bg-white/[0.03] animate-pulse mb-3" />
            {Array.from({ length: 13 }).map((_, i) => (
              <div key={i} className="h-6 rounded-md bg-white/[0.02] animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </aside>
          {/* Skeleton content */}
          <main className="flex-1 p-6 space-y-4">
            <div className="h-14 rounded-xl bg-white/[0.02] animate-pulse" />
            <div className="h-10 rounded-xl bg-white/[0.02] animate-pulse" style={{ animationDelay: "100ms" }} />
            <div className="space-y-2 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-white/[0.02] animate-pulse" style={{ animationDelay: `${200 + i * 80}ms` }} />
              ))}
            </div>
          </main>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* ── LEFT SIDEBAR ──────────────────────────────── */}
          <aside
            className="hidden md:flex flex-col border-r overflow-y-auto"
            style={{ flex: "0 0 50%", borderColor: BORDER, background: "rgba(10,10,15,0.5)" }}
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

            {/* Guest / Host Research Cards */}
            {(job.guest?.name || job.host?.name) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase size={12} color={GOLD} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: GOLD }}>People</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {job.guest?.name && <PersonCard person={job.guest} role="guest" />}
                  {job.host?.name && <PersonCard person={job.host} role="host" />}
                </div>
              </div>
            )}

            {/* Visual Assets Strip: hero + carousel side by side */}
            {(job.heroImageUrl || job.gammaExportUrl) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Image size={12} color={GOLD} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: GOLD }}>Visuals</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {job.heroImageUrl && job.heroImageUrl.startsWith("http") && (
                    <div className="flex-shrink-0 w-36"><MediaThumb src={job.heroImageUrl} type="image" label="Hero 16:9" /></div>
                  )}
                  {job.gammaExportUrl && job.gammaExportUrl.startsWith("http") && (
                    <div className="flex-shrink-0 w-36"><MediaThumb src={job.gammaExportUrl} type="image" label="Carousel 4:5" /></div>
                  )}
                  {job.gammaUrl && (
                    <a href={job.gammaUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-shrink-0 w-40 h-40 rounded-lg border flex flex-col items-center justify-center gap-2 hover:bg-white/[0.02] transition-colors"
                      style={{ borderColor: BORDER }}>
                      <ExternalLink size={16} className="text-white/20" />
                      <span className="text-[10px] text-white/30">Open in Gamma</span>
                      <span className="text-[9px] text-white/15">Edit slides</span>
                    </a>
                  )}
                </div>
              </div>
            )}

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
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} color={GOLD} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                      Social Posts
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${GOLD}12`, color: GOLD }}>
                      {postCount}
                    </span>
                  </div>

                  {/* Copy All button */}
                  <button
                    onClick={handleCopyAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all hover:scale-105"
                    style={{ background: allCopied ? "#1DB95412" : `${GOLD}08`, border: `1px solid ${allCopied ? "#1DB95420" : `${GOLD}15`}`, color: allCopied ? "#1DB954" : GOLD }}
                  >
                    {allCopied ? <CheckCheck size={10} /> : <Copy size={10} />}
                    {allCopied ? "All copied!" : "Copy all"}
                  </button>
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

            {/* Scene Images Gallery */}
            {job.sceneImageUrls && job.sceneImageUrls.length > 0 && (
              <div>
                <button onClick={() => setSceneOpen(!sceneOpen)} className="flex items-center gap-2 mb-3 group">
                  <Image size={12} color={GOLD} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                    AI Scene Images
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${GOLD}12`, color: GOLD }}>
                    {job.sceneImageUrls.length}
                  </span>
                  <ChevronDown size={10} className={`text-white/20 transition-transform ${sceneOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {sceneOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {job.sceneImageUrls.map((url, i) => (
                          <div key={i} className="rounded-lg overflow-hidden border group relative" style={{ borderColor: BORDER }}>
                            <img src={url} alt={`Scene ${i + 1}`} className="w-full aspect-video object-cover" />
                            <a
                              href={url} download
                              className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: "rgba(0,0,0,0.8)", color: GOLD }}
                            >
                              <Download size={8} />PNG
                            </a>
                          </div>
                        ))}
                      </div>

                      {/* Animated scenes */}
                      {job.animatedSceneUrls && job.animatedSceneUrls.length > 0 && (
                        <div className="mt-2">
                          {job.animatedSceneUrls.map((url, i) => (
                            <div key={i} className="rounded-lg overflow-hidden border" style={{ borderColor: BORDER }}>
                              <video controls className="w-full" preload="metadata">
                                <source src={url} type="video/mp4" />
                              </video>
                              <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "#0d0d14" }}>
                                <span className="text-[9px] text-white/30">Animated scene {i + 1}</span>
                                <a href={url} download className="text-[9px] font-medium" style={{ color: GOLD }}>
                                  <Download size={9} className="inline mr-1" />MP4
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Audio Shorts */}
            {job.shortsUrls && job.shortsUrls.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Play size={12} color={GOLD} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                    Audio Shorts
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${GOLD}12`, color: GOLD }}>
                    {job.shortsUrls.length}
                  </span>
                  <span className="text-[9px] text-white/20 ml-1">15s best moments</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {job.shortsUrls.map((url, i) => (
                    <div key={i} className="flex-shrink-0 w-24"><MediaThumb src={url} type="video" label={`Short ${i + 1}`} /></div>
                  ))}
                </div>
              </div>
            )}

            {/* Full YouTube Video */}
            {job.fullVideoUrl && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Video size={12} color="#FF0000" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#FF0000" }}>
                    Full YouTube Video
                  </span>
                  <span className="text-[9px] text-white/20 ml-1">Speaker viz + karaoke subtitles</span>
                </div>
                <div className="w-48"><MediaThumb src={job.fullVideoUrl} type="video" label="Full episode, karaoke subs" /></div>
              </div>
            )}

            {/* Error */}
            {job.status === "error" && (
              <div className="p-4 rounded-xl bg-red-500/[0.06] border border-red-500/15 flex items-start gap-2">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-red-300/80 font-medium">Pipeline failed</p>
                  <p className="text-[10px] text-red-300/50 mt-0.5">{job.error || "An unknown error occurred"}</p>
                </div>
              </div>
            )}

            {/* Done: asset summary */}
            {isDone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="p-6 rounded-xl"
                style={{ background: `radial-gradient(circle at 50% 20%, ${GOLD}05, ${CARD_BG})`, border: `1px solid ${GOLD}12` }}
              >
                <div className="text-center mb-4">
                  <p className="text-2xl mb-2">✦</p>
                  <p className="text-sm font-bold text-white/90" style={{ fontFamily: "var(--font-heading)" }}>Content repurposed.</p>
                  {(() => {
                    const completed = job.completedSteps || [];
                    const skipped = STEP_NAMES
                      .map((name, i) => ({ name, num: i + 1 }))
                      .filter(s => !completed.includes(s.num));
                    return (
                      <div className="mt-1">
                        <p className="text-[10px] text-white/40">
                          {completed.length}/{STEP_NAMES.length} steps completed
                        </p>
                        {skipped.length > 0 && skipped.length < 6 && (
                          <p className="text-[9px] text-white/20 mt-0.5">
                            Skipped: {skipped.map(s => s.name).join(", ")}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Asset summary grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {postCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border" style={{ borderColor: BORDER }}>
                      <FileText size={12} className="text-white/30" />
                      <div>
                        <p className="text-xs font-bold text-white/70">{postCount}</p>
                        <p className="text-[8px] text-white/25 uppercase">Posts</p>
                      </div>
                    </div>
                  )}
                  {assetCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border" style={{ borderColor: BORDER }}>
                      <Image size={12} className="text-white/30" />
                      <div>
                        <p className="text-xs font-bold text-white/70">{assetCount}</p>
                        <p className="text-[8px] text-white/25 uppercase">Assets</p>
                      </div>
                    </div>
                  )}
                  {job.srt && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border" style={{ borderColor: BORDER }}>
                      <Headphones size={12} className="text-white/30" />
                      <div>
                        <p className="text-xs font-bold text-white/70">1</p>
                        <p className="text-[8px] text-white/25 uppercase">Transcript</p>
                      </div>
                    </div>
                  )}
                  {job.gammaUrl && (
                    <a href={job.gammaUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border hover:bg-white/[0.04] transition-colors" style={{ borderColor: BORDER }}>
                      <ExternalLink size={12} className="text-white/30" />
                      <div>
                        <p className="text-xs font-bold text-white/70">Gamma</p>
                        <p className="text-[8px] text-white/25 uppercase">View</p>
                      </div>
                    </a>
                  )}
                </div>

                <p className="text-[10px] text-white/30 text-center">Expand each post to copy text and download media.</p>
              </motion.div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
