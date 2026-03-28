"use client";

import { useState, useCallback } from "react";
import { UserButton } from "@clerk/nextjs";
import { Upload, Link, FileText, Sparkles, ArrowRight } from "lucide-react";

const GOLD = "#C9A84C";

type InputMode = "url" | "file" | "text";

export default function DashboardPage() {
  const [mode, setMode] = useState<InputMode>("url");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
      setMode("file");
    }
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    const input = mode === "url" ? urlInput : mode === "text" ? textInput : file?.name || "";

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "auto",
          input,
          config: { platforms: ["linkedin", "instagram", "x", "facebook", "tiktok", "youtube", "pinterest", "threads", "bluesky"] },
        }),
      });
      const data = await res.json();
      if (data.jobId) {
        window.location.href = `/dashboard/${data.jobId}`;
      }
    } catch (err) {
      console.error("Failed to submit job:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const hasInput = mode === "url" ? urlInput.trim() : mode === "file" ? !!file : textInput.trim();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Sparkles size={24} color={GOLD} />
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Repurpose
          </span>
        </div>
        <UserButton />
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center px-4 pt-20">
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
        <div className="flex gap-1 p-1 rounded-2xl bg-[#13131a] border border-white/5 mb-8">
          {([
            { key: "url" as InputMode, label: "URL", icon: Link },
            { key: "file" as InputMode, label: "File", icon: Upload },
            { key: "text" as InputMode, label: "Text", icon: FileText },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                mode === key
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="w-full max-w-2xl">
          {mode === "url" && (
            <div
              className="rounded-2xl border p-1 transition-all"
              style={{
                background: "radial-gradient(circle at 40% 30%, #1e1e2a, #13131a)",
                borderColor: urlInput ? `${GOLD}40` : "rgba(255,255,255,0.05)",
                boxShadow: urlInput ? `0 0 20px ${GOLD}10` : "none",
              }}
            >
              <input
                type="url"
                placeholder="Paste a URL... (podcast, YouTube, article)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-transparent px-6 py-4 text-white text-lg placeholder:text-white/20 outline-none"
              />
            </div>
          )}

          {mode === "file" && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className="rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer"
              style={{
                background: dragActive
                  ? `radial-gradient(circle, ${GOLD}08, #13131a)`
                  : "radial-gradient(circle at 40% 30%, #1e1e2a, #13131a)",
                borderColor: dragActive ? `${GOLD}60` : file ? `${GOLD}40` : "rgba(255,255,255,0.1)",
              }}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.onchange = (e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) setFile(f);
                };
                input.click();
              }}
            >
              <Upload size={32} color={dragActive ? GOLD : "#666"} />
              {file ? (
                <p className="text-white font-medium">{file.name}</p>
              ) : (
                <>
                  <p className="text-white/50 text-sm">Drag and drop, or click to browse</p>
                  <p className="text-white/20 text-xs">Audio, video, PDF, images</p>
                </>
              )}
            </div>
          )}

          {mode === "text" && (
            <div
              className="rounded-2xl border transition-all"
              style={{
                background: "radial-gradient(circle at 40% 30%, #1e1e2a, #13131a)",
                borderColor: textInput ? `${GOLD}40` : "rgba(255,255,255,0.05)",
              }}
            >
              <textarea
                placeholder="Paste your text content here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={6}
                className="w-full bg-transparent px-6 py-4 text-white placeholder:text-white/20 outline-none resize-none"
              />
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!hasInput || submitting}
            className="w-full mt-6 py-4 rounded-2xl text-lg font-bold tracking-wide transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: hasInput
                ? `linear-gradient(135deg, ${GOLD}, #F0B429)`
                : "#1e1e2a",
              color: hasInput ? "#0a0a0f" : "#666",
              boxShadow: hasInput ? `0 0 30px ${GOLD}30` : "none",
            }}
          >
            {submitting ? "Processing..." : "Repurpose It"}
            {!submitting && hasInput && <ArrowRight className="inline ml-2" size={20} />}
          </button>
        </div>
      </main>
    </div>
  );
}
