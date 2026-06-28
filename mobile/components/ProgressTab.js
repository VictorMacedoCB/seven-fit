import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Dimensions } from "react-native";
import { AppContext } from "../context/AppContext";
import * as ImagePicker from "expo-image-picker";
import { Plus, Camera, Image as ImageIcon, Trash2 } from "lucide-react-native";

export default function ProgressTab() {
  const { state, saveProgressPhotos, fmtDate } = useContext(AppContext);
  const [activeSubTab, setActiveSubTab] = useState("weight");

  // Photos management state
  const [selectedWeek, setSelectedWeek] = useState("Semana 1");
  const [photoFront, setPhotoFront] = useState(null);
  const [photoSide, setPhotoSide] = useState(null);
  const [photoBack, setPhotoBack] = useState(null);

  // Weight logs
  const weightLogs = [...(state.weightLogs || [])].reverse();

  // BF Progress calculations
  const profile = state.profile || {};
  const weight = parseFloat(profile.weight) || 87;
  const current_bf = parseFloat(profile.current_bf) || 19;
  const goal_bf = parseFloat(profile.goal_bf) || 12;

  const startingWeight = (state.weightLogs || []).length > 0 ? state.weightLogs[0].value : weight;
  const currentWeight = (state.weightLogs || []).length > 0 ? state.weightLogs[state.weightLogs.length - 1].value : weight;
  const totalWeightLost = Math.max(0, startingWeight - currentWeight);
  const estimatedBF = Math.max(goal_bf, current_bf - (totalWeightLost * 0.15));

  // Vision / Gallery photo selector
  const handleSelectPhoto = async (angle, useCamera = false) => {
    try {
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true
      };

      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          alert("Permissão da câmera é necessária.");
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Permissão da galeria é necessária.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const dataUrl = `data:image/jpeg;base64,${result.assets[0].base64}`;
        if (angle === "front") setPhotoFront(dataUrl);
        if (angle === "side") setPhotoSide(dataUrl);
        if (angle === "back") setPhotoBack(dataUrl);
      }
    } catch (err) {
      console.error("Error picking photo:", err);
    }
  };

  const handleSaveWeekPhotos = () => {
    if (!photoFront && !photoSide && !photoBack) {
      alert("Adicione pelo menos uma foto antes de salvar.");
      return;
    }

    const newWeekRecord = {
      week: selectedWeek,
      date: new Date().toISOString().split("T")[0],
      front: photoFront,
      side: photoSide,
      back: photoBack
    };

    // Filter out previous record of same week
    const filtered = (state.progressPhotos || []).filter((p) => p.week !== selectedWeek);
    saveProgressPhotos([...filtered, newWeekRecord]);

    setPhotoFront(null);
    setPhotoSide(null);
    setPhotoBack(null);
    alert(`Fotos salvas para a ${selectedWeek}!`);
  };

  const handleRemoveWeek = (weekName) => {
    const filtered = (state.progressPhotos || []).filter((p) => p.week !== weekName);
    saveProgressPhotos(filtered);
  };

  // Cutting statistics calculation
  const getStats = () => {
    const totalDietDays = new Set((state.foodLogs || []).map((l) => l.date)).size;
    const totalWorkouts = (state.workoutLogs || []).length;
    
    let totalVolumeLifted = 0;
    (state.workoutLogs || []).forEach((w) => {
      totalVolumeLifted += w.volume || 0;
    });

    let totalKcalLogged = 0;
    (state.foodLogs || []).forEach((l) => {
      totalKcalLogged += l.kcal || 0;
    });

    const averageKcal = totalDietDays > 0 ? Math.round(totalKcalLogged / totalDietDays) : 0;

    return {
      totalDietDays,
      totalWorkouts,
      totalVolumeLifted,
      averageKcal
    };
  };

  const stats = getStats();

  return (
    <View style={styles.container}>
      {/* Sub Tabs */}
      <View style={styles.tabsRow}>
        {[
          { id: "weight", label: "Peso" },
          { id: "photos", label: "Fotos" },
          { id: "stats", label: "Estatísticas" }
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
        {/* SUB TAB 1: PESO */}
        {activeSubTab === "weight" && (
          <View>
            {/* BF Progression Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Jornada Corporal de cutting</Text>
              <View style={styles.bfStatsRow}>
                <View style={styles.bfStatCol}>
                  <Text style={styles.bfStatVal}>{startingWeight.toFixed(1)} kg</Text>
                  <Text style={styles.bfStatLabel}>Peso Inicial</Text>
                </View>
                <View style={styles.bfStatCol}>
                  <Text style={[styles.bfStatVal, { color: "#f97316" }]}>{totalWeightLost.toFixed(1)} kg</Text>
                  <Text style={styles.bfStatLabel}>Eliminado</Text>
                </View>
                <View style={styles.bfStatCol}>
                  <Text style={styles.bfStatVal}>{estimatedBF.toFixed(1)}%</Text>
                  <Text style={styles.bfStatLabel}>BF Estimado</Text>
                </View>
              </View>
            </View>

            {/* Weight logs history */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Histórico de Pesagem ({weightLogs.length})</Text>
              {weightLogs.length === 0 ? (
                <Text style={styles.emptyText}>Sem pesagens registradas.</Text>
              ) : (
                weightLogs.map((log) => (
                  <View key={log.id} style={styles.logItem}>
                    <Text style={styles.logItemDate}>{fmtDate(log.date)}</Text>
                    <Text style={styles.logItemVal}>{log.value.toFixed(1)} kg</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* SUB TAB 2: FOTOS */}
        {activeSubTab === "photos" && (
          <View>
            {/* Week Selector */}
            <View style={styles.card}>
              <Text style={styles.label}>Selecionar Semana</Text>
              <TextInput
                style={styles.weekInput}
                value={selectedWeek}
                onChangeText={setSelectedWeek}
                placeholder="Ex: Semana 1, Semana 2"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>

            {/* Pickers cards for 3 angles */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Adicionar Fotos (3 Ângulos)</Text>
              
              {/* Angle 1: Frente */}
              <View style={styles.photoPickerRow}>
                <Text style={styles.angleLabel}>Frente</Text>
                {photoFront ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: photoFront }} style={styles.photoThumb} />
                    <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoFront(null)}>
                      <Trash2 size={13} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity style={styles.pickerBtn} onPress={() => handleSelectPhoto("front", true)}>
                      <Camera size={14} color="#f97316" />
                      <Text style={styles.pickerBtnText}>Câmera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: "rgba(255,255,255,0.06)" }]} onPress={() => handleSelectPhoto("front", false)}>
                      <ImageIcon size={14} color="#fff" />
                      <Text style={[styles.pickerBtnText, { color: "#fff" }]}>Galeria</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Angle 2: Lado */}
              <View style={styles.photoPickerRow}>
                <Text style={styles.angleLabel}>Perfil (Lado)</Text>
                {photoSide ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: photoSide }} style={styles.photoThumb} />
                    <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoSide(null)}>
                      <Trash2 size={13} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity style={styles.pickerBtn} onPress={() => handleSelectPhoto("side", true)}>
                      <Camera size={14} color="#f97316" />
                      <Text style={styles.pickerBtnText}>Câmera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: "rgba(255,255,255,0.06)" }]} onPress={() => handleSelectPhoto("side", false)}>
                      <ImageIcon size={14} color="#fff" />
                      <Text style={[styles.pickerBtnText, { color: "#fff" }]}>Galeria</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Angle 3: Costas */}
              <View style={styles.photoPickerRow}>
                <Text style={styles.angleLabel}>Costas</Text>
                {photoBack ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: photoBack }} style={styles.photoThumb} />
                    <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoBack(null)}>
                      <Trash2 size={13} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity style={styles.pickerBtn} onPress={() => handleSelectPhoto("back", true)}>
                      <Camera size={14} color="#f97316" />
                      <Text style={styles.pickerBtnText}>Câmera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: "rgba(255,255,255,0.06)" }]} onPress={() => handleSelectPhoto("back", false)}>
                      <ImageIcon size={14} color="#fff" />
                      <Text style={[styles.pickerBtnText, { color: "#fff" }]}>Galeria</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.saveWeekBtn} onPress={handleSaveWeekPhotos}>
                <Plus size={15} color="#fff" />
                <Text style={styles.saveWeekBtnText}>Salvar Fotos da Semana</Text>
              </TouchableOpacity>
            </View>

            {/* Saved Photos Gallery List */}
            {state.progressPhotos.length > 0 && (
              <View>
                <Text style={styles.sectionHeader}>Galeria de Comparação</Text>
                {state.progressPhotos.map((weekItem) => (
                  <View key={weekItem.week} style={styles.galleryCard}>
                    <View style={styles.galleryCardHeader}>
                      <Text style={styles.galleryCardTitle}>{weekItem.week} · <Text style={{ color: "rgba(255,255,255,0.4)", fontWeight: "400" }}>{fmtDate(weekItem.date)}</Text></Text>
                      <TouchableOpacity onPress={() => handleRemoveWeek(weekItem.week)}>
                        <Trash2 size={14} color="#f87171" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.galleryPhotosRow}>
                      {weekItem.front && (
                        <View style={styles.galleryPhotoWrap}>
                          <Image source={{ uri: weekItem.front }} style={styles.galleryPhoto} />
                          <Text style={styles.galleryPhotoLabel}>Frente</Text>
                        </View>
                      )}
                      {weekItem.side && (
                        <View style={styles.galleryPhotoWrap}>
                          <Image source={{ uri: weekItem.side }} style={styles.galleryPhoto} />
                          <Text style={styles.galleryPhotoLabel}>Perfil</Text>
                        </View>
                      )}
                      {weekItem.back && (
                        <View style={styles.galleryPhotoWrap}>
                          <Image source={{ uri: weekItem.back }} style={styles.galleryPhoto} />
                          <Text style={styles.galleryPhotoLabel}>Costas</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* SUB TAB 3: STATS */}
        {activeSubTab === "stats" && (
          <View>
            {/* Totalizers */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Geral do Cutting</Text>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Dias Controlando Dieta</Text>
                <Text style={styles.statVal}>{stats.totalDietDays} dias</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Sessões de Musculação</Text>
                <Text style={styles.statVal}>{stats.totalWorkouts} treinos</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Média Diária de Consumo</Text>
                <Text style={styles.statVal}>{stats.averageKcal} kcal/dia</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Carga Total Levantada</Text>
                <Text style={styles.statVal}>{stats.totalVolumeLifted} kg</Text>
              </View>
            </View>
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
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 6,
    marginVertical: 12
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
  card: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 16,
    marginBottom: 12
  },
  cardTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12
  },
  bfStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  bfStatCol: {
    alignItems: "center"
  },
  bfStatVal: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900"
  },
  bfStatLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    marginTop: 2
  },
  emptyText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 20
  },
  logItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)"
  },
  logItemDate: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600"
  },
  logItemVal: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700"
  },
  label: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase"
  },
  weekInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 10,
    color: "#fff",
    fontSize: 13,
    fontWeight: "600"
  },
  photoPickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)"
  },
  angleLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    flex: 1
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(249,115,22,0.1)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.25)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  pickerBtnText: {
    color: "#f97316",
    fontSize: 11,
    fontWeight: "700"
  },
  previewContainer: {
    position: "relative",
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden"
  },
  photoThumb: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000"
  },
  removePhotoBtn: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    padding: 3
  },
  saveWeekBtn: {
    backgroundColor: "#f97316",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 14
  },
  saveWeekBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700"
  },
  sectionHeader: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    marginVertical: 12,
    paddingLeft: 4
  },
  galleryCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 14,
    marginBottom: 10
  },
  galleryCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  galleryCardTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800"
  },
  galleryPhotosRow: {
    flexDirection: "row",
    gap: 8
  },
  galleryPhotoWrap: {
    flex: 1,
    alignItems: "center"
  },
  galleryPhoto: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    backgroundColor: "#000"
  },
  galleryPhotoLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    marginTop: 4,
    fontWeight: "600"
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)"
  },
  statLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "500"
  },
  statVal: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700"
  }
});
