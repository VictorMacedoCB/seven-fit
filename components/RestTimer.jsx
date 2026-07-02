"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Pause, Play, RotateCcw, Plus, Minus, X } from "lucide-react";

const PRESETS = [60, 90, 120, 180];
const DEFAULT_DURATION_KEY = "co_restTimer_defaultDuration";

// Toca um beep simples via WebAudio quando o descanso termina (sem depender de arquivos externos)
function playBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    [0, 0.18, 0.36].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = i === 2 ? 1046 : 880;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.18);
    });
    setTimeout(() => ctx.close && ctx.close(), 700);
  } catch (e) { /* ambientes sem suporte a áudio: ignora */ }
}

/**
 * Cronômetro de descanso entre séries.
 * - Fica fixo na parte inferior da tela quando ativo.
 * - Pode ser iniciado automaticamente (prop `autoStartSignal` muda a cada série registrada).
 * - Lembra a última duração escolhida pelo usuário (localStorage).
 */
export default function RestTimer({ autoStartSignal, exerciseName }) {
  const [duration, setDuration] = useState(90);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef(null);
  const hasFiredRef = useRef(false);

  // Carrega duração padrão salva
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(DEFAULT_DURATION_KEY);
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDuration(parseInt(saved, 10) || 90);
    }
  }, []);

  const persistDuration = (val) => {
    setDuration(val);
    if (typeof window !== "undefined") localStorage.setItem(DEFAULT_DURATION_KEY, String(val));
  };

  const start = useCallback((secs) => {
    hasFiredRef.current = false;
    setSecondsLeft(secs);
    setRunning(true);
    setVisible(true);
  }, []);

  // Dispara automaticamente toda vez que uma nova série é registrada
  useEffect(() => {
    if (autoStartSignal === undefined || autoStartSignal === null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    start(duration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartSignal]);

  // Tick do cronômetro
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          if (!hasFiredRef.current) {
            hasFiredRef.current = true;
            playBeep();
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  if (!visible) return null;

  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");
  const pct = duration > 0 ? Math.max(0, Math.min(100, (secondsLeft / duration) * 100)) : 0;
  const isDone = secondsLeft === 0;

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "84px",
        zIndex: 700,
        width: "min(92vw, 380px)",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, rgba(20,20,28,0.97) 0%, rgba(10,10,16,0.98) 100%)",
          border: `1px solid ${isDone ? "rgba(16,185,129,0.5)" : "rgba(249,115,22,0.4)"}`,
          borderRadius: 18,
          padding: "12px 14px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <Timer size={14} style={{ color: isDone ? "#10b981" : "#f97316", flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {isDone ? "Descanso concluído!" : `Descansando${exerciseName ? " · " + exerciseName : ""}`}
            </span>
          </div>
          <button onClick={() => { setVisible(false); setRunning(false); clearInterval(intervalRef.current); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 2 }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            className="syne"
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: isDone ? "#10b981" : "#fff",
              minWidth: 74,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {mm}:{ss}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: isDone ? "#10b981" : "#f97316", transition: "width 1s linear" }} />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setSecondsLeft((s) => Math.max(0, s - 15))}
                style={btnStyle()} title="-15s"><Minus size={13} /></button>
              <button
                onClick={() => {
                  if (secondsLeft === 0) { start(duration); return; }
                  setRunning((r) => !r);
                }}
                style={{ ...btnStyle(), flex: 1, background: "#f97316", color: "#fff" }}
              >
                {secondsLeft === 0 ? "Reiniciar" : running ? <Pause size={13} /> : <Play size={13} />}
              </button>
              <button onClick={() => setSecondsLeft((s) => s + 15)}
                style={btnStyle()} title="+15s"><Plus size={13} /></button>
              <button onClick={() => { setRunning(false); setSecondsLeft(duration); }}
                style={btnStyle()} title="Reiniciar"><RotateCcw size={13} /></button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => { persistDuration(p); start(p); }}
              style={{
                flex: 1,
                padding: "5px 0",
                borderRadius: 8,
                border: "1px solid " + (duration === p ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.08)"),
                background: duration === p ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)",
                color: duration === p ? "#f97316" : "rgba(255,255,255,0.5)",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {p}s
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function btnStyle() {
  return {
    height: 30,
    minWidth: 30,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
}

// Hook auxiliar: expõe um "trigger" incremental para disparar o timer a cada série nova
export function useRestTimerTrigger() {
  const [signal, setSignal] = useState(0);
  const fire = useCallback(() => setSignal((s) => s + 1), []);
  return [signal, fire];
}
