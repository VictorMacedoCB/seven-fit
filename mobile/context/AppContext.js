import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import exercisesDb from "../assets/exercises-ptbr.json";

export const AppContext = createContext();

export const DEFAULT_PROFILE = {
  weight: 87,
  height: 176,
  age: 23,
  current_bf: 19,
  goal_bf: 12,
  activityFactor: 1.725,
  gender: "male",
  proteinFactor: 1.8
};

export const DEFAULT_MEAL_PLAN = {
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

export const DEFAULT_EXERCISES = {
  Push: [
    "Supino Reto", "Supino Inclinado", "Supino Declinado", "Crucifixo", "Crucifixo Inclinado", "Pec Deck", "Crossover",
    "Desenvolvimento com Barra", "Desenvolvimento com Halteres", "Elevação Lateral", "Elevação Frontal", "Encolhimento", "Face Pull",
    "Tríceps Corda", "Tríceps Testa", "Tríceps Francês", "Tríceps Banco", "Mergulho", "Extensão Tríceps"
  ],
  Pull: [
    "Puxada Frente", "Puxada Neutra", "Puxada Fechada", "Barra Fixa", "Pullover",
    "Remada Curvada", "Remada Unilateral", "Remada Cavalinho", "Remada Sentado", "Serrote",
    "Rosca Direta", "Rosca Martelo", "Rosca Concentrada", "Rosca 21", "Rosca Inversa", "Rosca Scott",
    "Crucifixo Invertido com Halteres", "Crucifixo Invertido na Máquina", "Face Pull"
  ],
  Legs: [
    "Agachamento Livre", "Agachamento Smith", "Agachamento Sumô", "Leg Press", "Hack Squat",
    "Cadeira Extensora", "Mesa Flexora", "Cadeira Adutora", "Cadeira Abdutora",
    "Stiff", "Avanço", "Avanço com Barra", "Agachamento Búlgaro",
    "Panturrilha em Pé", "Panturrilha Sentado", "Panturrilha no Leg Press"
  ],
  Upper: [
    "Supino Reto", "Supino Inclinado", "Crucifixo", "Pec Deck",
    "Desenvolvimento com Halteres", "Elevação Lateral", "Face Pull",
    "Tríceps Corda", "Tríceps Testa",
    "Puxada Frente", "Remada Curvada", "Remada Unilateral", "Pullover"
  ],
  Lower: [
    "Agachamento Livre", "Leg Press", "Cadeira Extensora", "Mesa Flexora", "Stiff",
    "Avanço", "Panturrilha em Pé", "Panturrilha Sentado",
    "Rosca Direta", "Rosca Martelo", "Rosca Concentrada"
  ]
};

export const DEFAULT_WORKOUT_PLANS = {
  Push: ["Supino Reto", "Supino Inclinado", "Crucifixo", "Desenvolvimento com Halteres", "Elevação Lateral", "Tríceps Corda", "Tríceps Testa"],
  Pull: ["Puxada Frente", "Remada Curvada", "Remada Unilateral", "Pullover", "Rosca Direta", "Rosca Martelo"],
  Legs: ["Agachamento Livre", "Leg Press", "Cadeira Extensora", "Mesa Flexora", "Stiff", "Panturrilha em Pé"],
  Upper: ["Supino Reto", "Desenvolvimento com Halteres", "Elevação Lateral", "Puxada Frente", "Remada Curvada", "Tríceps Corda"],
  Lower: ["Leg Press", "Stiff", "Mesa Flexora", "Cadeira Extensora", "Panturrilha em Pé", "Rosca Direta", "Rosca Martelo"],
};

export const DEFAULT_SCHEDULE = [
  { day: "Seg", type: "Push", color: "#f97316", calType: "normal", group: "Push" },
  { day: "Ter", type: "Pull", color: "#3b82f6", calType: "normal", group: "Pull" },
  { day: "Qua", type: "Legs 🦵", color: "#8b5cf6", calType: "heavy", group: "Legs" },
  { day: "Qui", type: "Jiu-Jitsu 🥋", color: "#10b981", calType: "normal", group: "Upper" },
  { day: "Sex", type: "Upper", color: "#f59e0b", calType: "normal", group: "Upper" },
  { day: "Sab", type: "Lower 🦵", color: "#ec4899", calType: "heavy", group: "Lower" },
  { day: "Dom", type: "Descanso 🍕", color: "#6b7280", calType: "free", group: null }
];

export const DEFAULT_FOODS = [
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

export const SET_TYPES = [
  { id: "aquecimento", label: "Aquecimento", emoji: "🔥", color: "#f59e0b" },
  { id: "valida",     label: "Válida",       emoji: "✅", color: "#10b981" },
  { id: "pap",        label: "PAP",          emoji: "⚡", color: "#8b5cf6" },
  { id: "feeder",     label: "Feeder",       emoji: "🩸", color: "#ef4444" },
];

export const calculateMetabolicTargets = (profile) => {
  const rawProfile = profile || DEFAULT_PROFILE;
  const p = {
    weight: parseFloat(rawProfile.weight) || DEFAULT_PROFILE.weight,
    height: parseFloat(rawProfile.height) || DEFAULT_PROFILE.height,
    age: parseInt(rawProfile.age) || DEFAULT_PROFILE.age,
    current_bf: parseFloat(rawProfile.current_bf) || DEFAULT_PROFILE.current_bf,
    goal_bf: parseFloat(rawProfile.goal_bf) || DEFAULT_PROFILE.goal_bf,
    activityFactor: parseFloat(rawProfile.activityFactor) || DEFAULT_PROFILE.activityFactor,
    gender: rawProfile.gender || DEFAULT_PROFILE.gender,
    proteinFactor: parseFloat(rawProfile.proteinFactor) || DEFAULT_PROFILE.proteinFactor
  };
  
  // TMB (Mifflin-St Jeor)
  let tmb = 10 * p.weight + 6.25 * p.height - 5 * p.age;
  if (p.gender === "female") {
    tmb -= 161;
  } else {
    tmb += 5;
  }
  
  // TDEE
  const tdee = Math.round(tmb * p.activityFactor);
  
  // Weekly safe weight loss target (0.7% of body weight)
  const weeklyWeightLossTargetKg = p.weight * 0.007;
  
  // 1kg of fat = 7700 kcal. Deficit needed per week:
  const weeklyDeficitNeeded = Math.round(weeklyWeightLossTargetKg * 7700);
  
  // Sunday is a free day. Total regulated energy target per week:
  const dailyAverageControlledTarget = tdee - Math.round(weeklyDeficitNeeded / 6);
  
  // Macros factor
  const pFactor = parseFloat(p.proteinFactor) || 1.8;
  const proteinGrams = Math.round(pFactor * p.weight);
  const fatGrams = Math.round(0.8 * p.weight);
  
  const kcalNormal = Math.round((dailyAverageControlledTarget - 30) / 50) * 50;
  const kcalHeavy = kcalNormal + 200;
  
  const carbsNormal = Math.max(0, Math.round((kcalNormal - (proteinGrams * 4) - (fatGrams * 9)) / 4));
  const carbsHeavy = Math.max(0, Math.round((kcalHeavy - (proteinGrams * 4) - (fatGrams * 9)) / 4));
  
  return {
    tmb,
    tdee,
    weeklyWeightLossTargetKg: Math.round(weeklyWeightLossTargetKg * 1000) / 1000,
    weeklyDeficitNeeded,
    dailyAverageControlledTarget,
    proteinGrams,
    fatGrams,
    normal: {
      kcal: kcalNormal,
      protein: proteinGrams,
      carbs: carbsNormal,
      fat: fatGrams
    },
    heavy: {
      kcal: kcalHeavy,
      protein: proteinGrams,
      carbs: carbsHeavy,
      fat: fatGrams
    }
  };
};

export const AppProvider = ({ children }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [state, setState] = useState({
    foodLogs: [],
    workoutLogs: [],
    weightLogs: [],
    customFoods: [],
    customExercises: {},
    customMuscleMap: {},
    workoutPlans: DEFAULT_WORKOUT_PLANS,
    schedule: DEFAULT_SCHEDULE,
    progressPhotos: [],
    profile: DEFAULT_PROFILE,
    mealPlan: DEFAULT_MEAL_PLAN,
    selectedFood: null
  });

  useEffect(() => {
    const loadCachedState = async () => {
      try {
        const keys = [
          "co_foodLogs",
          "co_workoutLogs",
          "co_weightLogs",
          "co_customFoods",
          "co_customExercises",
          "co_customMuscleMap",
          "co_workoutPlans",
          "co_schedule",
          "co_progressPhotos",
          "co_profile",
          "co_mealPlan"
        ];
        const cached = await AsyncStorage.multiGet(keys);
        const cacheMap = {};
        cached.forEach(([key, val]) => {
          cacheMap[key] = val ? JSON.parse(val) : null;
        });

        setState((prev) => ({
          ...prev,
          foodLogs: cacheMap["co_foodLogs"] || [],
          workoutLogs: cacheMap["co_workoutLogs"] || [],
          weightLogs: cacheMap["co_weightLogs"] || [],
          customFoods: cacheMap["co_customFoods"] || [],
          customExercises: cacheMap["co_customExercises"] || {},
          customMuscleMap: cacheMap["co_customMuscleMap"] || {},
          workoutPlans: cacheMap["co_workoutPlans"] || DEFAULT_WORKOUT_PLANS,
          schedule: cacheMap["co_schedule"] || DEFAULT_SCHEDULE,
          progressPhotos: cacheMap["co_progressPhotos"] || [],
          profile: cacheMap["co_profile"] || DEFAULT_PROFILE,
          mealPlan: cacheMap["co_mealPlan"] || DEFAULT_MEAL_PLAN
        }));
      } catch (err) {
        console.error("AsyncStorage hydration error:", err);
      } finally {
        setIsHydrated(true);
      }
    };
    loadCachedState();
  }, []);

  const saveStateField = async (field, storageKey, data) => {
    setState((prev) => {
      const updated = { ...prev, [field]: data };
      AsyncStorage.setItem(storageKey, JSON.stringify(data)).catch((e) =>
        console.error(`Error saving ${field}:`, e)
      );
      return updated;
    });
  };

  const saveWeightLog = (value) => {
    const logObj = { id: Date.now(), date: today(), value };
    const updated = [...state.weightLogs, logObj];
    saveStateField("weightLogs", "co_weightLogs", updated);
  };

  const addFoodLog = (food, qty, logDate, meal) => {
    const ratio = qty / 100;
    const newLog = {
      id: Date.now(),
      date: logDate || today(),
      meal: meal || "Almoço",
      foodName: food.name,
      qty,
      kcal: Math.round(food.kcal * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fat: Math.round(food.fat * ratio * 10) / 10
    };
    const updated = [...state.foodLogs, newLog];
    saveStateField("foodLogs", "co_foodLogs", updated);
  };

  const removeFoodLog = (id) => {
    const updated = state.foodLogs.filter((l) => l.id !== id);
    saveStateField("foodLogs", "co_foodLogs", updated);
  };

  const saveCustomFood = (foodSpec) => {
    const newFood = {
      id: "c" + Date.now(),
      name: foodSpec.name,
      kcal: foodSpec.kcal,
      protein: foodSpec.protein,
      carbs: foodSpec.carbs,
      fat: foodSpec.fat,
      unit: "100g"
    };
    const updated = [...state.customFoods, newFood];
    saveStateField("customFoods", "co_customFoods", updated);
  };

  const saveSessionWorkout = (workoutSpec) => {
    const targetDate = workoutSpec.date || today();
    const existingIndex = state.workoutLogs.findIndex((w) => w.date === targetDate);

    let updatedLogs = [...state.workoutLogs];

    if (existingIndex > -1) {
      const existing = state.workoutLogs[existingIndex];
      const mergedExercises = [...(existing.exercises || [])];

      (workoutSpec.exercises || []).forEach((newEx) => {
        if (newEx.isMetadata) {
          const metaIdx = mergedExercises.findIndex((e) => e.isMetadata);
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
          const exIdx = mergedExercises.findIndex((e) => e.name === newEx.name);
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

      updatedLogs[existingIndex] = {
        ...existing,
        exercises: mergedExercises,
        notes: newNotes,
        volume: newVolume
      };
    } else {
      const newWorkout = {
        id: Date.now(),
        date: targetDate,
        type: workoutSpec.type,
        exercises: workoutSpec.exercises || [],
        notes: workoutSpec.notes || "",
        volume: workoutSpec.volume || 0
      };
      updatedLogs.push(newWorkout);
    }

    saveStateField("workoutLogs", "co_workoutLogs", updatedLogs);
  };

  const removeWorkoutLog = (id) => {
    const updated = state.workoutLogs.filter((w) => w.id !== id);
    saveStateField("workoutLogs", "co_workoutLogs", updated);
  };

  const saveCustomExercise = (group, name, muscle = null) => {
    const updatedExs = { ...state.customExercises };
    if (!updatedExs[group]) updatedExs[group] = [];
    if (!updatedExs[group].includes(name)) updatedExs[group].push(name);

    const updatedMuscleMap = { ...state.customMuscleMap };
    if (muscle) updatedMuscleMap[name] = muscle;

    setState((prev) => {
      const updated = {
        ...prev,
        customExercises: updatedExs,
        customMuscleMap: updatedMuscleMap
      };
      AsyncStorage.setItem("co_customExercises", JSON.stringify(updatedExs));
      AsyncStorage.setItem("co_customMuscleMap", JSON.stringify(updatedMuscleMap));
      return updated;
    });
  };

  const saveWorkoutPlan = (group, exercises) => {
    const updatedPlans = { ...state.workoutPlans, [group]: exercises };
    saveStateField("workoutPlans", "co_workoutPlans", updatedPlans);
  };

  const saveDayEdit = (dayIndex, updatedDay) => {
    const updatedSchedule = [...state.schedule];
    updatedSchedule[dayIndex] = updatedDay;
    saveStateField("schedule", "co_schedule", updatedSchedule);
  };

  const saveProfile = (newProfile) => {
    saveStateField("profile", "co_profile", newProfile);
  };

  const saveMealPlan = (newPlan) => {
    saveStateField("mealPlan", "co_mealPlan", newPlan);
  };

  const saveProgressPhotos = (newPhotos) => {
    saveStateField("progressPhotos", "co_progressPhotos", newPhotos);
  };

  const setSelectedFood = (food) => {
    setState(prev => ({ ...prev, selectedFood: food }));
  };

  const today = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const fmtDate = (d) => {
    try {
      const parts = d.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
      }
      return d;
    } catch {
      return d;
    }
  };

  const getDOW = () => {
    const d = new Date();
    return ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][d.getDay()];
  };

  const todaySched = () => {
    return state.schedule.find((s) => s.day === getDOW()) || state.schedule[6];
  };

  const getTargets = () => {
    const s = todaySched();
    const targets = calculateMetabolicTargets(state.profile);
    return s.calType === "heavy"
      ? targets.heavy
      : s.calType === "free"
      ? { kcal: 9999, protein: 0, carbs: 0, fat: 0 }
      : targets.normal;
  };

  const allFoods = () => {
    return [...DEFAULT_FOODS, ...state.customFoods];
  };

  const getExercises = (group) => {
    if (!group) return [];

    const mapMuscleToGroup = (ex) => {
      const primary = ex.primaryMuscles?.[0];
      if (!primary) return null;
      const nameNorm = ex.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (primary === 'ombros') {
        const isRearDelt = nameNorm.includes('invertido') || 
                           nameNorm.includes('inverso') || 
                           nameNorm.includes('posterior') || 
                           nameNorm.includes('rear delt') ||
                           nameNorm.includes('face pull');
        if (isRearDelt) return 'Pull';
        return 'Push';
      }
      const pushMuscles = ['peito', 'triceps', 'trapezio'];
      const pullMuscles = ['dorsais', 'meio-das-costas', 'inferior-das-costas', 'biceps', 'antebracos', 'pescoco'];
      const legsMuscles = ['quadriceps', 'isquiotibiais', 'gluteos', 'panturrilhas', 'adutores', 'abdutores', 'abdominais'];
      
      if (pushMuscles.includes(primary)) return 'Push';
      if (pullMuscles.includes(primary)) return 'Pull';
      if (legsMuscles.includes(primary)) return 'Legs';
      return null;
    };

    const dbExercises = exercisesDb.filter(ex => {
      const primary = ex.primaryMuscles?.[0];
      const mapped = mapMuscleToGroup(ex);
      if (group === 'Push') return mapped === 'Push';
      if (group === 'Pull') return mapped === 'Pull';
      if (group === 'Legs') return mapped === 'Legs';
      if (group === 'Upper') return mapped === 'Push' || mapped === 'Pull';
      if (group === 'Lower') return mapped === 'Legs' || primary === 'biceps';
      return false;
    }).map(ex => ex.name);

    return [
      ...new Set([
        ...(DEFAULT_EXERCISES[group] || []),
        ...dbExercises,
        ...(state.customExercises[group] || [])
      ])
    ].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  };

  return (
    <AppContext.Provider
      value={{
        state,
        isHydrated,
        addFoodLog,
        removeFoodLog,
        saveWeightLog,
        saveCustomFood,
        saveSessionWorkout,
        removeWorkoutLog,
        saveCustomExercise,
        saveWorkoutPlan,
        saveDayEdit,
        saveProfile,
        saveMealPlan,
        saveProgressPhotos,
        setSelectedFood,
        today,
        fmtDate,
        getDOW,
        todaySched,
        getTargets,
        allFoods,
        getExercises,
        calculateMetabolicTargets
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
