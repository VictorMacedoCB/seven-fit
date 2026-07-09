"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import HeavyDutyLogo from "@/components/HeavyDutyLogo";
import CoachChatModal from "@/components/CoachChatModal";
import AiPlanModal from "@/components/AiPlanModal";
import AddVideoModal from "@/components/AddVideoModal";
import TabBar from "@/components/TabBar";
import Dashboard from "@/components/Dashboard";
import DietTab from "@/components/DietTab";
import WorkoutTab from "@/components/WorkoutTab";
import ProgressTab from "@/components/ProgressTab";
import SettingsTab from "@/components/SettingsTab";

// Modals
import { supabase } from "@/lib/supabase";
import * as db from "@/lib/db";
import ScannerModal from "@/components/ScannerModal";
import EditDayModal from "@/components/EditDayModal";
import HistoryModal from "@/components/HistoryModal";
import ExerciseGuideModal from "@/components/ExerciseGuideModal";
import { useRestTimer, useRestTimerTrigger } from "@/components/RestTimer";
import exercisesDb from "@/lib/exercises-ptbr.json";
import foodsPtbr from "@/lib/foods-ptbr.json";

// ── SYSTEM CONSTANTS ─────────────────────────────────────────────────────────
const DEFAULT_PROFILE = {
  weight: 87,
  height: 176,
  age: 23,
  current_bf: 19,
  goal_bf: 12,
  activityFactor: 1.725,
  gender: "male",
  proteinFactor: 1.8
};
const DEFAULT_MEAL_PLAN = {
  normal: [
    { time: "09:00", name: "Café da Manhã", foods: ["4 ovos inteiros", "2 fatias pão integral", "1 banana", "150g iogurte grego desnatado"], kcal: 620 },
    { time: "12:00", name: "Pré-Treino", foods: ["30g Whey", "1 fruta"], kcal: 200 },
    { time: "17:30", name: "Almoço / Pós-Treino", foods: ["200g frango grelhado", "250g arroz branco", "Salada à vontade"], kcal: 780 },
    { time: "20:30", name: "Jantar", foods: ["180g frango grelhado", "150g batata doce", "1 ovo + fio de azeite"], kcal: 620 }
  ],
  heavy: [
    { time: "09:00", name: "Café da Manhã", foods: ["4 ovos inteiros", "3 fatias pão integral", "1 banana", "150g iogurte grego desnatado"], kcal: 700 },
    { time: "12:00", name: "Pré-Treino", foods: ["30g Whey", "1 banana", "1 maçã"], kcal: 260 },
    { time: "17:30", name: "Almoço / Pós-Treino", foods: ["200g frango grelhado", "300g arroz branco", "Salada à vontade"], kcal: 880 },
    { time: "20:30", name: "Jantar", foods: ["180g frango grelhado", "200g batata doce", "1 ovo + fio de azeite"], kcal: 700 }
  ]
};
// Biblioteca completa por grupamento (para selecionar ao montar o plano)
// IMPORTANTE: os nomes abaixo foram auditados um a um contra lib/exercises-ptbr.json para
// que cada um resolva por CORRESPONDÊNCIA EXATA (não por aproximação) ao exercício certo —
// com a imagem e instrução corretas. Antes, nomes genéricos como "Supino Reto" ou "Agachamento
// Livre" não existiam de forma exata no banco (que usa nomes mais específicos, ex: "Supino Reto
// com Barra - Pegada Média"), então caíam no algoritmo de aproximação e várias vezes acertavam o
// exercício errado (ex: "Tríceps Corda" caía em "Pular Corda", "Cadeira Extensora" caía em
// "Cadeira Flexora"). Também estavam faltando vários exercícios simples e básicos, como o
// Levantamento Terra tradicional — foram adicionados. Se for alterar/adicionar um nome aqui,
// confira antes que ele existe EXATAMENTE (mesmas letras/acentos) em lib/exercises-ptbr.json.
const DEFAULT_EXERCISES = {
  // PUSH — Peito + Ombro + Tríceps
  Push: [
    "Supino Reto com Barra - Pegada Média", "Supino Inclinado com Barra - Pegada Média", "Supino Declinado com Barra",
    "Crucifixo com Halteres", "Crucifixo Inclinado com Halteres", "Crossover na Polia",
    "Desenvolvimento Militar com Barra", "Desenvolvimento com Halteres em Pé", "Elevação Lateral", "Elevação Frontal com Barra em Pé",
    "Encolhimento de Ombros com Barra", "Face Pull",
    "Tríceps Pulley com Corda", "Tríceps Testa com Barra W", "Tríceps Francês na Polia Deitado", "Mergulho no Banco",
    "Extensão de Tríceps com Halter Unilateral", "Flexões", "Press Arnold com Halteres", "Tríceps Coice com Halter"
  ],
  // PULL — Costas + Bíceps + Posterior de Ombro
  Pull: [
    "Pulldown com Pegada Larga", "Puxada no Pulley com Barra V", "Pulldown Frente em Pegada Fechada", "Barra Fixa",
    "Pullover com Halter e Braços Flexionados", "Remada Curvada com Barra", "Remada Unilateral com Halter",
    "Remada T-Bar Deitado", "Remada Sentada no Pulley", "Rosca Direta com Barra", "Rosca Martelo", "Rosca Concentrada",
    "Rosca Inversa com Halteres em Pé", "Rosca Scott", "Crucifixo Inverso", "Crucifixo Invertido na Máquina", "Face Pull",
    "Levantamento Terra com Barra"
  ],
  // LEGS — Pernas completo
  Legs: [
    "Agachamento Livre com Barra", "Agachamento no Smith", "Agachamento Sumô com Halter", "Leg Press",
    "Agachamento Hack com Barra", "Extensão de Pernas", "Mesa Flexora", "Cadeira Flexora", "Adutor de Coxas", "Abdutor de Coxas",
    "Levantamento Terra com Pernas Rígidas", "Afundo com Halteres", "Afundo com Barra", "Agachamento Búlgaro Suspenso",
    "Levantamento Terra com Barra", "Levantamento Terra Romeno", "Elevação Pélvica com Barra",
    "Elevação de Panturrilha em Pé", "Elevação de Panturrilha Sentada", "Press de Panturrilha na Máquina de Leg Press"
  ],
  // UPPER — Peito + Ombro + Tríceps + Costas
  Upper: [
    "Supino Reto com Barra - Pegada Média", "Supino Inclinado com Barra - Pegada Média", "Crucifixo com Halteres",
    "Crossover na Polia", "Desenvolvimento com Halteres em Pé", "Elevação Lateral", "Face Pull",
    "Tríceps Pulley com Corda", "Tríceps Testa com Barra W", "Pulldown com Pegada Larga", "Remada Curvada com Barra",
    "Remada Unilateral com Halter", "Pullover com Halter e Braços Flexionados", "Levantamento Terra com Barra"
  ],
  // LOWER — Pernas + Bíceps
  Lower: [
    "Agachamento Livre com Barra", "Leg Press", "Extensão de Pernas", "Mesa Flexora", "Cadeira Flexora",
    "Levantamento Terra com Pernas Rígidas", "Levantamento Terra Romeno", "Levantamento Terra com Barra", "Afundo com Halteres", "Elevação Pélvica com Barra",
    "Elevação de Panturrilha em Pé", "Elevação de Panturrilha Sentada", "Rosca Direta com Barra", "Rosca Martelo", "Rosca Concentrada"
  ],
  // COMPLEMENTARES — Abdômen + Panturrilha + Lombar (dia dedicado, separado do treino principal)
  Complementares: [
    "Prancha", "Abdominal na Polia", "Abdominal Infra na Polia", "Elevação de Pernas na Barra", "Roda Abdominal",
    "Abdominal Inverso", "Abdominais Oblíquos",
    "Elevação de Panturrilha em Pé", "Elevação de Panturrilha Sentada", "Press de Panturrilha na Máquina de Leg Press",
    "Hiperextensões (Extensões Lombares)"
  ]
};

