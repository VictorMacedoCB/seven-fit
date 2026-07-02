"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";

// ── Divisões de treino disponíveis ──────────────────────────────────────────
// Cada categoria agrupa divisões relacionadas.
// "group" é o ID usado no workoutPlans pra buscar os exercícios.
// Se "group" for null, o dia é de descanso/atividade livre (não usa workoutPlans).
const DIVISIONS = [
  {
    category: "Divisões Clássicas",
    options: [
      { label: "Push",     group: "Push",  emoji: "💪", desc: "Peito, Ombro, Tríceps" },
      { label: "Pull",     group: "Pull",  emoji: "🔙", desc: "Costas, Bíceps, Posterior de Ombro" },
      { label: "Legs",     group: "Legs",  emoji: "🦵", desc: "Quadríceps, Posterior, Glúteos, Panturrilha" },
    ],
  },
  {
    category: "Upper / Lower",
    options: [
      { label: "Upper",   group: "Upper",  emoji: "⬆️", desc: "Peito, Costas, Ombros, Braços" },
      { label: "Lower",   group: "Lower",  emoji: "⬇️", desc: "Quadríceps, Posteriores, Glúteos, Panturrilha" },
    ],
  },
  {
    category: "Full Body",
    options: [
      { label: "Full Body A", group: "Full Body A", emoji: "🏋️", desc: "Corpo inteiro — treino A" },
      { label: "Full Body B", group: "Full Body B", emoji: "🏋️", desc: "Corpo inteiro — treino B" },
      { label: "Full Body",   group: "Full Body",   emoji: "🏋️", desc: "Corpo inteiro — único" },
    ],
  },
  {
    category: "Torso / Limbs",
    options: [
      { label: "Torso",   group: "Torso",  emoji: "🫀", desc: "Peito, Costas, Ombros, Core" },
      { label: "Limbs",   group: "Limbs",  emoji: "💪", desc: "Braços, Pernas" },
    ],
  },
  {
    category: "Anterior / Posterior",
    options: [
      { label: "Anterior",   group: "Anterior",   emoji: "⬛", desc: "Músculos da frente do corpo" },
      { label: "Posterior",  group: "Posterior",  emoji: "⬜", desc: "Músculos do fundo do corpo" },
    ],
  },
  {
    category: "Por Músculo",
    options: [
      { label: "Peito + Tríceps",     group: "Peito",    emoji: "💪", desc: "Chest & Tris" },
      { label: "Costas + Bíceps",     group: "Costas",   emoji: "🔙", desc: "Back & Bis" },
      { label: "Ombro + Trapézio",    group: "Ombro",    emoji: "🏔️", desc: "Shoulder & Traps" },
      { label: "Pernas (Quad Focus)", group: "Quad",     emoji: "🦵", desc: "Agachamentos, extensoras" },
      { label: "Pernas (Post Focus)", group: "Posterior", emoji: "🦵", desc: "Stiff, flexoras, glúteos" },
      { label: "Braços",              group: "Braços",   emoji: "💪", desc: "Bíceps + Tríceps" },
      { label: "Core + Lombar",       group: "Core",     emoji: "🎯", desc: "Abdômen e lombar" },
    ],
  },
  {
    category: "Cardio & Complementares",
    options: [
      { label: "Cardio",         group: "Cardio",         emoji: "🏃", desc: "Corrida, bike, elíptico — com registro de duração/calorias" },
      { label: "Complementares", group: "Complementares", emoji: "🧩", desc: "Abdômen, panturrilha e lombar" },
    ],
  },
  {
    category: "Esporte / Atividade",
    options: [
      { label: "Jiu-Jitsu",    group: null, emoji: "🥋", desc: "Arte marcial — dia de descanso da musculação" },
      { label: "Natação",      group: null, emoji: "🏊", desc: "Treino de natação" },
      { label: "Esportes",     group: null, emoji: "⚽", desc: "Futebol, basquete, vôlei..." },
      { label: "Mobilidade",   group: null, emoji: "🧘", desc: "Yoga, alongamento, mobilidade" },
    ],
  },
  {
    category: "Descanso",
    options: [
      { label: "Descanso",     group: null, emoji: "😴", desc: "Dia de recuperação" },
      { label: "Descanso Ativo", group: null, emoji: "🚶", desc: "Caminhada leve, recuperação ativa" },
    ],
  },
];

