"use client";

import React from "react";
import { Calendar, Flame, CheckCircle2 } from "lucide-react";

export default function HistoryModal({ isOpen, onClose, exerciseName, state, SET_TYPES }) {
  if (!isOpen) return null;

  // Get previous performance list
  const getPrevPerf = (name) => {
    const logs = state.workoutLogs || [];
    return logs
      .filter((w) => { const d = new Date(); const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; return w.date < s; })
      .flatMap((w) =>
        (w.exercises || [])
          .filter((e) => e.name === name)
          .map((e) => ({ ...e, date: w.date }))
      )
      .slice(-6);
  };

  const prev = getPrevPerf(exerciseName);

  const fmtDate = (d) => {
    try {
      return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="modal" style={{ padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "480px", margin: "0 auto" }}>
        <div className="row-sb" style={{ marginBottom: "20px" }}>
          <div className="syne" style={{ fontSize: "18px", fontWeight: "700" }}>
            {exerciseName}
          </div>
          <button className="btn btn-ghost" style={{ padding: "8px 14px" }} onClick={onClose}>
            Fechar
          </button>
        </div>
        <div style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
          {!prev.length ? (
            <div style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "40px" }}>
              Sem histórico ainda
            </div>
          ) : (
            prev
              .slice()
              .reverse()
              .map((sess, idx) => {
                const vs = sess.sets.filter((s) => s.type === "valida");
                const vol = vs.reduce((a, s) => a + s.weight * s.reps, 0);
                return (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: "14px",
                      padding: "16px",
                      marginBottom: "12px",
                    }}
                  >
                    <div className="small" style={{ marginBottom: "10px", fontWeight: "600", color: "#f97316", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar size={12} /> {fmtDate(sess.date)} (Sessão anterior {prev.length - idx})
                    </div>
                    {sess.sets.map((set, sIdx) => {
                      const t = SET_TYPES.find((x) => x.id === set.type);
                      return (
                        <div
                          key={sIdx}
                          style={{
                            display: "flex",
                            gap: "10px",
                            fontSize: "13px",
                            padding: "4px 0",
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                            alignItems: "center"
                          }}
                        >
                          <span style={{ color: t.color, width: "110px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                            {t.id === "aquecimento" ? <Flame size={12} /> : <CheckCircle2 size={12} />} {t.label}
                          </span>
                          <span style={{ fontWeight: "700" }}>
                            {set.weight}kg × {set.reps}
                          </span>
                        </div>
                      );
                    })}
                    {vs.length > 0 && (
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "8px" }}>
                        Volume válido: {vol}kg
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
