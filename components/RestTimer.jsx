"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Pause, Play, RotateCcw, Plus, Minus, X } from "lucide-react";

const PRESETS = [60, 90, 120, 180];
const DEFAULT_DURATION_KEY = "co_restTimer_defaultDuration";
const STATE_KEY = "co_restTimer_state";

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

function loadPersisted() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function persist(data) {
  if (typeof window === "undefined") return;
  try {
    if (data) localStorage.setItem(STATE_KEY, JSON.stringify(data));
    else localStorage.removeItem(STATE_KEY);
  } catch (e) { /* noop */ }
}

/**
 * Hook com toda a lógica do cronômetro de descanso. Deve ser chamado UMA VEZ, no
 * componente raiz do app (page.js) — assim o estado (contagem, se está rodando, etc.)
 * não é perdido quando o usuário troca de aba (Treino → Dieta → Treino...), porque
 * quem muda de aba é a árvore de componentes abaixo dele, não ele mesmo.
 *
 * A contagem em si é baseada num timestamp de término (endAt), não num contador que
 * decrementa a cada tick — por isso continua certa mesmo se o navegador suspender o
 * timer em segundo plano ou o usuário sair do app e voltar depois.
 */
export function useRestTimer(autoStartSignal, exerciseName) {
  const [duration, setDuration] = useState(90);
  const [endAt, setEndAt] = useState(null);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [exName, setExName] = useState("");
  const hasFiredRef = useRef(false);
  const tickRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedDuration = parseInt(localStorage.getItem(DEFAULT_DURATION_KEY), 10) || 90;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDuration(savedDuration);
    const saved = loadPersisted();
    if (saved && saved.running && saved.endAt) {
      setEndAt(saved.endAt);
      setRunning(true);
      setExName(saved.exerciseName || "");
      hasFiredRef.current = !!saved.hasFired;
    } else {
      setSecondsLeft(savedDuration);
    }
  }, []);

  const persistDuration = (val) => {
    setDuration(val);
    if (typeof window !== "undefined") localStorage.setItem(DEFAULT_DURATION_KEY, String(val));
  };

  // Reseta para o estado PARADO na duração padrão — usado ao registrar uma nova série.
  // Não abre o painel, não inicia a contagem sozinho.
  const resetIdle = useCallback((secs, name) => {
    setRunning(false);
    setEndAt(null);
    hasFiredRef.current = false;
    setSecondsLeft(secs);
    if (name !== undefined) setExName(name || "");
    persist(null);
  }, []);

  useEffect(() => {
    if (autoStartSignal === undefined || autoStartSignal === null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetIdle(duration, exerciseName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartSignal]);

  const play = () => {
    hasFiredRef.current = false;
    const newEndAt = Date.now() + secondsLeft * 1000;
    setEndAt(newEndAt);
    setRunning(true);
    persist({ endAt: newEndAt, running: true, exerciseName: exName, hasFired: false });
  };

  const recompute = useCallback(() => {
    if (!running || !endAt) return;
    const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    setSecondsLeft(left);
    if (left === 0) {
      setRunning(false);
      if (!hasFiredRef.current) {
        hasFiredRef.current = true;
        playBeep();
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
      persist(null);
    }
  }, [endAt, running]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { recompute(); }, [recompute]);

  useEffect(() => {
    if (!running) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(recompute, 1000);
    return () => clearInterval(tickRef.current);
  }, [running, recompute]);

  // Ao voltar de segundo plano (troca de app, tela bloqueada, outra aba do navegador),
  // recalcula na hora em vez de esperar o próximo tick.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisible = () => { if (document.visibilityState === "visible") recompute(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [recompute]);

  const pause = () => {
    const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    setRunning(false);
    setSecondsLeft(left);
    persist(null);
  };

  const adjust = (deltaSecs) => {
    if (running) {
      const newEndAt = Math.max(Date.now(), endAt + deltaSecs * 1000);
      setEndAt(newEndAt);
      setSecondsLeft(Math.max(0, Math.round((newEndAt - Date.now()) / 1000)));
      persist({ endAt: newEndAt, running: true, exerciseName: exName, hasFired: hasFiredRef.current });
    } else {
      setSecondsLeft((s) => Math.max(0, s + deltaSecs));
    }
  };

  const resetToDuration = () => resetIdle(duration, exName);

  const selectPreset = (p) => { persistDuration(p); resetIdle(p, exName); };

  return {
    duration, secondsLeft, running, expanded, exName,
    setExpanded, play, pause, adjust, resetToDuration, selectPreset,
    isDone: !running && secondsLeft === 0,
  };
}

/**
 * Badge compacto + painel expansível do cronômetro. Renderizado DENTRO de um card
 * específico (ex: o quadro "Treino de Hoje") em vez de flutuar fixo na tela — antes
 * ficava sobreposto ao botão flutuante do Coach de IA, que ocupa o mesmo canto.
 * O componente pai precisa ter `position: relative` para o badge se ancorar nele.
 */
export function RestTimerBadge({ timer, inline = false }) {
  const {
    duration, secondsLeft, running, expanded,
    setExpanded,
  } = timer;

  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");

  const button = (
    <button
      onClick={() => setExpanded(true)}
      aria-label="Abrir cronômetro de descanso"
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: "6px 11px", borderRadius: "999px",
        border: `1px solid ${running ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.14)"}`,
        background: "rgba(10,10,16,0.55)",
        backdropFilter: "blur(6px)",
        cursor: "pointer", flexShrink: 0,
      }}
    >
      <Timer size={13} style={{ color: running ? "#f97316" : "rgba(255,255,255,0.55)" }} />
      <span className="syne" style={{ fontSize: 13, fontWeight: 800, color: running ? "#fff" : "rgba(255,255,255,0.6)", fontVariantNumeric: "tabular-nums" }}>
        {mm}:{ss}
      </span>
    </button>
  );

  if (inline) {
    return (
      <>
        {button}
        {expanded && <RestTimerModal timer={timer} />}
      </>
    );
  }

  return (
    <div style={{ position: "absolute", top: "14px", right: "16px", zIndex: 20 }}>
      {button}
      {expanded && <RestTimerModal timer={timer} />}
    </div>
  );
}

