import React, { useContext, useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal } from "react-native";
import { AppContext } from "../context/AppContext";
import { Calendar, Settings, User, X } from "lucide-react-native";

const COLORS = ["#f97316", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#6b7280", "#ef4444"];

export default function SettingsTab() {
  const { state, saveProfile, saveDayEdit } = useContext(AppContext);

  // Profile forms state
  const [weight, setWeight] = useState(state.profile?.weight !== undefined && state.profile?.weight !== null ? String(state.profile.weight) : "87");
  const [height, setHeight] = useState(state.profile?.height !== undefined && state.profile?.height !== null ? String(state.profile.height) : "176");
  const [age, setAge] = useState(state.profile?.age !== undefined && state.profile?.age !== null ? String(state.profile.age) : "23");
  const [currentBf, setCurrentBf] = useState(state.profile?.current_bf !== undefined && state.profile?.current_bf !== null ? String(state.profile.current_bf) : "19");
  const [goalBf, setGoalBf] = useState(state.profile?.goal_bf !== undefined && state.profile?.goal_bf !== null ? String(state.profile.goal_bf) : "12");
  const [proteinFactor, setProteinFactor] = useState(state.profile?.proteinFactor !== undefined && state.profile?.proteinFactor !== null ? String(state.profile.proteinFactor) : "1.8");

  useEffect(() => {
    if (state.profile) {
      setWeight(state.profile.weight !== undefined && state.profile.weight !== null ? String(state.profile.weight) : "87");
      setHeight(state.profile.height !== undefined && state.profile.height !== null ? String(state.profile.height) : "176");
      setAge(state.profile.age !== undefined && state.profile.age !== null ? String(state.profile.age) : "23");
      setCurrentBf(state.profile.current_bf !== undefined && state.profile.current_bf !== null ? String(state.profile.current_bf) : "19");
      setGoalBf(state.profile.goal_bf !== undefined && state.profile.goal_bf !== null ? String(state.profile.goal_bf) : "12");
      setProteinFactor(state.profile.proteinFactor !== undefined && state.profile.proteinFactor !== null ? String(state.profile.proteinFactor) : "1.8");
    }
  }, [state.profile]);

  // Edit Day Modal State
  const [editIndex, setEditIndex] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editTypeName, setEditTypeName] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [editCalType, setEditCalType] = useState("normal");
  const [editColor, setEditColor] = useState(COLORS[0]);

  const handleSaveProfile = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    const cb = parseFloat(currentBf);
    const gb = parseFloat(goalBf);
    const pf = parseFloat(proteinFactor);

    if (isNaN(w) || isNaN(h) || isNaN(a) || isNaN(cb) || isNaN(gb) || isNaN(pf)) {
      alert("Por favor, preencha todos os campos do perfil com números válidos.");
      return;
    }

    saveProfile({
      ...state.profile,
      weight: w,
      height: h,
      age: a,
      current_bf: cb,
      goal_bf: gb,
      proteinFactor: pf
    });

    alert("Perfil salvo com sucesso! As metas calóricas foram atualizadas.");
  };

  const handleOpenEditDay = (idx) => {
    const day = state.schedule[idx];
    setEditIndex(idx);
    setEditTypeName(day.type);
    setEditGroup(day.group || "");
    setEditCalType(day.calType);
    setEditColor(day.color);
    setEditOpen(true);
  };

  const handleSaveDay = () => {
    if (editIndex === null) return;
    
    saveDayEdit(editIndex, {
      ...state.schedule[editIndex],
      type: editTypeName.trim() || "Descanso",
      group: editGroup || null,
      calType: editCalType,
      color: editColor
    });

    setEditOpen(false);
    setEditIndex(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <User size={15} color="#f97316" />
            <Text style={styles.cardTitle}>Dados Pessoais do Usuário</Text>
          </View>
          
          <View style={styles.formGrid}>
            <View style={styles.inputCol}>
              <Text style={styles.label}>Peso (kg)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={weight} onChangeText={setWeight} />
            </View>
            <View style={styles.inputCol}>
              <Text style={styles.label}>Altura (cm)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={height} onChangeText={setHeight} />
            </View>
          </View>

          <View style={styles.formGrid}>
            <View style={styles.inputCol}>
              <Text style={styles.label}>Idade (anos)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={age} onChangeText={setAge} />
            </View>
            <View style={styles.inputCol}>
              <Text style={styles.label}>BF Inicial (%)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={currentBf} onChangeText={setCurrentBf} />
            </View>
          </View>

          <View style={styles.formGrid}>
            <View style={styles.inputCol}>
              <Text style={styles.label}>Meta BF (%)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={goalBf} onChangeText={setGoalBf} />
            </View>
            <View style={styles.inputCol}>
              <Text style={styles.label}>Proteína (g/kg)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={proteinFactor} onChangeText={setProteinFactor} />
            </View>
          </View>

          <TouchableOpacity style={styles.saveProfileBtn} onPress={handleSaveProfile}>
            <Text style={styles.saveProfileBtnText}>Recalcular Metas & Salvar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Schedule Grid */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Calendar size={15} color="#3b82f6" />
            <Text style={styles.cardTitle}>Divisão de Treinos Semanal</Text>
          </View>
          <Text style={styles.cardDesc}>Edite as divisões musculares e metas calóricas por dia:</Text>

          {state.schedule.map((day, idx) => (
            <TouchableOpacity
              key={day.day}
              style={[styles.dayItem, { borderLeftColor: day.color }]}
              onPress={() => handleOpenEditDay(idx)}
            >
              <View>
                <Text style={styles.dayText}>{day.day} · <Text style={{ color: "#fff", fontWeight: "700" }}>{day.type}</Text></Text>
                <Text style={styles.daySubText}>
                  {day.group ? `Foco: ${day.group}` : "Descanso"} · {day.calType === "heavy" ? "Carbo Alto (2800 kcal)" : day.calType === "free" ? "Livre 🍕" : "Carbo Moderado (2600 kcal)"}
                </Text>
              </View>
              <View style={[styles.colorIndicator, { backgroundColor: day.color }]} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* EDIT DAY MODAL */}
      <Modal visible={editOpen} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>
                Editar {editIndex !== null && state.schedule[editIndex]?.day}
              </Text>
              <TouchableOpacity onPress={() => setEditOpen(false)}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12 }}>
              <View>
                <Text style={styles.label}>Nome do Treino</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editTypeName}
                  onChangeText={setEditTypeName}
                  placeholder="Push, Pull, Pernas, etc."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>

              <View>
                <Text style={styles.label}>Foco de Exercícios</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editGroup}
                  onChangeText={setEditGroup}
                  placeholder="Push, Pull, Legs, Upper, Lower"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>

              <View>
                <Text style={styles.label}>Metabolismo do Dia</Text>
                <View style={styles.calOptions}>
                  {["normal", "heavy", "free"].map((ct) => (
                    <TouchableOpacity
                      key={ct}
                      style={[styles.calOptionBtn, editCalType === ct && styles.calOptionBtnActive]}
                      onPress={() => setEditCalType(ct)}
                    >
                      <Text style={[styles.calOptionText, editCalType === ct && styles.calOptionTextActive]}>
                        {ct === "normal" ? "Normal" : ct === "heavy" ? "Pesado" : "Livre"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text style={styles.label}>Cor de Identificação</Text>
                <View style={styles.colorPalette}>
                  {COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.colorDot, { backgroundColor: c }, editColor === c && styles.colorDotSelected]}
                      onPress={() => setEditColor(c)}
                    />
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.saveDayBtn} onPress={handleSaveDay}>
                <Text style={styles.saveDayBtnText}>Salvar Dia</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06060c"
  },
  content: {
    padding: 16
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 16,
    marginBottom: 12
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12
  },
  cardTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800"
  },
  cardDesc: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    marginBottom: 12
  },
  formGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8
  },
  inputCol: {
    flex: 1
  },
  label: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase"
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 10,
    color: "#fff",
    fontSize: 13,
    fontWeight: "600"
  },
  saveProfileBtn: {
    backgroundColor: "#f97316",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 12
  },
  saveProfileBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700"
  },
  dayItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4
  },
  dayText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "500"
  },
  daySubText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    marginTop: 3
  },
  colorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end"
  },
  modalSheet: {
    backgroundColor: "#0d0d15",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    maxHeight: "75%"
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  modalHeaderTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800"
  },
  modalInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 10,
    color: "#fff",
    fontSize: 13
  },
  calOptions: {
    flexDirection: "row",
    gap: 6
  },
  calOptionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center"
  },
  calOptionBtnActive: {
    backgroundColor: "#f97316"
  },
  calOptionText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700"
  },
  calOptionTextActive: {
    color: "#fff"
  },
  colorPalette: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    paddingVertical: 4
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent"
  },
  colorDotSelected: {
    borderColor: "#fff",
    transform: [{ scale: 1.1 }]
  },
  saveDayBtn: {
    backgroundColor: "#f97316",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 10
  },
  saveDayBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700"
  }
});
