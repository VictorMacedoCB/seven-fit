"use client";

import React, { useState } from "react";
import { Scale, Flame, Calendar, Dumbbell } from "lucide-react";

// Reusable MacroRing Component
function MacroRing({ val, max, color, size, stroke, label }) {
  const isFree = !isFinite(max);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = isFree ? 0 : Math.min(val / Math.max(max, 1), 1) * circ;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.5s ease-in-out" }}
        />
      </svg>
      <div style={{ marginTop: `-${size * 0.62}px`, textAlign: "center", pointerEvents: "none" }}>
        <div style={{ fontSize: `${size * 0.18}px`, fontWeight: "700", color: "#fff", fontFamily: "'Syne',sans-serif" }}>
          {Math.round(val)}
        </div>
        <div style={{ fontSize: `${size * 0.13}px`, color: "rgba(255,255,255,0.5)" }}>
          {isFree ? "Livre" : `/${max}`}
        </div>
      </div>
      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: "600", marginTop: `${size * 0.6}px` }}>
        {label}
      </div>
    </div>
  );
}

// Reusable ProgressBar Component
function ProgressBar({ val, max, color, label, unit = "" }) {
  const isFree = !isFinite(max);
  const pct = isFree ? 0 : Math.min((val / Math.max(max, 1)) * 100, 100);
  return (
    <div className="bar-wrap">
      <div className="row-sb" style={{ fontSize: "12px", marginBottom: "4px" }}>
        <span style={{ color: "rgba(255,255,255,0.7)" }}>{label}</span>
        <span style={{ color: "#fff" }}>
          {Math.round(val)}
          {unit} <span style={{ color: "rgba(255,255,255,0.4)" }}>{isFree ? "· Livre" : `/ ${max}${unit}`}</span>
        </span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// Reusable StatCard Component
function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div style={{ color: color || "rgba(255,255,255,0.5)", marginBottom: "8px", display: "flex", alignItems: "center" }}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>{label}</div>
      <div className="syne" style={{ fontSize: "18px", fontWeight: "700", color }}>
        {value}
      </div>
      <div className="small" style={{ marginTop: "2px" }}>
        {sub}
      </div>
    </div>
  );
}