/**
 * Modal próprio do cronômetro de descanso: relógio grande centralizado, com o botão de
 * play/pause centralizado logo abaixo e os ajustes de -15s / +15s um de cada lado dele.
 */
function RestTimerModal({ timer }) {
  const {
    duration, secondsLeft, running, exName,
    setExpanded, play, pause, adjust, resetToDuration, selectPreset, isDone,
  } = timer;

  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");
  const pct = duration > 0 ? Math.max(0, Math.min(100, (secondsLeft / duration) * 100)) : 0;
  const size = 200, stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) setExpanded(false); }}
      style={{
        position: "fixed", inset: 0, zIndex: 900,
        background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <div style={{
        width: "100%", maxWidth: "340px",
        background: "linear-gradient(170deg,#15151f,#0c0c14)",
        border: `1px solid ${isDone ? "rgba(16,185,129,0.4)" : "rgba(249,115,22,0.35)"}`,
        borderRadius: 24,
        padding: "20px 22px 24px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
            {isDone ? "Descanso concluído!" : running ? `Descansando${exName ? " · " + exName : ""}` : "Cronômetro de descanso"}
          </span>
          <button onClick={() => setExpanded(false)} title="Fechar (continua rodando se estiver ativo)"
            style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}>
            <X size={14} />
          </button>
        </div>

        {/* Relógio centralizado */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <div style={{ position: "relative", width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
              <circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={isDone ? "#10b981" : "#f97316"} strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1s linear" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="syne" style={{ fontSize: 40, fontWeight: 800, color: isDone ? "#10b981" : "#fff", fontVariantNumeric: "tabular-nums" }}>
                {mm}:{ss}
              </span>
            </div>
          </div>
        </div>

        {/* Play/pause centralizado, com -15s / +15s dos lados */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 18 }}>
          <button onClick={() => adjust(-15)} style={sideBtnStyle()} title="-15s">
            <Minus size={16} />
            <span style={{ fontSize: 9, fontWeight: 700 }}>15s</span>
          </button>
          <button
            onClick={() => { secondsLeft === 0 ? resetToDuration() : (running ? pause() : play()); }}
            style={{
              width: 66, height: 66, borderRadius: "50%", border: "none", cursor: "pointer",
              background: isDone ? "#10b981" : "#f97316", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 6px 20px ${isDone ? "rgba(16,185,129,0.4)" : "rgba(249,115,22,0.4)"}`,
            }}
            aria-label={secondsLeft === 0 ? "Reiniciar" : running ? "Pausar" : "Iniciar"}
          >
            {secondsLeft === 0 ? <RotateCcw size={24} /> : running ? <Pause size={24} /> : <Play size={26} style={{ marginLeft: 3 }} />}
          </button>
          <button onClick={() => adjust(15)} style={sideBtnStyle()} title="+15s">
            <Plus size={16} />
            <span style={{ fontSize: 9, fontWeight: 700 }}>15s</span>
          </button>
        </div>

        {/* Presets de duração */}
        <div style={{ display: "flex", gap: 6 }}>
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => selectPreset(p)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 9,
                border: "1px solid " + (duration === p ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.08)"),
                background: duration === p ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)",
                color: duration === p ? "#f97316" : "rgba(255,255,255,0.5)",
                fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
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

function sideBtnStyle() {
  return {
    width: 44, height: 44, borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
    cursor: "pointer",
  };
}

// Hook auxiliar: expõe um "trigger" incremental para disparar o reset do timer a cada série nova
export function useRestTimerTrigger() {
  const [signal, setSignal] = useState(0);
  const fire = useCallback(() => setSignal((s) => s + 1), []);
  return [signal, fire];
}