// Cores disponíveis pra cada dia
const PRESET_COLORS = [
  "#f97316","#ef4444","#8b5cf6","#3b82f6","#10b981",
  "#f59e0b","#ec4899","#06b6d4","#84cc16","#6b7280",
];

export default function EditDayModal({ isOpen, onClose, dayIndex, schedule, saveDayEdit, COLORS }) {
  const [typeName,       setTypeName]       = useState("");
  const [exerciseGroup,  setExerciseGroup]  = useState("");
  const [calType,        setCalType]        = useState("normal");
  const [selectedColor,  setSelectedColor]  = useState(PRESET_COLORS[0]);
  const [showCustom,     setShowCustom]     = useState(false);
  const [expandedCat,    setExpandedCat]    = useState(null);

  const dayObj = schedule && dayIndex !== null ? schedule[dayIndex] : null;

  useEffect(() => {
    if (!dayObj) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTypeName(dayObj.type || "");
    setExerciseGroup(dayObj.group || "");
    setCalType(dayObj.calType || "normal");
    setSelectedColor(dayObj.color || PRESET_COLORS[0]);
    setShowCustom(false);
    setExpandedCat(null);
  }, [dayObj]);

  if (!isOpen || !dayObj) return null;

  const handleSelectOption = (opt) => {
    setTypeName(opt.label);
    setExerciseGroup(opt.group || "");
    // Sugere calType automaticamente
    if (opt.group === null) setCalType("free");
    else setCalType("normal");
  };

  const handleSave = () => {
    saveDayEdit(dayIndex, {
      ...dayObj,
      type:    typeName.trim() || dayObj.type,
      group:   exerciseGroup || null,
      calType,
      color:   selectedColor,
    });
    onClose();
  };

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div onClick={handleBackdrop} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:900,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }}>
      <div style={{
        width:"100%", maxWidth:440,
        background:"linear-gradient(170deg,#15151f,#0c0c14)",
        border:"1px solid rgba(255,255,255,0.1)",
        borderRadius:24, overflow:"hidden",
        maxHeight:"88dvh", display:"flex", flexDirection:"column",
      }}>

        {/* Header */}
        <div style={{
          padding:"14px 16px 12px", flexShrink:0,
          borderBottom:"1px solid rgba(255,255,255,0.07)",
          display:"flex", alignItems:"center", justifyContent:"space-between",
        }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:1 }}>Editar dia</div>
            <div className="syne" style={{ fontSize:17, fontWeight:800, color:"#f97316" }}>{dayObj.day}</div>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,0.08)", border:"none", borderRadius:10,
            width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", color:"rgba(255,255,255,0.7)",
          }}>
            <X size={15}/>
          </button>
        </div>

        <div style={{ overflowY:"auto", flex:1, padding:"14px 16px 20px" }}>

          {/* Preview do dia atual */}
          {typeName && (
            <div style={{
              background:`${selectedColor}14`, border:`1px solid ${selectedColor}30`,
              borderRadius:12, padding:"10px 14px", marginBottom:14,
              display:"flex", alignItems:"center", gap:10,
            }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:selectedColor, flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{typeName}</div>
                {exerciseGroup && <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>Plano: {exerciseGroup}</div>}
              </div>
            </div>
          )}

          {/* Seletor de divisão */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:.7, marginBottom:8 }}>
              Tipo de treino
            </div>

            {DIVISIONS.map((cat) => (
              <div key={cat.category} style={{ marginBottom:6 }}>
                {/* Categoria colapsável */}
                <button
                  onClick={() => setExpandedCat(expandedCat === cat.category ? null : cat.category)}
                  style={{
                    width:"100%", padding:"9px 12px", borderRadius:10, border:"none",
                    background:"rgba(255,255,255,0.04)", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
                    color:"rgba(255,255,255,0.6)",
                  }}
                >
                  <span>{cat.category}</span>
                  {expandedCat === cat.category
                    ? <ChevronUp size={13}/>
                    : <ChevronDown size={13}/>}
                </button>

                {expandedCat === cat.category && (
                  <div style={{ display:"flex", flexDirection:"column", gap:4, marginTop:4, paddingLeft:4 }}>
                    {cat.options.map((opt) => {
                      const isActive = typeName === opt.label;
                      return (
                        <button
                          key={opt.label}
                          onClick={() => handleSelectOption(opt)}
                          style={{
                            padding:"9px 12px", borderRadius:10, border:"none", cursor:"pointer",
                            background: isActive ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)",
                            border: isActive ? "1px solid rgba(249,115,22,0.35)" : "1px solid rgba(255,255,255,0.06)",
                            display:"flex", alignItems:"center", gap:10, textAlign:"left", width:"100%",
                          }}
                        >
                          <span style={{ fontSize:16, flexShrink:0 }}>{opt.emoji}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:700, color: isActive ? "#f97316" : "#fff", fontFamily:"'DM Sans',sans-serif" }}>
                              {opt.label}
                            </div>
                            <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontFamily:"'DM Sans',sans-serif" }}>
                              {opt.desc}
                            </div>
                          </div>
                          {isActive && <span style={{ fontSize:14, color:"#f97316" }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Nome personalizado */}
            <button
              onClick={() => setShowCustom(v => !v)}
              style={{
                width:"100%", marginTop:6, padding:"9px 12px", borderRadius:10,
                border:"1px dashed rgba(255,255,255,0.15)", background:"none", cursor:"pointer",
                fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
                color:"rgba(255,255,255,0.45)", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              }}
            >
              ✏️ {showCustom ? "Fechar nome personalizado" : "Nome personalizado"}
            </button>

            {showCustom && (
              <div style={{ marginTop:8 }}>
                <input
                  type="text"
                  placeholder='Ex: "Natação", "Funcional", "Braços"...'
                  value={typeName}
                  onChange={e => setTypeName(e.target.value)}
                  style={{ marginBottom:6 }}
                />
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>
                  Plano de exercícios vinculado (opcional):
                </div>
                <input
                  type="text"
                  placeholder="Nome do plano em workoutPlans (ex: Push)"
                  value={exerciseGroup}
                  onChange={e => setExerciseGroup(e.target.value)}
                  style={{ marginTop:4 }}
                />
              </div>
            )}
          </div>

          {/* Calorias do dia */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:.7, marginBottom:8 }}>
              Calorias do dia
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {[
                { id:"normal", label:"Normal",   sub:"Dia padrão" },
                { id:"heavy",  label:"Pesado 🏋️", sub:"+200 kcal" },
                { id:"free",   label:"Livre 🍕",  sub:"Sem controle" },
              ].map(c => (
                <button key={c.id} onClick={() => setCalType(c.id)} style={{
                  flex:1, padding:"9px 6px", borderRadius:10, border:"none", cursor:"pointer",
                  background: calType === c.id ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.04)",
                  border: calType === c.id ? "1px solid rgba(249,115,22,0.3)" : "1px solid rgba(255,255,255,0.07)",
                  textAlign:"center",
                }}>
                  <div style={{ fontSize:11, fontWeight:800, color: calType === c.id ? "#f97316" : "rgba(255,255,255,0.6)", fontFamily:"'DM Sans',sans-serif" }}>{c.label}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>{c.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:.7, marginBottom:8 }}>
              Cor
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => setSelectedColor(c)} style={{
                  width:30, height:30, borderRadius:8, border:"none", cursor:"pointer",
                  background:c, flexShrink:0,
                  outline: selectedColor === c ? `2px solid ${c}` : "none",
                  outlineOffset:2,
                  transform: selectedColor === c ? "scale(1.2)" : "scale(1)",
                  transition:"transform 0.15s",
                }}/>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={onClose} className="btn btn-ghost" style={{ flex:1, fontSize:13, padding:12 }}>
              Cancelar
            </button>
            <button onClick={handleSave} className="btn btn-primary" style={{ flex:2, fontSize:13, padding:12 }}>
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
