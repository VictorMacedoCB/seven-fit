"use client";

import React, { useState, useEffect } from "react";
import { X, Dumbbell } from "lucide-react";

// Mesmo vocabulário de músculo usado em lib/exercises-ptbr.json (campo primaryMuscles),
// pra que um exercício criado manualmente seja tratado exatamente como um exercício do
// banco — aparece no grupo/sessão certos e agrupado sob o sub-músculo certo, em vez de
// cair sempre em "Outros".
const MUSCLE_OPTIONS = [
  { value: "peito", label: "Peito" },
  { value: "ombros", label: "Ombro" },
  { value: "trapezio", label: "Trapézio" },
  { value: "triceps", label: "Tríceps" },
  { value: "dorsais", label: "Costas (Dorsal)" },
  { value: "meio-das-costas", label: "Costas (Meio)" },
  { value: "inferior-das-costas", label: "Lombar" },
  { value: "biceps", label: "Bíceps" },
  { value: "antebracos", label: "Antebraço" },
  { value: "pescoco", label: "Pescoço" },
  { value: "quadriceps", label: "Quadríceps" },
  { value: "isquiotibiais", label: "Posterior de Coxa" },
  { value: "gluteos", label: "Glúteos" },
  { value: "panturrilhas", label: "Panturrilha" },
  { value: "adutores", label: "Adutores (Coxa Interna)" },
  { value: "abdutores", label: "Abdutores (Coxa Externa)" },
  { value: "abdominais", label: "Abdômen" },
];

const EQUIPMENT_OPTIONS = [
  { value: "barra", label: "Barra" },
  { value: "halteres", label: "Halteres" },
  { value: "maquina", label: "Máquina" },
  { value: "cabo", label: "Polia / Cabo" },
  { value: "peso-do-corpo", label: "Peso do Corpo" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "faixas", label: "Elástico / Faixa" },
  { value: "barra-w", label: "Barra W" },
  { value: "outros", label: "Outro" },
];

/**
 * Modal de criação de exercício customizado (quando o exercício buscado não existe no
 * banco). Coleta músculo primário (obrigatório — define em quais grupos/sessões o
 * exercício vai aparecer), músculo secundário (opcional) e equipamento/tipo.
 */
export default function CreateExerciseModal({ isOpen, onClose, initialName = "", onConfirm }) {
  const [name, setName] = useState(initialName);
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [equipment, setEquipment] = useState("maquina");

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(initialName);
      setPrimary("");
      setSecondary("");
      setEquipment("maquina");
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const canSave = name.trim().length > 0 && primary;

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div onClick={handleBackdrop} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 950,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        width: "100%", maxWidth: 420,
        background: "linear-gradient(170deg,#15151f,#0c0c14)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 24, overflow: "hidden",
        maxHeight: "88dvh", display: "flex", flexDirection: "column",
      }}>
        <div style={{
          padding: "14px 16px 12px", flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Dumbbell size={16} style={{ color: "#f97316" }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>
                Novo exercício
              </div>
              <div className="syne" style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>Criar exercício</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10,
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.7)",
          }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "14px 16px 20px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: .7, marginBottom: 6 }}>
            Nome do exercício
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Ex: "Remada Pendlay"'
            style={{ marginBottom: 14 }}
          />

          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: .7, marginBottom: 6 }}>
            Músculo primário <span style={{ color: "#f97316" }}>*</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {MUSCLE_OPTIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => setPrimary(m.value)}
                style={{
                  padding: "7px 11px", borderRadius: 999, cursor: "pointer",
                  border: "1px solid " + (primary === m.value ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.1)"),
                  background: primary === m.value ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)",
                  color: primary === m.value ? "#f97316" : "rgba(255,255,255,0.6)",
                  fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: .7, marginBottom: 6 }}>
            Músculo secundário (opcional)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            <button
              onClick={() => setSecondary("")}
              style={{
                padding: "7px 11px", borderRadius: 999, cursor: "pointer",
                border: "1px solid " + (secondary === "" ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.1)"),
                background: secondary === "" ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)",
                color: secondary === "" ? "#f97316" : "rgba(255,255,255,0.6)",
                fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
              }}
            >
              Nenhum
            </button>
            {MUSCLE_OPTIONS.filter((m) => m.value !== primary).map((m) => (
              <button
                key={m.value}
                onClick={() => setSecondary(m.value)}
                style={{
                  padding: "7px 11px", borderRadius: 999, cursor: "pointer",
                  border: "1px solid " + (secondary === m.value ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.1)"),
                  background: secondary === m.value ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)",
                  color: secondary === m.value ? "#f97316" : "rgba(255,255,255,0.6)",
                  fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: .7, marginBottom: 6 }}>
            Equipamento
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
            {EQUIPMENT_OPTIONS.map((eq) => (
              <button
                key={eq.value}
                onClick={() => setEquipment(eq.value)}
                style={{
                  padding: "7px 11px", borderRadius: 999, cursor: "pointer",
                  border: "1px solid " + (equipment === eq.value ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.1)"),
                  background: equipment === eq.value ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)",
                  color: equipment === eq.value ? "#f97316" : "rgba(255,255,255,0.6)",
                  fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {eq.label}
              </button>
            ))}
          </div>

          {!primary && (
            <div style={{ fontSize: 11, color: "rgba(239,68,68,0.8)", marginBottom: 10, textAlign: "center" }}>
              Escolha o músculo primário pra continuar.
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1, fontSize: 13, padding: 12 }}>
              Cancelar
            </button>
            <button
              onClick={() => canSave && onConfirm({ name: name.trim(), primary, secondary, equipment })}
              disabled={!canSave}
              className="btn btn-primary"
              style={{ flex: 2, fontSize: 13, padding: 12, opacity: canSave ? 1 : 0.4, cursor: canSave ? "pointer" : "not-allowed" }}
            >
              Criar e adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
