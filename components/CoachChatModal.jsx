"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Trash2 } from "lucide-react";
import { loadProfile, saveProfile, loadProfileFromCloud, mergeProfileHints } from "@/lib/coachProfile";

const LS_HISTORY = "hdos_chat_history";

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS_HISTORY)) || []; } catch { return []; }
}

// Logo do bigode inline pequena
function MiniMustache() {
  return (
    <svg width="20" height="13" viewBox="0 0 100 62" fill="none">
      <ellipse cx="50" cy="42" rx="44" ry="14" fill="#f97316" opacity="0.15"/>
      <path d="M50 26 C44 20,33 18,22 22 C14 25,10 33,11 39 C12 43,17 45,23 43 C31 40,41 32,47 28 Z" fill="#f1e8d8"/>
      <path d="M50 28 C44 31,35 36,27 43 C19 49,11 50,11 41 C10 34,15 28,22 24 C30 20,42 18,49 26 Z" fill="#e2cba8"/>
      <path d="M50 26 C56 20,67 18,78 22 C86 25,90 33,89 39 C88 43,83 45,77 43 C69 40,59 32,53 28 Z" fill="#f1e8d8"/>
      <path d="M50 28 C56 31,65 36,73 43 C81 49,89 50,89 41 C90 34,85 28,78 24 C70 20,58 18,51 26 Z" fill="#e2cba8"/>
      <path d="M11 40 C9 44,7 51,8 56 C9 59,12 60,14 58 C16 56,16 49,15 44 Z" fill="#f1e8d8"/>
      <path d="M89 40 C91 44,93 51,92 56 C91 59,88 60,86 58 C84 56,84 49,85 44 Z" fill="#f1e8d8"/>
    </svg>
  );
}

