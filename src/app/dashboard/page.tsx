"use client";

import { useState, useCallback, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { Upload, Link, FileText, Zap, Music, Video, Globe, FileImage, Clock, ArrowRight, Check, Loader2, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlowCard } from "@/components/ui/spotlight-card";
import { ParticleButton } from "@/components/ui/particle-button";

const GOLD = "#C9A84C";
const CARD_BG = "#13131A";
const BORDER = "rgba(255,255,255,0.06)";
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

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

// ── Toast component ──────────────────────────────────────
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
      <button onClick={onClose} className="ml-1 text-white/20 hover:text-white/40">
        <X size={12} />
      </button>
    </motion.div>
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
  const [showContext, setShowContext] = useState(false);
  const [podcastName, setPodcastName] = useState("");
  const [hostName, setHostName] = useState("");
  const [guestName, setGuestName] = useState("");

  const showToast = (msg: string, type: "error" | "success" = "error") => setToast({ msg, type });

  // Fetch job history
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs${user?.id ? `?userId=${user.id}` : ""}`)
      .then(r => r.json())
      .then(d => setRecentJobs(d.jobs || []))
      .catch(() => showToast("Could not load recent jobs"));
  }, []);

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
      if (f.size > MAX_FILE_SIZE) {
        showToast(`File too large (${(f.size / 1024 / 1024).toFixed(0)}MB). Max 500MB.`);
        return;
      }
      setFile(f);
      setMode("file");
    }
  }, []);

  const handleSubmit = async () => {
    // Validate input
    if (mode === "url") {
      const trimmed = urlInput.trim();
      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        showToast("Enter a valid URL starting with https://");
        return;
      }
    }
    if (mode === "file" && !file) {
      showToast("Select a file first");
      return;
    }
    if (mode === "file" && file && file.size > MAX_FILE_SIZE) {
      showToast(`File too large (${(file.size / 1024 / 1024).toFixed(0)}MB). Max 500MB.`);
      return;
    }

    setSubmitting(true);

    try {
      let input = mode === "url" ? urlInput : mode === "text" ? textInput : file?.name || "";
      let audioUrl: string | undefined;

      // Upload file first if in file mode
      if (mode === "file" && file) {
        setUploadStatus("Uploading file...");
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({ error: "Upload failed" }));
          showToast(err.error || "File upload failed");
          return;
        }

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
      if (data.error) {
        showToast(data.error);
        return;
      }
      if (data.jobId) {
        window.location.href = `/dashboard/${data.jobId}`;
      }
    } catch (err) {
      showToast("Failed to connect to backend. Is the server running?");
    } finally {
      setSubmitting(false);
      setUploadStatus(null);
    }
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
      if (e.key === "Enter" && !e.shiftKey && hasInput && !submitting) {
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [hasInput, submitting, urlInput, textInput, file, mode]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <a href="/" className="flex items-center gap-3 group">
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
            className="text-lg font-bold tracking-tight text-white group-hover:text-white/80 transition-colors"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Repurpose
          </span>
        </a>
        <UserButton />
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center px-4 pt-16">
        <h1
          className="text-3xl md:text-4xl font-bold mb-2 tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <span className="text-white">Drop your content.</span>{" "}
          <span style={{ color: GOLD }}>Get everything.</span>
        </h1>
        <p className="text-white/40 text-sm mb-12">
          URL, file, or text. We handle the rest.
        </p>

        {/* Input mode tabs */}
        <div className="flex gap-3 mb-8">
          {([
            { key: "url" as InputMode, label: "URL", icon: Link },
            { key: "file" as InputMode, label: "File", icon: Upload },
            { key: "text" as InputMode, label: "Text", icon: FileText },
          ]).map(({ key, label, icon: Icon }) => (
            <GlowCard
              key={key}
              glowColor={mode === key ? "gold" : "blue"}
              customSize
              className="!aspect-auto p-0"
            >
              <button
                onClick={() => setMode(key)}
                className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                  mode === key
                    ? "text-white"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            </GlowCard>
          ))}
        </div>

        {/* Input area wrapped in GlowCard */}
        <div className="w-full max-w-2xl">
          <GlowCard
            glowColor="gold"
            customSize
            className="w-full !aspect-auto p-0"
          >
            <div className="relative z-10">
              {mode === "url" && (
                <input
                  type="url"
                  placeholder="Paste a URL... (podcast, YouTube, article)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full bg-transparent px-6 py-5 text-white text-lg placeholder:text-white/20 outline-none"
                />
              )}

              {mode === "file" && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className="p-10 flex flex-col items-center justify-center gap-4 cursor-pointer"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "audio/*,video/*,application/pdf,image/*";
                    input.onchange = (e) => {
                      const f = (e.target as HTMLInputElement).files?.[0];
                      if (f) {
                        if (f.size > MAX_FILE_SIZE) {
                          showToast(`File too large (${(f.size / 1024 / 1024).toFixed(0)}MB). Max 500MB.`);
                          return;
                        }
                        setFile(f);
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload size={32} color={dragActive ? GOLD : "#666"} />
                  {file ? (
                    <div className="text-center">
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-white/30 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(1)}MB</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-white/50 text-sm">Drag and drop, or click to browse</p>
                      <p className="text-white/20 text-xs">Audio, video, PDF, images (max 500MB)</p>
                    </>
                  )}
                </div>
              )}

              {mode === "text" && (
                <textarea
                  placeholder="Paste your text content here..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={6}
                  className="w-full bg-transparent px-6 py-5 text-white placeholder:text-white/20 outline-none resize-none"
                />
              )}
            </div>
          </GlowCard>

          {/* Detected content type badge */}
          {detectedType && (
            <div
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl w-fit"
              style={{
                background: `${detectedType.color}10`,
                border: `1px solid ${detectedType.color}25`,
                animation: "fade-up 0.3s ease-out",
              }}
            >
              <detectedType.icon size={14} color={detectedType.color} />
              <span className="text-xs font-medium" style={{ color: detectedType.color }}>
                {detectedType.label} detected
              </span>
            </div>
          )}

          {/* Optional context fields */}
          <button
            onClick={() => setShowContext(!showContext)}
            className="mt-3 text-[10px] uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
          >
            {showContext ? "Hide context" : "+ Add context (podcast name, host, guest)"}
          </button>

          <AnimatePresence>
            {showContext && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 grid grid-cols-3 gap-2 overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Podcast name"
                  value={podcastName}
                  onChange={(e) => setPodcastName(e.target.value)}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white/60 placeholder:text-white/15 outline-none focus:border-white/10"
                />
                <input
                  type="text"
                  placeholder="Host name"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white/60 placeholder:text-white/15 outline-none focus:border-white/10"
                />
                <input
                  type="text"
                  placeholder="Guest name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white/60 placeholder:text-white/15 outline-none focus:border-white/10"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Keyboard hint */}
          {hasInput && (
            <p className="text-white/15 text-xs mt-2 text-center" style={{ animation: "fade-up 0.4s ease-out" }}>
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/30 font-mono text-[10px]">Enter</kbd> to submit
            </p>
          )}

          {/* Submit button */}
          <ParticleButton
            visible={!!hasInput}
            onClick={handleSubmit}
            disabled={!hasInput || submitting}
            label={submitting ? (uploadStatus || "Processing...") : "Repurpose It  \u2192"}
          />
        </div>

        {/* Recent Jobs */}
        {recentJobs.length > 0 && (
          <div className="w-full max-w-2xl mt-16 mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={12} className="text-white/25" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">Recent</span>
            </div>
            <div className="space-y-1.5">
              {recentJobs.slice(0, 8).map((job) => (
                <a
                  key={job.jobId}
                  href={`/dashboard/${job.jobId}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl group transition-all hover:scale-[1.005]"
                  style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: job.status === "done" ? `${GOLD}15` : job.status === "error" ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)",
                    }}
                  >
                    {job.status === "done" ? <Check size={10} color={GOLD} />
                      : job.status === "error" ? <span className="text-red-400 text-[9px]">!</span>
                      : job.status === "processing" ? <Loader2 size={10} className="animate-spin text-white/40" />
                      : <Clock size={10} className="text-white/20" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white/70 truncate">
                      {job.title || `Job ${job.jobId.substring(0, 8)}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-white/25 font-mono">{job.jobId.substring(0, 8)}</span>
                      {job.createdAt && <span className="text-[9px] text-white/20">{timeAgo(job.createdAt)}</span>}
                    </div>
                  </div>

                  {job.status === "processing" && (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${job.progress}%`, background: `linear-gradient(90deg, ${GOLD}, #F0B429)` }} />
                      </div>
                      <span className="text-[9px] font-mono" style={{ color: GOLD }}>{job.progress}%</span>
                    </div>
                  )}

                  {job.status === "done" && (
                    <span className="text-[9px] text-white/20">{job.completedSteps}/{job.totalSteps} steps</span>
                  )}

                  <ArrowRight size={12} className="text-white/10 group-hover:text-white/30 transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
