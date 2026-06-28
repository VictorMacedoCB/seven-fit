"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

const IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

function getCached(key) {
  try { return JSON.parse(sessionStorage.getItem("guide_" + key)); } catch { return null; }
}
function setCached(key, data) {
  try { sessionStorage.setItem("guide_" + key, JSON.stringify(data)); } catch {}
}

export default function ExerciseGuideModal({ isOpen, onClose, exerciseName }) {
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState(null);
  const [error, setError] = useState("");
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [page, setPage] = useState(0); // 0=imagem+músculos, 1=preparo, 2=execução, 3=erros

  useEffect(() => {
    if (!isOpen || !exerciseName) { setGuide(null); setError(""); setPage(0); setFrame(0); return; }
    const cached = getCached(exerciseName);
    if (cached) { setGuide(cached); return; }
    setLoading(true);
    const groqKey = (typeof window !== "undefined" && localStorage.getItem("hdos_groq_key")) || "";
    fetch(`/api/exercise-guide?name=${encodeURIComponent(exerciseName)}`, {
      headers: groqKey ? { "x-groq-key": groqKey } : {},
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) { setGuide(data.guide); setCached(exerciseName, data.guide); }
        else setError(data.error || "Erro ao carregar guia.");
      })
      .catch(() => setError("Erro de rede."))
      .finally(() => setLoading(false));
  }, [isOpen, exerciseName]);

  // Animação das imagens
  useEffect(() => {
    if (!playing || !guide?.images || guide.images.length < 2) return;
    const id = setInterval(() => setFrame(f => (f + 1) % guide.images.length), 850);
    return () => clearInterval(id);
  }, [playing, guide?.images]);

  const handleBackdrop = useCallback(e => { if (e.target === e.currentTarget) onClose(); }, [onClose]);
  useEffect(() => {
    if (!isOpen) return;
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const images = guide?.images ?? [];
  const hasImg = images.length > 0;

  const PAGES = [
    { label: "Visão Geral", icon: "👁" },
    { label: "Preparação", icon: "📐" },
    { label: "Execução",   icon: "✅" },
    { label: "Erros",      icon: "⚠️" },
  ];

  return (
    <div onClick={handleBackdrop} style={{
      position: "fixed", inset: 0, zIndex: 600,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        width: "100%", maxWidth: 460,
        background: "linear-gradient(170deg,#15151f 0%,#0c0c14 100%)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 24, overflow: "hidden",
        maxHeight: "88dvh", display: "flex", flexDirection: "column",
      }}>

        {/* ── Header compacto ────────────────────────────────── */}
        <div style={{
          padding: "14px 16px 12px", flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1 }}>
              Como Executar
            </div>
            <div className="syne" style={{ fontSize: 15, fontWeight: 800, color: "#f97316", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {exerciseName}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10,
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.7)", flexShrink: 0,
          }}>
            <X size={15} />
          </button>
        </div>

        {/* ── Navegação por abas ─────────────────────────────── */}
        <div style={{
          display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0, overflowX: "auto",
        }}>
          {PAGES.map((p, i) => (
            <button key={i} onClick={() => setPage(i)} style={{
              flex: 1, minWidth: 70, padding: "9px 4px", border: "none", cursor: "pointer",
              background: "none", fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
              color: page === i ? "#f97316" : "rgba(255,255,255,0.35)",
              borderBottom: page === i ? "2px solid #f97316" : "2px solid transparent",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              transition: "color 0.15s",
            }}>
              <span style={{ fontSize: 14 }}>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* ── Conteúdo ───────────────────────────────────────── */}
        <div style={{ overflowY: "auto", flex: 1, padding: "14px 16px 20px" }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", gap: 12 }}>
              <div style={{ width: 22, height: 22, border: "2px solid rgba(255,255,255,0.06)", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Carregando guia...</div>
            </div>
          )}

          {error && (
            <div style={{ color: "#ef4444", fontSize: 13, textAlign: "center", padding: "20px 0" }}>{error}</div>
          )}

          {!loading && !error && guide && (
            <>
              {/* Página 0: Visão Geral */}
              {page === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Imagem animada */}
                  {hasImg && (
                    <div style={{ position: "relative", background: "#0a0a12", borderRadius: 14, overflow: "hidden" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={IMAGE_BASE + images[frame]}
                        alt={exerciseName}
                        onError={e => { e.target.parentElement.style.display = "none"; }}
                        style={{ width: "100%", aspectRatio: "4/3", objectFit: "contain", display: "block", background: "#0a0a12", padding: 8 }}
                      />
                      {images.length > 1 && (
                        <div style={{
                          position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
                          display: "flex", alignItems: "center", gap: 6,
                          background: "rgba(0,0,0,0.6)", borderRadius: 20, padding: "4px 10px",
                        }}>
                          <button onClick={() => { setPlaying(false); setFrame(f => (f - 1 + images.length) % images.length); }}
                            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: 1 }}>
                            <ChevronLeft size={13} />
                          </button>
                          {images.map((_, i) => (
                            <div key={i} onClick={() => { setPlaying(false); setFrame(i); }} style={{
                              width: frame === i ? 14 : 5, height: 5, borderRadius: 3, cursor: "pointer",
                              background: frame === i ? "#f97316" : "rgba(255,255,255,0.3)", transition: "all 0.2s",
                            }} />
                          ))}
                          <button onClick={() => { setPlaying(false); setFrame(f => (f + 1) % images.length); }}
                            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: 1 }}>
                            <ChevronRight size={13} />
                          </button>
                          <button onClick={() => setPlaying(p => !p)} style={{
                            background: "rgba(249,115,22,0.85)", border: "none", borderRadius: 5,
                            color: "#fff", fontSize: 9, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
                            padding: "2px 7px", cursor: "pointer",
                          }}>{playing ? "⏸" : "▶"}</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Músculos */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 12, padding: "10px 12px" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: .6, marginBottom: 4 }}>Principal</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{guide.musclePrimary}</div>
                    </div>
                    {guide.muscleSecondary && (
                      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 12px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: .6, marginBottom: 4 }}>Auxiliares</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>{guide.muscleSecondary}</div>
                      </div>
                    )}
                  </div>

                  {/* Dica rápida */}
                  {guide.proTip && (
                    <div style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.18)", borderRadius: 12, padding: "10px 12px" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: .6, marginBottom: 4 }}>⭐ Dica de Ouro</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.55, fontStyle: "italic" }}>
                        {`"${guide.proTip}"`}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                    <button onClick={() => setPage(1)} className="btn btn-primary" style={{ flex: 1, fontSize: 12, padding: "10px 6px", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      📐 Ver Preparação
                    </button>
                    <button onClick={() => setPage(2)} className="btn btn-ghost" style={{ flex: 1, fontSize: 12, padding: "10px 6px", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      ✅ Ver Execução
                    </button>
                  </div>
                </div>
              )}

              {/* Página 1: Preparação */}
              {page === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: .7, marginBottom: 4 }}>
                    Posicionamento e Preparação
                  </div>
                  {(guide.setup ?? []).map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 6, background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", lineHeight: 1.55 }}>{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Página 2: Execução */}
              {page === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: .7, marginBottom: 4 }}>
                    Execução do Movimento
                  </div>
                  {(guide.execution ?? guide.instructions ?? []).map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: "rgba(16,185,129,0.04)", borderRadius: 12, border: "1px solid rgba(16,185,129,0.12)" }}>
                      <span style={{ flexShrink: 0, fontSize: 12, color: "#10b981", fontWeight: 800, paddingTop: 2 }}>✓</span>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", lineHeight: 1.55 }}>{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Página 3: Erros */}
              {page === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: .7, marginBottom: 4 }}>
                    ⚠️ Erros Comuns a Evitar
                  </div>
                  {(guide.mistakes ?? []).map((m, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: "rgba(239,68,68,0.05)", borderRadius: 12, border: "1px solid rgba(239,68,68,0.15)" }}>
                      <X size={13} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", lineHeight: 1.55 }}>{m}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  );
}