export default function Dashboard({
  state,
  saveWeightLog,
  todaySched,
  getTargets,
  todayFoodLogs,
  getTotals,
  PROFILE,
}) {
  const [weightInput, setWeightInput] = useState("");

  // Helper: data local sem bug de timezone (toISOString usa UTC)
  const localDateStr = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const s = todaySched;
  const t = getTargets();
  const logs = todayFoodLogs();
  const tot = getTotals(logs);

  const wl = state.weightLogs || [];

  // ── Peso ──────────────────────────────────────────────────────
  const profile = PROFILE || {};
  const firstW = parseFloat(profile.weight) || 87;
  const lastW = wl.length ? parseFloat(wl[wl.length - 1].value) : firstW;
  const lost   = Math.max(0, firstW - lastW);

  // ── Semanas em processo ───────────────────────────────────────
  const weeks = (() => {
    if (!wl.length) return 1;
    const d0 = new Date(wl[0].date + "T12:00:00");
    const diffDays = Math.max(1, Math.round((new Date() - d0) / 86400000));
    return Math.max(1, Math.ceil(diffDays / 7));
  })();

  const height = parseFloat(profile.height) || 176;
  const age = parseInt(profile.age) || 23;
  const current_bf = parseFloat(profile.current_bf) || 19;
  const goal_bf = parseFloat(profile.goal_bf) || 12;
  const activityFactor = parseFloat(profile.activityFactor) || 1.725;
  const gender = profile.gender || "male";

  // ── TDEE via Mifflin-St Jeor (mesmo cálculo de calculateMetabolicTargets) ─
  const tmb = gender === "female"
    ? (10 * firstW + 6.25 * height - 5 * age - 161)
    : (10 * firstW + 6.25 * height - 5 * age + 5);
  const tdee = Math.round(tmb * activityFactor);

  // ── Déficit calórico acumulado real (via food logs) ───────────
  // Para cada dia registrado: déficit = TDEE − kcal consumidas
  // Déficit negativo (superávit) é desconsiderado para não inflar a estimativa
  const allLogs = state.foodLogs || [];
  const loggedDates = [...new Set(allLogs.map(l => l.date))];
  const cumulativeDeficit = loggedDates.reduce((acc, date) => {
    const dayKcal = allLogs.filter(l => l.date === date).reduce((a, l) => a + l.kcal, 0);
    return acc + (tdee - dayKcal); // pode ser positivo (déficit) ou negativo (superávit)
  }, 0);

  // ── BF estimado (método do vídeo: 7.700 kcal = 1kg gordura) ──
  // Combina déficit calórico (se há logs) com variação real de peso (se há logs de peso)
  const fatKgByDeficit = Math.max(0, cumulativeDeficit / 7700);
  const fatKgByScale   = lost * 0.72; // 72% da perda na balança é gordura (estimativa conservadora)
  const hasWeightHistory = wl.length >= 1;
  const fatKgLost = loggedDates.length > 0 && hasWeightHistory
    ? (fatKgByDeficit * 0.6 + fatKgByScale * 0.4)  // média ponderada dos dois métodos
    : loggedDates.length > 0
    ? fatKgByDeficit
    : fatKgByScale;

  const initialFatKg  = firstW * (current_bf / 100);
  const currentFatKg  = Math.max(0, initialFatKg - Math.max(0, fatKgLost));
  const calculatedBf = (currentFatKg / lastW) * 100;
  const bfNow = Math.max(
    goal_bf,
    lastW < firstW ? Math.min(current_bf, calculatedBf) : calculatedBf
  ).toFixed(1);

  const bfDiffTotal = current_bf - goal_bf;
  const bfLost      = current_bf - Number(bfNow);
  const bfProg      = bfDiffTotal > 0 ? Math.min((bfLost / bfDiffTotal) * 100, 100).toFixed(0) : 100;

  const todayStr = localDateStr();
  const todayWorkout = (state.workoutLogs || []).find((w) => w.date === todayStr);
  const hasTrained = !!todayWorkout;
  const activeKcal = todayWorkout ? (todayWorkout.exercises || []).reduce((acc, ex) => {
    if (ex.isCardio || ex.isMetadata) {
      return acc + (ex.kcal || 0);
    }
    return acc;
  }, 0) : 0;

  // Calorie history for the last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds  = localDateStr(d);
    const k   = allLogs.filter((l) => l.date === ds).reduce((a, l) => a + l.kcal, 0);
    const def = k > 0 ? tdee - k : null; // null = dia sem registro
    return {
      ds,
      k,
      def,                // positivo = déficit, negativo = superávit
      lbl: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][d.getDay()],
    };
  }).reverse();

  const weeklyDeficitReal = last7.reduce((a, d) => a + (d.def ?? 0), 0);
  const projFatLossWeek   = weeklyDeficitReal / 7700; // kg de gordura projetada esta semana
  const maxK = Math.max(...last7.map((d) => d.k), tdee);

  const handleSaveWeight = () => {
    const v = parseFloat(weightInput);
    if (isNaN(v)) return;
    saveWeightLog(v);
    setWeightInput("");
  };

  return (
    <div>
      {/* TODAY OVERVIEW */}
      <div className="card">
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>
          Hoje — {s.calType === "heavy" ? "Dia Pesado 🦵" : s.calType === "free" ? "Dia Livre 🍕" : "Dia Normal"}
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          <MacroRing val={tot.kcal} max={t.kcal} color="#f97316" size={110} stroke={10} label="kcal" />
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <MacroRing val={tot.protein} max={t.protein} color="#3b82f6" size={68} stroke={7} label="Prot." />
            <MacroRing val={tot.carbs} max={t.carbs} color="#8b5cf6" size={68} stroke={7} label="Carbo" />
            <MacroRing val={tot.fat} max={t.fat} color="#f59e0b" size={68} stroke={7} label="Gord." />
          </div>
        </div>
        <div style={{ marginTop: "16px" }}>
          <ProgressBar val={tot.kcal} max={t.kcal} color="#f97316" label="Calorias" unit=" kcal" />
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid2">
        <StatCard
          icon={Scale}
          label="Peso Atual"
          value={`${lastW} kg`}
          sub={lost > 0 ? `-${lost}kg perdido` : "Sem variação"}
          color="#10b981"
        />
        <StatCard
          icon={Flame}
          label="BF Estimado"
          value={`~${bfNow}%`}
          sub={`Meta: ${goal_bf}%`}
          color="#f97316"
        />
        <StatCard
          icon={Calendar}
          label="Semanas"
          value={`${weeks}w`}
          sub={`${(lost / weeks).toFixed(2)}kg/sem`}
          color="#3b82f6"
        />
        <StatCard
          icon={Dumbbell}
          label="Treino hoje"
          value={hasTrained ? "Feito" : "Pendente"}
          sub={hasTrained ? `${activeKcal} kcal gastas` : "Nenhum gasto"}
          color="#8b5cf6"
        />
      </div>

      {/* BF PROGRESS BAR */}
      <div className="card">
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "10px" }}>
          Progresso até {goal_bf}% BF
        </div>
        <div className="row-sb" style={{ fontSize: "12px", marginBottom: "6px" }}>
          <span style={{ color: "rgba(255,255,255,0.6)" }}>
            {current_bf}% → {goal_bf}%
          </span>
          <span style={{ color: "#f97316", fontWeight: "700" }}>{bfProg}%</span>
        </div>
        <div className="bar-track">
          <div
            className="bar-fill"
            style={{ width: `${bfProg}%`, background: "linear-gradient(90deg, #f97316, #ec4899)" }}
          />
        </div>
      </div>

      {/* REGISTER WEIGHT */}
      <div className="card">
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "10px" }}>
          Registrar Peso de Hoje
        </div>
        <div className="row" style={{ gap: "10px" }}>
          <input
            id="inp-weight"
            type="number"
            placeholder={`${lastW} kg`}
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleSaveWeight}>
            Salvar
          </button>
        </div>
      </div>

      {/* 7 DAYS CALORIE CHART + DÉFICIT */}
      <div className="card">
        <div className="row-sb" style={{ marginBottom: "14px" }}>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
            Calorias — 7 dias
          </div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
            meta {tdee} kcal/dia
          </div>
        </div>

        {/* Barras */}
        <div style={{ position: "relative" }}>
          {/* Linha de meta (TDEE) */}
          <div style={{
            position: "absolute",
            left: 0, right: 0,
            bottom: `${Math.max(4, (tdee / maxK) * 64)}px`,
            borderTop: "1px dashed rgba(255,255,255,0.18)",
            zIndex: 1,
            pointerEvents: "none",
          }} />

          <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "88px" }}>
            {last7.map((d, index) => {
              const isToday  = d.ds === todayStr;
              const barH     = d.k > 0 ? Math.max(4, (d.k / maxK) * 64) : 4;
              const inDeficit = d.def !== null && d.def > 0;
              const inSurplus = d.def !== null && d.def < 0;
              const barColor = d.k === 0
                ? "rgba(255,255,255,0.07)"
                : inDeficit
                  ? (isToday ? "#10b981" : "rgba(16,185,129,0.55)")
                  : (isToday ? "#ef4444" : "rgba(239,68,68,0.5)");

              return (
                <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  {/* kcal label */}
                  <div style={{ fontSize: "7.5px", color: isToday ? "#fff" : "rgba(255,255,255,0.38)", lineHeight: 1, textAlign: "center" }}>
                    {d.k > 0 ? d.k : ""}
                  </div>
                  {/* barra */}
                  <div style={{ width: "100%", background: barColor, borderRadius: "4px 4px 0 0", height: `${barH}px`, minHeight: "4px", transition: "height 0.4s ease" }} />
                  {/* dia */}
                  <div style={{ fontSize: "9px", color: isToday ? "#f97316" : "rgba(255,255,255,0.4)", fontWeight: isToday ? "700" : "400" }}>
                    {d.lbl}
                  </div>
                  {/* déficit/superávit */}
                  <div style={{ fontSize: "7px", color: inDeficit ? "#10b981" : inSurplus ? "#ef4444" : "transparent", fontWeight: "700", lineHeight: 1 }}>
                    {d.def !== null ? (d.def > 0 ? `-${d.def}` : `+${Math.abs(d.def)}`) : "·"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legenda */}
        <div className="row" style={{ gap: "14px", marginTop: "10px" }}>
          <div className="row" style={{ gap: "5px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#10b981" }} />
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>Déficit</span>
          </div>
          <div className="row" style={{ gap: "5px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#ef4444" }} />
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>Superávit</span>
          </div>
          <div className="row" style={{ gap: "5px" }}>
            <div style={{ width: "16px", borderTop: "1px dashed rgba(255,255,255,0.35)" }} />
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>Meta TDEE</span>
          </div>
        </div>
      </div>

      {/* DÉFICIT SEMANAL */}
      <div className="card">
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "14px" }}>
          Déficit Semanal Real
        </div>
        <div className="grid2" style={{ marginBottom: "0" }}>
          <div>
            <div className="label">Déficit acumulado (7d)</div>
            <div className="syne" style={{ fontSize: "22px", fontWeight: "800", color: weeklyDeficitReal > 0 ? "#10b981" : "#ef4444" }}>
              {weeklyDeficitReal > 0 ? "" : "+"}{Math.round(Math.abs(weeklyDeficitReal))}
              <span style={{ fontSize: "12px", fontWeight: "400", color: "rgba(255,255,255,0.4)" }}> kcal</span>
            </div>
            <div className="small">
              {weeklyDeficitReal > 0 ? "abaixo do TDEE" : "acima do TDEE"}
            </div>
          </div>
          <div>
            <div className="label">Gordura projetada</div>
            <div className="syne" style={{ fontSize: "22px", fontWeight: "800", color: projFatLossWeek > 0 ? "#10b981" : "#ef4444" }}>
              {projFatLossWeek > 0 ? "-" : "+"}{Math.abs(projFatLossWeek * 1000).toFixed(0)}
              <span style={{ fontSize: "12px", fontWeight: "400", color: "rgba(255,255,255,0.4)" }}>g</span>
            </div>
            <div className="small">esta semana · 7.700 kcal/kg</div>
          </div>
        </div>

        {/* Barra de progresso do déficit semanal vs meta */}
        {(() => {
          const weeklyTarget = firstW * 0.007 * 7700; // déficit ideal (0.7% do peso)
          const pct = weeklyTarget > 0 ? Math.min(100, Math.max(0, (weeklyDeficitReal / weeklyTarget) * 100)) : 0;
          return (
            <div style={{ marginTop: "14px" }}>
              <div className="row-sb" style={{ fontSize: "11px", marginBottom: "5px" }}>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>
                  Meta semanal: ~{Math.round(weeklyTarget).toLocaleString()} kcal
                </span>
                <span style={{ color: "#10b981", fontWeight: "700" }}>{pct.toFixed(0)}%</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct}%`, background: pct >= 100 ? "#10b981" : "linear-gradient(90deg, #f97316, #10b981)" }} />
              </div>
              <div className="small" style={{ marginTop: "5px" }}>
                Ideal: perder {(firstW * 0.007 * 1000).toFixed(0)}–{(firstW * 0.01 * 1000).toFixed(0)}g/sem (0,7–1% do peso)
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
