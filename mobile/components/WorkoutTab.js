import React, { useContext, useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { AppContext, SET_TYPES } from "../context/AppContext";
import { Flame, CheckCircle2, History, X, Plus, Save, Zap, Droplets, Search, ChevronDown, ChevronUp, Trash2 } from "lucide-react-native";

export default function WorkoutTab() {
  const {
    state,
    today,
    fmtDate,
    saveSessionWorkout,
    removeWorkoutLog,
    getExercises,
    saveCustomExercise,
    saveWorkoutPlan
  } = useContext(AppContext);

  const ALL_GROUPS = ["Push", "Pull", "Legs", "Upper", "Lower"];

  const [activeSubTab, setActiveSubTab] = useState("session");
  const [sessionDate, setSessionDate] = useState(() => today());
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Active workout session exercises
  const [sessionExs, setSessionExs] = useState([]);
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionStarted, setSessionStarted] = useState(false);

  // Set recording state
  const [expandedEx, setExpandedEx] = useState(null); // which card is open (index)
  const [serieType, setSerieType] = useState("valida");
  const [serieWeight, setSerieWeight] = useState("");
  const [serieReps, setSerieReps] = useState("");

  // Search extra exercise
  const [showAddEx, setShowAddEx] = useState(false);
  const [exSearch, setExSearch] = useState("");

  // Plan sub-tab
  const [planGroup, setPlanGroup] = useState("Push");
  const [planSearch, setPlanSearch] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);

  // Cardio states
  const [weightDuration, setWeightDuration] = useState("60");
  const [weightKcal, setWeightKcal] = useState("360");
  const [cardios, setCardios] = useState([]);
  const [showCardioForm, setShowCardioForm] = useState(false);
  const [cardioType, setCardioType] = useState("Corrida");
  const [cardioDuration, setCardioDuration] = useState("");
  const [cardioDistance, setCardioDistance] = useState("");
  const [cardioKcal, setCardioKcal] = useState("");

  // History sub-tab
  const [histWrkDate, setHistWrkDate] = useState("");

  const todayDOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][new Date(sessionDate + "T12:00:00").getDay()];
  const schedule = state?.schedule || [
    { day: "Seg", type: "Push", color: "#f97316", calType: "normal", group: "Push" },
    { day: "Ter", type: "Pull", color: "#3b82f6", calType: "normal", group: "Pull" },
    { day: "Qua", type: "Legs 🦵", color: "#8b5cf6", calType: "heavy", group: "Legs" },
    { day: "Qui", type: "Jiu-Jitsu 🥋", color: "#10b981", calType: "normal", group: "Upper" },
    { day: "Sex", type: "Upper", color: "#f59e0b", calType: "normal", group: "Upper" },
    { day: "Sab", type: "Lower 🦵", color: "#ec4899", calType: "heavy", group: "Lower" },
    { day: "Dom", type: "Descanso 🍕", color: "#6b7280", calType: "free", group: null }
  ];
  const sched = schedule.find((x) => x.day === todayDOW) || schedule[6];
  const activeGroup = selectedGroup || sched.group;

  const existingWorkout = (state.workoutLogs || []).find((w) => w.date === sessionDate);
  const displayDuration = sessionStarted ? weightDuration : (existingWorkout ? "0" : "60");
  const displayKcal = sessionStarted ? weightKcal : (existingWorkout ? "0" : "360");

  const dates = [...new Set((state.workoutLogs || []).map((w) => w.date))].sort().reverse();
  const activeHistDate = histWrkDate || dates[0] || "";

  // Initialize session with plan exercises when activeGroup changes (if not already started)
  useEffect(() => {
    if (!sessionStarted && activeGroup) {
      const plan = state.workoutPlans[activeGroup] || [];
      setSessionExs(plan.map((name) => ({ name, sets: [] })));
    }
  }, [activeGroup, sessionStarted, state.workoutPlans]);

  const handleSelectGroup = (g) => {
    setSelectedGroup(selectedGroup === g ? null : g);
    if (sessionStarted) {
      // Just visually change group focus
    }
  };

  const setTypeIcon = (id, size = 12) => {
    if (id === "aquecimento") return <Flame size={size} color="#f59e0b" />;
    if (id === "pap")         return <Zap size={size} color="#8b5cf6" />;
    if (id === "feeder")      return <Droplets size={size} color="#ef4444" />;
    return <CheckCircle2 size={size} color="#10b981" />;
  };

  // Performance anterior (histórico)
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

  // Efeito para auto-preencher carga/reps ao expandir card ou adicionar exercício
  useEffect(() => {
    if (expandedEx !== null && expandedEx !== undefined && sessionExs[expandedEx]) {
      const ex = sessionExs[expandedEx];
      if (ex.sets && ex.sets.length > 0) {
        const lastSet = ex.sets[ex.sets.length - 1];
        setSerieWeight(String(lastSet.weight));
        setSerieReps(String(lastSet.reps));
      } else {
        const prev = getPrevPerf(ex.name);
        if (prev) {
          setSerieWeight(String(prev.lastWeight));
          setSerieReps(String(prev.lastReps));
        } else {
          setSerieWeight("");
          setSerieReps("");
        }
      }
    }
  }, [expandedEx, sessionExs]);

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
    // Não limpa mais os inputs para permitir registrar séries idênticas rapidamente
  };

  const handleRemoveSet = (exIdx, setIdx) => {
    setSessionStarted(true);
    setSessionExs((prev) =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: ex.sets.filter((_, si) => si !== setIdx) } : ex
      )
    );
  };

  const handleRemoveEx = (exIdx) => {
    setSessionStarted(true);
    setSessionExs((prev) => prev.filter((_, i) => i !== exIdx));
    if (expandedEx === exIdx) setExpandedEx(null);
  };

  const handleMoveEx = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sessionExs.length) return;
    setSessionStarted(true);
    setSessionExs((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[newIndex];
      updated[newIndex] = temp;
      return updated;
    });
    if (expandedEx === index) {
      setExpandedEx(newIndex);
    } else if (expandedEx === newIndex) {
      setExpandedEx(index);
    }
  };

  const handleAddExToSession = (name) => {
    if (sessionExs.some((e) => e.name === name)) return;
    setSessionExs((prev) => {
      const newExs = [...prev, { name, sets: [] }];
      // Auto-expande o novo card de exercício
      setExpandedEx(newExs.length - 1);
      return newExs;
    });
    setSessionStarted(true);
    // O painel fica aberto para permitir múltiplos cadastros
    setExSearch("");
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

    cardios.forEach((c) => {
      finalExs.push({
        name: `Cardio (${c.type})`,
        isCardio: true,
        cardioType: c.type,
        duration: c.duration,
        distance: c.distance,
        kcal: c.kcal
      });
    });

    if (finalExs.length === 0) {
      alert("Nenhum exercício ou série válida adicionada.");
      return;
    }

    const volume = finalExs
      .filter((ex) => !ex.isCardio && !ex.isMetadata)
      .reduce((tot, ex) =>
        tot + ex.sets.filter((x) => x.type === "valida").reduce((a, x) => a + x.weight * x.reps, 0), 0);

    saveSessionWorkout({
      date: sessionDate,
      type: sched.type,
      exercises: finalExs,
      notes: sessionNotes,
      volume
    });

    // Reset session
    setSessionExs([]);
    setSessionNotes("");
    setSessionStarted(false);
    setCardios([]);
    setShowCardioForm(false);
    alert("Treino salvo com sucesso!");
  };

  // Plan Handlers
  const planExercises = state.workoutPlans[planGroup] || [];
  const allForGroup = getExercises(planGroup);
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

  const handleAddCardio = () => {
    const dur = parseInt(cardioDuration);
    const kcal = parseInt(cardioKcal) || Math.round(dur * 7.5);
    if (isNaN(dur) || dur <= 0) return;

    setCardios((prev) => [
      ...prev,
      {
        type: cardioType,
        duration: dur,
        distance: parseFloat(cardioDistance) || 0,
        kcal
      }
    ]);

    setSessionStarted(true);
    setShowCardioForm(false);
    setCardioDuration("");
    setCardioDistance("");
    setCardioKcal("");
  };

  const hasSets = sessionExs.some((e) => e.sets.length > 0);

  return (
    <View style={styles.container}>
      {/* Title Header Card */}
      <View style={[styles.headerCard, { borderColor: sched.color + "44" }]}>
        <Text style={styles.headerDate}>{sessionDate === today() ? "Treino de Hoje" : `Treino de ${fmtDate(sessionDate)}`}</Text>
        <Text style={[styles.headerTitle, { color: sched.color }]}>{sched.type}</Text>
        <Text style={styles.headerSubtitle}>
          {activeGroup ? `${activeGroup} · ${sessionExs.length} exercícios` : "Descanso"}
        </Text>
      </View>

      {/* Sub Tabs */}
      <View style={styles.tabsRow}>
        {[
          { id: "session", label: "Sessão" },
          { id: "plan", label: "Plano" },
          { id: "history", label: "Histórico" }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, activeSubTab === tab.id && styles.tabButtonActive]}
            onPress={() => setActiveSubTab(tab.id)}
          >
            <Text style={[styles.tabText, activeSubTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* SUB TAB 1: SESSÃO */}
        {activeSubTab === "session" && (
          <View>
            {/* Date Pickers */}
            <View style={styles.dateRow}>
              <TextInput
                style={styles.dateInput}
                value={sessionDate}
                onChangeText={(val) => { setSessionDate(val || today()); setSessionStarted(false); }}
              />
              {sessionDate !== today() && (
                <TouchableOpacity style={styles.todayButton} onPress={() => { setSessionDate(today()); setSessionStarted(false); }}>
                  <Text style={styles.todayButtonText}>Hoje</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Workout focus muscle selector */}
            <View style={styles.groupSelectorRow}>
              {ALL_GROUPS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.groupBtn, activeGroup === g && styles.groupBtnActive]}
                  onPress={() => handleSelectGroup(g)}
                >
                  <Text style={[styles.groupBtnText, activeGroup === g && styles.groupBtnTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Extra Session Exercise Adder */}
            {activeGroup && (
              <View style={styles.addExWrap}>
                {!showAddEx ? (
                  <TouchableOpacity style={styles.addExBtn} onPress={() => setShowAddEx(true)}>
                    <Plus size={14} color="#f97316" />
                    <Text style={styles.addExBtnText}>Adicionar Exercício Extra</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.searchPane}>
                    <View style={styles.searchPaneHeader}>
                      <Text style={styles.searchPaneTitle}>Selecionar Exercício</Text>
                      <TouchableOpacity onPress={() => setShowAddEx(false)}>
                        <X size={18} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.searchBarContainer}>
                      <Search size={14} color="rgba(255,255,255,0.3)" style={styles.searchIcon} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={exSearch}
                        onChangeText={setExSearch}
                      />
                    </View>
                    <ScrollView nestedScrollEnabled={true} style={styles.searchList}>
                      {getExercises(activeGroup)
                        .filter((name) => !exSearch || name.toLowerCase().includes(exSearch.toLowerCase()))
                        .map((name) => {
                          const inSession = sessionExs.some((e) => e.name === name);
                          return (
                            <TouchableOpacity
                              key={name}
                              style={[styles.searchItem, inSession && { opacity: 0.5 }]}
                              onPress={() => !inSession && handleAddExToSession(name)}
                            >
                              <Text style={styles.searchItemName}>{name}</Text>
                              {inSession ? <CheckCircle2 size={13} color="#10b981" /> : <Plus size={13} color="#f97316" />}
                            </TouchableOpacity>
                          );
                        })}
                    </ScrollView>
                    {exSearch && !getExercises(activeGroup).some((name) => name.toLowerCase() === exSearch.trim().toLowerCase()) && (
                      <TouchableOpacity
                        style={styles.createExBtn}
                        onPress={() => {
                          const newName = exSearch.trim();
                          if (saveCustomExercise) {
                            saveCustomExercise(activeGroup, newName, "Outros");
                          }
                          handleAddExToSession(newName);
                        }}
                      >
                        <Text style={styles.createExBtnText}>+ Criar e adicionar "{exSearch.trim()}"</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.doneSearchBtn} onPress={() => setShowAddEx(false)}>
                      <Text style={styles.doneSearchBtnText}>Concluir</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Exercise log cards */}
            {sessionExs.map((ex, exIdx) => {
              const isOpen = expandedEx === exIdx;
              
              // Calcular volume total da sessão atual para o exercício
              const totalVolume = ex.sets
                .filter(s => s.type === "valida" || s.type === "pap")
                .reduce((acc, s) => acc + (s.weight * s.reps), 0);

              return (
                <View key={exIdx} style={[styles.exCard, isOpen && styles.exCardOpen]}>
                  {/* Card Header toggler */}
                  <TouchableOpacity
                    style={styles.exCardHeader}
                    onPress={() => setExpandedEx(isOpen ? null : exIdx)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.exCardName, isOpen && { color: "#f97316" }]}>{ex.name}</Text>
                      {ex.sets.length > 0 ? (
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                          <Text style={{ fontSize: 10, fontWeight: "700", color: "#f97316" }}>
                            {ex.sets.length} {ex.sets.length === 1 ? 'série' : 'séries'}
                          </Text>
                          <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}> · Volume: </Text>
                          <Text style={{ fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.8)" }}>{totalVolume} kg</Text>
                        </View>
                      ) : (
                        <Text style={styles.exCardSetsCount}>Toque para registrar séries</Text>
                      )}
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }} onStartShouldSetResponder={() => true} ResponderRelease={(e) => e.stopPropagation()}>
                      {exIdx > 0 && (
                        <TouchableOpacity style={{ padding: 6 }} onPress={() => handleMoveEx(exIdx, -1)}>
                          <ChevronUp size={16} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                      )}
                      {exIdx < sessionExs.length - 1 && (
                        <TouchableOpacity style={{ padding: 6 }} onPress={() => handleMoveEx(exIdx, 1)}>
                          <ChevronDown size={16} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.deleteExBtn} onPress={() => handleRemoveEx(exIdx)}>
                        <X size={14} color="#f87171" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  {/* Logged sets list — Grid layout */}
                  {ex.sets.length > 0 && (
                    <View style={styles.setsContainer}>
                      <View style={styles.setsTableHeader}>
                        <Text style={[styles.setsTableHeaderText, { flex: 1.2 }]}>Série</Text>
                        <Text style={[styles.setsTableHeaderText, { flex: 1.5, textAlign: "center" }]}>Tipo</Text>
                        <Text style={[styles.setsTableHeaderText, { flex: 1.5, textAlign: "right" }]}>Carga</Text>
                        <Text style={[styles.setsTableHeaderText, { flex: 1.5, textAlign: "right" }]}>Reps</Text>
                        <Text style={[styles.setsTableHeaderText, { flex: 0.5 }]}></Text>
                      </View>
                      <View style={styles.setsList}>
                        {ex.sets.map((set, sIdx) => {
                          const ts = SET_TYPES.find((x) => x.id === set.type) || SET_TYPES[1];
                          return (
                            <View key={sIdx} style={[styles.setRow, sIdx % 2 === 0 && { backgroundColor: "rgba(255,255,255,0.01)" }]}>
                              <View style={{ flex: 1.2, flexDirection: "row", alignItems: "center" }}>
                                <View style={styles.setNumberBadge}>
                                  <Text style={styles.setNumberBadgeText}>{sIdx + 1}</Text>
                                </View>
                              </View>
                              <View style={{ flex: 1.5, alignItems: "center" }}>
                                <View style={[styles.setTagBadge, { backgroundColor: ts.color + "15" }]}>
                                  <Text style={[styles.setTagBadgeText, { color: ts.color }]}>{ts.label.toUpperCase()}</Text>
                                </View>
                              </View>
                              <Text style={[styles.setRowTextVal, { flex: 1.5, textAlign: "right" }]}>
                                {set.weight} <Text style={styles.setRowTextSuffix}>kg</Text>
                              </Text>
                              <Text style={[styles.setRowTextVal, { flex: 1.5, textAlign: "right" }]}>
                                {set.reps} <Text style={styles.setRowTextSuffix}>reps</Text>
                              </Text>
                              <TouchableOpacity style={{ flex: 0.5, alignItems: "flex-end", padding: 4 }} onPress={() => handleRemoveSet(exIdx, sIdx)}>
                                <X size={12} color="rgba(239,68,68,0.5)" />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Add set form inside card */}
                  {isOpen && (
                    <View style={styles.addSetForm}>
                      <View style={styles.setTypesRow}>
                        {SET_TYPES.map((t) => (
                          <TouchableOpacity
                            key={t.id}
                            style={[styles.setTypeBtn, serieType === t.id && { backgroundColor: t.color }]}
                            onPress={() => setSerieType(t.id)}
                          >
                            <Text style={[styles.setTypeBtnText, serieType === t.id && { color: "#fff" }]}>{t.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={styles.setInputRow}>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.setInput}
                            keyboardType="numeric"
                            placeholder="Carga"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={serieWeight}
                            onChangeText={setSerieWeight}
                          />
                          <Text style={styles.inputSuffix}>kg</Text>
                        </View>
                        <Text style={{ color: "rgba(255,255,255,0.4)" }}>x</Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.setInput}
                            keyboardType="numeric"
                            placeholder="Reps"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={serieReps}
                            onChangeText={setSerieReps}
                          />
                          <Text style={styles.inputSuffix}>reps</Text>
                        </View>
                        <TouchableOpacity style={styles.confirmSetBtn} onPress={() => handleAddSet(exIdx)}>
                          <Text style={styles.confirmSetBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Cardio logs & Energy expend */}
            {activeGroup && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Cardio & Gasto Calórico</Text>
                
                {hasSets && (
                  <View style={styles.cardioInputRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Duração Musculação (min)</Text>
                      <TextInput style={styles.input} keyboardType="numeric" value={displayDuration} onChangeText={(val) => { setWeightDuration(val); setSessionStarted(true); }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Calorias (kcal)</Text>
                      <TextInput style={styles.input} keyboardType="numeric" value={displayKcal} onChangeText={(val) => { setWeightKcal(val); setSessionStarted(true); }} />
                    </View>
                  </View>
                )}

                {/* Logged cardios */}
                {cardios.map((c, idx) => (
                  <View key={idx} style={styles.loggedCardioRow}>
                    <Text style={styles.loggedCardioText}>🏃 {c.type} · {c.duration} min {c.distance ? `· ${c.distance} km` : ""} · ~{c.kcal} kcal</Text>
                    <TouchableOpacity onPress={() => setCardios(prev => prev.filter((_, i) => i !== idx))}>
                      <X size={12} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                  </View>
                ))}

                {showCardioForm ? (
                  <View style={styles.cardioForm}>
                    <Text style={styles.cardioFormTitle}>Adicionar Cardio</Text>
                    <View style={styles.cardioFormGrid}>
                      <TextInput style={styles.input} placeholder="Tipo: Corrida, Bicicleta" placeholderTextColor="rgba(255,255,255,0.3)" value={cardioType} onChangeText={setCardioType} />
                      <TextInput style={styles.input} keyboardType="numeric" placeholder="Duração (min)" placeholderTextColor="rgba(255,255,255,0.3)" value={cardioDuration} onChangeText={setCardioDuration} />
                    </View>
                    <View style={styles.cardioFormGrid}>
                      <TextInput style={styles.input} keyboardType="numeric" placeholder="Distância (km - opcional)" placeholderTextColor="rgba(255,255,255,0.3)" value={cardioDistance} onChangeText={setCardioDistance} />
                      <TextInput style={styles.input} keyboardType="numeric" placeholder="Gasto (kcal)" placeholderTextColor="rgba(255,255,255,0.3)" value={cardioKcal} onChangeText={setCardioKcal} />
                    </View>
                    <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
                      <TouchableOpacity style={[styles.cardioFormBtn, { backgroundColor: "rgba(255,255,255,0.06)" }]} onPress={() => setShowCardioForm(false)}>
                        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cardioFormBtn} onPress={handleAddCardio}>
                        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>Adicionar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addCardioBtn} onPress={() => setShowCardioForm(true)}>
                    <Plus size={14} color="#10b981" />
                    <Text style={styles.addCardioBtnText}>Adicionar Cardio</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Save Session Card */}
            {(sessionExs.length > 0 || cardios.length > 0) && (
              <View style={styles.card}>
                <TextInput
                  style={styles.notesInput}
                  multiline
                  placeholder="Observações do treino..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={sessionNotes}
                  onChangeText={setSessionNotes}
                />
                <TouchableOpacity style={styles.saveWorkoutBtn} onPress={handleSaveWorkout}>
                  <Save size={15} color="#fff" />
                  <Text style={styles.saveWorkoutBtnText}>Salvar Treino Completo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* SUB TAB 2: PLANO */}
        {activeSubTab === "plan" && (
          <View>
            <View style={styles.groupSelectorRow}>
              {ALL_GROUPS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.groupBtn, planGroup === g && styles.groupBtnActive]}
                  onPress={() => setPlanGroup(g)}
                >
                  <Text style={[styles.groupBtnText, planGroup === g && styles.groupBtnTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Exercícios do Plano {planGroup} ({planExercises.length})</Text>
              {planExercises.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum exercício no plano. Adicione abaixo.</Text>
              ) : (
                planExercises.map((name) => (
                  <View key={name} style={styles.planItem}>
                    <Text style={styles.planItemName}>{name}</Text>
                    <TouchableOpacity style={styles.deletePlanExBtn} onPress={() => removeFromPlan(name)}>
                      <Trash2 size={13} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Add from catalog library */}
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setShowLibrary(!showLibrary)}
              >
                <Text style={styles.accordionHeaderText}>Adicionar Exercícios da Biblioteca</Text>
                {showLibrary ? <ChevronUp size={16} color="#f97316" /> : <ChevronDown size={16} color="#f97316" />}
              </TouchableOpacity>

              {showLibrary && (
                <View style={styles.accordionContent}>
                  <View style={styles.searchBarContainer}>
                    <Search size={14} color="rgba(255,255,255,0.3)" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Filtrar biblioteca..."
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={planSearch}
                      onChangeText={setPlanSearch}
                    />
                  </View>
                  <View style={styles.searchList}>
                    {filteredLib.map((name) => {
                      const inPlan = planExercises.includes(name);
                      return (
                        <TouchableOpacity
                          key={name}
                          style={styles.searchItem}
                          onPress={() => !inPlan && addToPlan(name)}
                        >
                          <Text style={styles.searchItemName}>{name}</Text>
                          {inPlan ? <CheckCircle2 size={13} color="#10b981" /> : <Plus size={13} color="#f97316" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* SUB TAB 3: HISTÓRICO */}
        {activeSubTab === "history" && (
          <View>
            <View style={styles.histSelectCard}>
              <Text style={styles.label}>Selecionar Data</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={histWrkDate}
                onChangeText={setHistWrkDate}
              />
            </View>

            {(() => {
              const hLogs = (state?.workoutLogs || []).filter((w) => w.date === activeHistDate);
              if (hLogs.length === 0) {
                return (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Nenhum treino nesta data ({activeHistDate})</Text>
                  </View>
                );
              }

              return hLogs.map((w) => (
                <View key={w.id} style={styles.card}>
                  <View style={styles.histLogHeader}>
                    <Text style={styles.histLogTitle}>{w.type}</Text>
                    <Text style={styles.histLogVol}>Vol: {w.volume} kg</Text>
                  </View>

                  {(w.exercises || []).map((ex, eIdx) => {
                    if (ex.isMetadata) {
                      return (
                        <View key={eIdx} style={styles.histCardioLog}>
                          <Text style={styles.histCardioTitle}>Treino de Força</Text>
                          <Text style={styles.histCardioDetails}>Duração: {ex.duration} min · Gasto: ~{ex.kcal} kcal</Text>
                        </View>
                      );
                    }
                    if (ex.isCardio) {
                      return (
                        <View key={eIdx} style={styles.histCardioLog}>
                          <Text style={[styles.histCardioTitle, { color: "#10b981" }]}>Cardio ({ex.cardioType})</Text>
                          <Text style={styles.histCardioDetails}>Duração: {ex.duration} min {ex.distance ? `· Distância: ${ex.distance} km` : ""} · Gasto: ~{ex.kcal} kcal</Text>
                        </View>
                      );
                    }
                    return (
                      <View key={eIdx} style={styles.histExBox}>
                        <Text style={styles.histExName}>{ex.name}</Text>
                        {ex.sets.map((set, sIdx) => {
                          const typeSpec = SET_TYPES.find((x) => x.id === set.type) || SET_TYPES[1];
                          return (
                            <View key={sIdx} style={styles.histSetLine}>
                              <Text style={[styles.histSetType, { color: typeSpec.color }]}>{typeSpec.label}</Text>
                              <Text style={styles.histSetVal}>{set.weight} kg x {set.reps} reps</Text>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                  {w.notes ? <Text style={styles.histNotes}>Obs: {w.notes}</Text> : null}
                  <TouchableOpacity style={styles.deleteHistLogBtn} onPress={() => removeWorkoutLog(w.id)}>
                    <Text style={styles.deleteHistLogBtnText}>Deletar Registro de Treino</Text>
                  </TouchableOpacity>
                </View>
              ));
            })()}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06060c"
  },
  headerCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
    margin: 16,
    marginBottom: 8
  },
  headerDate: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    marginBottom: 4
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900"
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 4
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 12
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center"
  },
  tabButtonActive: {
    backgroundColor: "#f97316"
  },
  tabText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700"
  },
  tabTextActive: {
    color: "#fff"
  },
  tabContent: {
    paddingHorizontal: 16
  },
  dateRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12
  },
  dateInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 10,
    color: "#fff",
    fontSize: 13,
    fontWeight: "600"
  },
  todayButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  todayButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  groupSelectorRow: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
    marginBottom: 12
  },
  groupBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)"
  },
  groupBtnActive: {
    backgroundColor: "#f97316"
  },
  groupBtnText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700"
  },
  groupBtnTextActive: {
    color: "#fff"
  },
  addExWrap: {
    marginBottom: 12
  },
  addExBtn: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  addExBtnText: {
    color: "#f97316",
    fontSize: 11,
    fontWeight: "700"
  },
  searchPane: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 12
  },
  searchPaneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  searchPaneTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700"
  },
  searchBarContainer: {
    position: "relative",
    marginBottom: 10
  },
  searchIcon: {
    position: "absolute",
    left: 8,
    top: 10,
    zIndex: 1
  },
  searchInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    padding: 6,
    paddingLeft: 28,
    color: "#fff",
    fontSize: 11
  },
  searchList: {
    maxHeight: 160
  },
  searchItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)"
  },
  searchItemName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  doneSearchBtn: {
    backgroundColor: "#f97316",
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  doneSearchBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700"
  },
  createExBtn: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(249,115,22,0.4)",
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  createExBtnText: {
    color: "#f97316",
    fontSize: 11,
    fontWeight: "600"
  },
  exCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 14,
    marginBottom: 8
  },
  exCardOpen: {
    borderColor: "rgba(249,115,22,0.3)"
  },
  exCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 4
  },
  exCardName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700"
  },
  exCardSetsCount: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    marginTop: 2
  },
  deleteExBtn: {
    padding: 6
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)"
  },
  setText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "600"
  },
  setTextVal: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700"
  },
  addSetForm: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 10,
    marginTop: 6
  },
  setTypesRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8
  },
  setTypeBtn: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center"
  },
  setTypeBtnText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "700"
  },
  setInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  setInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 8,
    color: "#fff",
    fontSize: 12,
    textAlign: "center"
  },
  confirmSetBtn: {
    backgroundColor: "#f97316",
    borderRadius: 8,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center"
  },
  confirmSetBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800"
  },
  setsContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)"
  },
  setsTableHeader: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
    alignItems: "center"
  },
  setsTableHeaderText: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 0.5
  },
  setNumberBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center"
  },
  setNumberBadgeText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontWeight: "800"
  },
  setTagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  setTagBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.3
  },
  setRowTextVal: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700"
  },
  setRowTextSuffix: {
    fontSize: 9,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "500"
  },
  inputWrapper: {
    flex: 1,
    position: "relative"
  },
  inputSuffix: {
    position: "absolute",
    right: 10,
    top: 11,
    fontSize: 9,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "700"
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 16,
    marginBottom: 10
  },
  cardTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 10
  },
  label: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 9,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase"
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 8,
    color: "#fff",
    fontSize: 12
  },
  cardioInputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10
  },
  loggedCardioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 8,
    borderRadius: 8,
    marginBottom: 6
  },
  loggedCardioText: {
    color: "#10b981",
    fontSize: 11,
    fontWeight: "600"
  },
  cardioForm: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 10,
    gap: 8
  },
  cardioFormTitle: {
    color: "#10b981",
    fontSize: 11,
    fontWeight: "700"
  },
  cardioFormGrid: {
    flexDirection: "row",
    gap: 8
  },
  cardioFormBtn: {
    flex: 1,
    backgroundColor: "#10b981",
    borderRadius: 8,
    padding: 8,
    alignItems: "center"
  },
  addCardioBtn: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  addCardioBtnText: {
    color: "#10b981",
    fontSize: 11,
    fontWeight: "700"
  },
  notesInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 10,
    color: "#fff",
    fontSize: 12,
    height: 50,
    marginBottom: 10,
    textAlignVertical: "top"
  },
  saveWorkoutBtn: {
    backgroundColor: "#f97316",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  saveWorkoutBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700"
  },
  emptyText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 10
  },
  planItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)"
  },
  planItemName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  deletePlanExBtn: {
    padding: 4
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  accordionHeaderText: {
    color: "#f97316",
    fontSize: 12,
    fontWeight: "700"
  },
  accordionContent: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)"
  },
  histSelectCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center"
  },
  histLogHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  histLogTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800"
  },
  histLogVol: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12
  },
  histCardioLog: {
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8
  },
  histCardioTitle: {
    color: "#f97316",
    fontSize: 12,
    fontWeight: "700"
  },
  histCardioDetails: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    marginTop: 2
  },
  histExBox: {
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8
  },
  histExName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6
  },
  histSetLine: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 2
  },
  histSetType: {
    fontSize: 10,
    fontWeight: "700",
    width: 80
  },
  histSetVal: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11
  },
  histNotes: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontStyle: "italic",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 8,
    marginTop: 6
  },
  deleteHistLogBtn: {
    marginTop: 12,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 10,
    padding: 8,
    alignItems: "center"
  },
  deleteHistLogBtnText: {
    color: "#f87171",
    fontSize: 11,
    fontWeight: "700"
  }
});
