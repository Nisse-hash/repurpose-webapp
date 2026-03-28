"use client";

import { useState, useCallback } from "react";
import { UserButton } from "@clerk/nextjs";
import { Upload, Link, FileText, Zap } from "lucide-react";
import { GlowCard } from "@/components/ui/spotlight-card";
import { ParticleButton } from "@/components/ui/particle-button";

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

          {/* Submit button: particles assemble into button when input is provided */}
          <ParticleButton
            visible={!!hasInput}
            onClick={handleSubmit}
            disabled={!hasInput || submitting}
            label={submitting ? "Processing..." : "Repurpose It  \u2192"}
          />
        </div>
      </main>
    </div>
  );
}
