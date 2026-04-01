"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Upload, Link, FileText, Zap, Music, Video, Globe, FileImage,
  Clock, ArrowRight, Check, Loader2, AlertCircle, X, Palette,
  ChevronDown, Image, Sparkles, Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlowCard } from "@/components/ui/spotlight-card";
import { ParticleButton } from "@/components/ui/particle-button";

const GOLD = "#C9A84C";
const GOLD_BRIGHT = "#F0B429";
const CARD_BG = "#13131A";
const BORDER = "rgba(255,255,255,0.06)";
const MAX_FILE_SIZE = 500 * 1024 * 1024;

type InputMode = "url" | "file" | "text";

interface JobSummary {
  jobId: string;
  status: string;
  title: string;
  progress: number;
  createdAt: string;
  completedSteps: number;
  totalSteps: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Toast({ msg, type, onClose }: { msg: string; type: "error" | "success"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg"
      style={{
        background: type === "error" ? "rgba(239,68,68,0.12)" : `${GOLD}12`,
        border: `1px solid ${type === "error" ? "rgba(239,68,68,0.2)" : `${GOLD}20`}`,
        backdropFilter: "blur(12px)",
      }}
    >
      {type === "error" ? (
        <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
      ) : (
        <Check size={14} color={GOLD} className="flex-shrink-0" />
      )}
      <span className={`text-xs font-medium ${type === "error" ? "text-red-300" : "text-white/70"}`}>{msg}</span>
      <button onClick={onClose} className="ml-1 text-white/20 hover:text-white/40"><X size={12} /></button>
    </motion.div>
  );
}

// ── Floating orbs background ────────────────────────────
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute w-[600px] h-[600px] rounded-full opacity-[0.03]" style={{
        background: `radial-gradient(circle, ${GOLD}, transparent 70%)`,
        top: "-10%", left: "-10%", animation: "float-slow 20s ease-in-out infinite",
      }} />
      <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.02]" style={{
        background: `radial-gradient(circle, #F0B429, transparent 70%)`,
        bottom: "5%", right: "-5%", animation: "float-slow 25s ease-in-out infinite reverse",
      }} />
      <style>{`
        @keyframes float-slow { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(30px, -40px); } }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const [mode, setMode] = useState<InputMode>("url");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recentJobs, setRecentJobs] = useState<JobSummary[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [podcastName, setPodcastName] = useState("");
  const [hostName, setHostName] = useState("");
  const [guestName, setGuestName] = useState("");

  // Brand reference image
  const [brandImage, setBrandImage] = useState<File | null>(null);
  const [brandImagePreview, setBrandImagePreview] = useState<string | null>(null);
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [extractingColors, setExtractingColors] = useState(false);
  const brandInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: "error" | "success" = "error") => setToast({ msg, type });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs${user?.id ? `?userId=${user.id}` : ""}`)
      .then(r => r.json())
      .then(d => setRecentJobs(d.jobs || []))
      .catch(() => {});
  }, []);

  // Load saved branding
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/branding/${user.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.colors?.length) setBrandColors(data.colors);
        if (data?.logoUrl) setBrandImagePreview(data.logoUrl);
      })
      .catch(() => {});
  }, [user?.id]);

  const handleBrandImageUpload = async (f: File) => {
    setBrandImage(f);
    setBrandImagePreview(URL.createObjectURL(f));
    if (!user?.id) return;

    setExtractingColors(true);
    try {
      const formData = new FormData();
      formData.append("file", f);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/branding/${user.id}/logo`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.extractedColors?.length) {
          setBrandColors(data.extractedColors);
          showToast(`Extracted ${data.extractedColors.length} colors`, "success");
        }
        if (data.logoUrl) setBrandImagePreview(data.logoUrl);
      }
    } catch {}
    setExtractingColors(false);
  };

  const removeBrandImage = () => {
    setBrandImage(null);
    setBrandImagePreview(null);
    setBrandColors([]);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      if (f.size > MAX_FILE_SIZE) { showToast(`File too large. Max 500MB.`); return; }
      setFile(f);
      setMode("file");
    }
  }, []);

  const handleSubmit = async () => {
    if (mode === "url") {
      const trimmed = urlInput.trim();
      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        showToast("Enter a valid URL starting with https://");
        return;
      }
    }
    if (mode === "file" && !file) { showToast("Select a file first"); return; }
    if (mode === "file" && file && file.size > MAX_FILE_SIZE) { showToast("File too large. Max 500MB."); return; }

    setSubmitting(true);
    try {
      let input = mode === "url" ? urlInput : mode === "text" ? textInput : file?.name || "";
      let audioUrl: string | undefined;

      if (mode === "file" && file) {
        setUploadStatus("Uploading file...");
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload`, { method: "POST", body: formData });
        if (!uploadRes.ok) { showToast("File upload failed"); return; }
        const uploadData = await uploadRes.json();
        audioUrl = uploadData.fileUrl;
        input = uploadData.fileName;
        setUploadStatus(null);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "auto",
          input,
          userId: user?.id || null,
          ...(audioUrl ? { audioUrl } : {}),
          context: {
            podcastName: podcastName.trim() || undefined,
            hostName: hostName.trim() || undefined,
            guestName: guestName.trim() || undefined,
          },
          config: { platforms: ["linkedin", "instagram", "x", "facebook", "tiktok", "youtube", "pinterest", "threads", "bluesky"] },
        }),
      });
      const data = await res.json();
      if (data.error) { showToast(data.error); return; }
      if (data.jobId) window.location.href = `/dashboard/${data.jobId}`;
    } catch { showToast("Failed to connect to backend"); } finally { setSubmitting(false); setUploadStatus(null); }
  };

  const hasInput = mode === "url" ? urlInput.trim() : mode === "file" ? !!file : textInput.trim();

  const detectedType = (() => {
    if (mode !== "url" || !urlInput.trim()) return null;
    const url = urlInput.toLowerCase();
    if (url.includes("spotify") || url.includes("podcast") || url.includes("anchor.fm")) return { label: "Podcast", icon: Music, color: "#1DB954" };
    if (url.includes("youtube") || url.includes("youtu.be")) return { label: "YouTube", icon: Video, color: "#FF0000" };
    if (url.includes("tiktok")) return { label: "TikTok", icon: Video, color: "#FF0050" };
    if (url.includes(".mp3") || url.includes(".wav") || url.includes(".m4a")) return { label: "Audio", icon: Music, color: "#8B5CF6" };
    if (url.includes(".mp4") || url.includes(".mov") || url.includes(".webm")) return { label: "Video", icon: Video, color: "#F59E0B" };
    if (url.includes(".pdf")) return { label: "PDF", icon: FileImage, color: "#EF4444" };
    if (url.startsWith("http")) return { label: "Article", icon: Globe, color: "#3B82F6" };
    return null;
  })();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && hasInput && !submitting) handleSubmit();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [hasInput, submitting, urlInput, textInput, file, mode]);

  const hasContext = podcastName || hostName || guestName;
  const hasBrandRef = brandImagePreview || brandColors.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative">
      <FloatingOrbs />

      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/[0.04]">
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105" style={{
            background: `linear-gradient(135deg, ${GOLD}25, ${GOLD}08)`,
            border: `1.5px solid ${GOLD}30`,
            boxShadow: `0 0 20px ${GOLD}10`,
          }}>
            <Zap size={17} color={GOLD} />
          </div>
          <span className="text-lg font-bold tracking-tight text-white/90 group-hover:text-white transition-colors" style={{ fontFamily: "var(--font-heading)" }}>
            Repurpose
          </span>
        </a>
        <div className="flex items-center gap-5">
          <a href="/settings" className="text-[11px] text-white/25 hover:text-white/50 transition-colors flex items-center gap-1.5">
            <Palette size={11} /> Settings
          </a>
          <UserButton />
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-col items-center px-4 pt-20 pb-16">
        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-14"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="text-white">Drop your content.</span>
            <br />
            <span className="bg-clip-text text-transparent" style={{
              backgroundImage: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT}, #E8C547)`,
            }}>
              Get everything.
            </span>
          </h1>
          <p className="text-white/30 text-sm mt-4 max-w-md mx-auto leading-relaxed">
            Paste a URL, upload a file, or drop text. We generate social posts, visuals, shorts, and a full YouTube video.
          </p>
        </motion.div>

        {/* Input mode tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex gap-1.5 mb-6 p-1 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}` }}
        >
          {([
            { key: "url" as InputMode, label: "URL", icon: Link },
            { key: "file" as InputMode, label: "File", icon: Upload },
            { key: "text" as InputMode, label: "Text", icon: FileText },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`relative flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                mode === key ? "text-white" : "text-white/30 hover:text-white/50"
              }`}
            >
              {mode === key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}20` }}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={14} />
                {label}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Input area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="w-full max-w-2xl"
        >
          <GlowCard glowColor="gold" customSize className="w-full !aspect-auto p-0">
            <div className="relative z-10">
              {mode === "url" && (
                <div className="flex items-center">
                  <div className="pl-5 text-white/15"><Link size={16} /></div>
                  <input
                    type="url"
                    placeholder="Paste a URL... (Spotify, YouTube, article, audio)"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full bg-transparent px-4 py-5 text-white text-base placeholder:text-white/15 outline-none"
                    autoFocus
                  />
                </div>
              )}

              {mode === "file" && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${dragActive ? "bg-white/[0.02]" : ""}`}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "audio/*,video/*,application/pdf,image/*";
                    input.onchange = (e) => {
                      const f = (e.target as HTMLInputElement).files?.[0];
                      if (f) {
                        if (f.size > MAX_FILE_SIZE) { showToast("File too large. Max 500MB."); return; }
                        setFile(f);
                      }
                    };
                    input.click();
                  }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                    background: file ? `${GOLD}10` : "rgba(255,255,255,0.02)",
                    border: `1.5px dashed ${file ? `${GOLD}40` : "rgba(255,255,255,0.08)"}`,
                  }}>
                    <Upload size={20} color={file ? GOLD : "#444"} />
                  </div>
                  {file ? (
                    <div className="text-center">
                      <p className="text-white/80 font-medium text-sm">{file.name}</p>
                      <p className="text-white/25 text-xs mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-white/40 text-sm">Drag and drop, or click to browse</p>
                      <p className="text-white/15 text-xs">Audio, video, PDF, images (max 500MB)</p>
                    </>
                  )}
                </div>
              )}

              {mode === "text" && (
                <textarea
                  placeholder="Paste your text content here..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={5}
                  className="w-full bg-transparent px-6 py-5 text-white text-sm placeholder:text-white/15 outline-none resize-none leading-relaxed"
                />
              )}
            </div>
          </GlowCard>

          {/* Detected type + Options row */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              {detectedType && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: `${detectedType.color}10`, border: `1px solid ${detectedType.color}20` }}
                >
                  <detectedType.icon size={12} color={detectedType.color} />
                  <span className="text-[10px] font-medium" style={{ color: detectedType.color }}>{detectedType.label}</span>
                </motion.div>
              )}
              {hasBrandRef && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}15` }}>
                  <Palette size={10} color={GOLD} />
                  <div className="flex gap-0.5">
                    {brandColors.slice(0, 4).map((c, i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
            >
              <ChevronDown size={10} className={`transition-transform ${showOptions ? "rotate-180" : ""}`} />
              Options
            </button>
          </div>

          {/* Expandable options panel */}
          <AnimatePresence>
            {showOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="rounded-xl p-4 space-y-4" style={{ background: "rgba(255,255,255,0.015)", border: `1px solid ${BORDER}` }}>

                  {/* Context fields */}
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-white/25 font-medium mb-2 block">Context (optional)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" placeholder="Podcast name" value={podcastName} onChange={(e) => setPodcastName(e.target.value)}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white/60 placeholder:text-white/15 outline-none focus:border-white/10 transition-colors" />
                      <input type="text" placeholder="Host name" value={hostName} onChange={(e) => setHostName(e.target.value)}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white/60 placeholder:text-white/15 outline-none focus:border-white/10 transition-colors" />
                      <input type="text" placeholder="Guest name" value={guestName} onChange={(e) => setGuestName(e.target.value)}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white/60 placeholder:text-white/15 outline-none focus:border-white/10 transition-colors" />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/[0.04]" />

                  {/* Brand reference */}
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-white/25 font-medium mb-2 block">Brand colors (optional)</label>
                    <p className="text-[10px] text-white/15 mb-3">Upload a logo or image to auto-extract brand colors. These colors will style your posts, visuals, and videos.</p>

                    <div className="flex items-start gap-3">
                      {/* Image preview or upload zone */}
                      {brandImagePreview ? (
                        <div className="relative group flex-shrink-0">
                          <img src={brandImagePreview} alt="Brand" className="w-16 h-16 rounded-lg object-cover border border-white/10" />
                          <button
                            onClick={removeBrandImage}
                            className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-red-500/30 border border-red-500/40 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={8} />
                          </button>
                          {extractingColors && (
                            <div className="absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center">
                              <Loader2 size={14} className="animate-spin text-white/60" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => brandInputRef.current?.click()}
                          className="w-16 h-16 rounded-lg border border-dashed border-white/10 flex flex-col items-center justify-center gap-1 hover:border-white/20 transition-colors flex-shrink-0"
                        >
                          <Image size={14} className="text-white/15" />
                          <span className="text-[8px] text-white/15">Logo</span>
                        </button>
                      )}

                      <input ref={brandInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleBrandImageUpload(f);
                        e.target.value = "";
                      }} />

                      {/* Color swatches */}
                      <div className="flex-1">
                        {brandColors.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {brandColors.map((c, i) => (
                              <div key={i} className="flex flex-col items-center gap-0.5">
                                <div className="w-8 h-8 rounded-md border border-white/10" style={{ background: c }} title={c} />
                                <span className="text-[7px] text-white/20 font-mono">{c}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center h-16 text-[10px] text-white/15 italic">
                            No colors extracted yet. Upload an image to start.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Keyboard hint */}
          {hasInput && !showOptions && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/10 text-xs mt-3 text-center"
            >
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/25 font-mono text-[10px]">Enter</kbd> to submit
            </motion.p>
          )}

          {/* Submit */}
          <ParticleButton
            visible={!!hasInput}
            onClick={handleSubmit}
            disabled={!hasInput || submitting}
            label={submitting ? (uploadStatus || "Processing...") : "Repurpose It  \u2192"}
          />
        </motion.div>

        {/* Recent Jobs */}
        {recentJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-2xl mt-20 mb-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock size={11} className="text-white/20" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/20">Recent</span>
            </div>
            <div className="space-y-1">
              {recentJobs.slice(0, 8).map((job, i) => (
                <motion.a
                  key={job.jobId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  href={`/dashboard/${job.jobId}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl group transition-all hover:bg-white/[0.015]"
                  style={{ border: `1px solid transparent` }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                    background: job.status === "done" ? `${GOLD}12` : job.status === "error" ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${job.status === "done" ? `${GOLD}20` : job.status === "error" ? "rgba(239,68,68,0.15)" : BORDER}`,
                  }}>
                    {job.status === "done" ? <Check size={11} color={GOLD} />
                      : job.status === "error" ? <AlertCircle size={11} className="text-red-400/60" />
                      : job.status === "processing" ? <Loader2 size={11} className="animate-spin text-white/30" />
                      : <Clock size={11} className="text-white/15" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white/60 truncate group-hover:text-white/80 transition-colors">
                      {job.title || `Job ${job.jobId.substring(0, 8)}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {job.createdAt && <span className="text-[9px] text-white/15">{timeAgo(job.createdAt)}</span>}
                    </div>
                  </div>

                  {job.status === "processing" && (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${job.progress}%`, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})` }} />
                      </div>
                      <span className="text-[9px] font-mono" style={{ color: GOLD }}>{job.progress}%</span>
                    </div>
                  )}

                  {job.status === "done" && (
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={9} color={GOLD} className="opacity-40" />
                      <span className="text-[9px] text-white/15">{job.completedSteps} steps</span>
                    </div>
                  )}

                  <ArrowRight size={12} className="text-white/5 group-hover:text-white/25 transition-colors flex-shrink-0" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
