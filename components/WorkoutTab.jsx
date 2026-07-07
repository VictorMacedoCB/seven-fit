"use client";

import React, { useState, useEffect } from "react";
import { Flame, CheckCircle2, BookOpen, History, X, Plus, Save, Zap, Droplets, Search, ChevronDown, ChevronUp, Trash2, GripVertical, Edit, Calendar } from "lucide-react";
import exercisesDb from "@/lib/exercises-ptbr.json";
import { RestTimerBadge } from "@/components/RestTimer";
import CreateExerciseModal from "@/components/CreateExerciseModal";


// Sub-grupamentos musculares por tipo de treino
const MUSCLE_SUBGROUPS = {
  Push: {
    "Peito":   ["Supino Reto","Supino Inclinado","Supino Declinado","Crucifixo","Crucifixo Inclinado","Pec Deck","Crossover"],
    "Ombro":   ["Desenvolvimento com Barra","Desenvolvimento com Halteres","Elevação Lateral","Elevação Frontal","Encolhimento","Face Pull"],
    "Tríceps": ["Tríceps Corda","Tríceps Testa","Tríceps Francês","Tríceps Banco","Mergulho","Extensão Tríceps"],
  },
  Pull: {
    "Costas":  ["Puxada Frente","Puxada Neutra","Puxada Fechada","Barra Fixa","Pullover","Remada Curvada","Remada Unilateral","Remada Cavalinho","Remada Sentado","Serrote"],
    "Bíceps":  ["Rosca Direta","Rosca Martelo","Rosca Concentrada","Rosca 21","Rosca Inversa","Rosca Scott"],
    "Posterior de Ombro": ["Crucifixo Invertido com Halteres", "Crucifixo Invertido na Máquina", "Face Pull"],
  },
  Legs: {
    "Quadríceps": ["Agachamento Livre","Agachamento Smith","Agachamento Sumô","Leg Press","Hack Squat","Cadeira Extensora","Avanço","Avanço com Barra","Agachamento Búlgaro"],
    "Posterior":  ["Stiff","Mesa Flexora"],
    "Adutores":   ["Cadeira Adutora","Cadeira Abdutora"],
    "Panturrilha":["Panturrilha em Pé","Panturrilha Sentado","Panturrilha no Leg Press"],
    "Abdômen":    [],
  },
  Upper: {
    "Peito":   ["Supino Reto","Supino Inclinado","Crucifixo","Pec Deck"],
    "Ombro":   ["Desenvolvimento com Halteres","Elevação Lateral","Face Pull"],
    "Tríceps": ["Tríceps Corda","Tríceps Testa"],
    "Costas":  ["Puxada Frente","Remada Curvada","Remada Unilateral","Pullover"],
    "Bíceps":  [],
  },
  Lower: {
    "Pernas":  ["Agachamento Livre","Leg Press","Cadeira Extensora","Mesa Flexora","Stiff","Avanço","Panturrilha em Pé","Panturrilha Sentado"],
    "Bíceps":  ["Rosca Direta","Rosca Martelo","Rosca Concentrada"],
    "Abdômen":    [],
  },
  // Dia dedicado a cardio + grupos complementares (abdômen, panturrilha, lombar)
  // — útil pra quem quer separar isso do dia principal de força.
  Complementares: {
    "Abdômen":     ["Prancha","Abdominal na Polia","Abdominal Infra","Elevação de Pernas","Roda Abdominal","Abdominal Bicicleta","Abdominal Oblíquo"],
    "Panturrilha": ["Panturrilha em Pé","Panturrilha Sentado","Panturrilha no Leg Press"],
    "Lombar":      ["Hiperextensão Lombar"],
  },
  Cardio: {
    "Cardio": [],
  },
  Torso: {
    "Peito":   ["Supino Reto","Supino Inclinado","Supino Declinado","Crucifixo","Crucifixo Inclinado","Pec Deck","Crossover"],
    "Costas":  ["Puxada Frente","Puxada Neutra","Puxada Fechada","Barra Fixa","Pullover","Remada Curvada","Remada Unilateral","Remada Cavalinho","Remada Sentado","Serrote"],
    "Ombro":   ["Desenvolvimento com Barra","Desenvolvimento com Halteres","Elevação Lateral","Elevação Frontal","Encolhimento","Face Pull"],
    "Core":    ["Prancha","Abdominal na Polia","Abdominal Infra","Elevação de Pernas","Roda Abdominal","Abdominal Bicicleta","Abdominal Oblíquo","Hiperextensão Lombar"],
  },
  Limbs: {
    "Braços": ["Tríceps Corda","Tríceps Testa","Tríceps Francês","Tríceps Banco","Mergulho","Extensão Tríceps","Rosca Direta","Rosca Martelo","Rosca Concentrada","Rosca 21","Rosca Inversa","Rosca Scott"],
    "Pernas": ["Agachamento Livre","Agachamento Smith","Agachamento Sumô","Leg Press","Hack Squat","Cadeira Extensora","Avanço","Avanço com Barra","Agachamento Búlgaro","Stiff","Mesa Flexora","Cadeira Adutora","Cadeira Abdutora","Panturrilha em Pé","Panturrilha Sentado","Panturrilha no Leg Press"],
  },
};

// Retorna o sub-músculo de um exercício dentro de um grupo
// customMap é passado em runtime para exercícios criados pelo usuário
function getMuscle(group, name, customMap = {}) {
  const normalize = (str) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const normalizedName = normalize(name);

  // "primary" vem do banco (exercisesDb) OU, pra exercícios criados pelo usuário, do
  // músculo escolhido na criação — guardado com o MESMO vocabulário usado no banco
  // (ex: "triceps", "peito", "ombros"), pra passar pelas mesmas regras de agrupamento
  // abaixo em vez de cair direto e sempre em "Outros".
  let primary = null;
  if (customMap[name]) {
    primary = customMap[name];
  } else {
    const ex = exercisesDb.find(e => normalize(e.name) === normalizedName);
    if (ex && ex.primaryMuscles && ex.primaryMuscles.length > 0) primary = ex.primaryMuscles[0];
  }

  if (primary) {
    const nameNorm = normalizedName;

    if (group === 'Lower') {
      if (primary === 'biceps') return 'Bíceps';
      if (primary === 'abdominais') return 'Abdômen';
      const legsMuscles = ['quadriceps', 'isquiotibiais', 'gluteos', 'panturrilhas', 'adutores', 'abdutores'];
      if (legsMuscles.includes(primary)) return 'Pernas';
    }

    if (group === 'Complementares') {
      if (primary === 'abdominais') return 'Abdômen';
      if (primary === 'panturrilhas') return 'Panturrilha';
      if (primary === 'inferior-das-costas') return 'Lombar';
    }

    if (group === 'Torso') {
      if (primary === 'peito') return 'Peito';
      if (['dorsais', 'meio-das-costas', 'pescoco'].includes(primary)) return 'Costas';
      if (primary === 'trapezio') return 'Ombro';
      if (['abdominais', 'inferior-das-costas'].includes(primary)) return 'Core';
      // ombros já é tratado abaixo (rear delt -> Ombro nesse grupo também, já que Torso não separa Push/Pull)
    }

    if (group === 'Limbs') {
      if (['biceps', 'antebracos', 'triceps'].includes(primary)) return 'Braços';
      const legsMuscles = ['quadriceps', 'isquiotibiais', 'gluteos', 'panturrilhas', 'adutores', 'abdutores'];
      if (legsMuscles.includes(primary)) return 'Pernas';
    }

    if (primary === 'ombros') {
      const isRearDelt = nameNorm.includes('invertido') || 
                         nameNorm.includes('inverso') || 
                         nameNorm.includes('posterior') || 
                         nameNorm.includes('rear delt') ||
                         nameNorm.includes('face pull');
      if (isRearDelt) return group === 'Pull' ? 'Posterior de Ombro' : 'Ombro';
      return 'Ombro';
    }

    const map = {
      'peito': 'Peito',
      'triceps': 'Tríceps',
      'trapezio': 'Ombro',
      'dorsais': 'Costas',
      'meio-das-costas': 'Costas',
      'inferior-das-costas': 'Costas',
      'biceps': 'Bíceps',
      'antebracos': 'Bíceps',
      'pescoco': 'Costas',
      'quadriceps': 'Quadríceps',
      'isquiotibiais': 'Posterior',
      'gluteos': 'Posterior',
      'panturrilhas': 'Panturrilha',
      'adutores': 'Adutores',
      'abdutores': 'Adutores',
      'abdominais': 'Abdômen'
    };

    return map[primary] || 'Outros';
  }

  // Fallback to static list matching
  const subs = MUSCLE_SUBGROUPS[group] || {};
  for (const [muscle, list] of Object.entries(subs)) {
    if (list.includes(name)) return muscle;
  }
  return "Outros";
}

