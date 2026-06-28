import React, { useContext, useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, Image, ActivityIndicator } from "react-native";
import { AppContext } from "../context/AppContext";
import * as ImagePicker from "expo-image-picker";
import { Search, Camera, Trash2, X, Plus, ChevronDown, ChevronUp, History, Sparkles } from "lucide-react-native";

// Modify this with your local machine's IP (e.g. http://192.168.1.50:3000) when testing on a real device
const API_HOST = "http://localhost:3000";

function ProgressBar({ val, max, color, label, unit = "" }) {
  const pct = Math.min((val / Math.max(max, 1)) * 100, 100);
  return (
    <View style={styles.barWrap}>
      <View style={styles.barLabelRow}>
        <Text style={styles.barLabelText}>{label}</Text>
        <Text style={styles.barValText}>
          {Math.round(val)}{unit} <Text style={styles.barMaxText}>/ {max}{unit}</Text>
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function DietTab() {
  const {
    state,
    today,
    addFoodLog,
    removeFoodLog,
    saveCustomFood,
    getTargets,
    allFoods,
    fmtDate,
    todaySched,
    calculateMetabolicTargets
  } = useContext(AppContext);

  const MEALS = ["Café da Manhã", "Almoço", "Jantar", "Lanches"];

  const [activeSubTab, setActiveSubTab] = useState("log");
  const [logDate, setLogDate] = useState(() => today());
  
  // Custom Food Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [cfName, setCfName] = useState("");
  const [cfKcal, setCfKcal] = useState("");
  const [cfProtein, setCfProtein] = useState("");
  const [cfCarbs, setCfCarbs] = useState("");
  const [cfFat, setCfFat] = useState("");
  const [cfUnit, setCfUnit] = useState("100g");

  // Selection state
  const [activeMeal, setActiveMeal] = useState(null); // which meal search is open
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [foodQty, setFoodQty] = useState("100");

  // History state
  const [histDietDate, setHistDietDate] = useState("");

  // Scanner modal state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTab, setScannerTab] = useState("barcode"); // "barcode" | "label"
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeError, setBarcodeError] = useState("");
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  // Vision state
  const [labelName, setLabelName] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionStatus, setVisionStatus] = useState("");
  const [visionStatusColor, setVisionStatusColor] = useState("rgba(255,255,255,0.5)");

  const t = getTargets();
  const logs = (state.foodLogs || []).filter((l) => l.date === logDate);
  const totals = logs.reduce(
    (a, l) => ({
      kcal: a.kcal + (l.kcal || 0),
      protein: a.protein + (l.protein || 0),
      carbs: a.carbs + (l.carbs || 0),
      fat: a.fat + (l.fat || 0)
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const dates = [...new Set((state.foodLogs || []).map((l) => l.date))].sort().reverse();
  const activeHistDietDate = histDietDate || dates[0] || "";

  const filteredFoods = foodSearch
    ? allFoods().filter((f) => f.name.toLowerCase().includes(foodSearch.toLowerCase())).slice(0, 10)
    : allFoods();

  const handleSelectFood = (food) => {
    setSelectedFood(food);
  };

  const handleConfirmLog = () => {
    if (!selectedFood) return;
    const qty = parseFloat(foodQty) || 0;
    if (qty <= 0) return;
    addFoodLog(selectedFood, qty, logDate, activeMeal);
    setSelectedFood(null);
    setFoodQty("100");
    setFoodSearch("");
    setActiveMeal(null);
  };

  const handleSaveCustom = () => {
    const name = cfName.trim();
    const kcal = parseFloat(cfKcal);
    if (!name || isNaN(kcal)) return;

    saveCustomFood({
      name,
      kcal,
      protein: parseFloat(cfProtein) || 0,
      carbs: parseFloat(cfCarbs) || 0,
      fat: parseFloat(cfFat) || 0,
      unit: cfUnit
    });

    setCfName("");
    setCfKcal("");
    setCfProtein("");
    setCfCarbs("");
    setCfFat("");
    setShowAddForm(false);
  };

  // Image vision selectors
  const handlePickImage = async (useCamera = false) => {
    try {
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true
      };

      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          alert("Permissão para câmera é necessária.");
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Permissão para galeria é necessária.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
        setVisionStatus("");
      }
    } catch (err) {
      console.error("Error picking photo:", err);
    }
  };

  const handleAnalyzeLabel = async () => {
    if (!imageBase64) return;
    setVisionLoading(true);
    setVisionStatusColor("rgba(255,255,255,0.5)");
    setVisionStatus("Enviando para análise com Claude Vision...");

    try {
      const response = await fetch(`${API_HOST}/api/analyze-label`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64,
          customName: labelName.trim()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        addFoodLog(data.food, 100, logDate, activeMeal || "Lanches");
        // Reset states
        setLabelName("");
        setImageUri(null);
        setImageBase64(null);
        setScannerOpen(false);
        setActiveMeal(null);
      } else {
        throw new Error(data.error || "Erro ao analisar imagem.");
      }
    } catch (e) {
      setVisionStatusColor("#ef4444");
      setVisionStatus(e.message || "Erro ao analisar rótulo. Verifique a conexão com o Next.js backend.");
    } finally {
      setVisionLoading(false);
    }
  };

  const handleBarcodeSearch = async () => {
    const code = barcodeInput.trim();
    if (!code) {
      setBarcodeError("Digite o código de barras.");
      return;
    }
    setBarcodeError("");
    setBarcodeLoading(true);

    try {
      const response = await fetch(`${API_HOST}/api/barcode?code=${code}`);
      const data = await response.json();

      if (response.ok && data.success) {
        addFoodLog(data.food, 100, logDate, activeMeal || "Lanches");
        setBarcodeInput("");
        setScannerOpen(false);
        setActiveMeal(null);
      } else {
        setBarcodeError(data.error || "Produto não encontrado.");
      }
    } catch (e) {
      setBarcodeError("Erro ao buscar código. Verifique a conexão com o Next.js backend.");
    } finally {
      setBarcodeLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Target Progress Bar Summary */}
      <View style={styles.summaryCard}>
        <ProgressBar val={totals.kcal} max={t.kcal} color="#f97316" label="Calorias" unit=" kcal" />
        <View style={styles.summaryGrid}>
          <ProgressBar val={totals.protein} max={t.protein} color="#3b82f6" label="Proteína" unit="g" />
          <ProgressBar val={totals.carbs} max={t.carbs} color="#8b5cf6" label="Carboidratos" unit="g" />
          <ProgressBar val={totals.fat} max={t.fat} color="#f59e0b" label="Gordura" unit="g" />
        </View>
      </View>

      {/* Sub Tabs */}
      <View style={styles.tabsRow}>
        {[
          { id: "log", label: "Registrar" },
          { id: "plan", label: "Plano" },
          { id: "hist", label: "Histórico" },
          { id: "foods", label: "Alimentos" }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, activeSubTab === tab.id && styles.tabButtonActive]}
            onPress={() => {
              setActiveSubTab(tab.id);
              setSelectedFood(null);
              setFoodSearch("");
            }}
          >
            <Text style={[styles.tabText, activeSubTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* TAB 1: REGISTRAR */}
        {activeSubTab === "log" && (
          <View>
            {/* Date Input */}
            <View style={styles.dateRow}>
              <TextInput
                style={styles.dateInput}
                value={logDate}
                onChangeText={(val) => { setLogDate(val || today()); setActiveMeal(null); }}
              />
              {logDate !== today() && (
                <TouchableOpacity style={styles.todayButton} onPress={() => { setLogDate(today()); setActiveMeal(null); }}>
                  <Text style={styles.todayButtonText}>Hoje</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Food Search Pane */}
            {activeMeal && (
              <View style={styles.searchPane}>
                <View style={styles.searchPaneHeader}>
                  <Text style={styles.searchPaneTitle}>+ Adicionar ao {activeMeal}</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity style={styles.scannerOpenBtn} onPress={() => setScannerOpen(true)}>
                      <Camera size={14} color="#f97316" />
                      <Text style={styles.scannerOpenBtnText}>Scanner IA</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setActiveMeal(null); setSelectedFood(null); setFoodSearch(""); }}>
                      <X size={18} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                  </View>
                </View>

                {selectedFood ? (
                  <View style={styles.confirmAddWrap}>
                    <Text style={styles.confirmAddTitle}>{selectedFood.name}</Text>
                    <Text style={styles.confirmAddMacros}>
                      {selectedFood.kcal} kcal · P:{selectedFood.protein}g · C:{selectedFood.carbs}g · G:{selectedFood.fat}g
                    </Text>
                    <View style={styles.confirmAddInputRow}>
                      <TextInput
                        style={styles.qtyInput}
                        keyboardType="numeric"
                        value={foodQty}
                        onChangeText={setFoodQty}
                        placeholder="Quantidade em gramas"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                      />
                      <Text style={styles.qtyUnitText}>gramas</Text>
                    </View>
                    <TouchableOpacity style={styles.confirmAddBtn} onPress={handleConfirmLog}>
                      <Text style={styles.confirmAddBtnText}>Adicionar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.searchListWrap}>
                    <View style={styles.searchBarContainer}>
                      <Search size={14} color="rgba(255,255,255,0.3)" style={styles.searchIcon} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar alimento..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={foodSearch}
                        onChangeText={setFoodSearch}
                      />
                    </View>
                    <View style={styles.searchList}>
                      {filteredFoods.map((f) => (
                        <TouchableOpacity
                          key={f.id}
                          style={styles.searchItem}
                          onPress={() => handleSelectFood(f)}
                        >
                          <View>
                            <Text style={styles.searchItemName}>{f.name}</Text>
                            <Text style={styles.searchItemMacros}>
                              C:{f.carbs}g · P:{f.protein}g · G:{f.fat}g · /100g
                            </Text>
                          </View>
                          <Text style={styles.searchItemKcal}>{f.kcal} kcal</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Meals Cards */}
            {MEALS.map((meal) => {
              const mealLogs = logs.filter((l) => l.meal === meal);
              const mealTotals = mealLogs.reduce(
                (a, l) => ({
                  kcal: a.kcal + (l.kcal || 0),
                  protein: a.protein + (l.protein || 0),
                  carbs: a.carbs + (l.carbs || 0),
                  fat: a.fat + (l.fat || 0)
                }),
                { kcal: 0, protein: 0, carbs: 0, fat: 0 }
              );

              return (
                <View key={meal} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealTitle}>{meal}</Text>
                    <Text style={styles.mealKcal}>{mealTotals.kcal} kcal</Text>
                  </View>
                  
                  {/* Micro Macros Info */}
                  <View style={styles.mealMacrosRow}>
                    <Text style={styles.mealMacroText}>P: {mealTotals.protein.toFixed(1)}g</Text>
                    <Text style={styles.mealMacroText}>C: {mealTotals.carbs.toFixed(1)}g</Text>
                    <Text style={styles.mealMacroText}>G: {mealTotals.fat.toFixed(1)}g</Text>
                  </View>

                  {/* Food log items */}
                  {mealLogs.map((l) => (
                    <View key={l.id} style={styles.logItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.logFoodName}>{l.foodName}</Text>
                        <Text style={styles.logFoodDetails}>{l.qty}g · {l.kcal} kcal</Text>
                      </View>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => removeFoodLog(l.id)}>
                        <Trash2 size={13} color="#f87171" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addFoodBtn}
                    onPress={() => openMealSearch(meal)}
                  >
                    <Text style={styles.addFoodBtnText}>+ Adicionar alimentos</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* TAB 2: PLANO */}
        {activeSubTab === "plan" && (
          <View>
            {(() => {
              const schedule = todaySched();
              const mealPlanGroup = schedule.calType === "heavy" ? mealPlan?.heavy : mealPlan?.normal;
              const totalPlanKcal = (mealPlanGroup || []).reduce((sum, m) => sum + (m.kcal || 0), 0);
              
              return (
                <View>
                  <Text style={styles.planSubHeader}>
                    {schedule.calType === "heavy" ? `🦵 Dia Pesado (Treino de Pernas) — ${totalPlanKcal} kcal` : `Dia Normal — ${totalPlanKcal} kcal`}
                  </Text>
                  {(mealPlanGroup || []).map((meal, index) => (
                    <View key={index} style={styles.planCard}>
                      <View style={styles.planHeader}>
                        <Text style={styles.planTitle}>{meal.name}</Text>
                        <Text style={styles.planTimeKcal}>{meal.time} · {meal.kcal} kcal</Text>
                      </View>
                      {(meal.foods || []).map((food, fIdx) => (
                        <Text key={fIdx} style={styles.planFoodLine}>· {food}</Text>
                      ))}
                    </View>
                  ))}
                </View>
              );
            })()}
          </View>
        )}

        {/* TAB 3: HISTÓRICO */}
        {activeSubTab === "hist" && (
          <View>
            <View style={styles.histSelectCard}>
              <Text style={styles.label}>Selecionar Data</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={histDietDate}
                onChangeText={setHistDietDate}
              />
            </View>

            {(() => {
              const hLogs = (state.foodLogs || []).filter((l) => l.date === activeHistDietDate);
              const hTotals = hLogs.reduce(
                (a, l) => ({
                  kcal: a.kcal + (l.kcal || 0),
                  protein: a.protein + (l.protein || 0),
                  carbs: a.carbs + (l.carbs || 0),
                  fat: a.fat + (l.fat || 0)
                }),
                { kcal: 0, protein: 0, carbs: 0, fat: 0 }
              );

              if (hLogs.length === 0) {
                return (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Nenhum registro nesta data ({activeHistDietDate})</Text>
                  </View>
                );
              }

              return (
                <View>
                  <View style={styles.summaryCard}>
                    <ProgressBar val={hTotals.kcal} max={t.kcal} color="#f97316" label="Calorias" unit=" kcal" />
                    <View style={styles.summaryGrid}>
                      <ProgressBar val={hTotals.protein} max={t.protein} color="#3b82f6" label="Proteína" unit="g" />
                      <ProgressBar val={hTotals.carbs} max={t.carbs} color="#8b5cf6" label="Carboidratos" unit="g" />
                      <ProgressBar val={hTotals.fat} max={t.fat} color="#f59e0b" label="Gordura" unit="g" />
                    </View>
                  </View>
                  
                  {hLogs.map((l) => (
                    <View key={l.id} style={styles.histFoodItem}>
                      <View>
                        <Text style={styles.histFoodName}>{l.foodName}</Text>
                        <Text style={styles.histFoodDetails}>{l.qty}g · P:{l.protein}g · C:{l.carbs}g · G:{l.fat}g</Text>
                      </View>
                      <Text style={styles.histFoodKcal}>{l.kcal} kcal</Text>
                    </View>
                  ))}
                </View>
              );
            })()}
          </View>
        )}

        {/* TAB 4: ALIMENTOS */}
        {activeSubTab === "foods" && (
          <View>
            {/* Custom Food Form Accordion */}
            <View style={styles.addCustomCard}>
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setShowAddForm(!showAddForm)}
              >
                <Text style={styles.accordionHeaderText}>Cadastrar Alimento Manual</Text>
                {showAddForm ? <ChevronUp size={16} color="#f97316" /> : <ChevronDown size={16} color="#f97316" />}
              </TouchableOpacity>

              {showAddForm && (
                <View style={styles.accordionContent}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nome do Alimento</Text>
                    <TextInput style={styles.input} value={cfName} onChangeText={setCfName} placeholder="Ex: Pasta de Amendoim" placeholderTextColor="rgba(255,255,255,0.3)" />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Calorias (por 100g)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={cfKcal} onChangeText={setCfKcal} placeholder="Ex: 588" placeholderTextColor="rgba(255,255,255,0.3)" />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Proteína (g)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={cfProtein} onChangeText={setCfProtein} placeholder="Ex: 24" placeholderTextColor="rgba(255,255,255,0.3)" />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Carboidratos (g)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={cfCarbs} onChangeText={setCfCarbs} placeholder="Ex: 20" placeholderTextColor="rgba(255,255,255,0.3)" />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Gordura (g)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={cfFat} onChangeText={setCfFat} placeholder="Ex: 49" placeholderTextColor="rgba(255,255,255,0.3)" />
                  </View>
                  <TouchableOpacity style={styles.saveCustomBtn} onPress={handleSaveCustom}>
                    <Text style={styles.saveCustomBtnText}>Salvar Alimento</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* List Catalog */}
            <View style={styles.catalogCard}>
              <Text style={styles.catalogCardTitle}>Todos os Alimentos ({allFoods().length})</Text>
              {allFoods().map((f) => (
                <View key={f.id} style={styles.catalogItem}>
                  <View>
                    <Text style={styles.catalogItemName}>{f.name}</Text>
                    <Text style={styles.catalogItemMacros}>C:{f.carbs}g · P:{f.protein}g · G:{f.fat}g · /{f.unit}</Text>
                  </View>
                  <Text style={styles.catalogItemKcal}>{f.kcal} kcal</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* SCANNER MODAL (IA Vision / Barcode scanner) */}
      <Modal visible={scannerOpen} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Scanner / IA Vision</Text>
              <TouchableOpacity onPress={() => setScannerOpen(false)}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Modal Tabs */}
            <View style={styles.modalTabs}>
              <TouchableOpacity
                style={[styles.modalTabButton, scannerTab === "barcode" && styles.modalTabButtonActive]}
                onPress={() => setScannerTab("barcode")}
              >
                <Text style={[styles.modalTabText, scannerTab === "barcode" && styles.modalTabTextActive]}>Código de Barras</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalTabButton, scannerTab === "label" && styles.modalTabButtonActive]}
                onPress={() => setScannerTab("label")}
              >
                <Text style={[styles.modalTabText, scannerTab === "label" && styles.modalTabTextActive]}>Tabela Nutricional</Text>
              </TouchableOpacity>
            </View>

            {/* Tab 1: Barcode manual search */}
            {scannerTab === "barcode" && (
              <View style={styles.modalTabContent}>
                <Text style={styles.modalDesc}>Digite o código de barras EAN do produto (Open Food Facts):</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  placeholder="Ex: 7891000315507"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={barcodeInput}
                  onChangeText={setBarcodeInput}
                />
                {barcodeError ? <Text style={styles.errorText}>{barcodeError}</Text> : null}
                
                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={handleBarcodeSearch}
                  disabled={barcodeLoading}
                >
                  {barcodeLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalBtnText}>Buscar Produto</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Tab 2: Nutrition Label photo / Claude Vision */}
            {scannerTab === "label" && (
              <ScrollView style={styles.modalTabContent}>
                <Text style={styles.modalDesc}>Nome do alimento (Opcional):</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ex: Aveia Premium"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={labelName}
                  onChangeText={setLabelName}
                />
                
                <View style={styles.photoSelectRow}>
                  <TouchableOpacity style={styles.photoSelectBtn} onPress={() => handlePickImage(true)}>
                    <Text style={styles.photoSelectText}>Tirar Foto 📸</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.photoSelectBtn, { backgroundColor: "rgba(255,255,255,0.06)" }]} onPress={() => handlePickImage(false)}>
                    <Text style={[styles.photoSelectText, { color: "#fff" }]}>Galeria 🖼️</Text>
                  </TouchableOpacity>
                </View>

                {imageUri && (
                  <View style={styles.imagePreviewWrap}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.analyzeBtn}
                      onPress={handleAnalyzeLabel}
                      disabled={visionLoading}
                    >
                      {visionLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Sparkles size={14} color="#fff" />
                          <Text style={styles.analyzeBtnText}>Analisar com Claude IA</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {visionStatus ? (
                  <Text style={[styles.visionStatusText, { color: visionStatusColor }]}>{visionStatus}</Text>
                ) : null}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const openMealSearch = (meal) => {};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06060c"
  },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 16,
    margin: 16,
    marginBottom: 8
  },
  barWrap: {
    marginBottom: 8
  },
  barLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4
  },
  barLabelText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12
  },
  barValText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700"
  },
  barMaxText: {
    color: "rgba(255,255,255,0.35)",
    fontWeight: "400"
  },
  barTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden"
  },
  barFill: {
    height: "100%",
    borderRadius: 3
  },
  summaryGrid: {
    marginTop: 8,
    gap: 8
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
  searchPane: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.2)",
    padding: 12,
    marginBottom: 14
  },
  searchPaneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  searchPaneTitle: {
    color: "#f97316",
    fontSize: 13,
    fontWeight: "800"
  },
  scannerOpenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(249,115,22,0.1)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  scannerOpenBtnText: {
    color: "#f97316",
    fontSize: 10,
    fontWeight: "800"
  },
  confirmAddWrap: {
    paddingVertical: 8
  },
  confirmAddTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700"
  },
  confirmAddMacros: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    marginTop: 2,
    marginBottom: 12
  },
  confirmAddInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12
  },
  qtyInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 8,
    color: "#fff",
    fontSize: 13
  },
  qtyUnitText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12
  },
  confirmAddBtn: {
    backgroundColor: "#f97316",
    borderRadius: 8,
    padding: 10,
    alignItems: "center"
  },
  confirmAddBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700"
  },
  searchListWrap: {},
  searchBarContainer: {
    position: "relative",
    marginBottom: 10
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    top: 12,
    zIndex: 1
  },
  searchInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    padding: 8,
    paddingLeft: 30,
    color: "#fff",
    fontSize: 12
  },
  searchList: {
    maxHeight: 200,
    overflow: "scroll"
  },
  searchItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)"
  },
  searchItemName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  searchItemMacros: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    marginTop: 2
  },
  searchItemKcal: {
    color: "#f97316",
    fontSize: 12,
    fontWeight: "700"
  },
  mealCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 16,
    marginBottom: 10
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4
  },
  mealTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800"
  },
  mealKcal: {
    color: "#f97316",
    fontSize: 13,
    fontWeight: "700"
  },
  mealMacrosRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10
  },
  mealMacroText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "600"
  },
  logItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)"
  },
  logFoodName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  logFoodDetails: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    marginTop: 2
  },
  deleteBtn: {
    padding: 4
  },
  addFoodBtn: {
    paddingTop: 10,
    alignItems: "center"
  },
  addFoodBtnText: {
    color: "#f97316",
    fontSize: 12,
    fontWeight: "700"
  },
  planSubHeader: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    marginBottom: 12
  },
  planCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  planTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700"
  },
  planTimeKcal: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11
  },
  planFoodLine: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    paddingVertical: 3
  },
  histSelectCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10
  },
  label: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase"
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center"
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12
  },
  histFoodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 6
  },
  histFoodName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600"
  },
  histFoodDetails: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    marginTop: 2
  },
  histFoodKcal: {
    color: "#f97316",
    fontSize: 13,
    fontWeight: "700"
  },
  addCustomCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginBottom: 10,
    overflow: "hidden"
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    alignItems: "center"
  },
  accordionHeaderText: {
    color: "#f97316",
    fontSize: 12,
    fontWeight: "700"
  },
  accordionContent: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    gap: 8
  },
  inputGroup: {
    marginBottom: 4
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
  saveCustomBtn: {
    backgroundColor: "#f97316",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginTop: 8
  },
  saveCustomBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700"
  },
  catalogCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 14
  },
  catalogCardTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 10
  },
  catalogItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)"
  },
  catalogItemName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  catalogItemMacros: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    marginTop: 2
  },
  catalogItemKcal: {
    color: "#f97316",
    fontSize: 12,
    fontWeight: "700"
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "flex-end"
  },
  modalSheet: {
    height: "85%",
    backgroundColor: "#0d0d15",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  modalHeaderTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900"
  },
  modalTabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16
  },
  modalTabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center"
  },
  modalTabButtonActive: {
    backgroundColor: "#f97316"
  },
  modalTabText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700"
  },
  modalTabTextActive: {
    color: "#fff"
  },
  modalTabContent: {
    flex: 1
  },
  modalDesc: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginBottom: 10
  },
  modalInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 10,
    color: "#fff",
    fontSize: 13,
    marginBottom: 10
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginBottom: 10
  },
  modalBtn: {
    backgroundColor: "#f97316",
    borderRadius: 10,
    padding: 12,
    alignItems: "center"
  },
  modalBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700"
  },
  photoSelectRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16
  },
  photoSelectBtn: {
    flex: 1,
    backgroundColor: "#f97316",
    borderRadius: 10,
    padding: 12,
    alignItems: "center"
  },
  photoSelectText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700"
  },
  imagePreviewWrap: {
    alignItems: "center",
    gap: 12
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#000"
  },
  analyzeBtn: {
    backgroundColor: "#8b5cf6",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center"
  },
  analyzeBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700"
  },
  visionStatusText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 12
  }
});