// IMPORTANTE: propositalmente NÃO existe um "plano padrão" com exercícios pré-definidos.
// Cada divisão (Push/Pull/Legs/Upper/Lower/qualquer nome customizado) começa vazia e só
// ganha exercícios quando o próprio usuário os adiciona — na aba "Plano" ou direto numa
// sessão de treino. Isso é intencional: um plano "pré-preenchido" reaparecia sozinho
// mesmo depois de o usuário apagá-lo (porque o preenchimento automático era reaplicado
// a cada renderização), então a exclusão de divisões parecia não funcionar.
const DEFAULT_SCHEDULE = [
  { day: "Seg", type: "Push", color: "#f97316", calType: "heavy", group: "Push" },
  { day: "Ter", type: "Pull", color: "#3b82f6", calType: "heavy", group: "Pull" },
  { day: "Qua", type: "Legs 🦵", color: "#8b5cf6", calType: "heavy", group: "Legs" },
  { day: "Qui", type: "Jiu-Jitsu 🥋", color: "#10b981", calType: "heavy", group: "Upper" },
  { day: "Sex", type: "Upper", color: "#f59e0b", calType: "heavy", group: "Upper" },
  { day: "Sab", type: "Lower 🦵", color: "#ec4899", calType: "heavy", group: "Lower" },
  { day: "Dom", type: "Descanso 🍕", color: "#6b7280", calType: "free", group: null }
];
const DEFAULT_FOODS = [
  { id: "f1", name: "Frango Grelhado", kcal: 165, protein: 31, carbs: 0, fat: 3.6, unit: "100g" },
  { id: "f2", name: "Arroz Branco Cozido", kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, unit: "100g" },
  { id: "f3", name: "Batata Doce Cozida", kcal: 86, protein: 1.6, carbs: 20, fat: 0.1, unit: "100g" },
  { id: "f4", name: "Ovo Inteiro", kcal: 155, protein: 13, carbs: 1.1, fat: 11, unit: "100g" },
  { id: "f5", name: "Whey Protein", kcal: 120, protein: 24, carbs: 3, fat: 2, unit: "30g" },
  { id: "f6", name: "Iogurte Grego Desnatado", kcal: 59, protein: 10, carbs: 3.6, fat: 0.4, unit: "100g" },
  { id: "f7", name: "Pão Integral", kcal: 247, protein: 9, carbs: 41, fat: 3.4, unit: "100g" },
  { id: "f8", name: "Banana", kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, unit: "100g" },
  { id: "f9", name: "Patinho / Coxão Mole", kcal: 158, protein: 28, carbs: 0, fat: 5, unit: "100g" },
  { id: "f10", name: "Azeite de Oliva", kcal: 884, protein: 0, carbs: 0, fat: 100, unit: "100ml" }
];

