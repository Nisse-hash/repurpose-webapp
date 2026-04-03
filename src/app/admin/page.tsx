"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Zap, BarChart3, ChevronDown, Plus, Save,
  Clock, ArrowLeft, RefreshCw, AlertCircle,
} from "lucide-react";
import Link from "next/link";

const GOLD = "#C9A84C";
const GOLD_BRIGHT = "#F0B429";
const CARD_BG = "#13131A";
const BORDER = "rgba(255,255,255,0.06)";

const API = process.env.NEXT_PUBLIC_BACKEND_URL;
const ADMIN_KEY = "rprs_admin_k7x9m2p4q1w8"; // Should be in env var for production

interface Client {
  id: string;
  clerk_id: string;
  email: string;
  name: string;
  plan: string;
  credits_used: number;
  credits_limit: number;
  created_at: string;
  jobs?: { count: number }[];
}

interface Stats {
  totalClients: number;
  totalJobs: number;
  activeJobs: number;
  recentJobs: { id: string; title: string; status: string; created_at: string }[];
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

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color: GOLD }}>{value}</p>
    </div>
  );
}

export default function AdminPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editCredits, setEditCredits] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");

  const headers = { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY };

  async function fetchData() {
    setLoading(true);
    try {
      const [clientsRes, statsRes] = await Promise.all([
        fetch(`${API}/admin/clients`, { headers }),
        fetch(`${API}/admin/stats`, { headers }),
      ]);
      const clientsData = await clientsRes.json();
      const statsData = await statsRes.json();
      setClients(clientsData.clients || []);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function updateClient() {
    if (!selectedClient) return;
    await fetch(`${API}/admin/clients/${selectedClient.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ plan: editPlan, credits_limit: editCredits }),
    });
    fetchData();
    setSelectedClient(null);
  }

  async function createClient() {
    if (!newEmail) return;
    await fetch(`${API}/admin/clients`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email: newEmail, name: newName || newEmail }),
    });
    setShowCreate(false);
    setNewEmail("");
    setNewName("");
    fetchData();
  }

  return (
    <div className="min-h-screen p-6" style={{ background: "#0a0a0f" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft size={16} className="text-white/40" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white/90" style={{ fontFamily: "var(--font-heading)" }}>Admin Panel</h1>
            <p className="text-[10px] text-white/25">Manage clients, credits, and pipeline</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <RefreshCw size={14} className={`text-white/30 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total Clients" value={stats.totalClients || 0} icon={<Users size={14} color={GOLD} />} />
          <StatCard label="Total Jobs" value={stats.totalJobs || 0} icon={<Zap size={14} color={GOLD} />} />
          <StatCard label="Active Jobs" value={stats.activeJobs || 0} icon={<BarChart3 size={14} color="#1DB954" />} />
          <StatCard label="Recent" value={stats.recentJobs?.length || 0} icon={<Clock size={14} color="#F59E0B" />} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white/60">Clients</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium"
          style={{ background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}25` }}
        >
          <Plus size={10} /> Add Client
        </button>
      </div>

      {/* Create Client Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 rounded-xl" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-white/30 uppercase tracking-wider">Email</label>
                  <input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-white/[0.04] border text-xs text-white/80 outline-none focus:border-amber-500/30"
                    style={{ borderColor: BORDER }}
                    placeholder="client@example.com"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-white/30 uppercase tracking-wider">Name</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-white/[0.04] border text-xs text-white/80 outline-none focus:border-amber-500/30"
                    style={{ borderColor: BORDER }}
                    placeholder="Client Name"
                  />
                </div>
              </div>
              <button
                onClick={createClient}
                className="mt-3 px-4 py-2 rounded-lg text-[10px] font-semibold"
                style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, color: "#0a0a0f" }}
              >
                Create Client
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clients Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="grid grid-cols-6 gap-2 px-4 py-2 text-[9px] text-white/25 uppercase tracking-wider border-b" style={{ borderColor: BORDER }}>
          <span>Name</span>
          <span>Email</span>
          <span>Plan</span>
          <span>Credits</span>
          <span>Jobs</span>
          <span>Joined</span>
        </div>

        {clients.map((client) => (
          <div
            key={client.id}
            onClick={() => {
              setSelectedClient(client);
              setEditPlan(client.plan);
              setEditCredits(client.credits_limit);
            }}
            className="grid grid-cols-6 gap-2 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors border-b"
            style={{ borderColor: BORDER }}
          >
            <span className="text-xs text-white/70 truncate">{client.name || "Unnamed"}</span>
            <span className="text-[10px] text-white/40 truncate">{client.email}</span>
            <span className="text-[10px]">
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium"
                style={{
                  background: client.plan === "pro" ? `${GOLD}15` : "rgba(255,255,255,0.04)",
                  color: client.plan === "pro" ? GOLD : "rgba(255,255,255,0.4)",
                }}>
                {client.plan}
              </span>
            </span>
            <span className="text-[10px] text-white/40">{client.credits_used}/{client.credits_limit}</span>
            <span className="text-[10px] text-white/40">{client.jobs?.[0]?.count || 0}</span>
            <span className="text-[10px] text-white/25">{timeAgo(client.created_at)}</span>
          </div>
        ))}

        {clients.length === 0 && !loading && (
          <div className="px-4 py-8 text-center">
            <Users size={20} className="mx-auto text-white/10 mb-2" />
            <p className="text-[10px] text-white/20">No clients yet</p>
          </div>
        )}
      </div>

      {/* Edit Client Modal */}
      <AnimatePresence>
        {selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedClient(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl"
              style={{ background: "#13131A", border: `1px solid ${BORDER}` }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-bold text-white/80 mb-4">{selectedClient.name || selectedClient.email}</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] text-white/30 uppercase tracking-wider">Plan</label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-white/[0.04] border text-xs text-white/80 outline-none"
                    style={{ borderColor: BORDER }}
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-white/30 uppercase tracking-wider">Credits Limit</label>
                  <input
                    type="number"
                    value={editCredits}
                    onChange={(e) => setEditCredits(parseInt(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-white/[0.04] border text-xs text-white/80 outline-none"
                    style={{ borderColor: BORDER }}
                  />
                </div>
                <div className="text-[10px] text-white/25">
                  Credits used: {selectedClient.credits_used} / {selectedClient.credits_limit}
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={updateClient}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-semibold"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, color: "#0a0a0f" }}
                >
                  <Save size={12} /> Save Changes
                </button>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="px-4 py-2 rounded-lg text-[11px] text-white/40 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Jobs */}
      {stats?.recentJobs && stats.recentJobs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-white/60 mb-3">Recent Jobs</h2>
          <div className="rounded-xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
            {stats.recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: BORDER }}>
                <div>
                  <p className="text-xs text-white/60">{job.title || "Untitled"}</p>
                  <p className="text-[9px] text-white/20">{timeAgo(job.created_at)}</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: job.status === "done" ? "#1DB95412" : job.status === "error" ? "#EF444412" : `${GOLD}12`,
                    color: job.status === "done" ? "#1DB954" : job.status === "error" ? "#EF4444" : GOLD,
                  }}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
