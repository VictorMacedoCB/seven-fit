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
export function RestTimerBadge({ timer }) {
  const {
    duration, secondsLeft, running, expanded, exName,
    setExpanded, play, pause, adjust, resetToDuration, selectPreset, isDone,
  } = timer;

  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");
  const pct = duration > 0 ? Math.max(0, Math.min(100, (secondsLeft / duration) * 100)) : 0;

  return (
    <div style={{ position: "absolute", top: "14px", right: "16px", zIndex: 20 }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? "Fechar cronômetro de descanso" : "Abrir cronômetro de descanso"}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "6px 11px", borderRadius: "999px",
          border: `1px solid ${running ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.14)"}`,
          background: "rgba(10,10,16,0.55)",
          backdropFilter: "blur(6px)",
          cursor: "pointer",
        }}
      >
        <Timer size={13} style={{ color: running ? "#f97316" : "rgba(255,255,255,0.55)" }} />
        <span className="syne" style={{ fontSize: 13, fontWeight: 800, color: running ? "#fff" : "rgba(255,255,255,0.6)", fontVariantNumeric: "tabular-nums" }}>
          {mm}:{ss}
        </span>
      </button>

      {expanded && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            width: "min(88vw, 300px)",
            background: "linear-gradient(135deg, rgba(20,20,28,0.98) 0%, rgba(10,10,16,0.99) 100%)",
            border: `1px solid ${isDone ? "rgba(16,185,129,0.5)" : "rgba(249,115,22,0.4)"}`,
            borderRadius: 16,
            padding: "12px 14px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.55)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {isDone ? "Descanso concluído!" : running ? `Descansando${exName ? " · " + exName : ""}` : "Cronômetro de descanso"}
            </span>
            <button onClick={() => setExpanded(false)} title="Fechar (continua rodando se estiver ativo)"
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 2 }}>
              <X size={14} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="syne" style={{ fontSize: 24, fontWeight: 800, color: isDone ? "#10b981" : "#fff", minWidth: 62, fontVariantNumeric: "tabular-nums" }}>
              {mm}:{ss}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 5, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 7 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: isDone ? "#10b981" : "#f97316", transition: "width 1s linear" }} />
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                <button onClick={() => adjust(-15)} style={btnStyle()} title="-15s"><Minus size={12} /></button>
                <button
                  onClick={() => { secondsLeft === 0 ? resetToDuration() : (running ? pause() : play()); }}
                  style={{ ...btnStyle(), flex: 1, background: "#f97316", color: "#fff" }}
                >
                  {secondsLeft === 0 ? "Reiniciar" : running ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <button onClick={() => adjust(15)} style={btnStyle()} title="+15s"><Plus size={12} /></button>
                <button onClick={resetToDuration} style={btnStyle()} title="Reiniciar"><RotateCcw size={12} /></button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 5, marginTop: 9 }}>
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => selectPreset(p)}
                style={{
                  flex: 1, padding: "5px 0", borderRadius: 7,
                  border: "1px solid " + (duration === p ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.08)"),
                  background: duration === p ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)",
                  color: duration === p ? "#f97316" : "rgba(255,255,255,0.5)",
                  fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {p}s
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function btnStyle() {
  return {
    height: 28, minWidth: 28, borderRadius: 7,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
  };
}

// Hook auxiliar: expõe um "trigger" incremental para disparar o reset do timer a cada série nova
export function useRestTimerTrigger() {
  const [signal, setSignal] = useState(0);
  const fire = useCallback(() => setSignal((s) => s + 1), []);
  return [signal, fire];
}