export default function WorkoutTab({
  state,
  saveSessionWorkout,
  removeWorkoutLog,
  getExercises,
  saveCustomExercise,
  workoutPlans,
  saveWorkoutPlan,
  deleteWorkoutPlan,
  DEFAULT_EXERCISES,
  customMuscleMap = {},
  saveCustomMuscleMap,
  SET_TYPES,
  today,
  fmtDate,
  openHistoryModal,
  openGuideModal,
  openAiPlanModal,
  fireRestTimer,
  setRestTimerExName,
  restTimer,
  openEditDayModal,
}) {
  // Divisões selecionáveis: união de (1) tudo que já existe em workoutPlans e (2) toda
  // divisão configurada em qualquer dia da Semana (Personalizar Semana → Configurações) —
  // cobre QUALQUER uma das divisões disponíveis lá (Push/Pull/Legs, Upper/Lower, Full Body,
  // Torso/Limbs, Anterior/Posterior, por músculo, Complementares...), não só uma lista fixa.
  // Isso garante que a divisão escolhida na Semana sempre apareça pra seleção manual na aba
  // Treino, mesmo antes de ter qualquer exercício salvo nela (ex: num dia de descanso, pra
  // treinar uma divisão diferente da programada).
  const scheduleGroups = [...new Set((state?.schedule || []).map((d) => d.group).filter(Boolean))];
  const planGroups = workoutPlans ? Object.keys(workoutPlans) : [];
  const ALL_GROUPS = [...new Set([...planGroups, ...scheduleGroups])];
  if (ALL_GROUPS.length === 0) ALL_GROUPS.push("Push", "Pull", "Legs");

  const [activeSubTab, setActiveSubTab] = useState("session");
  const [histWrkDate, setHistWrkDate] = useState("");
  
  const [sessionDate, setSessionDate] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("co_active_sessionDate") || today();
    }
    return today();
  });
  
  const [selectedGroup, setSelectedGroup] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("co_active_selectedGroup") || null;
    }
    return null;
  });

  const [sessionStarted, setSessionStarted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("co_active_sessionStarted") === "true";
    }
    return false;
  });

  // Modal da sessão: "Iniciar Sessão" abre o modal de registro (exercícios/séries/cargas).
  // Fechar o modal (X) NÃO encerra a sessão nem zera o cronômetro — só esconde a tela,
  // a sessão continua ativa e o cronômetro continua contando; um botão "Continuar sessão"
  // reabre o mesmo modal exatamente de onde parou.
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  // Cronômetro de duração da sessão — baseado em timestamp de início (não num contador
  // que decrementa), então continua certo mesmo se o app for pra segundo plano.
  const [sessionStartedAt, setSessionStartedAt] = useState(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("co_active_sessionStartedAt");
      return raw ? parseInt(raw, 10) : null;
    }
    return null;
  });
  const [sessionElapsed, setSessionElapsed] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!sessionStartedAt) { setSessionElapsed(0); return; }
    const tick = () => setSessionElapsed(Math.max(0, Math.floor((Date.now() - sessionStartedAt) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessionStartedAt]);

  // Recalcula na hora ao voltar de segundo plano, em vez de esperar o próximo tick.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisible = () => {
      if (document.visibilityState === "visible" && sessionStartedAt) {
        setSessionElapsed(Math.max(0, Math.floor((Date.now() - sessionStartedAt) / 1000)));
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [sessionStartedAt]);

  const startSession = () => {
    if (!sessionStartedAt) {
      const now = Date.now();
      setSessionStartedAt(now);
      if (typeof window !== "undefined") localStorage.setItem("co_active_sessionStartedAt", String(now));
    }
    setSessionModalOpen(true);
  };

  const endSessionTimer = () => {
    setSessionStartedAt(null);
    if (typeof window !== "undefined") localStorage.removeItem("co_active_sessionStartedAt");
  };

  // Sessão: lista de exercícios com sets
  const [sessionExs, setSessionExs] = useState(() => {
    if (typeof window !== "undefined") {
      const savedStarted = localStorage.getItem("co_active_sessionStarted") === "true";
      if (savedStarted) {
        const savedExs = localStorage.getItem("co_active_sessionExs");
        if (savedExs) {
          try {
            return JSON.parse(savedExs);
          } catch (e) {
            console.error("Failed to parse saved sessionExs:", e);
          }
        }
      }
    }
    return [];
  });

  const [sessionNotes, setSessionNotes] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("co_active_sessionNotes") || "";
    }
    return "";
  });


  const [expandedEx, setExpandedEx] = useState(null); // índice do card aberto
  const [serieType, setSerieType] = useState("valida");
  const [serieWeight, setSerieWeight] = useState("");
  const [serieReps, setSerieReps] = useState("");
  const [draggedExIdx, setDraggedExIdx] = useState(null);

  // Excluir plano/divisão: em vez do "x" sempre visível, o usuário segura o chip
  // por 3s pra revelar o botão de remover — evita exclusões acidentais.
  const [deleteRevealGroup, setDeleteRevealGroup] = useState(null);
  const longPressTimerRef = React.useRef(null);
  const longPressFiredRef = React.useRef(false);
  const [pressingGroup, setPressingGroup] = useState(null);

  const startGroupLongPress = (g) => {
    longPressFiredRef.current = false;
    setPressingGroup(g);
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setPressingGroup(null);
      setDeleteRevealGroup(g);
    }, 3000);
  };
  const cancelGroupLongPress = () => {
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
    setPressingGroup(null);
  };
  const confirmDeleteGroup = (g) => {
    if (window.confirm(`Excluir o plano "${g}" inteiro? Isso remove o treino e todos os exercícios salvos dele.`)) {
      if (selectedGroup === g) setSelectedGroup(null);
      if (planGroup === g) {
        // Sem isso, "planGroup" ficava apontando pra um grupo que não existe mais em
        // workoutPlans (fantasma) até o usuário trocar de plano manualmente — o que causava
        // referências a um grupo indefinido em vários lugares da aba "Plano".
        planGroupTouchedRef.current = true;
        const remaining = Object.keys(workoutPlans || {}).filter((k) => k !== g);
        setPlanGroup(remaining[0] || "");
        setShowLibrary(false);
        setPlanSearch("");
      }
      deleteWorkoutPlan && deleteWorkoutPlan(g);
    }
    setDeleteRevealGroup(null);
  };

  // Esconde o botão de remover revelado automaticamente após alguns segundos sem uso.
  useEffect(() => {
    if (!deleteRevealGroup) return;
    const t = setTimeout(() => setDeleteRevealGroup(null), 4000);
    return () => clearTimeout(t);
  }, [deleteRevealGroup]);

  // Busca para adicionar exercício extra
  const [showAddEx, setShowAddEx] = useState(false);
  const [exSearch, setExSearch] = useState("");
  const [showCreateExerciseModal, setShowCreateExerciseModal] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [newExGroup, setNewExGroup] = useState(null);
  const [newExMuscle, setNewExMuscle] = useState(null);

  // Plano sub-tab
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  // Sincroniza o plano padrão da aba "Plano" com o treino programado para hoje
  // (evita ficar preso em "Push" quando o usuário mudou a divisão nas Configurações, ex: Upper/Lower)
  const [planGroup, setPlanGroup] = useState(() => {
    try {
      const dow = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][new Date().getDay()];
      const sched = state?.schedule || [];
      const todaySched = sched.find((d) => d.day === dow);
      // Não exige mais que o grupo já exista em workoutPlans — antes disso, como os planos
      // começam vazios até o usuário adicionar algo, a aba "Plano" sempre caía em "Push"
      // em vez de respeitar o grupo programado (ex: Upper/Lower) só porque ele ainda não
      // tinha nenhum exercício salvo.
      if (todaySched?.group) {
        return todaySched.group;
      }
    } catch (e) { /* noop */ }
    const keys = workoutPlans ? Object.keys(workoutPlans) : [];
    return keys[0] || "Push";
  });

  // Enquanto o usuário não trocar manualmente de plano nesta visita, mantém a aba
  // "Plano" acompanhando o grupo ativo da agenda — ex: ao editar a Semana pra Upper/Lower.
  const planGroupTouchedRef = React.useRef(false);
  const [planSearch, setPlanSearch] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);

  // Cardio & Gasto Calórico states
  const [weightDuration, setWeightDuration] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("co_active_weightDuration") || "60";
    }
    return "60";
  });
  
  const [weightKcal, setWeightKcal] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("co_active_weightKcal") || "360";
    }
    return "360";
  });

  const [cardios, setCardios] = useState(() => {
    if (typeof window !== "undefined") {
      const savedCardios = localStorage.getItem("co_active_cardios");
      if (savedCardios) {
        try {
          return JSON.parse(savedCardios);
        } catch (e) {
          console.error("Failed to parse saved cardios:", e);
        }
      }
    }
    return [];
  });
  
  const [showCardioForm, setShowCardioForm] = useState(false);
  const [cardioType, setCardioType] = useState("Corrida");
  const [cardioDuration, setCardioDuration] = useState("");
  const [cardioDistance, setCardioDistance] = useState("");
  const [cardioKcalOverride, setCardioKcalOverride] = useState("");

  const estimateCardioKcal = (type, min) => {
    const minutes = parseFloat(min);
    if (isNaN(minutes) || minutes <= 0) return 0;
    const rates = {
      "Corrida": 12.5,
      "Caminhada": 5.0,
      "Bicicleta": 8.0,
      "Elíptico": 9.5,
      "Outro": 7.0
    };
    const rate = rates[type] || 7.0;
    return Math.round(minutes * rate);
  };

  const estimateWeightKcal = (min) => {
    const minutes = parseFloat(min);
    if (isNaN(minutes) || minutes <= 0) return 0;
    return Math.round(minutes * 6.0);
  };

  // ── helpers ─────────────────────────────────────────────────
  const setTypeIcon = (id, size = 13) => {
    if (id === "aquecimento") return <Flame size={size} />;
    if (id === "pap")         return <Zap size={size} />;
    if (id === "feeder")      return <Droplets size={size} />;
    return <CheckCircle2 size={size} />;
  };

  const FALLBACK_SCHEDULE = [
    { day: "Seg", type: "Push", color: "#f97316", calType: "normal", group: "Push" },
    { day: "Ter", type: "Pull", color: "#3b82f6", calType: "normal", group: "Pull" },
    { day: "Qua", type: "Legs 🦵", color: "#8b5cf6", calType: "heavy", group: "Legs" },
    { day: "Qui", type: "Jiu-Jitsu 🥋", color: "#10b981", calType: "normal", group: "Upper" },
    { day: "Sex", type: "Upper", color: "#f59e0b", calType: "normal", group: "Upper" },
    { day: "Sab", type: "Lower 🦵", color: "#ec4899", calType: "heavy", group: "Lower" },
    { day: "Dom", type: "Descanso 🍕", color: "#6b7280", calType: "free", group: null },
  ];

  function schedForDate(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    const dow = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][d.getDay()];
    // "state?.schedule || FALLBACK_SCHEDULE" só cobre undefined/null — um array vazio ([])
    // é "truthy" em JS e passava direto, deixando "schedule" vazio e schedule[6] undefined,
    // o que quebrava com "Cannot read properties of undefined (reading 'group')".
    const schedule = (state?.schedule && state.schedule.length) ? state.schedule : FALLBACK_SCHEDULE;
    return schedule.find((x) => x.day === dow) || schedule[6] || FALLBACK_SCHEDULE[6];
  }

  const s = schedForDate(sessionDate);
  const activeGroup = selectedGroup || s.group;

  // Mantém a aba "Plano" sincronizada com a divisão programada na Semana (Configurações),
  // a menos que o usuário já tenha trocado manualmente de plano nesta sessão.
  useEffect(() => {
    if (planGroupTouchedRef.current) return;
    if (activeGroup && activeGroup !== planGroup) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlanGroup(activeGroup);
    }
  }, [activeGroup, planGroup]);

  // Derived values for default weight training session info
  const existingWorkout = (state.workoutLogs || []).find(w => w.date === sessionDate);
  const displayDuration = sessionStarted ? weightDuration : (existingWorkout ? "0" : "60");
  const displayKcal = sessionStarted ? weightKcal : (existingWorkout ? "0" : "360");

  // Inicializa sessão com exercícios do plano quando grupo muda
  useEffect(() => {
    if (!sessionStarted && activeGroup) {
      const plan = (workoutPlans && workoutPlans[activeGroup]) || [];
      const currentNames = sessionExs.map((e) => e.name);
      const isDifferent = plan.length !== currentNames.length || plan.some((name, i) => name !== currentNames[i]);
      if (isDifferent) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSessionExs(plan.map((name) => ({ name, sets: [] })));
      }
    }
  }, [activeGroup, sessionStarted, workoutPlans, sessionExs]);

  // Save active session to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (sessionStarted) {
        localStorage.setItem("co_active_sessionStarted", "true");
        localStorage.setItem("co_active_sessionExs", JSON.stringify(sessionExs));
        localStorage.setItem("co_active_sessionNotes", sessionNotes);
        localStorage.setItem("co_active_weightDuration", weightDuration);
        localStorage.setItem("co_active_weightKcal", weightKcal);
        localStorage.setItem("co_active_cardios", JSON.stringify(cardios));
        localStorage.setItem("co_active_sessionDate", sessionDate);
        if (selectedGroup) {
          localStorage.setItem("co_active_selectedGroup", selectedGroup);
        } else {
          localStorage.removeItem("co_active_selectedGroup");
        }
      } else {
        localStorage.removeItem("co_active_sessionStarted");
        localStorage.removeItem("co_active_sessionExs");
        localStorage.removeItem("co_active_sessionNotes");
        localStorage.removeItem("co_active_weightDuration");
        localStorage.removeItem("co_active_weightKcal");
        localStorage.removeItem("co_active_cardios");
        localStorage.removeItem("co_active_sessionDate");
        localStorage.removeItem("co_active_selectedGroup");
      }
    }
  }, [sessionStarted, sessionExs, sessionNotes, weightDuration, weightKcal, cardios, sessionDate, selectedGroup]);

  // Performance anterior (melhor série "válida" do último treino com este exercício)
  const getPrevPerf = (exName) => {
    const logs = state.workoutLogs || [];
    const all = [];
    logs.forEach((w) => w.exercises.forEach((ex) => {
      if (ex.name === exName) all.push({ date: w.date, sets: ex.sets });
    }));
    if (!all.length) return null;
    const last = all[all.length - 1];
    const vs = last.sets.filter((x) => x.type === "valida");
    if (!vs.length) return null;
    const mx = vs.reduce((a, x) => (x.weight > a.weight ? x : a), vs[0]);
    const vol = vs.reduce((a, x) => a + x.weight * x.reps, 0);
    return { lastWeight: mx.weight, lastReps: mx.reps, vol };
  };

  // Última série registrada de fato (não a "melhor") — usada como placeholder nos campos
  // de Carga/Reps, pra lembrar rapidamente o que foi feito no treino anterior desse exercício.
  const getLastSetPerf = (exName) => {
    const logs = state.workoutLogs || [];
    const all = [];
    logs.forEach((w) => w.exercises.forEach((ex) => {
      if (ex.name === exName && ex.sets && ex.sets.length) all.push({ date: w.date, sets: ex.sets });
    }));
    if (!all.length) return null;
    const last = all[all.length - 1];
    const validSets = last.sets.filter((x) => x.type === "valida");
    const lastSet = (validSets.length ? validSets : last.sets)[(validSets.length ? validSets : last.sets).length - 1];
    if (!lastSet) return null;
    return { weight: lastSet.weight, reps: lastSet.reps, date: last.date };
  };

  // Todas as séries válidas da última sessão em que esse exercício apareceu — usado pra
  // montar a "fila" de séries sugeridas (placeholders) quando o exercício é aberto sem
  // nenhuma série feita hoje ainda. Assim o usuário só confirma/remove em vez de digitar tudo de novo.
  const getLastSessionSets = (exName) => {
    const logs = state.workoutLogs || [];
    const all = [];
    logs.forEach((w) => w.exercises.forEach((ex) => {
      if (ex.name === exName && ex.sets && ex.sets.length) all.push({ date: w.date, sets: ex.sets });
    }));
    if (!all.length) return [];
    const last = all[all.length - 1];
    const validSets = last.sets.filter((x) => x.type === "valida");
    const source = validSets.length ? validSets : last.sets;
    return source.map((s) => ({ weight: s.weight, reps: s.reps, type: "valida" }));
  };

  // Fila de séries sugeridas por exercício (chave = nome do exercício). Nasce como uma cópia
  // das séries da última sessão assim que o card é aberto sem séries feitas hoje; o usuário
  // pode confirmar cada uma com um toque, remover (fazer uma a menos) ou adicionar mais uma
  // (fazer uma a mais que da última vez).
  const [pendingSetQueues, setPendingSetQueues] = useState({});

  // Reseta as filas sugeridas ao trocar a data da sessão (contexto de treino diferente).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendingSetQueues({});
  }, [sessionDate]);

  // Efeito para auto-preencher carga/reps ao expandir card (apenas com séries já feitas HOJE).
  // Quando não há série feita hoje ainda, deixamos os campos vazios e mostramos o desempenho
  // do treino anterior como *placeholder* (texto fantasma), não como valor pré-preenchido —
  // assim o usuário sempre confirma explicitamente a carga/reps que está fazendo agora.
  useEffect(() => {
    if (expandedEx !== null && expandedEx !== undefined && sessionExs[expandedEx]) {
      const ex = sessionExs[expandedEx];
      if (ex.sets && ex.sets.length > 0) {
        const lastSet = ex.sets[ex.sets.length - 1];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSerieWeight(String(lastSet.weight));
         
        setSerieReps(String(lastSet.reps));
      } else {
         
        setSerieWeight("");
         
        setSerieReps("");
        // Ainda não tem nenhuma série feita hoje: monta a fila de séries sugeridas
        // com base na última sessão, se ainda não existir uma fila pra esse exercício.
        setPendingSetQueues((prev) => {
          if (prev[ex.name] !== undefined) return prev;
          const suggested = getLastSessionSets(ex.name);
          return suggested.length ? { ...prev, [ex.name]: suggested } : prev;
        });
      }
    }
  }, [expandedEx, sessionExs]);

  // ── handlers da fila de séries sugeridas ─────────────────────
  // Confirma a série sugerida no topo da fila: registra ela de fato e a remove da fila.
  const handleUseQueuedSet = (exIdx, queueIdx) => {
    const exName = sessionExs[exIdx]?.name;
    const queued = pendingSetQueues[exName]?.[queueIdx];
    if (!queued) return;
    setSessionStarted(true);
    setSessionExs((prev) =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: [...ex.sets, { type: queued.type, weight: queued.weight, reps: queued.reps }] } : ex
      )
    );
    setPendingSetQueues((prev) => ({
      ...prev,
      [exName]: (prev[exName] || []).filter((_, i) => i !== queueIdx),
    }));
    setRestTimerExName(exName || "");
    fireRestTimer();
  };

  // Remove uma série da fila sem registrá-la — usado quando o usuário vai fazer
  // uma série a menos do que na última sessão.
  const handleRemoveQueuedSet = (exIdx, queueIdx) => {
    const exName = sessionExs[exIdx]?.name;
    setPendingSetQueues((prev) => ({
      ...prev,
      [exName]: (prev[exName] || []).filter((_, i) => i !== queueIdx),
    }));
  };

  // Adiciona mais uma série sugerida ao fim da fila (cópia da última) — usado quando o
  // usuário vai fazer uma série a mais do que na última sessão.
  const handleAddQueuedSet = (exIdx) => {
    const exName = sessionExs[exIdx]?.name;
    const queue = pendingSetQueues[exName] || [];
    const ex = sessionExs[exIdx];
    const base = queue[queue.length - 1] || ex?.sets?.[ex.sets.length - 1] || getLastSetPerf(exName);
    if (!base) return;
    setPendingSetQueues((prev) => ({
      ...prev,
      [exName]: [...queue, { weight: base.weight, reps: base.reps, type: "valida" }],
    }));
  };

  // ── handlers de séries ───────────────────────────────────────
  const handleAddSet = (exIdx) => {
    const w = parseFloat(serieWeight);
    const r = parseInt(serieReps);
    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return;
    setSessionStarted(true);
    setSessionExs((prev) =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: [...ex.sets, { type: serieType, weight: w, reps: r }] } : ex
      )
    );
    // Se havia uma série sugerida na fila, ela foi "consumida" por esse registro manual —
    // remove o topo da fila pra não sugerir a mesma série de novo.
    const exName = sessionExs[exIdx]?.name;
    setPendingSetQueues((prev) => {
      if (!prev[exName] || !prev[exName].length) return prev;
      return { ...prev, [exName]: prev[exName].slice(1) };
    });
    // Dispara o cronômetro de descanso automaticamente após registrar a série
    setRestTimerExName(sessionExs[exIdx]?.name || "");
    fireRestTimer();
    // Não limpa mais os inputs para permitir adicionar séries idênticas rapidamente
  };

  const handleRemoveSet = (exIdx, setIdx) => {
    setSessionStarted(true);
    setSessionExs((prev) =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: ex.sets.filter((_, si) => si !== setIdx) } : ex
      )
    );
  };

  // Remove o exercício da sessão de hoje E do plano salvo do grupo, em uma única ação —
  // sem isso, o exercício "removido" voltava a aparecer no próximo treino porque continuava
  // salvo no plano (workoutPlans[activeGroup]).
  const handleRemoveEx = (exIdx) => {
    const exName = sessionExs[exIdx]?.name;
    setSessionExs((prev) => prev.filter((_, i) => i !== exIdx));
    setSessionStarted(true);
    if (expandedEx === exIdx) setExpandedEx(null);
    else if (expandedEx > exIdx) setExpandedEx((p) => p - 1);
    if (exName) {
      setPendingSetQueues((prev) => {
        if (prev[exName] === undefined) return prev;
        const next = { ...prev };
        delete next[exName];
        return next;
      });
    }

    // Também remove do plano permanente do grupo ativo, se ele estiver lá
    if (exName && activeGroup && workoutPlans && Array.isArray(workoutPlans[activeGroup]) && workoutPlans[activeGroup].includes(exName)) {
      saveWorkoutPlan(activeGroup, workoutPlans[activeGroup].filter((n) => n !== exName));
    }
  };

  // Adiciona o exercício à sessão de hoje E ao plano salvo do grupo, em uma única ação —
  // sem isso, o exercício ficava só na sessão de hoje (cache local), então sumia ao trocar
  // de aba antes de logar uma série, ou simplesmente não aparecia mais numa próxima sessão/
  // semana seguinte, porque nunca tinha sido salvo em workoutPlans[activeGroup].
  const handleAddExToSession = (name) => {
    if (sessionExs.some((e) => e.name === name)) return;
    setSessionExs((prev) => {
      const newExs = [...prev, { name, sets: [] }];
      // Auto-expande o novo card de exercício
      setExpandedEx(newExs.length - 1);
      return newExs;
    });
    setSessionStarted(true);
    // O painel agora fica aberto para permitir múltiplos cadastros
    setExSearch("");

    // Também adiciona ao plano permanente do grupo ativo, se ainda não estiver lá
    if (activeGroup && !(workoutPlans[activeGroup] || []).includes(name)) {
      saveWorkoutPlan(activeGroup, [...(workoutPlans[activeGroup] || []), name]);
    }
  };

  const handleSaveWorkout = () => {
    const finalExs = sessionExs.filter((ex) => ex.sets.length > 0);

    const wDur = parseInt(displayDuration);
    const wKcal = parseInt(displayKcal);
    if (finalExs.length > 0 && wDur > 0) {
      finalExs.push({
        name: "Treino de Força (Info)",
        isMetadata: true,
        duration: wDur,
        kcal: wKcal
      });
    }

    cardios.forEach(c => {
      finalExs.push({
        name: `Cardio (${c.type})`,
        isCardio: true,
        cardioType: c.type,
        duration: c.duration,
        distance: c.distance,
        kcal: c.kcal
      });
    });

    // Ao encerrar o treino, salva o que tiver sido registrado (se houver). Antes, sem
    // nenhuma série válida essa função simplesmente não fazia nada — e como "Encerrar
    // Treino" chama essa mesma função, o usuário ficava travado sem conseguir fechar.
    // Agora sempre limpa a sessão e fecha o modal, com ou sem dados pra salvar.
    if (finalExs.length > 0) {
      const volume = finalExs
        .filter(ex => !ex.isCardio && !ex.isMetadata)
        .reduce((tot, ex) =>
          tot + ex.sets.filter((x) => x.type === "valida").reduce((a, x) => a + x.weight * x.reps, 0), 0);

      saveSessionWorkout({ date: sessionDate, type: s.type, exercises: finalExs, notes: sessionNotes, volume });
    }

    setSessionExs(activeGroup ? (workoutPlans[activeGroup] || []).map((n) => ({ name: n, sets: [] })) : []);
    setSessionNotes("");
    setSessionStarted(false);
    setExpandedEx(null);
    setWeightDuration("60");
    setWeightKcal("360");
    setCardios([]);
    setShowCardioForm(false);
    endSessionTimer();
    setSessionModalOpen(false);
  };

  const resetSession = () => {
    setSessionExs(activeGroup ? (workoutPlans[activeGroup] || []).map((n) => ({ name: n, sets: [] })) : []);
    setSessionNotes("");
    setSessionStarted(false);
    setExpandedEx(null);
    setWeightDuration("60");
    setWeightKcal("360");
    setCardios([]);
    setShowCardioForm(false);
  };

  // ── handlers de plano ────────────────────────────────────────
  const planExercises = (workoutPlans && workoutPlans[planGroup]) || [];
  const libraryExs = (DEFAULT_EXERCISES && DEFAULT_EXERCISES[planGroup]) || [];
  const allForGroup = getExercises ? getExercises(planGroup) : libraryExs;
  const filteredLib = planSearch
    ? allForGroup.filter((e) => e.toLowerCase().includes(planSearch.toLowerCase()))
    : allForGroup;

  const addToPlan = (name) => {
    if (planExercises.includes(name)) return;
    saveWorkoutPlan(planGroup, [...planExercises, name]);
  };

  const removeFromPlan = (name) => {
    saveWorkoutPlan(planGroup, planExercises.filter((e) => e !== name));
  };

  // Histórico
  const dates = [...new Set((state.workoutLogs || []).map((w) => w.date))].sort().reverse();
  const activeHistDate = histWrkDate || dates[0] || "";

  const hasSets = sessionExs.some((e) => e.sets.length > 0);

  return (
    <div>
      {/* Header */}
      <div style={{ position: "relative", background: `linear-gradient(135deg, ${s.color}18, rgba(255,255,255,0.02))`, border: `1px solid ${s.color}30`, borderRadius: "20px", padding: "18px 20px", marginBottom: "14px" }}>
        {restTimer && <RestTimerBadge timer={restTimer} />}
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginBottom: "3px" }}>
          {sessionDate === today() ? "Treino de Hoje" : `Treino de ${fmtDate(sessionDate)}`}
        </div>
        <div className="syne" style={{ fontSize: "22px", fontWeight: "800", color: s.color }}>{s.type}</div>
        <div className="small" style={{ marginTop: "3px" }}>
          {activeGroup ? `${ALL_GROUPS.includes(activeGroup) ? activeGroup : activeGroup} · ${sessionExs.length} exercícios` : "Selecione um grupo abaixo"}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="sub-tabs" style={{ marginBottom: "14px" }}>
        {[{ id: "session", label: "Sessão" }, { id: "plan", label: "Plano" }, { id: "semana", label: "Semana" }, { id: "history", label: "Histórico" }].map((t) => (
          <button key={t.id} className={`sub-tab ${activeSubTab === t.id ? "active" : ""}`} onClick={() => setActiveSubTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ─────────── SESSÃO ─────────── */}
      {activeSubTab === "session" && (
        <div>
          {(() => {
            const hasActiveSession = sessionStarted || !!sessionStartedAt;
            const mm = String(Math.floor(sessionElapsed / 60)).padStart(2, "0");
            const ss = String(sessionElapsed % 60).padStart(2, "0");
            // Nome do treino de hoje = o grupo/plano que realmente vai abrir na sessão
            // (o mesmo que aparece na aba Plano), não um rótulo separado que poderia
            // ter sido editado de forma diferente no Personalizar Semana.
            const todayPlanLabel = activeGroup || s.type || "Treino de hoje";
            return (
              <div className="card" style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 18px", marginBottom: "14px",
                border: hasActiveSession ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(255,255,255,0.08)",
                background: hasActiveSession ? "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(255,255,255,0.02))" : undefined,
              }}>
                <div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "2px" }}>
                    {hasActiveSession ? "Treino em andamento" : `Hoje: ${todayPlanLabel}`}
                  </div>
                  <div className="syne" style={{ fontSize: hasActiveSession ? "26px" : "16px", fontWeight: "800", color: "#fff", fontVariantNumeric: "tabular-nums" }}>
                    {hasActiveSession ? `${mm}:${ss}` : "Pronto pra treinar?"}
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ padding: "12px 20px", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
                  onClick={() => {
                    if (!hasActiveSession) startSession(); else { if (!sessionStartedAt) startSession(); else setSessionModalOpen(true); }
                  }}
                >
                  {hasActiveSession ? "Continuar Treino" : "Iniciar Treino"}
                </button>
              </div>
            );
          })()}

          {/* Último treino desta divisão — visível direto na aba (sem precisar abrir o
              modal), pra dar uma olhada rápida no que foi feito da última vez antes de
              decidir iniciar. Só aparece fora de uma sessão ativa, pra não poluir a tela
              enquanto o usuário já está treinando. */}
          {!sessionStarted && !sessionStartedAt && (() => {
            if (!activeGroup) return null;
            const planNames = new Set(workoutPlans[activeGroup] || []);
            const logs = [...(state?.workoutLogs || [])]
              .filter((w) => w.date !== sessionDate)
              .sort((a, b) => (a.date < b.date ? 1 : -1));
            const last = logs.find((w) => (w.exercises || []).some((ex) => !ex.isCardio && !ex.isMetadata && planNames.has(ex.name)));
            if (!last) return null;
            const realExs = (last.exercises || []).filter((ex) => !ex.isCardio && !ex.isMetadata);
            return (
              <div className="card" style={{ marginBottom: "14px" }}>
                <div className="row-sb" style={{ marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
                    Último treino de {activeGroup} · {fmtDate(last.date)}
                  </span>
                  <span className="small">Vol: {last.volume}kg</span>
                </div>
                {realExs.map((ex, i) => {
                  const validSets = (ex.sets || []).filter((x) => x.type === "valida");
                  const bestSet = validSets[validSets.length - 1];
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "4px 0", color: "rgba(255,255,255,0.7)" }}>
                      <span>{ex.name}</span>
                      {bestSet && <span style={{ color: "#f97316", fontWeight: 700 }}>{bestSet.weight}kg × {bestSet.reps}</span>}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Modal de registro: exercícios, séries e cargas. Fechar (X) não encerra a sessão
              nem o cronômetro — só volta pro cartão "Continuar Sessão" acima; tudo o que foi
              registrado continua salvo e o cronômetro segue contando normalmente.
              Tamanho fixo tipo "tela de celular" mesmo no desktop — em telas grandes ele NÃO
              esticava e ficava gigante, então agora fica centralizado com largura máxima. */}
          {sessionModalOpen && (
            <div
              onClick={(e) => { if (e.target === e.currentTarget) setSessionModalOpen(false); }}
              style={{
                position: "fixed", inset: 0, zIndex: 800,
                background: "rgba(0,0,0,0.85)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "16px",
              }}
            >
              <div style={{
                width: "100%", maxWidth: "460px", height: "min(860px, 92dvh)",
                background: "#0a0a0f", borderRadius: "24px",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                display: "flex", flexDirection: "column", overflow: "hidden",
              }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0,
              }}>
                <div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>Treino em andamento</div>
                  <div className="syne" style={{ fontSize: "18px", fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
                    {String(Math.floor(sessionElapsed / 60)).padStart(2, "0")}:{String(sessionElapsed % 60).padStart(2, "0")}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    onClick={handleSaveWorkout}
                    className="btn-danger"
                    style={{ padding: "8px 12px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}
                    title="Salva o treino registrado e encerra"
                  >
                    Encerrar Treino
                  </button>
                  <button
                    onClick={() => setSessionModalOpen(false)}
                    style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", flexShrink: 0 }}
                    aria-label="Fechar (o treino continua ativo)"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 16px 24px" }}>
          {/* Date + group */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", minWidth: 0 }}>
            <input type="date" value={sessionDate} max={today()} onChange={(e) => { setSessionDate(e.target.value || today()); setSessionStarted(false); }}
              style={{ fontWeight: "600", fontSize: "13px", minWidth: 0, flex: 1, width: "100%" }} />
            {sessionDate !== today() && (
              <button className="btn btn-ghost" style={{ padding: "10px 12px", fontSize: "12px", flexShrink: 0, whiteSpace: "nowrap" }} onClick={() => { setSessionDate(today()); setSessionStarted(false); }}>Hoje</button>
            )}
          </div>

          {/* Group selector — planos dinâmicos. Segure um chip por 3s pra revelar "remover". */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
            {ALL_GROUPS.map((g) => (
              <div key={g} style={{ position: "relative", display: "inline-flex" }}>
                <button
                  onMouseDown={() => startGroupLongPress(g)}
                  onMouseUp={cancelGroupLongPress}
                  onMouseLeave={cancelGroupLongPress}
                  onTouchStart={() => startGroupLongPress(g)}
                  onTouchEnd={cancelGroupLongPress}
                  onClick={() => {
                    if (longPressFiredRef.current) { longPressFiredRef.current = false; return; }
                    if (g === activeGroup) {
                      // Clicar no grupo já ativo apenas desmarca a seleção manual (volta a
                      // seguir o grupo programado na Semana), só faz sentido antes de logar séries.
                      if (!sessionStarted) setSelectedGroup(null);
                      return;
                    }
                    // Bug corrigido: antes, depois de registrar a primeira série (sessionStarted
                    // = true), trocar de grupo só atualizava a aba selecionada — a lista de
                    // exercícios continuava sendo a do grupo anterior (ex: Push ficava aparecendo
                    // mesmo depois de trocar pra Pull). Agora a lista é sempre recarregada do
                    // plano do novo grupo.
                    const hasLoggedSets = sessionExs.some((e) => e.sets && e.sets.length > 0);
                    const doSwitch = () => {
                      setSelectedGroup(g);
                      const plan = (workoutPlans && workoutPlans[g]) || [];
                      setSessionExs(plan.map((name) => ({ name, sets: [] })));
                    };
                    if (hasLoggedSets) {
                      if (window.confirm(`Trocar para "${g}" vai substituir os exercícios da sessão atual (as séries já registradas nesta troca não ficam salvas). Continuar?`)) {
                        doSwitch();
                      }
                    } else {
                      doSwitch();
                    }
                  }}
                  style={{ padding: "7px 14px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif", transition: "all 0.18s",
                    transform: pressingGroup === g ? "scale(0.94)" : "scale(1)",
                    boxShadow: pressingGroup === g ? "0 0 0 2px rgba(239,68,68,0.5)" : "none",
                    background: activeGroup === g ? "#f97316" : "rgba(255,255,255,0.07)", color: activeGroup === g ? "#fff" : "rgba(255,255,255,0.5)" }}>
                  {g}
                </button>
                {deleteRevealGroup === g && (
                  <button
                    onClick={(e) => { e.stopPropagation(); confirmDeleteGroup(g); }}
                    title={`Excluir plano "${g}"`}
                    style={{
                      position: "absolute", top: "-8px", right: "-8px", width: "18px", height: "18px",
                      borderRadius: "50%", border: "1px solid rgba(0,0,0,0.3)", background: "#ef4444", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0,
                      animation: "fadeInDelete 0.15s ease-out",
                    }}
                  >
                    <X size={10} strokeWidth={3} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Adicionar Exercício à Sessão */}
          {activeGroup && (
            <div style={{ marginBottom: "14px" }}>
              {!showAddEx ? (
                <button
                  className="btn btn-ghost"
                  style={{ width: "100%", padding: "10px", fontSize: "12px", border: "1px dashed rgba(255,255,255,0.15)", color: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                  onClick={() => setShowAddEx(true)}
                >
                  <Plus size={14} /> Adicionar Exercício
                </button>
              ) : (
                <div className="card" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontWeight: "700", fontSize: "12px", color: "#f97316" }}>Selecionar Exercício</span>
                    <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }} onClick={() => setShowAddEx(false)}>
                      <X size={14} />
                    </button>
                  </div>
                  <div style={{ position: "relative", marginBottom: "10px" }}>
                    <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                    <input
                      type="text"
                      placeholder="Buscar exercício..."
                      value={exSearch}
                      onChange={(e) => setExSearch(e.target.value)}
                      style={{ paddingLeft: "32px", fontSize: "12px" }}
                    />
                  </div>
                  {(() => {
                    const filtered = getExercises(activeGroup).filter(name => !exSearch || name.toLowerCase().includes(exSearch.toLowerCase()));
                    return (
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "6px" }}>
                        {filtered.length} exercício{filtered.length === 1 ? "" : "s"} encontrado{filtered.length === 1 ? "" : "s"}{!exSearch && " — role a lista pra ver todos"}
                      </div>
                    );
                  })()}
                  <div style={{ maxHeight: "340px", overflowY: "auto" }}>
                    {getExercises(activeGroup)
                      .filter(name => !exSearch || name.toLowerCase().includes(exSearch.toLowerCase()))
                      .map(name => {
                        const inSession = sessionExs.some(e => e.name === name);
                        return (
                          <div
                            key={name}
                            onClick={() => !inSession && handleAddExToSession(name)}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 10px",
                              borderRadius: "8px",
                              cursor: inSession ? "default" : "pointer",
                              marginBottom: "2px",
                              background: inSession ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
                              opacity: inSession ? 0.6 : 1
                            }}
                          >
                            <span style={{ fontSize: "12px" }}>{name}</span>
                            {inSession ? <CheckCircle2 size={12} style={{ color: "#10b981" }} /> : <Plus size={12} style={{ color: "#f97316" }} />}
                          </div>
                        );
                      })}
                  </div>
                  {exSearch && !getExercises(activeGroup).some(name => name.toLowerCase() === exSearch.trim().toLowerCase()) && (
                    <button
                      className="btn btn-ghost"
                      style={{ width: "100%", padding: "8px", fontSize: "12px", border: "1px dashed rgba(249,115,22,0.3)", color: "#f97316", marginTop: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                      onClick={() => setShowCreateExerciseModal(true)}
                    >
                      <Plus size={12} /> {`Criar "${exSearch.trim()}"`}
                    </button>
                  )}
                  <button
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      padding: "10px",
                      fontSize: "12px",
                      marginTop: "10px",
                      background: "#f97316",
                      color: "#fff",
                      fontWeight: "bold",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      cursor: "pointer",
                      border: "none"
                    }}
                    onClick={() => setShowAddEx(false)}
                  >
                    Concluir
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Exercise cards — agrupados por músculo */}
          {(() => {
            // Card compacto por padrão — toca para expandir e adicionar série
            const renderExCard = (ex, exIdx) => {
              const isOpen = expandedEx === exIdx;
              const prev = getPrevPerf(ex.name);
              const lastSet = getLastSetPerf(ex.name);
              
              // Calcular volume total da sessão atual para o exercício
              const totalVolume = ex.sets
                .filter(s => s.type === "valida" || s.type === "pap")
                .reduce((acc, s) => acc + (s.weight * s.reps), 0);

              // Resumo por tipo de série
              const setsByType = SET_TYPES.map((t) => {
                const ofType = ex.sets.filter((x) => x.type === t.id);
                const vol = ofType.reduce((a, x) => a + x.weight * x.reps, 0);
                return { ...t, count: ofType.length, vol };
              }).filter((t) => t.count > 0);

              const isDragged = draggedExIdx === exIdx;
              return (
                <div key={exIdx} 
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedExIdx === null || draggedExIdx === exIdx) return;
                    const updated = [...sessionExs];
                    const [draggedItem] = updated.splice(draggedExIdx, 1);
                    updated.splice(exIdx, 0, draggedItem);
                    setSessionExs(updated);
                    setDraggedExIdx(null);
                  }}
                  style={{ 
                    background: isOpen ? "linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.015) 100%)" : "rgba(255, 255, 255, 0.02)", 
                    border: `1px solid ${isOpen ? "rgba(249, 115, 22, 0.4)" : "rgba(255, 255, 255, 0.06)"}`, 
                    borderRadius: "16px", 
                    overflow: "hidden", 
                    marginBottom: "10px", 
                    transition: "all 0.2s ease-in-out",
                    boxShadow: isOpen ? "0 8px 30px rgba(0, 0, 0, 0.35), 0 0 15px rgba(249, 115, 22, 0.06)" : "none",
                    opacity: isDragged ? 0.35 : 1,
                  }}
                >

                  {/* Cabeçalho — toca para abrir/fechar */}
                  <div onClick={() => setExpandedEx(isOpen ? null : exIdx)}
                    style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                      <div 
                        draggable={true}
                        onDragStart={(e) => {
                          setDraggedExIdx(exIdx);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => {
                          setDraggedExIdx(null);
                        }}
                        onClick={(e) => e.stopPropagation()} // Prevent expand/collapse when dragging
                        style={{ cursor: "grab", display: "flex", alignItems: "center", padding: "4px 2px" }}
                      >
                        <GripVertical size={16} style={{ color: "rgba(255,255,255,0.2)" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{ fontWeight:"700",fontSize:"14px",color:isOpen?"#f97316":"#fff",transition:"color 0.2s",cursor:"pointer",textDecoration:"underline dotted",textUnderlineOffset:"3px",textDecorationColor:"rgba(249,115,22,0.35)" }}
                          onClick={e=>{e.stopPropagation();openGuideModal&&openGuideModal(ex.name);}}
                          title="Ver como executar"
                        >{ex.name}</div>
                      {ex.sets.length > 0 ? (
                        <div style={{ fontSize: "11px", marginTop: "3px", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ color: "#f97316", fontWeight: "700" }}>{ex.sets.length} {ex.sets.length === 1 ? 'série' : 'séries'}</span>
                          <span>•</span>
                          <span>Volume: <strong>{totalVolume} kg</strong></span>
                        </div>
                      ) : (
                        <div style={{ fontSize: "11px", marginTop: "3px", color: "rgba(255,255,255,0.3)" }}>
                          {prev ? `Melhor Anterior: ${prev.lastWeight}kg × ${prev.lastReps} (Vol: ${prev.vol}kg)` : "Nenhuma série registrada hoje"}
                        </div>
                      )}
                    </div>
                  </div>
                    <div className="row" style={{ gap: "6px", background: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "3px 6px" }} onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-ghost" style={{ width: "26px", height: "26px", padding: "0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => openHistoryModal && openHistoryModal(ex.name)} title="Histórico"><History size={12} /></button>
                      <button className="btn-danger" style={{ width: "26px", height: "26px", padding: "0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => handleRemoveEx(exIdx)} title="Remover do treino de hoje e do plano"><X size={11} /></button>
                    </div>
                  </div>

                  {/* Séries já registradas — Grid Layout */}
                  {ex.sets.length > 0 && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1.5fr 1.5fr 0.5fr", gap: "8px", padding: "6px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "9px", fontWeight: "800", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        <span>Série</span>
                        <span style={{ textAlign: "center" }}>Tipo</span>
                        <span style={{ textAlign: "right" }}>Carga</span>
                        <span style={{ textAlign: "right" }}>Reps</span>
                        <span></span>
                      </div>
                      <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                        {ex.sets.map((set, sIdx) => {
                          const ts = SET_TYPES.find((x) => x.id === set.type) || SET_TYPES[1];
                          return (
                            <div key={sIdx} style={{ 
                              display: "grid", 
                              gridTemplateColumns: "1.2fr 1.5fr 1.5fr 1.5fr 0.5fr", 
                              gap: "8px", 
                              alignItems: "center", 
                              padding: "8px 16px", 
                              borderBottom: "1px solid rgba(255,255,255,0.03)", 
                              background: sIdx % 2 === 0 ? "rgba(255,255,255,0.005)" : "transparent" 
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ display: "inline-flex", width: "18px", height: "18px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)", fontSize: "10px", fontWeight: "800", alignItems: "center", justifyContent: "center" }}>{sIdx + 1}</span>
                              </div>
                              <span style={{ textTransform: "uppercase", fontSize: "8px", fontWeight: "900", color: ts.color, background: ts.color + "15", padding: "2px 6px", borderRadius: "4px", textAlign: "center", width: "fit-content", justifySelf: "center" }}>{ts.label}</span>
                              <span style={{ fontSize: "12px", fontWeight: "700", color: "#fff", textAlign: "right" }}>{set.weight}<span style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", fontWeight: "500", marginLeft: "1px" }}>kg</span></span>
                              <span style={{ fontSize: "12px", fontWeight: "700", color: "#fff", textAlign: "right" }}>{set.reps}<span style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", fontWeight: "500", marginLeft: "1px" }}>reps</span></span>
                              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button style={{ background: "none", border: "none", color: "rgba(239,68,68,0.5)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }} onClick={() => handleRemoveSet(exIdx, sIdx)}><X size={11} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Formulário expansível inline */}
                  {isOpen && (
                    <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
                      {/* Fila de séries sugeridas com base na última sessão — toque pra confirmar,
                          X pra pular (uma série a menos), + pra acrescentar (uma série a mais) */}
                      {(pendingSetQueues[ex.name] || []).length > 0 && (
                        <div style={{ marginBottom: "12px", padding: "8px 10px", borderRadius: "10px", border: "1px dashed rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.05)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                            <History size={11} style={{ color: "#f97316", flexShrink: 0 }} />
                            <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                              Igual ao último treino — confirme ou ajuste
                            </span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                            {pendingSetQueues[ex.name].map((qs, qIdx) => (
                              <div key={qIdx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ display: "inline-flex", width: "18px", height: "18px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontSize: "10px", fontWeight: "800", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  {(ex.sets?.length || 0) + qIdx + 1}
                                </span>
                                <button
                                  onClick={() => handleUseQueuedSet(exIdx, qIdx)}
                                  style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.05)", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
                                  title="Confirmar essa série"
                                >
                                  <span style={{ fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.75)" }}>{qs.weight}kg × {qs.reps} reps</span>
                                  <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px", fontWeight: "700", color: "#22c55e" }}><CheckCircle2 size={12} /> usar</span>
                                </button>
                                <button
                                  onClick={() => handleRemoveQueuedSet(exIdx, qIdx)}
                                  title="Pular essa série (fazer uma a menos)"
                                  style={{ flexShrink: 0, width: "26px", height: "26px", borderRadius: "8px", border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleAddQueuedSet(exIdx)}
                            title="Adicionar mais uma série (fazer uma a mais)"
                            style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "8px", padding: "5px 8px", borderRadius: "7px", border: "1px dashed rgba(255,255,255,0.15)", background: "none", color: "rgba(255,255,255,0.45)", fontSize: "10px", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
                          >
                            <Plus size={11} /> Mais uma série
                          </button>
                        </div>
                      )}
                      {/* Chip com desempenho do treino anterior — toque pra copiar pros campos */}
                      {lastSet && (
                        <button
                          onClick={() => { setSerieWeight(String(lastSet.weight)); setSerieReps(String(lastSet.reps)); }}
                          style={{
                            display: "flex", alignItems: "center", gap: "6px", width: "100%",
                            marginBottom: "10px", padding: "7px 10px", borderRadius: "8px",
                            border: "1px dashed rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.06)",
                            cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                          }}
                          title="Usar carga/reps do último treino"
                        >
                          <History size={11} style={{ color: "#f97316", flexShrink: 0 }} />
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)" }}>
                            Último treino: <strong style={{ color: "#f97316" }}>{lastSet.weight}kg × {lastSet.reps}</strong>
                          </span>
                          <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: "700", color: "#f97316" }}>usar</span>
                        </button>
                      )}
                      {/* Tipo de série */}
                      <div style={{ display: "flex", gap: "4px", marginBottom: "10px" }}>
                        {SET_TYPES.map((t) => (
                          <button key={t.id} onClick={() => setSerieType(t.id)}
                            style={{ 
                              flex: 1, 
                              padding: "6px 2px", 
                              borderRadius: "6px", 
                              border: "none", 
                              cursor: "pointer", 
                              fontSize: "9px", 
                              fontWeight: "700", 
                              fontFamily: "'DM Sans',sans-serif",
                              background: serieType === t.id ? t.color : "rgba(255,255,255,0.04)", 
                              color: serieType === t.id ? "#fff" : "rgba(255,255,255,0.4)", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              gap: "2px",
                              transition: "all 0.15s" 
                            }}>
                            {setTypeIcon(t.id, 10)} {t.label}
                          </button>
                        ))}
                      </div>
                      {/* Peso × Reps + botão confirmar */}
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <div style={{ flex: 1, position: "relative" }}>
                          <input type="number" placeholder={lastSet ? `Últ: ${lastSet.weight}` : "Carga"} value={serieWeight} onChange={(e) => setSerieWeight(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && document.getElementById(`reps-${exIdx}`)?.focus()}
                            style={{ width: "100%", padding: "10px", paddingRight: "30px", fontSize: "13px", fontWeight: "700", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", textAlign: "center" }} />
                          <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "9px", color: "rgba(255,255,255,0.3)", fontWeight: "700" }}>kg</span>
                        </div>
                        <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: "700", fontSize: "14px" }}>×</span>
                        <div style={{ flex: 1, position: "relative" }}>
                          <input id={`reps-${exIdx}`} type="number" placeholder={lastSet ? `Últ: ${lastSet.reps}` : "Reps"} value={serieReps} onChange={(e) => setSerieReps(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddSet(exIdx)}
                            style={{ width: "100%", padding: "10px", paddingRight: "38px", fontSize: "13px", fontWeight: "700", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", textAlign: "center" }} />
                          <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "9px", color: "rgba(255,255,255,0.3)", fontWeight: "700" }}>reps</span>
                        </div>
                        <button onClick={() => handleAddSet(exIdx)}
                          style={{ 
                            flexShrink: 0, 
                            width: "42px", 
                            height: "42px", 
                            borderRadius: "10px", 
                            border: "none", 
                            cursor: "pointer", 
                            background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", 
                            color: "#fff", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            boxShadow: "0 4px 12px rgba(249, 115, 22, 0.25)"
                          }}>
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            };

            if (sessionExs.length === 0) return null;

            // Monta grupos musculares na ordem
            const muscleOrder = Object.keys(MUSCLE_SUBGROUPS[activeGroup] || {});
            // Exercícios que não pertencem a nenhum músculo → "Outros"
            const allRendered = new Set();

            return (
              <>
                {muscleOrder.map((muscle) => {
                  const inGroup = sessionExs.filter((ex) => getMuscle(activeGroup, ex.name, customMuscleMap) === muscle);
                  if (!inGroup.length) return null;
                  return (
                    <div key={muscle} style={{ marginBottom: "14px" }}>
                      {/* Header do músculo */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", marginTop: "12px" }}>
                        <div style={{ width: "3px", height: "12px", background: "#f97316", borderRadius: "2px" }} />
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#f97316", textTransform: "uppercase", letterSpacing: "0.8px" }}>{muscle}</span>
                      </div>
                      {inGroup.map((ex) => {
                        const exIdx = sessionExs.indexOf(ex);
                        allRendered.add(exIdx);
                        return renderExCard(ex, exIdx);
                      })}
                    </div>
                  );
                })}
                {/* Outros (exercícios customizados não mapeados) */}
                {sessionExs.some((ex, i) => !allRendered.has(i)) && (
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", marginTop: "12px" }}>
                      <div style={{ width: "3px", height: "12px", background: "rgba(255,255,255,0.3)", borderRadius: "2px" }} />
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Outros</span>
                    </div>
                    {sessionExs.map((ex, exIdx) => !allRendered.has(exIdx) ? renderExCard(ex, exIdx) : null)}
                  </div>
                )}
              </>
            );
          })()}

          {/* Cardio & Gasto Calórico — sempre visível, mesmo em dias sem grupo de treino de força
              (ex: dia de Cardio puro, Complementares, ou Descanso Ativo) */}
          {true && (
            <div className="card" style={{ marginTop: "14px" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", color: "#f97316" }}>
                <Flame size={16} /> Cardio & Gasto Calórico
              </div>

              {/* Musculação Info */}
              {hasSets && (
                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ flex: 1 }}>
                    <div className="label" style={{ marginBottom: "4px" }}>Duração Musculação (min)</div>
                    <input
                      type="number"
                      value={displayDuration}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWeightDuration(val);
                        setWeightKcal(estimateWeightKcal(val).toString());
                        setSessionStarted(true);
                      }}
                      placeholder="60"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="label" style={{ marginBottom: "4px" }}>Est. Calorias Gastas (kcal)</div>
                    <input
                      type="number"
                      value={displayKcal}
                      onChange={(e) => {
                        setWeightKcal(e.target.value);
                        setSessionStarted(true);
                      }}
                      placeholder="360"
                    />
                  </div>
                </div>
              )}

              {/* Cardios logged list */}
              {cardios.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <div className="label" style={{ marginBottom: "6px" }}>Cardios Adicionados:</div>
                  {cardios.map((c, idx) => (
                    <div key={idx} className="row-sb" style={{ background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: "10px", marginBottom: "6px", fontSize: "12px" }}>
                      <span>
                        🏃 **{c.type}** · {c.duration} min {c.distance ? `· ${c.distance} km` : ""} · ~{c.kcal} kcal
                      </span>
                      <button
                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}
                        onClick={() => setCardios(prev => prev.filter((_, ci) => ci !== idx))}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Cardio Form */}
              {showCardioForm ? (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "12px", marginBottom: "12px" }}>
                  <div style={{ fontWeight: "700", fontSize: "12px", marginBottom: "10px", color: "#10b981" }}>Adicionar Cardio</div>
                  
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <div className="label" style={{ marginBottom: "3px" }}>Tipo</div>
                      <select
                        value={cardioType}
                        onChange={(e) => {
                          setCardioType(e.target.value);
                          const est = estimateCardioKcal(e.target.value, cardioDuration);
                          setCardioKcalOverride(est ? est.toString() : "");
                        }}
                        style={{ padding: "8px", fontSize: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "8px", width: "100%" }}
                      >
                        {["Corrida", "Caminhada", "Bicicleta", "Elíptico", "Outro"].map(t => (
                          <option key={t} value={t} style={{ background: "#0a0a0f" }}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="label" style={{ marginBottom: "3px" }}>Duração (min)</div>
                      <input
                        type="number"
                        placeholder="min"
                        value={cardioDuration}
                        onChange={(e) => {
                          setCardioDuration(e.target.value);
                          const est = estimateCardioKcal(cardioType, e.target.value);
                          setCardioKcalOverride(est ? est.toString() : "");
                        }}
                        style={{ padding: "8px", fontSize: "12px" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <div className="label" style={{ marginBottom: "3px" }}>Distância (km - opcional)</div>
                      <input
                        type="number"
                        placeholder="km"
                        value={cardioDistance}
                        onChange={(e) => setCardioDistance(e.target.value)}
                        style={{ padding: "8px", fontSize: "12px" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="label" style={{ marginBottom: "3px" }}>Calorias (kcal)</div>
                      <input
                        type="number"
                        placeholder="kcal"
                        value={cardioKcalOverride}
                        onChange={(e) => setCardioKcalOverride(e.target.value)}
                        style={{ padding: "8px", fontSize: "12px" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="btn btn-ghost"
                      style={{ flex: 1, padding: "8px" }}
                      onClick={() => {
                        setShowCardioForm(false);
                        setCardioDuration("");
                        setCardioDistance("");
                        setCardioKcalOverride("");
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, padding: "8px", background: "#10b981" }}
                      onClick={() => {
                        const dur = parseInt(cardioDuration);
                        if (isNaN(dur) || dur <= 0) return;
                        
                        const defaultEst = estimateCardioKcal(cardioType, cardioDuration);
                        const kcalVal = parseInt(cardioKcalOverride) || defaultEst;
                        
                        setCardios(prev => [...prev, {
                          type: cardioType,
                          duration: dur,
                          distance: parseFloat(cardioDistance) || 0,
                          kcal: kcalVal
                        }]);

                        setSessionStarted(true);
                        setShowCardioForm(false);
                        setCardioDuration("");
                        setCardioDistance("");
                        setCardioKcalOverride("");
                      }}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn btn-ghost"
                  style={{ width: "100%", padding: "10px", fontSize: "12px", border: "1px dashed rgba(255,255,255,0.1)", color: "#10b981", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                  onClick={() => setShowCardioForm(true)}
                >
                  <Plus size={14} /> Adicionar Cardio
                </button>
              )}

              {/* Resumo Gasto Calórico Total */}
              {(() => {
                const totalBurn = (hasSets ? parseInt(displayKcal) || 0 : 0) + cardios.reduce((acc, c) => acc + c.kcal, 0);
                if (totalBurn > 0) {
                  return (
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: "600", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px", display: "flex", justifyContent: "space-between" }}>
                      <span>Gasto calórico total estimado:</span>
                      <span style={{ color: "#ef4444", fontWeight: "700" }}>🔥 {totalBurn} kcal</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Salvar treino */}
          {(hasSets || cardios.length > 0) && (
            <div className="card">
              <textarea
                placeholder="Observações do treino..."
                value={sessionNotes}
                onChange={(e) => {
                  setSessionNotes(e.target.value);
                  setSessionStarted(true);
                }}
                style={{ height: "56px", marginBottom: "10px" }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "#f87171", borderColor: "rgba(239, 68, 68, 0.3)" }}
                  onClick={resetSession}
                >
                  Limpar
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  onClick={handleSaveWorkout}
                >
                  <Save size={15} /> Salvar Treino
                </button>
              </div>
            </div>
          )}

          {/* Saved workouts for selected date */}
          {(() => {
            const saved = (state?.workoutLogs || []).filter((w) => w.date === sessionDate);
            if (!saved.length) return null;
            return (
              <div className="card" style={{ marginTop: "12px" }}>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={13} style={{ color: "#10b981" }} />
                  {sessionDate === today() ? "Treinos salvos hoje" : `Treinos em ${fmtDate(sessionDate)}`}
                </div>
                {saved.map((w) => (
                  <div className="workout-item" key={w.id}>
                    <div className="row-sb" style={{ marginBottom: "10px" }}>
                      <span style={{ fontWeight: "700" }}>{w.type}</span>
                      <div className="row" style={{ gap: "8px" }}>
                        <span className="small">Vol total: {w.volume}kg</span>
                        {(() => {
                          const totalKcal = (w.exercises || []).reduce((acc, ex) => {
                            if (ex.isCardio || ex.isMetadata) {
                              return acc + (ex.kcal || 0);
                            }
                            return acc;
                          }, 0);
                          if (totalKcal > 0) {
                            return <span className="small" style={{ color: "#ef4444", fontWeight: "700" }}>🔥 {totalKcal} kcal</span>;
                          }
                          return null;
                        })()}
                        <button className="btn-danger" onClick={() => removeWorkoutLog(w.id)} style={{ padding: "3px 7px", display: "flex", alignItems: "center" }}><X size={11} /></button>
                      </div>
                    </div>
                    {(w.exercises || []).map((ex, ei) => {
                      if (ex.isMetadata) {
                        return (
                          <div key={ei} style={{ marginBottom: "10px", fontSize: "12px", background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: "10px" }}>
                            <div style={{ fontWeight: "700", color: "#f97316" }}>Musculação</div>
                            <div style={{ color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
                              Duração: {ex.duration} min · Gasto: ~{ex.kcal} kcal
                            </div>
                          </div>
                        );
                      }
                      if (ex.isCardio) {
                        return (
                          <div key={ei} style={{ marginBottom: "10px", fontSize: "12px", background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: "10px" }}>
                            <div style={{ fontWeight: "700", color: "#10b981" }}>Cardio ({ex.cardioType})</div>
                            <div style={{ color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
                              Duração: {ex.duration} min {ex.distance ? `· Distância: ${ex.distance} km` : ""} · Gasto: ~{ex.kcal} kcal
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={ei} style={{ marginBottom: "10px" }}>
                          <div style={{ fontWeight: "600", fontSize: "13px", marginBottom: "5px" }}>{ex.name}</div>
                          {ex.sets.map((set, si) => {
                            const ts = SET_TYPES.find((x) => x.id === set.type) || SET_TYPES[1];
                            return (
                              <div key={si} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                <span style={{ color: ts.color, display: "flex", alignItems: "center", gap: "3px", minWidth: "80px" }}>
                                  {setTypeIcon(ts.id, 11)} {ts.label}
                                </span>
                                <span style={{ fontWeight: "600" }}>{set.weight}kg × {set.reps}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })()}
              </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────── PLANO ─────────── */}
      {activeSubTab === "plan" && (
        <div>
          {/* Seletor de planos existentes — segure um chip por 3s pra revelar "remover" */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
            {ALL_GROUPS.map((g) => (
              <div key={g} style={{ position: "relative", display: "inline-flex" }}>
                <button
                  onMouseDown={() => startGroupLongPress(g)}
                  onMouseUp={cancelGroupLongPress}
                  onMouseLeave={cancelGroupLongPress}
                  onTouchStart={() => startGroupLongPress(g)}
                  onTouchEnd={cancelGroupLongPress}
                  onClick={() => {
                    if (longPressFiredRef.current) { longPressFiredRef.current = false; return; }
                    planGroupTouchedRef.current = true; setPlanGroup(g); setPlanSearch(""); setShowLibrary(false);
                  }}
                  style={{ padding:"7px 14px", borderRadius:10, border:"none", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
                    transform: pressingGroup === g ? "scale(0.94)" : "scale(1)",
                    boxShadow: pressingGroup === g ? "0 0 0 2px rgba(239,68,68,0.5)" : "none",
                    background: planGroup===g ? "#f97316" : "rgba(255,255,255,0.07)", color: planGroup===g ? "#fff" : "rgba(255,255,255,0.5)" }}>
                  {g}
                </button>
                {deleteRevealGroup === g && (
                  <button
                    onClick={(e) => { e.stopPropagation(); confirmDeleteGroup(g); }}
                    title={`Excluir plano "${g}"`}
                    style={{
                      position: "absolute", top: "-8px", right: "-8px", width: "18px", height: "18px",
                      borderRadius: "50%", border: "1px solid rgba(0,0,0,0.3)", background: "#ef4444", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0,
                      animation: "fadeInDelete 0.15s ease-out",
                    }}
                  >
                    <X size={10} strokeWidth={3} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Criar novo plano */}
          {showNewPlan ? (
            <div className="card" style={{ padding:"12px 14px", marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#f97316", marginBottom:10 }}>Novo plano de treino</div>
              <input type="text" placeholder="Nome do plano (ex: Push A, Chest Day...)"
                value={newPlanName} onChange={e=>setNewPlanName(e.target.value)}
                style={{ marginBottom:10 }}/>
              <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:.7, marginBottom:6 }}>
                Ou escolha um template
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
                {[
                  { category:"PPL Clássico",    items:["Push","Pull","Legs"] },
                  { category:"Upper/Lower",      items:["Upper","Lower"] },
                  { category:"Full Body",        items:["Full Body A","Full Body B"] },
                  { category:"Torso/Limbs",      items:["Torso","Limbs"] },
                  { category:"Ant./Post.",       items:["Anterior","Posterior"] },
                  { category:"PPL x2 (6 dias)", items:["Push A","Pull A","Legs A","Push B","Pull B","Legs B"] },
                  { category:"Por músculo",      items:["Peito","Costas","Pernas","Ombro","Braços"] },
                  { category:"Cardio & Complementares", items:["Cardio","Complementares"] },
                ].map(tpl=>(
                  <div key={tpl.category}>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginBottom:4 }}>{tpl.category}</div>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {tpl.items.map(item=>(
                        <button key={item} onClick={()=>{
                          if (!workoutPlans[item]) saveWorkoutPlan(item,[]);
                          planGroupTouchedRef.current = true; setPlanGroup(item); setShowLibrary(false); setShowNewPlan(false); setNewPlanName("");
                        }} style={{
                          padding:"5px 10px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer",
                          fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
                          background:workoutPlans[item]?"rgba(16,185,129,0.12)":"rgba(255,255,255,0.05)",
                          color:workoutPlans[item]?"#10b981":"rgba(255,255,255,0.7)",
                        }}>
                          {workoutPlans[item]?"✓ ":""}{item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>{setShowNewPlan(false);setNewPlanName("");}} className="btn btn-ghost" style={{ flex:1, fontSize:12, padding:9 }}>Cancelar</button>
                {newPlanName.trim() && (
                  <button onClick={()=>{
                    saveWorkoutPlan(newPlanName.trim(),[]);
                    planGroupTouchedRef.current = true; setPlanGroup(newPlanName.trim()); setShowNewPlan(false); setNewPlanName("");
                  }} className="btn btn-primary" style={{ flex:2, fontSize:12, padding:9 }}>Criar &quot;{newPlanName}&quot;</button>
                )}
              </div>
            </div>
          ) : (
            <button onClick={()=>setShowNewPlan(true)} style={{
              width:"100%", marginBottom:12, padding:"9px 14px", borderRadius:12,
              border:"1px dashed rgba(249,115,22,0.35)", background:"rgba(249,115,22,0.05)",
              cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
              color:"#f97316", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            }}>
              <Plus size={13}/> Novo plano / template
            </button>
          )}

          {/* Exercícios do plano */}
          <div className="card" style={{ padding: "14px 16px", marginBottom: "10px" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>
              Exercícios do treino {planGroup} ({planExercises.length})
            </div>
            {planExercises.length === 0 && (
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "16px 0" }}>Nenhum exercício no plano. Adicione da biblioteca abaixo.</div>
            )}
            {planExercises.map((name) => (
              <div key={name} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0,cursor:"pointer" }}
                  onClick={()=>openGuideModal&&openGuideModal(name)}>
                  <div style={{ width:28,height:28,borderRadius:8,background:"rgba(249,115,22,0.1)",border:"1px solid rgba(249,115,22,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    <BookOpen size={11} style={{color:"#f97316"}}/>
                  </div>
                  <span style={{ fontSize:"13px",fontWeight:"600",color:"#fff" }}>{name}</span>
                </div>
                <button className="btn-danger" style={{ padding:"4px 8px",display:"flex",alignItems:"center",flexShrink:0 }} onClick={()=>removeFromPlan(name)}><Trash2 size={12}/></button>
              </div>
            ))}
          </div>

          {/* IA montar plano */}
          <button
            onClick={()=>openAiPlanModal&&openAiPlanModal(planGroup)}
            style={{
              width:"100%",marginBottom:8,padding:"11px 16px",borderRadius:14,
              border:"1px dashed rgba(249,115,22,0.4)",background:"rgba(249,115,22,0.06)",
              cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",
              color:"#f97316",display:"flex",alignItems:"center",justifyContent:"center",gap:6,
            }}>
            ✨ IA montar plano de {planGroup}
          </button>

          {/* Biblioteca para adicionar */}
          <div className="card" style={{ padding: "0", overflow: "hidden" }}>
            <button onClick={() => setShowLibrary((v) => !v)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#f97316", fontSize: "13px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Plus size={15} /> Adicionar da biblioteca</span>
              {showLibrary ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {showLibrary && (
              <div style={{ padding: "0 16px 16px" }}>
                <div style={{ position: "relative", marginBottom: "12px" }}>
                  <Search size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)" }} />
                  <input type="text" placeholder="Filtrar exercícios..." value={planSearch} onChange={(e) => setPlanSearch(e.target.value)} style={{ paddingLeft: "32px" }} />
                </div>

                {/* Biblioteca agrupada por músculo */}
                <div style={{ maxHeight: "340px", overflowY: "auto" }}>
                  {planSearch ? (
                    // Busca flat quando há filtro
                    filteredLib.map((name) => {
                      const inPlan = planExercises.includes(name);
                      return (
                        <div key={name} onClick={() => !inPlan && addToPlan(name)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", borderRadius: "10px", cursor: inPlan ? "default" : "pointer", marginBottom: "2px", background: inPlan ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)", opacity: inPlan ? 0.6 : 1 }}>
                          <span style={{ fontSize: "13px" }}>{name}</span>
                          {inPlan ? <CheckCircle2 size={13} style={{ color: "#10b981" }} /> : <Plus size={13} style={{ color: "#f97316" }} />}
                        </div>
                      );
                    })
                  ) : (
                    // Agrupado por músculo quando sem filtro
                    <>
                      {Object.entries(MUSCLE_SUBGROUPS[planGroup] || {}).map(([muscle, musclExs]) => {
                        const available = allForGroup.filter((e) => getMuscle(planGroup, e, customMuscleMap) === muscle);
                        if (!available.length) return null;
                        return (
                          <div key={muscle} style={{ marginBottom: "12px" }}>
                            <div style={{ fontSize: "10px", fontWeight: "800", color: "#f97316", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px", paddingLeft: "2px" }}>{muscle}</div>
                            {available.map((name) => {
                              const inPlan = planExercises.includes(name);
                              return (
                                <div key={name} onClick={() => !inPlan && addToPlan(name)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", borderRadius: "10px", cursor: inPlan ? "default" : "pointer", marginBottom: "2px", background: inPlan ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)", opacity: inPlan ? 0.6 : 1 }}>
                                  <span style={{ fontSize: "13px" }}>{name}</span>
                                  {inPlan ? <CheckCircle2 size={13} style={{ color: "#10b981" }} /> : <Plus size={13} style={{ color: "#f97316" }} />}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                      {(() => {
                        const outros = allForGroup.filter((e) => getMuscle(planGroup, e, customMuscleMap) === "Outros");
                        if (!outros.length) return null;
                        return (
                          <div key="Outros" style={{ marginBottom: "12px" }}>
                            <div style={{ fontSize: "10px", fontWeight: "800", color: "#f97316", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px", paddingLeft: "2px" }}>Outros</div>
                            {outros.map((name) => {
                              const inPlan = planExercises.includes(name);
                              return (
                                <div key={name} onClick={() => !inPlan && addToPlan(name)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", borderRadius: "10px", cursor: inPlan ? "default" : "pointer", marginBottom: "2px", background: inPlan ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)", opacity: inPlan ? 0.6 : 1 }}>
                                  <span style={{ fontSize: "13px" }}>{name}</span>
                                  {inPlan ? <CheckCircle2 size={13} style={{ color: "#10b981" }} /> : <Plus size={13} style={{ color: "#f97316" }} />}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>

                {/* Criar exercício novo */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "12px", paddingTop: "12px" }}>
                  <div className="label" style={{ marginBottom: "8px" }}>Criar exercício novo</div>
                  <input
                    type="text"
                    placeholder="Nome do exercício..."
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    style={{ marginBottom: "10px" }}
                  />

                  <div className="label" style={{ marginBottom: "6px" }}>Grupamento</div>
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "10px" }}>
                    {ALL_GROUPS.map((g) => (
                      <button key={g} onClick={() => { setNewExGroup(g); setNewExMuscle(null); }}
                        style={{ padding: "6px 12px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif",
                          background: newExGroup === g ? "#f97316" : "rgba(255,255,255,0.07)", color: newExGroup === g ? "#fff" : "rgba(255,255,255,0.5)" }}>
                        {g}
                      </button>
                    ))}
                  </div>

                  {/* Sub-músculo — aparece quando grupo é selecionado */}
                  {newExGroup && (
                    <>
                      <div className="label" style={{ marginBottom: "6px" }}>Músculo</div>
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "12px" }}>
                        {Object.keys(MUSCLE_SUBGROUPS[newExGroup] || {}).map((m) => (
                          <button key={m} onClick={() => setNewExMuscle(m)}
                            style={{ padding: "6px 12px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif",
                              background: newExMuscle === m ? "#3b82f6" : "rgba(255,255,255,0.07)", color: newExMuscle === m ? "#fff" : "rgba(255,255,255,0.5)" }}>
                            {m}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", opacity: (!newExName.trim() || !newExGroup || !newExMuscle) ? 0.5 : 1 }}
                    onClick={() => {
                      const name = newExName.trim();
                      if (!name || !newExGroup || !newExMuscle) return;
                      if (saveCustomExercise) saveCustomExercise(newExGroup, name, newExMuscle);
                      setNewExName("");
                      setNewExGroup(null);
                      setNewExMuscle(null);
                    }}
                  >
                    + Criar exercício
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────── SEMANA ─────────── */}
      {activeSubTab === "semana" && (
        <div>
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <Calendar size={15} style={{ color: "#f97316" }} />
              <div className="syne" style={{ fontSize: "15px", fontWeight: "700" }}>Personalizar Semana</div>
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "14px" }}>
              A divisão de cada dia aqui é o que abre automaticamente na aba Sessão.
            </div>
            {(state?.schedule || []).map((day, index) => {
              const calText =
                day.calType === "free" ? "Livre" : day.calType === "heavy" ? "Pesado (2800 kcal)" : "Normal (2600 kcal)";
              return (
                <div
                  key={day.day}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 0",
                    borderBottom: index < (state.schedule.length - 1) ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: day.color, fontWeight: "700", width: "28px" }}>{day.day}</span>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "500" }}>{day.type}</div>
                      <div className="small">{calText}</div>
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: "6px 14px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={() => openEditDayModal && openEditDayModal(index)}
                  >
                    <Edit size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────── HISTÓRICO ─────────── */}
      {activeSubTab === "history" && (
        <div>
          <div style={{ marginBottom: "14px" }}>
            <div className="label" style={{ marginBottom: "6px" }}>Selecionar data</div>
            <select value={activeHistDate} onChange={(e) => setHistWrkDate(e.target.value)}>
              <option value="">— Escolha uma data —</option>
              {dates.map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}
            </select>
          </div>
          {activeHistDate && (
            <div>
              {(state?.workoutLogs || []).filter((w) => w.date === activeHistDate).map((w) => (
                <div className="card" key={w.id}>
                  <div className="row-sb" style={{ marginBottom: "10px" }}>
                    <span className="syne" style={{ fontWeight: "700", fontSize: "16px" }}>{w.type}</span>
                    <div className="row" style={{ gap: "10px" }}>
                      <span className="small">Vol: {w.volume}kg</span>
                      {(() => {
                        const totalKcal = (w.exercises || []).reduce((acc, ex) => {
                          if (ex.isCardio || ex.isMetadata) {
                            return acc + (ex.kcal || 0);
                          }
                          return acc;
                        }, 0);
                        if (totalKcal > 0) {
                          return <span className="small" style={{ color: "#ef4444", fontWeight: "700" }}>🔥 {totalKcal} kcal</span>;
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  {(w.exercises || []).map((ex, eIdx) => {
                    if (ex.isMetadata) {
                      return (
                        <div key={eIdx} style={{ background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: "10px", marginBottom: "8px", fontSize: "12px" }}>
                          <div style={{ fontWeight: "700", color: "#f97316" }}>Musculação</div>
                          <div style={{ color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
                            Duração: {ex.duration} min · Gasto: ~{ex.kcal} kcal
                          </div>
                        </div>
                      );
                    }
                    if (ex.isCardio) {
                      return (
                        <div key={eIdx} style={{ background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: "10px", marginBottom: "8px", fontSize: "12px" }}>
                          <div style={{ fontWeight: "700", color: "#10b981" }}>Cardio ({ex.cardioType})</div>
                          <div style={{ color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
                            Duração: {ex.duration} min {ex.distance ? `· Distância: ${ex.distance} km` : ""} · Gasto: ~{ex.kcal} kcal
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={eIdx} style={{ background: "rgba(255,255,255,0.02)", padding: "10px 12px", borderRadius: "10px", marginBottom: "8px" }}>
                        <div style={{ fontWeight: "600", fontSize: "13px", marginBottom: "6px" }}>{ex.name}</div>
                        {ex.sets.map((set, sIdx) => {
                          const ts = SET_TYPES.find((x) => x.id === set.type) || SET_TYPES[1];
                          return (
                            <div key={sIdx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <span style={{ color: ts.color, fontWeight: "600", minWidth: "80px", display: "flex", alignItems: "center", gap: "3px" }}>
                                {setTypeIcon(ts.id, 10)} {ts.label}
                              </span>
                              <span style={{ fontWeight: "600" }}>{set.weight}kg × {set.reps}</span>
                              <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: "auto" }}>= {set.weight * set.reps}kg</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                  {w.notes && <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px", marginTop: "6px", fontStyle: "italic" }}>Obs: {w.notes}</div>}
                </div>
              ))}
              {!(state?.workoutLogs || []).filter((w) => w.date === activeHistDate).length && (
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "24px" }}>Sem treinos gravados nesta data.</div>
              )}
            </div>
          )}
        </div>
      )}
      <CreateExerciseModal
        isOpen={showCreateExerciseModal}
        initialName={exSearch.trim()}
        onClose={() => setShowCreateExerciseModal(false)}
        onConfirm={({ name, primary, secondary, equipment }) => {
          if (saveCustomExercise) {
            saveCustomExercise(activeGroup, name, primary, secondary, equipment);
          }
          handleAddExToSession(name);
          setShowCreateExerciseModal(false);
          setExSearch("");
        }}
      />
    </div>
  );
}
