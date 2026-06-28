import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions } from "react-native";
import { AppContext } from "../context/AppContext";
import { LinearGradient } from "expo-linear-gradient";
import { Flame, Compass, Calendar, TrendingDown } from "lucide-react-native";

const { width } = Dimensions.get("window");

export default function DashboardTab() {
  const { state, today, saveWeightLog, getTargets, getTotals, fmtDate } = useContext(AppContext);
  const [weightInput, setWeightInput] = useState("");

  const t = getTargets();
  const todayLogs = (state.foodLogs || []).filter((l) => l.date === today());
  const totals = getTotals(todayLogs);

  // Body Fat calculations
  const weightLogs = state.weightLogs || [];
  const profile = state.profile || {};
  const weight = parseFloat(profile.weight) || 87;
  const current_bf = parseFloat(profile.current_bf) || 19;
  const goal_bf = parseFloat(profile.goal_bf) || 12;

  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].value : weight;
  const startingWeight = weightLogs.length > 0 ? weightLogs[0].value : weight;
  const kgLost = Math.max(0, startingWeight - latestWeight);
  // BF formula: BF Now = BF Start - (kg lost * 0.15)
  const calculatedBF = Math.max(goal_bf, current_bf - (kgLost * 0.15));

  const handleLogWeight = () => {
    const val = parseFloat(weightInput);
    if (!isNaN(val) && val > 0) {
      saveWeightLog(val);
      setWeightInput("");
    }
  };

  // Get last 7 days of calorie burn logs for graph
  const getGraphData = () => {
    const data = [];
    const dateMap = {};
    
    // Group food logs by date
    (state.foodLogs || []).forEach((l) => {
      if (!dateMap[l.date]) dateMap[l.date] = 0;
      dateMap[l.date] += l.kcal || 0;
    });

    // Get last 7 calendar days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      data.push({
        date: dateStr,
        label: fmtDate(dateStr),
        kcal: dateMap[dateStr] || 0
      });
    }
    return data;
  };

  const graphData = getGraphData();
  const maxKcal = Math.max(...graphData.map(d => d.kcal), t.kcal, 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Target Header Card */}
      <LinearGradient colors={["#f9731622", "#0a0a0f00"]} style={styles.headerCard}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Seven Fit CuttingOS</Text>
          <Text style={styles.headerSubtitle}>Metodologia de Déficit Calórico Semanal</Text>
        </View>
        
        {/* Ring Approximation */}
        <View style={styles.calorieRingContainer}>
          <View style={styles.ringOuter}>
            <LinearGradient colors={["#f97316", "#ef4444"]} style={styles.ringInner}>
              <Text style={styles.ringKcal}>{totals.kcal}</Text>
              <Text style={styles.ringLabel}>de {t.kcal} kcal</Text>
            </LinearGradient>
          </View>
        </View>
      </LinearGradient>

      {/* Progress Bars */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Macronutrientes do Dia</Text>
        
        {/* Protein */}
        <View style={styles.progressRow}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressName}>Proteína</Text>
            <Text style={styles.progressValue}>{totals.protein}g / {t.protein}g</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${Math.min((totals.protein / (t.protein || 1)) * 100, 100)}%`, backgroundColor: "#3b82f6" }]} />
          </View>
        </View>

        {/* Carbs */}
        <View style={styles.progressRow}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressName}>Carboidratos</Text>
            <Text style={styles.progressValue}>{totals.carbs}g / {t.carbs}g</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${Math.min((totals.carbs / (t.carbs || 1)) * 100, 100)}%`, backgroundColor: "#8b5cf6" }]} />
          </View>
        </View>

        {/* Fat */}
        <View style={styles.progressRow}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressName}>Gordura</Text>
            <Text style={styles.progressValue}>{totals.fat}g / {t.fat}g</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${Math.min((totals.fat / (t.fat || 1)) * 100, 100)}%`, backgroundColor: "#f59e0b" }]} />
          </View>
        </View>
      </View>

      {/* Quick Weight Logger */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Registro de Peso Diário</Text>
        <Text style={styles.cardSubtitle}>Peso Atual: {latestWeight.toFixed(1)} kg</Text>
        
        <View style={styles.weightInputRow}>
          <TextInput
            style={styles.weightInput}
            keyboardType="decimal-pad"
            placeholder="Ex: 86.4"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={weightInput}
            onChangeText={setWeightInput}
          />
          <TouchableOpacity style={styles.weightButton} onPress={handleLogWeight}>
            <Text style={styles.weightButtonText}>Registrar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BF Progression */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Jornada de Percentual de Gordura</Text>
         <View style={styles.bfLabelRow}>
          <View>
            <Text style={styles.bfVal}>{current_bf}%</Text>
            <Text style={styles.bfLabel}>Início</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.bfVal, { color: "#f97316" }]}>{calculatedBF.toFixed(2)}%</Text>
            <Text style={styles.bfLabel}>Estimado</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.bfVal}>{goal_bf}%</Text>
            <Text style={styles.bfLabel}>Meta</Text>
          </View>
        </View>
        <View style={styles.bfBarTrack}>
          <View style={[styles.bfBarFill, { width: `${Math.min(((current_bf - calculatedBF) / Math.max(current_bf - goal_bf, 1)) * 100, 100)}%` }]} />
        </View>
        <Text style={styles.bfNote}>Dica: Cada 1kg perdido reduz ~0.15% de BF.</Text>
      </View>

      {/* Calories History Graph */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ingestão Calórica (7 Dias)</Text>
        
        <View style={styles.chartContainer}>
          {graphData.map((d, i) => {
            const barHeight = (d.kcal / maxKcal) * 120;
            const isOver = d.kcal > t.kcal;
            return (
              <View key={i} style={styles.chartCol}>
                <View style={styles.chartBarContainer}>
                  <View style={[styles.chartBar, { height: Math.max(barHeight, 4), backgroundColor: isOver ? "#ef4444" : "#10b981" }]} />
                </View>
                <Text style={styles.chartLabel}>{d.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06060c",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.15)",
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerInfo: {
    flex: 1,
    paddingRight: 10
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    fontFamily: "System",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    marginTop: 4,
  },
  calorieRingContainer: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center"
  },
  ringOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.2)",
  },
  ringInner: {
    flex: 1,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
  },
  ringKcal: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  ringLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 9,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
  },
  cardSubtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginBottom: 10,
  },
  progressRow: {
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  progressName: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "600",
  },
  progressValue: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden"
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3
  },
  weightInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  weightInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 10,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  weightButton: {
    backgroundColor: "#f97316",
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  weightButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  bfLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  bfVal: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  bfLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    marginTop: 2,
  },
  bfBarTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  bfBarFill: {
    height: "100%",
    backgroundColor: "#f97316",
    borderRadius: 4,
  },
  bfNote: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontStyle: "italic"
  },
  chartContainer: {
    flexDirection: "row",
    height: 150,
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: 10,
  },
  chartCol: {
    alignItems: "center",
    flex: 1,
  },
  chartBarContainer: {
    height: 120,
    justifyContent: "flex-end",
    width: "100%",
    alignItems: "center"
  },
  chartBar: {
    width: 14,
    borderRadius: 7,
  },
  chartLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 8,
    marginTop: 6,
  }
});