export default function CoachChatModal({ isOpen, onClose, workoutLogs = [] }) {
  const [messages, setMessages] = useState([]);
  const [profile, setProfile] = useState({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages(loadHistory());
      // Carrega perfil do Supabase (ou localStorage como fallback)
      loadProfileFromCloud().then(p => setProfile(p));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleBackdrop = useCallback(e => { if (e.target === e.currentTarget) onClose(); }, [onClose]);
  useEffect(() => {
    if (!isOpen) return;
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [isOpen, onClose]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    localStorage.setItem(LS_HISTORY, JSON.stringify(updated.slice(-30)));
    setInput("");
    setLoading(true);
    try {
      const groqKey = (typeof window !== "undefined" && localStorage.getItem("hdos_groq_key")) || "";
      const res = await fetch("/api/coach-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(groqKey ? { "x-groq-key": groqKey } : {}),
        },
        body: JSON.stringify({
          message: text,
          history: updated.slice(-8),
          userProfile: profile,
          workoutLogs: workoutLogs.slice(-20), // últimas 20 sessões
          profileSummary: profile.summary || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");
      const assistantMsg = { role: "assistant", content: data.reply, sources: data.sources };
      const final = [...updated, assistantMsg];
      setMessages(final);
      localStorage.setItem(LS_HISTORY, JSON.stringify(final.slice(-30)));
      // Mescla hints detectados nas mensagens
      if (data.profileUpdates && Object.keys(data.profileUpdates).length) {
        const merged = await mergeProfileHints(data.profileUpdates);
        if (merged) setProfile(merged);
      }
      // Salva resumo periódico gerado pela IA
      if (data.profileSummaryUpdate) {
        const withSummary = { ...profile, summary: data.profileSummaryUpdate };
        await saveProfile(withSummary);
        setProfile(withSummary);
      }
    } catch (err) {
      const errMsg = { role: "assistant", content: `⚠️ ${err.message}` };
      const final = [...updated, errMsg];
      setMessages(final);
      localStorage.setItem(LS_HISTORY, JSON.stringify(final.slice(-30)));
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(LS_HISTORY);
  };

  if (!isOpen) return null;

  return (
    <div onClick={handleBackdrop} style={{
      position: "fixed", inset: 0, zIndex: 700,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(7px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        width: "100%", maxWidth: 460,
        background: "linear-gradient(170deg,#15151f 0%,#0c0c14 100%)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 24, overflow: "hidden",
        height: "88dvh", display: "flex", flexDirection: "column",
      }}>

        {/* ── Header ───────────────────────────────────────────── */}
        <div style={{
          padding: "14px 16px 12px", flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MiniMustache />
            </div>
            <div>
              <div className="syne" style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.1 }}>
                <span style={{ color: "#fff" }}>HeavyDuty</span>
                <span style={{ color: "#f97316" }}> Coach</span>
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
                Powered by Groq · Llama 3.3 70B
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {messages.length > 0 && (
              <button onClick={clearChat} style={{
                background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 9,
                width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.4)",
              }}>
                <Trash2 size={13} />
              </button>
            )}
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 9,
              width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "rgba(255,255,255,0.7)",
            }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Mensagens ────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "20px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MiniMustache />
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="syne" style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>HeavyDuty Coach</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, maxWidth: 260 }}>
                  Seu coach de IA baseado no método Heavy Duty de Mike Mentzer. Pergunte sobre treino, dieta, técnica ou planejamento.
                </div>
              </div>
              {[
                "Como aplicar o Heavy Duty na prática?",
                "Quanto de proteína no cutting?",
                "Me explica como fazer supino corretamente",
              ].map((q, i) => (
                <button key={i} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 12, padding: "10px 14px", cursor: "pointer",
                    fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans',sans-serif",
                    width: "100%", textAlign: "left",
                  }}>
                  {q} →
                </button>
              ))}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
              {msg.role === "assistant" && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, marginLeft: 2 }}>
                  <MiniMustache />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#f97316" }}>HeavyDuty Coach</span>
                </div>
              )}
              <div style={{
                maxWidth: "88%",
                padding: msg.role === "user" ? "10px 14px" : "12px 14px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                background: msg.role === "user"
                  ? "linear-gradient(135deg,#f97316,#fb923c)"
                  : "rgba(255,255,255,0.07)",
                border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.09)" : "none",
                fontSize: 13, lineHeight: 1.6,
                color: msg.role === "user" ? "#fff" : "rgba(255,255,255,0.9)",
              }}>
                {msg.content}
              </div>
              {msg.sources?.length > 0 && (
                <div style={{ marginTop: 4, marginLeft: 2, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {msg.sources.map((s, j) => (
                    <span key={j} style={{
                      fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
                      background: "rgba(249,115,22,0.12)", color: "#f97316",
                      border: "1px solid rgba(249,115,22,0.2)",
                    }}>
                      📚 {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <MiniMustache />
              <div style={{ display: "flex", gap: 4, padding: "10px 14px", background: "rgba(255,255,255,0.07)", borderRadius: "4px 18px 18px 18px", border: "1px solid rgba(255,255,255,0.09)" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%", background: "#f97316",
                    animation: `bounce 1.2s ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input ────────────────────────────────────────────── */}
        <div style={{
          padding: "10px 14px 14px", flexShrink: 0,
          borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex", gap: 8, alignItems: "flex-end",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Pergunte sobre treino, dieta, técnica..."
            rows={1}
            style={{
              flex: 1, resize: "none", fontSize: 13, padding: "10px 14px",
              borderRadius: 14, lineHeight: 1.5, maxHeight: 100, overflowY: "auto",
            }}
          />
          <button onClick={send} disabled={!input.trim() || loading}
            style={{
              width: 40, height: 40, borderRadius: 12, border: "none", cursor: "pointer",
              background: input.trim() && !loading ? "#f97316" : "rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.15s",
            }}>
            <Send size={16} style={{ color: input.trim() && !loading ? "#fff" : "rgba(255,255,255,0.3)" }} />
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}` }} />
    </div>
  );
}
