"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Palette, Check, Loader2, ArrowLeft, X, Plus, Trash2, Image } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const GOLD = "#C9A84C";
const GOLD_BRIGHT = "#F0B429";
const CARD_BG = "#13131A";
const BORDER = "rgba(255,255,255,0.06)";

interface BrandingData {
  colors: string[];
  logoUrl: string;
  brandName: string;
}

export default function SettingsPage() {
  const user = { id: "default" };
  const [branding, setBranding] = useState<BrandingData>({ colors: [], logoUrl: "", brandName: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newColor, setNewColor] = useState("#C9A84C");
  const fileRef = useRef<HTMLInputElement>(null);

  // Load branding on mount
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/branding/${user.id}`)
      .then(r => r.ok ? r.json() : { colors: [], logoUrl: "", brandName: "" })
      .then(data => setBranding(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const saveBranding = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/branding/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      });
      if (res.ok) {
        const data = await res.json();
        setBranding(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {}
    setSaving(false);
  };

  const uploadLogo = async (file: File) => {
    if (!user?.id) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/branding/${user.id}/logo`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setBranding(prev => ({
          ...prev,
          logoUrl: data.logoUrl,
          colors: data.extractedColors?.length > 0 ? data.extractedColors : prev.colors,
        }));
      }
    } catch {}
    setUploading(false);
  };

  const addColor = () => {
    if (branding.colors.length >= 8) return;
    if (!branding.colors.includes(newColor)) {
      setBranding(prev => ({ ...prev, colors: [...prev.colors, newColor] }));
    }
  };

  const removeColor = (index: number) => {
    setBranding(prev => ({ ...prev, colors: prev.colors.filter((_, i) => i !== index) }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-white/30 hover:text-white/60 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-sm font-semibold tracking-wide">Settings</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin text-white/20" />
          </div>
        ) : (
          <div className="space-y-10">
            {/* Brand Name */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-4" style={{ color: GOLD }}>
                Brand Name
              </h2>
              <input
                type="text"
                value={branding.brandName}
                onChange={e => setBranding(prev => ({ ...prev, brandName: e.target.value }))}
                placeholder="Your brand or podcast name"
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/15 outline-none focus:border-white/10 transition-colors"
              />
            </section>

            {/* Logo Upload */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-4" style={{ color: GOLD }}>
                Logo
              </h2>
              <p className="text-[10px] text-white/25 mb-3">Upload a logo to auto-extract brand colors. Colors propagate to posts, visuals, and videos.</p>
              <div className="flex items-start gap-4">
                {branding.logoUrl ? (
                  <div className="relative group">
                    <img
                      src={branding.logoUrl}
                      alt="Brand logo"
                      className="w-24 h-24 rounded-xl object-cover border border-white/10"
                    />
                    <button
                      onClick={() => setBranding(prev => ({ ...prev, logoUrl: "" }))}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-white/20 transition-colors"
                  >
                    {uploading ? (
                      <Loader2 size={16} className="animate-spin text-white/20" />
                    ) : (
                      <>
                        <Image size={16} className="text-white/15" />
                        <span className="text-[9px] text-white/20">Upload</span>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) uploadLogo(f);
                    e.target.value = "";
                  }}
                />
                {branding.logoUrl && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-[10px] px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-colors"
                  >
                    {uploading ? "Uploading..." : "Replace"}
                  </button>
                )}
              </div>
            </section>

            {/* Brand Colors */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-4" style={{ color: GOLD }}>
                Brand Colors
              </h2>
              <p className="text-[10px] text-white/25 mb-3">
                {branding.colors.length > 0 ? "These colors will be used in your social posts, Gamma visuals, Canva designs, and Remotion videos." : "Add colors manually or upload a logo to extract them automatically."}
              </p>

              {/* Color swatches */}
              <div className="flex flex-wrap gap-2 mb-4">
                {branding.colors.map((color, i) => (
                  <div key={i} className="group relative">
                    <div
                      className="w-12 h-12 rounded-lg border border-white/10 cursor-pointer transition-transform hover:scale-105"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <button
                      onClick={() => removeColor(i)}
                      className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-red-500/30 border border-red-500/40 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={8} />
                    </button>
                    <span className="block text-center text-[8px] text-white/25 mt-1 font-mono">{color}</span>
                  </div>
                ))}

                {branding.colors.length < 8 && (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={newColor}
                        onChange={e => setNewColor(e.target.value)}
                        className="w-12 h-12 rounded-lg cursor-pointer border border-white/10 bg-transparent"
                        style={{ padding: 2 }}
                      />
                    </div>
                    <button
                      onClick={addColor}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors hover:bg-white/5"
                      style={{ color: GOLD, border: `1px solid ${GOLD}30` }}
                    >
                      <Plus size={10} /> Add
                    </button>
                  </div>
                )}
              </div>

              {/* Preset palettes */}
              <div className="mt-4">
                <span className="text-[9px] text-white/20 uppercase tracking-wider">Quick presets</span>
                <div className="flex gap-3 mt-2">
                  {[
                    { name: "Gold", colors: ["#C9A84C", "#F0B429", "#1A1A2E", "#FFFFFF", "#999999"] },
                    { name: "Ocean", colors: ["#0EA5E9", "#06B6D4", "#0F172A", "#FFFFFF", "#94A3B8"] },
                    { name: "Coral", colors: ["#E8614A", "#F59E0B", "#18120F", "#F5E6D3", "#9C8070"] },
                    { name: "Forest", colors: ["#22C55E", "#10B981", "#0A1A0F", "#FFFFFF", "#6B7280"] },
                  ].map(preset => (
                    <button
                      key={preset.name}
                      onClick={() => setBranding(prev => ({ ...prev, colors: preset.colors }))}
                      className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex gap-0.5">
                        {preset.colors.slice(0, 3).map((c, i) => (
                          <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <span className="text-[8px] text-white/25">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Preview */}
            {branding.colors.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-4" style={{ color: GOLD }}>
                  Preview
                </h2>
                <div
                  className="rounded-xl p-6 border border-white/5"
                  style={{ background: branding.colors[2] || CARD_BG }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {branding.logoUrl && (
                      <img src={branding.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    )}
                    <span className="text-sm font-bold" style={{ color: branding.colors[3] || "#FFFFFF" }}>
                      {branding.brandName || "Your Brand"}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: branding.colors[4] || "#999999" }}>
                    Your social posts and visuals will use these colors.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <div
                      className="px-3 py-1.5 rounded-lg text-[10px] font-medium"
                      style={{ backgroundColor: branding.colors[0], color: branding.colors[2] || "#000" }}
                    >
                      Primary Action
                    </div>
                    <div
                      className="px-3 py-1.5 rounded-lg text-[10px] font-medium border"
                      style={{ borderColor: branding.colors[1], color: branding.colors[1] }}
                    >
                      Secondary
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Save Button */}
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={saveBranding}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`,
                  color: "#000",
                }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Palette size={14} />}
                {saving ? "Saving..." : saved ? "Saved!" : "Save Branding"}
              </button>
              <AnimatePresence>
                {saved && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] text-green-400/60"
                  >
                    Colors will apply to your next pipeline run
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