// Base ampliada de alimentos brasileiros (TACO/UNICAMP) — anteriormente presente no repo
// mas não conectada à busca de alimentos. Normalizamos os campos (per → unit) e mesclamos
// com DEFAULT_FOODS, removendo duplicatas por nome.
const TACO_FOODS = foodsPtbr.map((f) => ({
  id: f.id,
  name: f.name,
  category: f.category,
  kcal: f.kcal,
  protein: f.protein,
  carbs: f.carbs,
  fat: f.fat,
  unit: f.per,
  source: f.source,
}));
const ALL_DEFAULT_FOODS = (() => {
  const seenNames = new Set(DEFAULT_FOODS.map((f) => f.name.toLowerCase()));
  const merged = [...DEFAULT_FOODS];
  for (const f of TACO_FOODS) {
    const key = f.name.toLowerCase();
    if (!seenNames.has(key)) {
      seenNames.add(key);
      merged.push(f);
    }
  }
  return merged;
})();
const COLORS = ["#f97316", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#6b7280", "#ef4444"];
const SET_TYPES = [
  { id: "aquecimento", label: "Aquecimento", emoji: "🔥", color: "#f59e0b" },
  { id: "valida",     label: "Válida",       emoji: "✅", color: "#10b981" },
  { id: "pap",        label: "PAP",          emoji: "⚡", color: "#8b5cf6" },
  { id: "feeder",     label: "Feeder",       emoji: "🩸", color: "#ef4444" },
];

export default function Home() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Global State (matching DB representation)
  const [state, setState] = useState({
    foodLogs: [],
    workoutLogs: [],
    weightLogs: [],
    customFoods: [],
    customExercises: {},
    customMuscleMap: {}, // { [exerciseName]: muscle } para exercícios criados pelo usuário
    customExerciseMeta: {}, // { [exerciseName]: { secondary, equipment } } dados extras do exercício customizado
    workoutPlans: {},
    schedule: DEFAULT_SCHEDULE,
    progressPhotos: [],
    // Session state
    selectedFood: null,
    profile: DEFAULT_PROFILE,
    mealPlan: DEFAULT_MEAL_PLAN,
  });

  // Modal control states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInitialTab, setScannerInitialTab] = useState("barcode");
  const [isEditDayOpen, setIsEditDayOpen] = useState(false);
  const [editDayIndex, setEditDayIndex] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyExName, setHistoryExName] = useState("");
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideExName, setGuideExName] = useState("");

  // Cronômetro de descanso: o hook fica no nível raiz do app (não dentro da aba
  // Treino) para que trocar de aba não resete o tempo restante. O ícone visual,
  // porém, é renderizado dentro do quadro "Treino de Hoje" (veja WorkoutTab) — antes
  // ficava fixo flutuando na tela e cobria o botão do Coach de IA.
  const [restTimerSignal, fireRestTimer] = useRestTimerTrigger();
  const [restTimerExName, setRestTimerExName] = useState("");
  const restTimer = useRestTimer(restTimerSignal, restTimerExName);
  const syncInFlightRef = React.useRef(null);
  // Sempre aponta pro state mais recente — necessário porque handleUserSignIn é um
  // useCallback com dependências vazias (closure fixa) mas precisa checar o state atual
  // de forma síncrona antes de decidir se confia numa resposta "vazia" da nuvem.
  const prevStateRef = React.useRef(state);
  useEffect(() => { prevStateRef.current = state; }, [state]);

  // Rede de segurança: mesmo com o deadlock do onAuthStateChange corrigido, uma conexão
  // muito lenta ou instável não deveria conseguir deixar a tela "sincronizando" para
  // sempre. Se a chamada não responder em 20s, desiste e mostra erro em vez de travar.
  const withTimeout = (promise, ms = 30000) =>
    Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Tempo de sincronização esgotado. Verifique sua conexão.")), ms)),
    ]);
  // ── HYDRATION & LOADING STATE ──────────────────────────────────────────────
  const loadLocalState = () => {
    try {
      const foodLogs = localStorage.getItem("co_foodLogs");
      const workoutLogs = localStorage.getItem("co_workoutLogs");
      const weightLogs = localStorage.getItem("co_weightLogs");
      const customFoods = localStorage.getItem("co_customFoods");
      const customExercises = localStorage.getItem("co_customExercises");
      const schedule = localStorage.getItem("co_schedule");
      const progressPhotos = localStorage.getItem("co_progressPhotos");
      const profile = localStorage.getItem("co_profile");
      const mealPlan = localStorage.getItem("co_mealPlan");

      const parsedSchedule = schedule ? JSON.parse(schedule) : null;
      const parsedProfile = profile ? JSON.parse(profile) : null;
      const parsedMealPlan = mealPlan ? JSON.parse(mealPlan) : null;

      const workoutPlansRaw = localStorage.getItem("co_workoutPlans");
      const customMuscleMapRaw = localStorage.getItem("co_customMuscleMap");
      const customExerciseMetaRaw = localStorage.getItem("co_customExerciseMeta");
      return {
        foodLogs: (foodLogs && JSON.parse(foodLogs)) || [],
        workoutLogs: (workoutLogs && JSON.parse(workoutLogs)) || [],
        weightLogs: (weightLogs && JSON.parse(weightLogs)) || [],
        customFoods: (customFoods && JSON.parse(customFoods)) || [],
        customExercises: (customExercises && JSON.parse(customExercises)) || {},
        customMuscleMap: (customMuscleMapRaw && JSON.parse(customMuscleMapRaw)) || {},
        customExerciseMeta: (customExerciseMetaRaw && JSON.parse(customExerciseMetaRaw)) || {},
        // Nenhum preenchimento automático aqui: o que o usuário salvou é exatamente o que
        // volta. Uma divisão que ele nunca configurou (ou que ele excluiu) simplesmente não
        // existe como chave — e é tratada como lista vazia em todo o resto do app.
        workoutPlans: (workoutPlansRaw && JSON.parse(workoutPlansRaw)) || {},
        schedule: (parsedSchedule && parsedSchedule.length === 7) ? parsedSchedule : DEFAULT_SCHEDULE,
        progressPhotos: (progressPhotos && JSON.parse(progressPhotos)) || [],
        selectedFood: null,
        profile: parsedProfile || DEFAULT_PROFILE,
        mealPlan: parsedMealPlan || DEFAULT_MEAL_PLAN,
      };
    } catch (error) {
      console.error("Error loading localStorage state:", error);
      return null;
    }
  };

  const cacheToLocal = (data) => {
    try {
      localStorage.setItem("co_foodLogs", JSON.stringify(data.foodLogs || []));
      localStorage.setItem("co_workoutLogs", JSON.stringify(data.workoutLogs || []));
      localStorage.setItem("co_weightLogs", JSON.stringify(data.weightLogs || []));
      localStorage.setItem("co_customFoods", JSON.stringify(data.customFoods || []));
      localStorage.setItem("co_customExercises", JSON.stringify(data.customExercises || {}));
      localStorage.setItem("co_customMuscleMap", JSON.stringify(data.customMuscleMap || {}));
      localStorage.setItem("co_customExerciseMeta", JSON.stringify(data.customExerciseMeta || {}));
      localStorage.setItem("co_workoutPlans", JSON.stringify(data.workoutPlans || {}));
      localStorage.setItem("co_schedule", JSON.stringify((data.schedule && data.schedule.length === 7) ? data.schedule : DEFAULT_SCHEDULE));
      localStorage.setItem("co_progressPhotos", JSON.stringify(data.progressPhotos || []));
      localStorage.setItem("co_profile", JSON.stringify(data.profile || DEFAULT_PROFILE));
      localStorage.setItem("co_mealPlan", JSON.stringify(data.mealPlan || DEFAULT_MEAL_PLAN));
    } catch (e) {
      console.error("Error writing to localStorage cache:", e);
    }
  };

  const saveState = (updatedState) => {
    setState(updatedState);
    cacheToLocal(updatedState);
  };

  const mergeLocalAndCloudState = (localState, cloudData) => {
    if (!cloudData) return localState;

    // Rede de segurança por campo: se a nuvem voltou vazia especificamente pra um desses
    // arrays (ex: só workout_logs, ou só food_logs) enquanto o dispositivo já tem dados
    // reais salvos localmente pra esse mesmo campo, isso é suspeito demais pra confiar —
    // prefere manter o que já existe localmente como base em vez de apagar. Sem isso, um
    // problema passageiro numa ÚNICA consulta (as 9 rodam em paralelo, então qualquer
    // uma pode falhar isoladamente) apagava só aquele tipo de dado silenciosamente — por
    // isso às vezes sumiam só os treinos, ou só a dieta, sem padrão aparente.
    const safeCloudArray = (cloudArr, localArr) => {
      const cloud = cloudArr || [];
      const local = localArr || [];
      if (cloud.length === 0 && local.length > 0) return local;
      return cloud;
    };

    // 1. Food Logs
    const mergedFoodLogs = [...safeCloudArray(cloudData.foodLogs, localState.foodLogs)];
    const localUnsyncedFood = (localState.foodLogs || []).filter(l => typeof l.id === 'number');
    localUnsyncedFood.forEach(localLog => {
      const exists = mergedFoodLogs.some(dbLog => 
        dbLog.date === localLog.date && 
        dbLog.meal === localLog.meal && 
        dbLog.foodName === localLog.foodName && 
        dbLog.qty === localLog.qty
      );
      if (!exists) mergedFoodLogs.push(localLog);
    });

    // 2. Workout Logs
    const mergedWorkoutLogs = [...safeCloudArray(cloudData.workoutLogs, localState.workoutLogs)];
    const localUnsyncedWorkouts = (localState.workoutLogs || []).filter(w => typeof w.id === 'number');
    localUnsyncedWorkouts.forEach(localLog => {
      const exists = mergedWorkoutLogs.some(dbLog => 
        dbLog.date === localLog.date && 
        dbLog.type === localLog.type
      );
      if (!exists) mergedWorkoutLogs.push(localLog);
    });

    // 3. Weight Logs
    const mergedWeightLogs = [...safeCloudArray(cloudData.weightLogs, localState.weightLogs)];
    const localUnsyncedWeight = (localState.weightLogs || []).filter(w => typeof w.id === 'number');
    localUnsyncedWeight.forEach(localLog => {
      const exists = mergedWeightLogs.some(dbLog => 
        dbLog.date === localLog.date && 
        Math.abs(dbLog.value - localLog.value) < 0.01
      );
      if (!exists) mergedWeightLogs.push(localLog);
    });

    // 4. Custom Foods
    const mergedCustomFoods = [...safeCloudArray(cloudData.customFoods, localState.customFoods)];
    (localState.customFoods || []).forEach(localFood => {
      const exists = mergedCustomFoods.some(dbFood => 
        dbFood.name.toLowerCase() === localFood.name.toLowerCase()
      );
      if (!exists) mergedCustomFoods.push(localFood);
    });

    // 5. Custom Exercises
    const mergedCustomExercises = { ...(cloudData.customExercises || {}) };
    Object.entries(localState.customExercises || {}).forEach(([group, names]) => {
      if (!mergedCustomExercises[group]) {
        mergedCustomExercises[group] = [];
      }
      names.forEach(name => {
        if (!mergedCustomExercises[group].includes(name)) {
          mergedCustomExercises[group].push(name);
        }
      });
    });

    // 6. Custom Muscle Map
    const mergedCustomMuscleMap = { 
      ...(localState.customMuscleMap || {}), 
      ...(cloudData.customMuscleMap || {}) 
    };

    // 7. Progress Photos
    const mergedProgressPhotos = [...safeCloudArray(cloudData.progressPhotos, localState.progressPhotos)];
    (localState.progressPhotos || []).forEach(localPhoto => {
      const exists = mergedProgressPhotos.some(dbPhoto => dbPhoto.week === localPhoto.week);
      if (!exists) mergedProgressPhotos.push(localPhoto);
    });

    return {
      ...localState,
      foodLogs: mergedFoodLogs,
      workoutLogs: mergedWorkoutLogs,
      weightLogs: mergedWeightLogs,
      customFoods: mergedCustomFoods,
      customExercises: mergedCustomExercises,
      customMuscleMap: mergedCustomMuscleMap,
      progressPhotos: mergedProgressPhotos,
      schedule: (cloudData.schedule && cloudData.schedule.length === 7) ? cloudData.schedule : localState.schedule,
      // Planos de treino: mescla por grupo, sem nenhum preenchimento automático — o que
      // não existir aqui simplesmente não existe (divisão vazia até o usuário adicionar
      // algo). A nuvem é a fonte da verdade pros grupos que já foram sincronizados (evita
      // reviver uma lista antiga só porque ela ainda está em cache local), mas mantém
      // grupos que só existem localmente (ex: criados agora mesmo, offline).
      workoutPlans: {
        ...(localState.workoutPlans || {}),
        ...((cloudData.workoutPlans && Object.keys(cloudData.workoutPlans).length) ? cloudData.workoutPlans : {}),
      },
      profile: cloudData.profile ? { ...localState.profile, ...cloudData.profile } : localState.profile,
      mealPlan: cloudData.mealPlan || localState.mealPlan,
      selectedFood: null
    };
  };

  const syncUnsyncedDataToCloud = async (userId, currentState, cloudData = null) => {
    try {
      const dbData = cloudData || await db.fetchUserData(userId) || {};
      const syncedState = { ...currentState };
      
      // 1. Sync Workout Logs
      const localUnsyncedWorkouts = (syncedState.workoutLogs || []).filter(w => typeof w.id === 'number');
      if (localUnsyncedWorkouts.length > 0) {
        const updatedWorkoutLogs = [...syncedState.workoutLogs];
        for (const w of localUnsyncedWorkouts) {
          try {
            const savedWorkout = await db.addWorkoutLog(userId, w);
            if (savedWorkout && savedWorkout.id) {
              const idx = updatedWorkoutLogs.findIndex(item => item.id === w.id);
              if (idx > -1) {
                updatedWorkoutLogs[idx] = {
                  ...updatedWorkoutLogs[idx],
                  id: savedWorkout.id
                };
              }
            }
          } catch (err) {
            console.error("Error syncing workout log:", err);
          }
        }
        syncedState.workoutLogs = updatedWorkoutLogs;
      }

      // 2. Sync Food Logs
      const localUnsyncedFood = (syncedState.foodLogs || []).filter(f => typeof f.id === 'number');
      if (localUnsyncedFood.length > 0) {
        const updatedFoodLogs = [...syncedState.foodLogs];
        for (const f of localUnsyncedFood) {
          try {
            const savedFood = await db.addFoodLog(userId, f);
            if (savedFood && savedFood.id) {
              const idx = updatedFoodLogs.findIndex(item => item.id === f.id);
              if (idx > -1) {
                updatedFoodLogs[idx] = {
                  ...updatedFoodLogs[idx],
                  id: savedFood.id
                };
              }
            }
          } catch (err) {
            console.error("Error syncing food log:", err);
          }
        }
        syncedState.foodLogs = updatedFoodLogs;
      }

      // 3. Sync Weight Logs
      const localUnsyncedWeight = (syncedState.weightLogs || []).filter(w => typeof w.id === 'number');
      if (localUnsyncedWeight.length > 0) {
        const updatedWeightLogs = [...syncedState.weightLogs];
        for (const w of localUnsyncedWeight) {
          try {
            const savedWeight = await db.addWeightLog(userId, w);
            if (savedWeight && savedWeight.id) {
              const idx = updatedWeightLogs.findIndex(item => item.id === w.id);
              if (idx > -1) {
                updatedWeightLogs[idx] = {
                  ...updatedWeightLogs[idx],
                  id: savedWeight.id
                };
              }
            }
          } catch (err) {
            console.error("Error syncing weight log:", err);
          }
        }
        syncedState.weightLogs = updatedWeightLogs;
      }

      // 4. Sync Custom Foods
      const cloudFoodNames = new Set((dbData.customFoods || []).map(f => f.name.toLowerCase()));
      const localUnsyncedCustomFoods = (syncedState.customFoods || []).filter(f => !cloudFoodNames.has(f.name.toLowerCase()));
      if (localUnsyncedCustomFoods.length > 0) {
        for (const f of localUnsyncedCustomFoods) {
          try {
            await db.addCustomFood(userId, f);
          } catch (err) {
            console.error("Error syncing custom food:", err);
          }
        }
      }

      // 5. Sync Custom Exercises
      const cloudExercises = dbData.customExercises || {};
      const localCustomExercises = syncedState.customExercises || {};
      for (const [group, names] of Object.entries(localCustomExercises)) {
        const cloudNamesForGroup = new Set((cloudExercises[group] || []).map(n => n.toLowerCase()));
        const unsyncedNames = names.filter(n => !cloudNamesForGroup.has(n.toLowerCase()));
        for (const name of unsyncedNames) {
          try {
            await db.addCustomExercise(userId, group, name);
          } catch (err) {
            console.error("Error syncing custom exercise:", err);
          }
        }
      }

      return syncedState;
    } catch (e) {
      console.error("Failed syncUnsyncedDataToCloud:", e);
      return currentState;
    }
  };

  const handleUserSignIn = React.useCallback(async (currUser) => {
    // Evita rodar a sincronização inteira duas vezes em paralelo: o Supabase dispara
    // onAuthStateChange imediatamente com a sessão atual assim que o app se inscreve nele,
    // e getSession() também resolve por conta própria logo em seguida — sem essa trava,
    // dois fetches concorrentes da nuvem corriam ao mesmo tempo e podiam se sobrepor.
    if (syncInFlightRef.current === currUser.id) return;
    syncInFlightRef.current = currUser.id;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const dbData = await withTimeout(db.fetchUserData(currUser.id));
      if (dbData) {
        // Rede de segurança: se a nuvem voltou praticamente vazia (não é erro — só zero
        // linhas, o que pode acontecer por uma falha passageira, ex: a query rodando um
        // instante antes da sessão de autenticação estar totalmente propagada) enquanto
        // o dispositivo já tem dados reais salvos localmente, isso é suspeito demais pra
        // confiar. Sem essa checagem, esse tipo de resposta vazia sobrescrevia dados de
        // verdade — exatamente o "às vezes sincroniza e apaga tudo" relatado.
        const cloudLooksEmpty =
          (dbData.foodLogs || []).length === 0 &&
          (dbData.workoutLogs || []).length === 0 &&
          (dbData.weightLogs || []).length === 0 &&
          (dbData.customFoods || []).length === 0 &&
          (dbData.schedule || []).length === 0;
        const localHasRealData =
          (prevStateRef.current.foodLogs || []).length > 0 ||
          (prevStateRef.current.workoutLogs || []).length > 0 ||
          (prevStateRef.current.weightLogs || []).length > 0;

        if (cloudLooksEmpty && localHasRealData) {
          console.warn("Cloud fetch veio vazio mas há dados locais reais — tentando de novo antes de confiar.");
          // Uma segunda tentativa geralmente resolve problemas de timing passageiros.
          const retryData = await withTimeout(db.fetchUserData(currUser.id)).catch(() => null);
          const retryLooksEmpty = !retryData || (
            (retryData.foodLogs || []).length === 0 &&
            (retryData.workoutLogs || []).length === 0 &&
            (retryData.weightLogs || []).length === 0 &&
            (retryData.customFoods || []).length === 0 &&
            (retryData.schedule || []).length === 0
          );
          if (retryLooksEmpty) {
            // Ainda vazio depois de tentar de novo: mantém os dados locais como estão e
            // não sincroniza nada agora — mais seguro que apagar algo que pode ser real.
            console.warn("Nuvem continua vazia após nova tentativa — mantendo dados locais intactos por segurança.");
            setSyncError("Não foi possível confirmar os dados na nuvem com segurança. Seus dados locais foram mantidos.");
          } else {
            let merged;
            setState((prev) => {
              merged = mergeLocalAndCloudState(prev, retryData);
              cacheToLocal(merged);
              return merged;
            });
            try {
              const syncedState = await syncUnsyncedDataToCloud(currUser.id, merged, retryData);
              setState(syncedState);
              cacheToLocal(syncedState);
            } catch (syncErr) {
              console.error("Failed background sync:", syncErr);
            }
          }
        } else {
          let merged;
          setState((prev) => {
            merged = mergeLocalAndCloudState(prev, dbData);
            cacheToLocal(merged);
            return merged;
          });

          // Trigger background sync
          try {
            const syncedState = await syncUnsyncedDataToCloud(currUser.id, merged, dbData);
            setState(syncedState);
            cacheToLocal(syncedState);
          } catch (syncErr) {
            console.error("Failed background sync:", syncErr);
          }
        }
      } else {
        const currentLocal = loadLocalState();
        if (currentLocal) {
          await withTimeout(db.migrateLocalData(currUser.id, currentLocal));
          const syncedData = await withTimeout(db.fetchUserData(currUser.id));
          if (syncedData) {
            setState((prev) => {
              const newState = mergeLocalAndCloudState(prev, syncedData);
              cacheToLocal(newState);
              return newState;
            });
          }
        }
      }
    } catch (error) {
      console.error("Error syncing with Supabase:", error);
      setSyncError(error.message || String(error));
    } finally {
      setIsHydrated(true);
      setIsSyncing(false);
      syncInFlightRef.current = null;
    }
  }, []);

  // Keep a ref to the latest handler so effects can call it without adding
  // it to dependency arrays and triggering re-runs.
  const handleUserSignInRef = React.useRef(handleUserSignIn);
  useEffect(() => {
    handleUserSignInRef.current = handleUserSignIn;
  }, [handleUserSignIn]);

  useEffect(() => {
    // Always load from localStorage immediately so the app renders without waiting for network
    const local = loadLocalState();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (local) setState((prev) => ({ ...prev, ...local }));

    if (supabase) {
      // IMPORTANTE: só existe UM caminho que dispara a sincronização agora — o
      // onAuthStateChange abaixo. Antes também tinha um getSession().then(...) separado
      // chamando a mesma sincronização — como o onAuthStateChange já dispara sozinho com
      // a sessão atual assim que o app se inscreve nele (evento "INITIAL_SESSION"), os
      // dois juntos causavam duas sincronizações completas rodando em sequência, cada
      // uma com uma "foto" da nuvem tirada em momento ligeiramente diferente — e a
      // segunda podia usar dados mais antigos que os que a primeira acabara de escrever,
      // revertendo trabalho recente. Isso é exatamente o padrão recomendado pelo próprio
      // Supabase: usar só o onAuthStateChange pro carregamento inicial.

      // Subscribe to auth state changes.
      // O callback NÃO pode ser async nem dar "await" direto numa cadeia pesada de
      // chamadas ao Supabase (como handleUserSignIn → fetchUserData → várias queries).
      // O supabase-js v2 mantém um lock interno de autenticação enquanto processa este
      // callback; awaitar outras chamadas do Supabase de dentro dele pode travar
      // esperando esse mesmo lock — a promise nunca resolve, e por isso a tela ficava
      // "sincronizando" para sempre. O jeito correto (recomendado pelo próprio Supabase)
      // é adiar esse trabalho pesado com setTimeout(0), rodando fora do callback, numa
      // nova task.
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          setUser(session.user);
          setIsHydrated(true);
          setTimeout(() => {
            if (handleUserSignInRef.current) handleUserSignInRef.current(session.user);
          }, 0);
        } else {
          setUser(null);
          const updatedLocal = loadLocalState();
          if (updatedLocal) setState((prev) => ({ ...prev, ...updatedLocal }));
          setIsHydrated(true);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setIsHydrated(true);
    }
  }, []);

  // ── CORE UTILS & HELPERS ───────────────────────────────────────────────────
  const today = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const getDOW = () => ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][new Date().getDay()];
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

  const todaySched = () => {
    // "|| DEFAULT_SCHEDULE" só entra em ação se schedule for undefined/null — um array
    // vazio ([]) é "truthy" em JS e passava direto, quebrando a busca do dia da semana.
    const sched = (state.schedule && state.schedule.length === 7) ? state.schedule : DEFAULT_SCHEDULE;
    return sched.find((s) => s.day === getDOW()) || sched[6] || DEFAULT_SCHEDULE[6];
  };

  // ── DYNAMIC METABOLIC CALCULATION UTILS ─────────────────────────────────────
  const calculateMetabolicTargets = (p) => {
    const rawProfile = p || state.profile || DEFAULT_PROFILE;
    const profile = {
      weight: parseFloat(rawProfile.weight) || DEFAULT_PROFILE.weight,
      height: parseFloat(rawProfile.height) || DEFAULT_PROFILE.height,
      age: parseInt(rawProfile.age) || DEFAULT_PROFILE.age,
      current_bf: parseFloat(rawProfile.current_bf) || DEFAULT_PROFILE.current_bf,
      goal_bf: parseFloat(rawProfile.goal_bf) || DEFAULT_PROFILE.goal_bf,
      activityFactor: parseFloat(rawProfile.activityFactor) || DEFAULT_PROFILE.activityFactor,
      gender: rawProfile.gender || DEFAULT_PROFILE.gender,
      proteinFactor: parseFloat(rawProfile.proteinFactor) || DEFAULT_PROFILE.proteinFactor,
      objetivo: rawProfile.objetivo || "cutting",
    };

    // TMB (Mifflin-St Jeor)
    let tmb = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
    tmb += profile.gender === "female" ? -161 : 5;

    // TDEE
    const tdee = Math.round(tmb * profile.activityFactor);

    // ── Distribuição Mentzer: 60% carb · 25% prot · 15% gordura ──────────────
    // Calcula a kcal alvo por objetivo primeiro, depois distribui os macros
    let kcalNormal, kcalHeavy, weeklyDelta, weeklyWeightTargetKg, goalLabel;

    if (profile.objetivo === "bulking") {
      // Superávit ~0.5% peso/semana para ganho lean
      weeklyWeightTargetKg = profile.weight * 0.005;
      weeklyDelta          = Math.round(weeklyWeightTargetKg * 7700);
      kcalNormal           = Math.round((tdee + Math.round(weeklyDelta / 6)) / 50) * 50;
      kcalHeavy            = kcalNormal + 250;
      goalLabel            = "Bulking";
    } else if (profile.objetivo === "manutencao") {
      weeklyWeightTargetKg = 0;
      weeklyDelta          = 0;
      kcalNormal           = Math.round(tdee / 50) * 50;
      kcalHeavy            = kcalNormal + 150;
      goalLabel            = "Manutenção";
    } else {
      // Cutting: déficit ~0.7%/semana
      weeklyWeightTargetKg = profile.weight * 0.007;
      weeklyDelta          = Math.round(weeklyWeightTargetKg * 7700);
      const dailyTarget    = tdee - Math.round(weeklyDelta / 6);
      kcalNormal           = Math.round((dailyTarget - 30) / 50) * 50;
      kcalHeavy            = kcalNormal + 200;
      goalLabel            = "Cutting";
    }

    // Distribuição Mentzer: 60% carb, 25% prot, 15% gordura
    const macroSplit = (kcal) => ({
      kcal,
      carbs:   Math.round((kcal * 0.60) / 4),
      protein: Math.round((kcal * 0.25) / 4),
      fat:     Math.round((kcal * 0.15) / 9),
    });

    const normalMacros = macroSplit(kcalNormal);
    const heavyMacros  = macroSplit(kcalHeavy);

    return {
      tmb: Math.round(tmb),
      tdee,
      objetivo: profile.objetivo,
      goalLabel,
      weeklyWeightLossTargetKg: Math.round(weeklyWeightTargetKg * 1000) / 1000,
      weeklyDeficitNeeded: weeklyDelta,
      dailyAverageControlledTarget: kcalNormal,
      // Compatibilidade legada
      proteinGrams: normalMacros.protein,
      fatGrams: normalMacros.fat,
      normal: normalMacros,
      heavy:  heavyMacros,
    };
  };

  const getTargets = () => {
    const s = todaySched();
    const targets = calculateMetabolicTargets(state.profile);
    return s.calType === "heavy"
      ? targets.heavy
      : s.calType === "free"
      ? { kcal: Infinity, protein: Infinity, carbs: Infinity, fat: Infinity }
      : targets.normal;
  };

  const todayFoodLogs = () => {
    return (state.foodLogs || []).filter((l) => l.date === today());
  };

  const getTotals = (logs) => {
    const raw = logs.reduce(
      (a, l) => ({
        kcal: a.kcal + (l.kcal || 0),
        protein: a.protein + (l.protein || 0),
        carbs: a.carbs + (l.carbs || 0),
        fat: a.fat + (l.fat || 0),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return {
      kcal: Math.round(raw.kcal),
      protein: parseFloat(raw.protein.toFixed(1)),
      carbs: parseFloat(raw.carbs.toFixed(1)),
      fat: parseFloat(raw.fat.toFixed(1)),
    };
  };

  const allFoods = () => {
    return [...ALL_DEFAULT_FOODS, ...(state.customFoods || [])];
  };

  // Removido o antigo sistema de "bucket" por músculo (que restringia quais exercícios
  // apareciam em cada divisão, ex: só peito em Push). Sempre tinha brechas — cada músculo
  // esquecido de algum grupo virava um "exercício sumiu" diferente (ex: trapézio faltando
  // em Pull). Agora getExercises() simplesmente libera o banco inteiro em qualquer divisão.

  const getExercises = (group) => {
    if (!group) return [];

    // Todo o banco de exercícios fica disponível em qualquer divisão — sem filtro por
    // "esse músculo só aparece nesse tipo de dia". Um sistema de categorização por
    // músculo/bucket parecia mais organizado, mas na prática sempre tinha brechas (ex:
    // trapézio não aparecia em Pull, levantamento terra não aparecia em Legs) e cada
    // brecha virava um "exercício sumiu" diferente. Mais simples e à prova de brecha:
    // o usuário vê e pode escolher qualquer exercício do banco em qualquer treino.
    const dbExercises = exercisesDb.map(ex => ex.name);

    // Exercícios customizados: todos ficam disponíveis em qualquer divisão também, pelo
    // mesmo motivo.
    const allCustomNames = new Set();
    Object.values(state.customExercises || {}).forEach(names => (names || []).forEach(n => allCustomNames.add(n)));

    return [
      ...new Set([
        ...(DEFAULT_EXERCISES[group] || []),
        ...dbExercises,
        ...allCustomNames,
      ]),
    ].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  };

  // ── STATE MUTATIONS ────────────────────────────────────────────────────────
  const saveWeightLog = async (value) => {
    const localId = Date.now();
    const logObj = { id: localId, date: today(), value };
    
    const updated = {
      ...state,
      weightLogs: [...(state.weightLogs || []), logObj],
    };
    saveState(updated);

    if (user) {
      try {
        const savedLog = await db.addWeightLog(user.id, logObj);
        if (savedLog && savedLog.id) {
          setState(prev => {
            const newState = {
              ...prev,
              weightLogs: (prev.weightLogs || []).map(w => w.id === localId ? { ...w, id: savedLog.id } : w)
            };
            cacheToLocal(newState);
            // Background sync
            syncUnsyncedDataToCloud(user.id, newState).then(syncedState => {
              setState(syncedState);
              cacheToLocal(syncedState);
            }).catch(err => console.error("Error in post-save weight sync:", err));
            return newState;
          });
        }
      } catch (err) {
        console.error("Failed to save weight log to cloud:", err);
      }
    }
  };

  const saveCustomFood = async (foodSpec) => {
    const localId = "c" + Date.now();
    const newFood = {
      id: localId,
      name: foodSpec.name,
      kcal: foodSpec.kcal,
      protein: foodSpec.protein,
      carbs: foodSpec.carbs,
      fat: foodSpec.fat,
      unit: "100g",
    };
    
    const updated = {
      ...state,
      customFoods: [...(state.customFoods || []), newFood],
    };
    saveState(updated);

    if (user) {
      try {
        const savedFood = await db.addCustomFood(user.id, newFood);
        if (savedFood && savedFood.id) {
          setState(prev => {
            const newState = {
              ...prev,
              customFoods: (prev.customFoods || []).map(f => f.id === localId ? { ...f, id: savedFood.id } : f)
            };
            cacheToLocal(newState);
            return newState;
          });
        }
      } catch (err) {
        console.error("Failed to save custom food to cloud:", err);
      }
    }
  };

  const addFoodLog = async (food, qty, logDate, meal) => {
    const ratio = qty / 100;
    const localId = Date.now();
    const newLog = {
      id: localId,
      date: logDate || today(),
      meal: meal || "Almoço",
      foodName: food.name,
      qty,
      kcal: Math.round(food.kcal * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fat: Math.round(food.fat * ratio * 10) / 10,
    };
    
    const updated = {
      ...state,
      foodLogs: [...(state.foodLogs || []), newLog],
      selectedFood: null,
    };
    saveState(updated);

    if (user) {
      try {
        const savedLog = await db.addFoodLog(user.id, newLog);
        if (savedLog && savedLog.id) {
          setState(prev => {
            const newState = {
              ...prev,
              foodLogs: (prev.foodLogs || []).map(l => l.id === localId ? {
                ...l,
                id: savedLog.id,
                foodName: savedLog.food_name,
                qty: Number(savedLog.qty),
                kcal: Number(savedLog.kcal),
                protein: Number(savedLog.protein),
                carbs: Number(savedLog.carbs),
                fat: Number(savedLog.fat)
              } : l)
            };
            cacheToLocal(newState);
            // Background sync
            syncUnsyncedDataToCloud(user.id, newState).then(syncedState => {
              setState(syncedState);
              cacheToLocal(syncedState);
            }).catch(err => console.error("Error in post-save food sync:", err));
            return newState;
          });
        }
      } catch (err) {
        console.error("Failed to add food log to cloud:", err);
      }
    }
  };

  const removeFoodLog = async (id) => {
    const updated = {
      ...state,
      foodLogs: (state.foodLogs || []).filter((l) => l.id !== id),
    };
    saveState(updated);

    if (user) {
      try {
        await db.deleteFoodLog(user.id, id);
      } catch (err) {
        console.error("Failed to delete food log from cloud:", err);
      }
    }
  };

  const saveSessionWorkout = async (workoutSpec) => {
    const targetDate = workoutSpec.date || today();
    
    // Check if there is already a workout saved for this date
    const existing = (state.workoutLogs || []).find(w => w.date === targetDate);
    
    if (existing) {
      // Merge exercises
      const mergedExercises = [...(existing.exercises || [])];
      (workoutSpec.exercises || []).forEach(newEx => {
        if (newEx.isMetadata) {
          const metaIdx = mergedExercises.findIndex(e => e.isMetadata);
          if (metaIdx > -1) {
            mergedExercises[metaIdx] = {
              ...mergedExercises[metaIdx],
              duration: (mergedExercises[metaIdx].duration || 0) + (newEx.duration || 0),
              kcal: (mergedExercises[metaIdx].kcal || 0) + (newEx.kcal || 0)
            };
          } else {
            mergedExercises.push(newEx);
          }
        } else if (newEx.isCardio) {
          mergedExercises.push(newEx);
        } else {
          const exIdx = mergedExercises.findIndex(e => e.name === newEx.name);
          if (exIdx > -1) {
            mergedExercises[exIdx] = {
              ...mergedExercises[exIdx],
              sets: [...(mergedExercises[exIdx].sets || []), ...(newEx.sets || [])]
            };
          } else {
            mergedExercises.push(newEx);
          }
        }
      });
      
      const newVolume = (existing.volume || 0) + (workoutSpec.volume || 0);
      
      let newNotes = existing.notes || "";
      if (workoutSpec.notes) {
        newNotes = newNotes ? `${newNotes}\n${workoutSpec.notes}` : workoutSpec.notes;
      }
      
      const mergedWorkout = {
        ...existing,
        exercises: mergedExercises,
        notes: newNotes,
        volume: newVolume
      };
      
      await updateSessionWorkout(existing.id, mergedWorkout);
      return existing.id;
    }

    // eslint-disable-next-line react-hooks/purity
    const localId = Date.now();
    const newWorkout = {
      id: localId,
      date: targetDate,
      type: workoutSpec.type,
      exercises: workoutSpec.exercises,
      notes: workoutSpec.notes || "",
      volume: workoutSpec.volume,
    };

    const updated = {
      ...state,
      workoutLogs: [...(state.workoutLogs || []), newWorkout],
    };
    saveState(updated);

    if (user) {
      try {
        const savedWorkout = await db.addWorkoutLog(user.id, newWorkout);
        if (savedWorkout && savedWorkout.id) {
          setState(prev => {
            const newState = {
              ...prev,
              workoutLogs: prev.workoutLogs.map(w => w.id === localId ? {
                ...w, id: savedWorkout.id, date: savedWorkout.date, type: savedWorkout.type,
                exercises: savedWorkout.exercises, notes: savedWorkout.notes, volume: Number(savedWorkout.volume)
              } : w)
            };
            cacheToLocal(newState);
            // Background sync
            syncUnsyncedDataToCloud(user.id, newState).then(syncedState => {
              setState(syncedState);
              cacheToLocal(syncedState);
            }).catch(err => console.error("Error in post-save workout sync:", err));
            return newState;
          });
          return savedWorkout.id;
        }
        return localId;
      } catch (err) {
        console.error("Failed to save workout to cloud:", err);
        return localId;
      }
    }
    return localId;
  };

  // Atualiza um treino já salvo (auto-save durante a sessão)
  const updateSessionWorkout = async (logId, workoutSpec) => {
    const updatedWorkout = {
      id: logId,
      date: workoutSpec.date || today(),
      type: workoutSpec.type,
      exercises: workoutSpec.exercises,
      notes: workoutSpec.notes || "",
      volume: workoutSpec.volume,
    };

    setState(prev => {
      const newState = {
        ...prev,
        workoutLogs: prev.workoutLogs.map(w => w.id === logId ? updatedWorkout : w),
      };
      cacheToLocal(newState);
      return newState;
    });

    if (user) {
      try {
        if (typeof logId === 'number') {
          const savedWorkout = await db.addWorkoutLog(user.id, updatedWorkout);
          if (savedWorkout && savedWorkout.id) {
            setState(prev => {
              const newState = {
                ...prev,
                workoutLogs: prev.workoutLogs.map(w => w.id === logId ? { ...w, id: savedWorkout.id } : w)
              };
              cacheToLocal(newState);
              return newState;
            });
          }
        } else {
          await db.updateWorkoutLog(user.id, logId, updatedWorkout);
        }
      } catch (err) {
        console.error("Failed to update workout in cloud:", err);
      }
    }
  };

  const removeWorkoutLog = async (id) => {
    const updated = {
      ...state,
      workoutLogs: (state.workoutLogs || []).filter((w) => w.id !== id),
    };
    saveState(updated);

    if (user) {
      try {
        await db.deleteWorkoutLog(user.id, id);
      } catch (err) {
        console.error("Failed to delete workout from cloud:", err);
      }
    }
  };

  const saveProgressPhotos = async (photosSpec) => {
    const localId = Date.now();
    const localRecord = {
      id: localId,
      date: photosSpec.date,
      week: photosSpec.week,
      images: photosSpec.images,
    };
    
    const updated = {
      ...state,
      progressPhotos: [...(state.progressPhotos || []), localRecord],
    };
    saveState(updated);

    if (user) {
      try {
        setIsSyncing(true);
        const uploadedImages = {};
        for (const [angle, base64] of Object.entries(photosSpec.images || {})) {
          if (base64) {
            const url = await db.uploadBase64Photo(user.id, base64, `${photosSpec.week}-${angle}.jpg`);
            uploadedImages[angle] = url;
          } else {
            uploadedImages[angle] = null;
          }
        }
        const photoRecord = {
          date: photosSpec.date,
          week: photosSpec.week,
          images: uploadedImages
        };
        const savedPhoto = await db.addProgressPhoto(user.id, photoRecord);
        if (savedPhoto && savedPhoto.id) {
          setState(prev => {
            const newState = {
              ...prev,
              progressPhotos: (prev.progressPhotos || []).map(p => p.id === localId ? {
                ...p,
                id: savedPhoto.id,
                images: savedPhoto.image_urls
              } : p)
            };
            cacheToLocal(newState);
            return newState;
          });
        }
      } catch (err) {
        console.error("Failed to upload/save progress photos to cloud:", err);
        setSyncError(`Fotos de progresso: ${err.message || String(err)}`);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const saveDayEdit = async (dayIndex, updatedDayObj) => {
    const updatedSched = [...state.schedule];
    updatedSched[dayIndex] = updatedDayObj;

    // Se o dia foi vinculado a uma divisão (ex: "Upper", "Lower") que ainda não existe
    // como plano de exercícios, cria automaticamente uma entrada vazia. Isso mantém a
    // aba "Plano" do Treino sempre sincronizada com o que foi configurado na Semana.
    const newGroup = updatedDayObj.group;
    const updatedPlans =
      newGroup && !Object.prototype.hasOwnProperty.call(state.workoutPlans || {}, newGroup)
        ? { ...(state.workoutPlans || {}), [newGroup]: [] }
        : state.workoutPlans;

    const updated = {
      ...state,
      schedule: updatedSched,
      workoutPlans: updatedPlans,
    };
    saveState(updated);

    if (user) {
      try {
        await db.saveSchedule(user.id, updatedSched);
      } catch (err) {
        console.error("Failed to save schedule to cloud:", err);
      }
    }
  };

  const saveProfile = async (updatedProfile) => {
    const updated = {
      ...state,
      profile: updatedProfile,
    };
    saveState(updated);

    if (user) {
      try {
        await db.saveProfile(user.id, updatedProfile, state.mealPlan);
      } catch (err) {
        console.error("Failed to save profile to cloud:", err);
      }
    }
  };

  const saveMealPlan = async (newMealPlan) => {
    const updated = {
      ...state,
      mealPlan: newMealPlan,
    };
    saveState(updated);

    if (user) {
      try {
        await db.saveProfile(user.id, state.profile, newMealPlan);
      } catch (err) {
        console.error("Failed to save meal plan to cloud:", err);
      }
    }
  };

  const onFoodScanned = async (scannedFood) => {
    const alreadyExists = state.customFoods.some((f) => f.id === scannedFood.id);
    const updatedCustomFoods = alreadyExists
      ? state.customFoods
      : [...state.customFoods, scannedFood];

    const updated = {
      ...state,
      customFoods: updatedCustomFoods,
      selectedFood: scannedFood,
    };
    saveState(updated);

    if (!alreadyExists && user) {
      try {
        await db.addCustomFood(user.id, scannedFood);
      } catch (err) {
        console.error("Failed to save scanned food to cloud:", err);
      }
    }
  };

  const clearSelectedFood = () => {
    setState((prev) => ({
      ...prev,
      selectedFood: null,
    }));
  };

  const openScanner = (tab = "barcode") => {
    setScannerInitialTab(tab);
    setIsScannerOpen(true);
  };

  // Salva o plano de exercícios de um grupo (lista editável pelo usuário)
  const saveWorkoutPlan = (group, exercises) => {
    const updatedPlans = { ...state.workoutPlans, [group]: exercises };
    const updated = {
      ...state,
      workoutPlans: updatedPlans,
    };
    saveState(updated);

    // Antes esta função só salvava no localStorage — os planos nunca chegavam na
    // tabela "workout_plans" do Supabase, então "sincronizava" na aparência (o ícone
    // girava por causa de outras coisas) mas essa parte dos dados nunca ia pra nuvem.
    if (user) {
      db.saveWorkoutPlans(user.id, updatedPlans).catch((err) => {
        console.error("Failed to save workout plans to cloud:", err);
      });
    }
  };

  // Exclui um plano/divisão inteira (ex: "Legs") da lista de treinos.
  // Diferente de esvaziar o plano: remove de vez o grupo, então ele some dos seletores.
  // Também limpa qualquer dia da Semana que ainda apontava pra esse grupo.
  const deleteWorkoutPlan = (group) => {
    const updatedPlans = { ...state.workoutPlans };
    delete updatedPlans[group];
    // Importante: usar DEFAULT_SCHEDULE (não []) como fallback. Se essa função rodar num
    // instante em que state.schedule ainda está undefined (ex: durante a sincronização com
    // a nuvem logo após o login), "state.schedule || []" apagava a semana inteira de vez —
    // porque o resultado ([].map(...) = []) era salvo de volta no estado e no localStorage.
    const baseSchedule = (state.schedule && state.schedule.length === 7) ? state.schedule : DEFAULT_SCHEDULE;
    const updatedSchedule = baseSchedule.map((d) =>
      d.group === group ? { ...d, group: null } : d
    );
    saveState({ ...state, workoutPlans: updatedPlans, schedule: updatedSchedule });

    if (user) {
      db.saveWorkoutPlans(user.id, updatedPlans).catch((err) => {
        console.error("Failed to save workout plans to cloud:", err);
      });
    }
  };

  const saveCustomExercise = async (group, name, primaryMuscle = null, secondaryMuscle = null, equipment = null) => {
    if (!group || !name) return;

    const updatedCustomExs = { ...state.customExercises };
    if (!updatedCustomExs[group]) {
      updatedCustomExs[group] = [];
    }
    if (!updatedCustomExs[group].includes(name)) {
      updatedCustomExs[group].push(name);
    }

    const updatedCustomMuscleMap = { ...state.customMuscleMap };
    if (primaryMuscle) {
      updatedCustomMuscleMap[name] = primaryMuscle;
    }

    // Metadados extras (músculo secundário + equipamento) — usados no guia do exercício
    // e em telas futuras. Guardados à parte pra não mudar o formato de customMuscleMap,
    // que outras partes do app (getMuscle) esperam como string simples.
    const updatedCustomExerciseMeta = { ...(state.customExerciseMeta || {}) };
    if (secondaryMuscle || equipment) {
      updatedCustomExerciseMeta[name] = { secondary: secondaryMuscle || null, equipment: equipment || null };
    }

    const updated = {
      ...state,
      customExercises: updatedCustomExs,
      customMuscleMap: updatedCustomMuscleMap,
      customExerciseMeta: updatedCustomExerciseMeta,
    };
    saveState(updated);

    if (user) {
      try {
        await db.addCustomExercise(user.id, group, name);
      } catch (err) {
        console.error("Failed to save custom exercise to cloud:", err);
      }
    }
  };

  // ── MODAL HELPERS ──────────────────────────────────────────────────────────
  const openEditDayModal = (index) => {
    setEditDayIndex(index);
    setIsEditDayOpen(true);
  };

  const openHistoryModal = (exName) => {
    setHistoryExName(exName);
    setIsHistoryOpen(true);
  };

  const openGuideModal = (exName) => {
    setGuideExName(exName);
    setIsGuideOpen(true);
  };

  const [isCoachChatOpen, setIsCoachChatOpen] = useState(false);
  const [aiPlanModal, setAiPlanModal] = useState({ open: false, group: "" });
  const [showAddVideo, setShowAddVideo] = useState(false);

  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", background: "#0a0a0f", gap: "16px" }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid rgba(255,255,255,0.06)", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div className="syne" style={{ fontSize: "14px", fontWeight: "700", letterSpacing: "1px", color: "rgba(255,255,255,0.5)" }}>
          CARREGANDO HEAVYDUTYOS...
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0f",
        padding: "24px",
        color: "#fff",
        fontFamily: "var(--font-sans, sans-serif)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Glowing Background Orbs */}
        <div style={{
          position: "absolute",
          width: "250px",
          height: "250px",
          background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, rgba(0,0,0,0) 70%)",
          top: "20%",
          left: "15%",
          filter: "blur(40px)",
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute",
          width: "250px",
          height: "250px",
          background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(0,0,0,0) 70%)",
          bottom: "20%",
          right: "15%",
          filter: "blur(40px)",
          pointerEvents: "none"
        }} />

        <div className="card" style={{
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
          padding: "40px 32px",
          background: "rgba(255, 255, 255, 0.02)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: "24px",
          position: "relative",
          zIndex: 1,
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
        }}>
          {/* Logo HeavyDutyOS */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <HeavyDutyLogo size={80} withText />
          </div>

          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6", marginBottom: "28px", textAlign: "center" }}>
            Treino de alta intensidade ao estilo Mike Mentzer.<br/>Registre, evolua, domine.
          </p>

          {!supabase ? (
            <div style={{
              background: "rgba(239, 68, 68, 0.06)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "16px",
              padding: "16px",
              textAlign: "left",
              fontSize: "12.5px",
              lineHeight: "1.45",
              color: "rgba(255,255,255,0.8)"
            }}>
              <div style={{ fontWeight: "700", color: "#ef4444", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                ⚠️ Supabase Não Configurado
              </div>
              Certifique-se de configurar as variáveis de ambiente <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no seu arquivo <code>.env.local</code> para habilitar o login.
            </div>
          ) : (
            <button
              className="btn-login-google"
              style={{
                width: "100%",
                background: "#fff",
                color: "#0a0a0f",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "14px",
                borderRadius: "16px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(255,255,255,0.15)"
              }}
              onClick={async () => {
                try {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                      redirectTo: window.location.origin
                    }
                  });
                  if (error) throw error;
                } catch (err) {
                  console.error("Erro no login:", err.message);
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Entrar com o Google
            </button>
          )}

          <div style={{ marginTop: "32px", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
            Ao entrar, você concorda com o salvamento seguro dos seus dados.
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .btn-login-google:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255,255,255,0.25);
            background: #f4f4f5 !important;
          }
          .btn-login-google:active {
            transform: translateY(0);
          }
        ` }} />
      </div>
    );
  }

  const currentSched = todaySched();

  return (
    <div style={{ padding: "16px 20px 80px" }}>
      {/* GLOBAL HEADER */}
      <Header todaySched={currentSched} user={user} isSyncing={isSyncing} />

      {/* VIEWPORT AREA */}
      <div style={{ padding: "16px 0" }}>
        {(() => {
          const calculatedMetabolism = calculateMetabolicTargets(state.profile);
          const activeProfile = {
            ...state.profile,
            tdee: calculatedMetabolism.tdee,
            tmb: calculatedMetabolism.tmb,
            weeklyDeficitNeeded: calculatedMetabolism.weeklyDeficitNeeded,
            weeklyWeightLossTargetKg: calculatedMetabolism.weeklyWeightLossTargetKg,
            normal: calculatedMetabolism.normal,
            heavy: calculatedMetabolism.heavy,
          };
          return (
            <>
              {activeTab === "dashboard" && (
                <Dashboard
                  state={state}
                  saveWeightLog={saveWeightLog}
                  todaySched={currentSched}
                  getTargets={getTargets}
                  todayFoodLogs={todayFoodLogs}
                  getTotals={getTotals}
                  PROFILE={activeProfile}
                />
              )}
              {activeTab === "diet" && (
                <DietTab
                  state={state}
                  saveCustomFood={saveCustomFood}
                  addFoodLog={addFoodLog}
                  removeFoodLog={removeFoodLog}
                  openScanner={(tab) => openScanner(tab)}
                  todaySched={currentSched}
                  getTargets={getTargets}
                  todayFoodLogs={todayFoodLogs}
                  getTotals={getTotals}
                  allFoods={allFoods}
                  mealPlan={state.mealPlan}
                  saveMealPlan={saveMealPlan}
                  fmtDate={fmtDate}
                  today={today}
                  clearSelectedFood={clearSelectedFood}
                />
              )}
              {activeTab === "workout" && (
                <WorkoutTab
                  state={state}
                  saveSessionWorkout={saveSessionWorkout}
                  updateSessionWorkout={updateSessionWorkout}
                  removeWorkoutLog={removeWorkoutLog}
                  getExercises={getExercises}
                  saveCustomExercise={saveCustomExercise}
                  workoutPlans={state.workoutPlans || {}}
                  saveWorkoutPlan={saveWorkoutPlan}
                  deleteWorkoutPlan={deleteWorkoutPlan}
                  DEFAULT_EXERCISES={DEFAULT_EXERCISES}
                  customMuscleMap={state.customMuscleMap || {}}
                  saveCustomMuscleMap={(map) => { const u = { ...state, customMuscleMap: map }; saveState(u); }}
                  SET_TYPES={SET_TYPES}
                  today={today}
                  fmtDate={fmtDate}
                  openHistoryModal={openHistoryModal}
                  openGuideModal={openGuideModal}
  openAiPlanModal={(group)=>setAiPlanModal({open:true,group})}
                  fireRestTimer={fireRestTimer}
                  setRestTimerExName={setRestTimerExName}
                  restTimer={restTimer}
                  openEditDayModal={openEditDayModal}
                />
              )}
              {activeTab === "progress" && (
                <ProgressTab
                  state={state}
                  saveProgressPhotos={saveProgressPhotos}
                  PROFILE={activeProfile}
                  fmtDate={fmtDate}
                  today={today}
                  isSyncing={isSyncing}
                />
              )}
              {activeTab === "settings" && (
                <SettingsTab
                  state={state}
                  user={user}
                  supabase={supabase}
                  syncError={syncError}
                  clearSyncError={() => setSyncError(null)}
                  openEditDayModal={openEditDayModal}
                  onImportSchedule={async (importedSchedule) => {
                    if (user) {
                      try {
                        await db.saveSchedule(user.id, importedSchedule);
                      } catch (err) {
                        console.error("Failed to save imported schedule to cloud:", err);
                      }
                    }
                    const updated = {
                      ...state,
                      schedule: importedSchedule,
                    };
                    saveState(updated);
                  }}
                  saveProfile={saveProfile}
                  calculateMetabolicTargets={calculateMetabolicTargets}
                />
              )}
            </>
          );
        })()}
      </div>

      {/* TAB BAR Bottom Navigation */}
      {/* Botão flutuante — Adicionar Vídeo ao Coach */}
      <button
        onClick={() => setShowAddVideo(true)}
        style={{
          position:"fixed",right:"20px",bottom:"162px",zIndex:500,
          width:"44px",height:"44px",borderRadius:"14px",border:"none",
          background:"rgba(255,255,255,0.08)",
          border:"1px solid rgba(255,255,255,0.1)",
          boxShadow:"0 4px 16px rgba(0,0,0,0.3)",
          cursor:"pointer",display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",gap:"2px",
        }}
        title="Treinar Coach com Vídeo"
      >
        <span style={{fontSize:"16px",lineHeight:1}}>🎙️</span>
        <span style={{fontSize:"7px",fontWeight:"800",color:"rgba(255,255,255,0.5)",letterSpacing:"0.3px",fontFamily:"'DM Sans',sans-serif"}}>VÍDEO</span>
      </button>

      {/* Botão flutuante do HeavyDuty Coach */}
      <button
        onClick={() => setIsCoachChatOpen(true)}
        style={{
          position: "fixed", right: "20px", bottom: "100px", zIndex: 500,
          width: "50px", height: "50px", borderRadius: "16px", border: "none",
          background: "linear-gradient(135deg,#f97316,#fb923c)",
          boxShadow: "0 4px 20px rgba(249,115,22,0.45)",
          cursor: "pointer", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "1px",
        }}
        title="HeavyDuty Coach"
      >
        <svg width="22" height="14" viewBox="0 0 100 62" fill="none">
          <path d="M50 26 C44 20,33 18,22 22 C14 25,10 33,11 39 C12 43,17 45,23 43 C31 40,41 32,47 28 Z" fill="white" opacity="0.95"/>
          <path d="M50 28 C44 31,35 36,27 43 C19 49,11 50,11 41 C10 34,15 28,22 24 C30 20,42 18,49 26 Z" fill="white" opacity="0.7"/>
          <path d="M50 26 C56 20,67 18,78 22 C86 25,90 33,89 39 C88 43,83 45,77 43 C69 40,59 32,53 28 Z" fill="white" opacity="0.95"/>
          <path d="M50 28 C56 31,65 36,73 43 C81 49,89 50,89 41 C90 34,85 28,78 24 C70 20,58 18,51 26 Z" fill="white" opacity="0.7"/>
          <path d="M11 40 C9 44,7 51,8 56 C9 59,12 60,14 58 C16 56,16 49,15 44 Z" fill="white" opacity="0.8"/>
          <path d="M89 40 C91 44,93 51,92 56 C91 59,88 60,86 58 C84 56,84 49,85 44 Z" fill="white" opacity="0.8"/>
        </svg>
        <span style={{ fontSize: "7px", fontWeight: "800", color: "rgba(255,255,255,0.85)", letterSpacing: "0.3px", fontFamily: "'DM Sans',sans-serif" }}>COACH</span>
      </button>

      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* GLOBAL MODALS */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onFoodScanned={onFoodScanned}
        allFoods={allFoods()}
        initialTab={scannerInitialTab}
      />

      <EditDayModal
        isOpen={isEditDayOpen}
        onClose={() => setIsEditDayOpen(false)}
        dayIndex={editDayIndex}
        schedule={state.schedule}
        saveDayEdit={saveDayEdit}
        COLORS={COLORS}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        exerciseName={historyExName}
        state={state}
        SET_TYPES={SET_TYPES}
      />

      {aiPlanModal.open && (
        <AiPlanModal
          group={aiPlanModal.group}
          onClose={()=>setAiPlanModal({open:false,group:""})}
          onApply={(dias)=>{
            // Aplica o primeiro dia do plano ao grupo ativo
            if (dias?.length) {
              const exs = dias.flatMap(d=>d.exercicios||[]);
              const unique = [...new Set(exs)];
              saveWorkoutPlan(aiPlanModal.group, unique);
            }
          }}
        />
      )}

      {showAddVideo && <AddVideoModal onClose={()=>setShowAddVideo(false)}/>}

      <CoachChatModal
        isOpen={isCoachChatOpen}
        onClose={() => setIsCoachChatOpen(false)}
        workoutLogs={state.workoutLogs || []}
      />

      <ExerciseGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        exerciseName={guideExName}
      />
    </div>
  );
}
