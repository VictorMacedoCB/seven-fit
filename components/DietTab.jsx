"use client";

import React, { useState, useEffect } from "react";
import DietPlanEditor from "@/components/DietPlanEditor";
import { Search, Camera, Upload, Download, Trash2, Settings, Flame, X, Plus, ChevronDown, ChevronUp, History, Barcode } from "lucide-react";

// Reusable ProgressBar Component
function ProgressBar({ val, max, color, label, unit = "" }) {
  const pct = Math.min((val / Math.max(max, 1)) * 100, 100);
  return (
    <div className="bar-wrap">
      <div className="row-sb" style={{ fontSize: "12px", marginBottom: "4px" }}>
        <span style={{ color: "rgba(255,255,255,0.7)" }}>{label}</span>
        <span style={{ color: "#fff" }}>
          {Math.round(val)}
          {unit} <span style={{ color: "rgba(255,255,255,0.4)" }}>/ {max}{unit}</span>
        </span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function DietTab({
  state,
  saveCustomFood,
  addFoodLog,
  removeFoodLog,
  openScanner,
  todaySched,
  getTargets,
  todayFoodLogs,
  getTotals,
  allFoods,
  mealPlan,
  saveMealPlan,
  fmtDate,
  today,
  clearSelectedFood,
}) {
  const MEALS = ["Café da Manhã", "Almoço", "Jantar", "Lanches"];

  const [activeSubTab, setActiveSubTab] = useState("log");
  const [foodsTab, setFoodsTab] = useState("meus");
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [foodQty, setFoodQty] = useState("100");
  const [foodUnit, setFoodUnit] = useState("g"); // "g" | "fatia" | "un"
  const [foodPortionSize, setFoodPortionSize] = useState(""); // grams per fatia/un
  const [logDate, setLogDate] = useState(() => today());
  const [activeMeal, setActiveMeal] = useState(null); // qual refeição está com busca aberta
  const [histDietDate, setHistDietDate] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [myFoodsFilter, setMyFoodsFilter] = useState("");
  const [myFoodsCategory, setMyFoodsCategory] = useState("Todas");
  // food picked from Alimentos tab (needs meal + qty selection)
  const [pickedFood, setPickedFood] = useState(null);
  const [pickedQty, setPickedQty] = useState("100");
  const [pickedMeal, setPickedMeal] = useState("Almoço");
  const [pickedUnit, setPickedUnit] = useState("g");
  const [pickedPortion, setPickedPortion] = useState("");
  const [planStatus, setPlanStatus] = useState({ type: "", message: "" });


  // Custom Food Form State
  const [cfName, setCfName] = useState("");
  const [cfKcal, setCfKcal] = useState("");
  const [cfProtein, setCfProtein] = useState("");
  const [cfCarbs, setCfCarbs] = useState("");
  const [cfFat, setCfFat] = useState("");
  const [cfUnit, setCfUnit] = useState("100g"); // "100g" | "1 unidade" | "1 fatia"

  const t = getTargets();
  const logs = (state.foodLogs || []).filter((l) => l.date === logDate);
  const tot = getTotals(logs);

  // Initialize historical date
  const dates = [...new Set((state.foodLogs || []).map((l) => l.date))].sort().reverse();
  const activeHistDietDate = histDietDate || dates[0] || "";

  // Synchronize foodSearch selections
  const filteredFoods = foodSearch
    ? allFoods().filter((f) => f.name.toLowerCase().includes(foodSearch.toLowerCase())).slice(0, 7)
    : [];

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setFoodSearch(""); // Close dropdown after selection
  };

  // Calcula gramas efetivos baseado na unidade escolhida
  const effectiveGrams = () => {
    const qty = parseFloat(foodQty) || 0;
    if (foodUnit === "g") return qty;
    const portion = parseFloat(foodPortionSize) || 0;
    return qty * portion;
  };

  const handleAddLog = () => {
    if (!selectedFood) return;
    const grams = effectiveGrams();
    if (grams <= 0) return;
    addFoodLog(selectedFood, grams, logDate, activeMeal);
    setSelectedFood(null);
    setFoodQty("100");
    setFoodUnit("g");
    setFoodPortionSize("");
    setFoodSearch("");
    setActiveMeal(null);
  };


  const handleAddPicked = () => {
    if (!pickedFood) return;
    const grams = pickedUnit === "g" ? (parseFloat(pickedQty) || 100) : (parseFloat(pickedQty) || 1) * (parseFloat(pickedPortion) || 100);
    addFoodLog(pickedFood, grams, logDate, pickedMeal);
    setPickedFood(null);
    setPickedQty("100");
    setPickedUnit("g");
    setPickedPortion("");
  };

  const openMealSearch = (meal) => {
    setActiveMeal(meal);
    setSelectedFood(null);
    setFoodSearch("");
    setFoodQty("100");
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
      unit: cfUnit,
    });

    setCfName(""); setCfKcal(""); setCfProtein(""); setCfCarbs(""); setCfFat(""); setCfUnit("100g");
  };

  // If a scanned food is set externally (e.g. from ScannerModal) in parent state
  useEffect(() => {
    if (state.selectedFood) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedFood(state.selectedFood);
       
      setFoodSearch(state.selectedFood.name);
      if (clearSelectedFood) {
        clearSelectedFood();
      }
    }
  }, [state.selectedFood, clearSelectedFood]);

  const handleExportMealPlan = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mealPlan, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "plano-alimentar-cutting.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      setPlanStatus({
        type: "success",
        message: "Plano exportado com sucesso! Verifique os seus downloads. 💾"
      });
      setTimeout(() => {
        setPlanStatus({ type: "", message: "" });
      }, 5000);
    } catch (err) {
      setPlanStatus({
        type: "error",
        message: "Ocorreu um erro ao exportar o plano de dieta."
      });
    }
  };

  const handleImportMealPlan = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== "object") {
          throw new Error("O arquivo JSON deve ser um objeto.");
        }
        if (!Array.isArray(parsed.normal) || !Array.isArray(parsed.heavy)) {
          throw new Error("O plano de dieta deve conter as listas 'normal' e 'heavy'.");
        }
        
        const validateMeals = (meals) => {
          return meals.every(meal => 
            meal &&
            typeof meal === "object" && 
            typeof meal.time === "string" &&
            typeof meal.name === "string" &&
            Array.isArray(meal.foods) &&
            typeof meal.kcal === "number"
          );
        };
        
        if (!validateMeals(parsed.normal) || !validateMeals(parsed.heavy)) {
          throw new Error("Formato inválido. Cada refeição precisa conter: time, name, foods (lista) e kcal.");
        }
        
        saveMealPlan(parsed);
        setPlanStatus({
          type: "success",
          message: "Plano de dieta importado e atualizado com sucesso! 🎉"
        });
        setTimeout(() => {
          setPlanStatus({ type: "", message: "" });
        }, 5000);
      } catch (err) {
        setPlanStatus({
          type: "error",
          message: `Erro ao importar: ${err.message}`
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div>
      {/* MACRO SUMMARY */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <ProgressBar val={tot.kcal} max={t.kcal} color="#f97316" label="Calorias" unit=" kcal" />
        <ProgressBar val={tot.protein} max={t.protein} color="#3b82f6" label="Proteína" unit="g" />
        <ProgressBar val={tot.carbs} max={t.carbs} color="#8b5cf6" label="Carboidrato" unit="g" />
        <ProgressBar val={tot.fat} max={t.fat} color="#f59e0b" label="Gordura" unit="g" />
      </div>

      {/* SUB TABS */}
      <div className="sub-tabs">
        {[
          { id: "log", label: "Registrar" },
          { id: "plan", label: "Plano" },
          { id: "hist", label: "Histórico" },
          { id: "foods", label: "Alimentos" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`sub-tab ${activeSubTab === tab.id ? "active" : ""}`}
            onClick={() => {
              setActiveSubTab(tab.id);
              setSelectedFood(null);
              setFoodSearch("");
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* REGISTRAR SUB-TAB */}
      {activeSubTab === "log" && (
        <div>
          {/* Date Picker */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", minWidth: 0 }}>
            <input
              type="date"
              value={logDate}
              max={today()}
              onChange={(e) => { setLogDate(e.target.value || today()); setActiveMeal(null); }}
              style={{ fontWeight: "600", fontSize: "13px", minWidth: 0, flex: 1, width: "100%" }}
            />
            {logDate !== today() && (
              <button
                className="btn btn-ghost"
                style={{ padding: "10px 12px", fontSize: "12px", flexShrink: 0, whiteSpace: "nowrap" }}
                onClick={() => { setLogDate(today()); setActiveMeal(null); }}
              >
                Hoje
              </button>
            )}
          </div>

          {/* Painel de adição de alimento (aparece ao clicar "+ Adicionar alimentos") */}
          {activeMeal && (
            <div style={{ background: "rgba(12,12,20,0.98)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: "20px", marginBottom: "14px", overflow: "hidden" }}>

              {/* Header */}
              <div className="row-sb" style={{ padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#f97316" }}>+ {activeMeal}</span>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: "2px" }}
                  onClick={() => { setActiveMeal(null); setSelectedFood(null); setFoodSearch(""); setFoodsTab("meus"); }}>
                  <X size={16} />
                </button>
              </div>

              {/* Selected food confirm */}
              {selectedFood ? (
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>{selectedFood.name}</div>
                  <div style={{ display: "flex", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "10px", flexWrap: "wrap" }}>
                    <span style={{ color: "#f97316" }}><Flame size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {selectedFood.kcal} kcal</span>
                    <span>C:{selectedFood.carbs}g</span><span>P:{selectedFood.protein}g</span><span>G:{selectedFood.fat}g</span>
                  </div>
                  {/* Seletor de unidade */}
                  <div style={{ display: "flex", gap: "5px", marginBottom: "8px" }}>
                    {["g", "fatia", "un"].map((u) => (
                      <button key={u} onClick={() => { setFoodUnit(u); setFoodPortionSize(""); }}
                        style={{ flex: 1, padding: "6px 0", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif",
                          background: foodUnit === u ? "#f97316" : "rgba(255,255,255,0.07)", color: foodUnit === u ? "#fff" : "rgba(255,255,255,0.45)" }}>
                        {u === "g" ? "Gramas" : u === "fatia" ? "Fatia" : "Unidade"}
                      </button>
                    ))}
                  </div>
                  <div className="row" style={{ gap: "8px", marginBottom: "8px" }}>
                    <input type="number" placeholder={foodUnit === "g" ? "Gramas" : `Qtd ${foodUnit}`} value={foodQty} onChange={(e) => setFoodQty(e.target.value)} style={{ flex: 1 }} />
                    {foodUnit !== "g" && (
                      <input type="number" placeholder="g por porção" value={foodPortionSize} onChange={(e) => setFoodPortionSize(e.target.value)} style={{ flex: 1 }} />
                    )}
                  </div>
                  {foodUnit !== "g" && foodQty && foodPortionSize && (
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>
                      = {parseFloat(foodQty) * parseFloat(foodPortionSize)}g total
                    </div>
                  )}
                  <div className="row" style={{ gap: "8px" }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddLog}>Adicionar</button>
                    <button className="btn btn-ghost" style={{ padding: "10px 12px" }} onClick={() => setSelectedFood(null)}><X size={14} /></button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "10px 12px 14px" }}>
                  {/* Filtro + lista de alimentos */}
                  <div style={{ position: "relative", marginBottom: "10px" }}>
                    <Search size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)" }} />
                    <input type="text" placeholder="Filtrar alimentos..." value={foodSearch} onChange={(e) => setFoodSearch(e.target.value)} style={{ paddingLeft: "32px", fontSize: "13px" }} />
                  </div>
                  {!foodSearch && (() => {
                    const recent = [...new Set((state.foodLogs || []).map(l => l.foodName))].map(n => allFoods().find(f => f.name === n)).filter(Boolean).slice(0, 5);
                    return recent.length > 0 ? (
                      <div style={{ marginBottom: "6px" }}>
                        <div style={{ fontSize: "9px", fontWeight: "700", color: "rgba(255,255,255,0.3)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}><History size={10} /> Recentes</div>
                        {recent.map((f) => (
                          <div key={f.id} onClick={() => handleSelectFood(f)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", borderRadius: "10px", cursor: "pointer", marginBottom: "2px", background: "rgba(255,255,255,0.04)" }}>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: "600" }}>{f.name}</div>
                              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>C:{f.carbs}g · P:{f.protein}g · G:{f.fat}g</div>
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#f97316", marginLeft: "8px", flexShrink: 0 }}>{f.kcal} kcal</span>
                          </div>
                        ))}
                        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
                      </div>
                    ) : null;
                  })()}
                  <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                    {(foodSearch ? allFoods().filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase())) : allFoods()).map((f) => (
                      <div key={f.id} onClick={() => handleSelectFood(f)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", borderRadius: "10px", cursor: "pointer", marginBottom: "2px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: "600" }}>{f.name}</div>
                          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>C:{f.carbs}g · P:{f.protein}g · G:{f.fat}g</div>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#f97316", marginLeft: "8px", flexShrink: 0 }}>{f.kcal} kcal</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Meal Cards */}
          {MEALS.map((meal) => {
            const mealLogs = logs.filter((l) => (l.meal || "Almoço") === meal);
            const mealTot  = getTotals(mealLogs);
            const isOpen   = activeMeal === meal;

            return (
              <div key={meal} className="card" style={{ padding: "0", overflow: "hidden", marginBottom: "10px" }}>
                {/* Meal header */}
                <div style={{ padding: "14px 16px 12px", borderBottom: mealLogs.length ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div className="row-sb" style={{ marginBottom: mealLogs.length ? "10px" : "0" }}>
                    <span style={{ fontWeight: "700", fontSize: "14px" }}>{meal}</span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: mealLogs.length ? "#f97316" : "rgba(255,255,255,0.2)" }}>
                      {mealLogs.length ? `${mealTot.kcal} kcal` : "0 kcal"}
                    </span>
                  </div>

                  {/* Macros row — sempre visível */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    {[
                      { label: "Carboidratos", value: mealTot.carbs, color: "#ec4899" },
                      { label: "Proteína",     value: mealTot.protein, color: "#3b82f6" },
                      { label: "Gordura",      value: mealTot.fat,    color: "#f59e0b" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "7px 10px" }}>
                        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</div>
                        <div style={{ fontSize: "14px", fontWeight: "700", color }}>{parseFloat(value.toFixed(1))}<span style={{ fontSize: "10px", fontWeight: "400", color: "rgba(255,255,255,0.35)" }}>g</span></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Food items */}
                {mealLogs.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.foodName}</div>
                      <div className="small">{l.qty}g · P:{parseFloat((l.protein||0).toFixed(1))}g C:{parseFloat((l.carbs||0).toFixed(1))}g G:{parseFloat((l.fat||0).toFixed(1))}g</div>
                    </div>
                    <div className="row" style={{ gap: "8px", flexShrink: 0, marginLeft: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#f97316" }}>{l.kcal}</span>
                      <button className="btn-danger" onClick={() => removeFoodLog(l.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", padding: 0 }}>
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add button + Scanner de código de barras */}
                <div style={{ display: "flex", alignItems: "stretch", borderTop: mealLogs.length ? "none" : undefined }}>
                  <button
                    onClick={() => isOpen ? setActiveMeal(null) : openMealSearch(meal)}
                    style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "11px 16px", display: "flex", alignItems: "center", gap: "6px", color: "#f97316", fontSize: "13px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif" }}
                  >
                    <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span> Adicionar alimentos
                  </button>
                  {openScanner && (
                    <button
                      onClick={() => { openMealSearch(meal); openScanner("barcode"); }}
                      title="Escanear código de barras"
                      style={{ flexShrink: 0, width: "44px", background: "none", border: "none", borderLeft: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(249,115,22,0.75)" }}
                    >
                      <Barcode size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PLANO SUB-TAB */}
      {activeSubTab === "plan" && (
        <div>
          {/* Action Bar for Customizing Diet Plan */}
          <div style={{
            display: "flex",
            gap: "10px",
            marginBottom: "16px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "14px",
            padding: "10px 12px",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}><Settings size={14} /> Personalizar Plano</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => document.getElementById("meal-plan-import-input").click()}
                className="btn"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  fontSize: "11px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <Upload size={12} /> Importar
              </button>
              <button
                onClick={handleExportMealPlan}
                className="btn"
                style={{
                  background: "rgba(249, 115, 22, 0.15)",
                  border: "1px solid rgba(249, 115, 22, 0.3)",
                  fontSize: "11px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  color: "#f97316",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <Download size={12} /> Exportar
              </button>
              <input
                id="meal-plan-import-input"
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={handleImportMealPlan}
              />
            </div>
          </div>

          {/* Status Message */}
          {planStatus.message && (
            <div style={{
              background: planStatus.type === "success" ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
              border: `1px solid ${planStatus.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              borderRadius: "10px",
              padding: "10px 12px",
              fontSize: "12px",
              color: planStatus.type === "success" ? "#10b981" : "#ef4444",
              marginBottom: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span>{planStatus.message}</span>
              <button 
                onClick={() => setPlanStatus({ type: "", message: "" })}
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          <DietPlanEditor
            mealPlan={mealPlan}
            saveMealPlan={saveMealPlan}
            targets={t}
            objetivo={state.profile?.objetivo || "cutting"}
          />
        </div>
      )}

      {/* HISTÓRICO SUB-TAB */}
      {activeSubTab === "hist" && (
        <div>
          <div style={{ marginBottom: "14px" }}>
            <div className="label" style={{ marginBottom: "6px" }}>
              Selecionar data
            </div>
            <select
              value={activeHistDietDate}
              onChange={(e) => setHistDietDate(e.target.value)}
            >
              <option value="">— Escolha uma data —</option>
              {dates.map((d) => (
                  <option key={d} value={d}>
                    {fmtDate(d)}
                  </option>
                ))}
            </select>
          </div>

          {/* Show Historical details */}
          {(() => {
            const hLogs = (state.foodLogs || []).filter((l) => l.date === activeHistDietDate);
            const hTot = getTotals(hLogs);
            if (!hLogs.length) {
              return (
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "32px" }}>
                  Nenhum registro nesta data
                </div>
              );
            }
            return (
              <div>
                <div className="card">
                  <ProgressBar val={hTot.kcal} max={t.kcal} color="#f97316" label="Calorias" unit=" kcal" />
                  <ProgressBar val={hTot.protein} max={t.protein} color="#3b82f6" label="Proteína" unit="g" />
                  <ProgressBar val={hTot.carbs} max={t.carbs} color="#8b5cf6" label="Carboidrato" unit="g" />
                  <ProgressBar val={hTot.fat} max={t.fat} color="#f59e0b" label="Gordura" unit="g" />
                </div>
                {hLogs.map((l) => (
                  <div className="food-item" key={l.id}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "500" }}>{l.foodName}</div>
                      <div className="small">
                        {l.qty}g · P:{l.protein}g C:{l.carbs}g G:{l.fat}g
                      </div>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#f97316" }}>{l.kcal}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* + ALIMENTO SUB-TAB */}
      {activeSubTab === "foods" && (
        <div>
          {/* Picked food confirm panel */}
          {pickedFood && (
            <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: "16px", padding: "14px", marginBottom: "14px" }}>
              <div className="row-sb" style={{ marginBottom: "8px" }}>
                <span style={{ fontWeight: "700", fontSize: "14px" }}>{pickedFood.name}</span>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }} onClick={() => setPickedFood(null)}><X size={16} /></button>
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ color: "#f97316" }}><Flame size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {pickedFood.kcal} kcal</span>
                <span>C:{pickedFood.carbs}g</span><span>P:{pickedFood.protein}g</span><span>G:{pickedFood.fat}g</span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>/{pickedFood.unit}</span>
              </div>
              {/* Unidade */}
              <div style={{ display: "flex", gap: "5px", marginBottom: "8px" }}>
                {["g", "fatia", "un"].map((u) => (
                  <button key={u} onClick={() => { setPickedUnit(u); setPickedPortion(""); }}
                    style={{ flex: 1, padding: "6px 0", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif",
                      background: pickedUnit === u ? "#f97316" : "rgba(255,255,255,0.07)", color: pickedUnit === u ? "#fff" : "rgba(255,255,255,0.45)" }}>
                    {u === "g" ? "Gramas" : u === "fatia" ? "Fatia" : "Unidade"}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: pickedUnit !== "g" ? "1fr 1fr 1fr" : "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                <div>
                  <div className="label">{pickedUnit === "g" ? "Gramas" : pickedUnit === "fatia" ? "Fatias" : "Unidades"}</div>
                  <input type="number" value={pickedQty} onChange={(e) => setPickedQty(e.target.value)} placeholder="0" />
                </div>
                {pickedUnit !== "g" && (
                  <div>
                    <div className="label">g por porção</div>
                    <input type="number" value={pickedPortion} onChange={(e) => setPickedPortion(e.target.value)} placeholder="0" />
                  </div>
                )}
                <div>
                  <div className="label">Refeição</div>
                  <select value={pickedMeal} onChange={(e) => setPickedMeal(e.target.value)}>
                    {MEALS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              {pickedUnit !== "g" && pickedQty && pickedPortion && (
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>
                  = {parseFloat(pickedQty) * parseFloat(pickedPortion)}g total
                </div>
              )}
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleAddPicked}>
                Adicionar ao {pickedMeal}
              </button>
            </div>
          )}

          {/* ── MEUS ALIMENTOS ── */}
          {foodsTab === "meus" && (
            <div>
              {/* Recently used (from logs) */}
              {(() => {
                const usedNames = [...new Set((state.foodLogs || []).map(l => l.foodName))];
                const recentFoods = usedNames.map(name => allFoods().find(f => f.name === name)).filter(Boolean);
                return recentFoods.length > 0 ? (
                  <div className="card" style={{ padding: "14px 16px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                      <History size={14} style={{ color: "#f97316" }} />
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Usados recentemente</span>
                    </div>
                    {recentFoods.map((f) => (
                      <div key={f.id} onClick={() => { setPickedFood(f); setPickedQty("100"); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "600" }}>{f.name}</div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                            C:{f.carbs}g · P:{f.protein}g · G:{f.fat}g · /{f.unit}
                          </div>
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#f97316", flexShrink: 0, marginLeft: "8px" }}>{f.kcal} kcal</span>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* All foods (default + custom) */}
              <div className="card" style={{ padding: "14px 16px", marginBottom: "10px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                  Todos os Alimentos ({allFoods().length})
                </div>

                {/* Busca */}
                <div style={{ position: "relative", marginBottom: "10px" }}>
                  <Search size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)" }} />
                  <input type="text" placeholder="Buscar alimento..." value={myFoodsFilter} onChange={(e) => setMyFoodsFilter(e.target.value)} style={{ paddingLeft: "32px" }} />
                </div>

                {/* Filtro por categoria */}
                {(() => {
                  const cats = ["Todas", ...new Set(allFoods().map((f) => f.category).filter(Boolean))];
                  return (
                    <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "10px", marginBottom: "4px" }}>
                      {cats.map((c) => (
                        <button key={c} onClick={() => setMyFoodsCategory(c)} style={{
                          padding: "5px 12px", borderRadius: "20px", border: "none", cursor: "pointer",
                          fontSize: "11px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap", flexShrink: 0,
                          background: myFoodsCategory === c ? "#f97316" : "rgba(255,255,255,0.06)",
                          color: myFoodsCategory === c ? "#fff" : "rgba(255,255,255,0.5)",
                        }}>{c}</button>
                      ))}
                    </div>
                  );
                })()}

                {(() => {
                  const filtered = allFoods().filter((f) =>
                    (myFoodsCategory === "Todas" || f.category === myFoodsCategory) &&
                    (!myFoodsFilter || f.name.toLowerCase().includes(myFoodsFilter.toLowerCase()))
                  );
                  if (!filtered.length) {
                    return <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "16px 0" }}>Nenhum alimento encontrado.</div>;
                  }
                  return (
                    <div style={{ maxHeight: "420px", overflowY: "auto" }}>
                      {filtered.map((f) => (
                        <div key={f.id} onClick={() => { setPickedFood(f); setPickedQty("100"); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                          <div style={{ flex: 1, minWidth: 0, marginRight: "8px" }}>
                            <div style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" }}>
                              {f.name}
                              {f.scanned && <Camera size={11} style={{ color: "#10b981", flexShrink: 0 }} />}
                            </div>
                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                              C:{f.carbs}g · P:{f.protein}g · G:{f.fat}g · /{f.unit}
                            </div>
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "#f97316", flexShrink: 0 }}>{f.kcal} kcal</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Add custom food form */}
              <div className="card" style={{ padding: "0", overflow: "hidden", marginBottom: "10px" }}>
                <button onClick={() => setShowAddForm((v) => !v)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#f97316", fontSize: "13px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Plus size={16} /> Cadastrar Alimento Manual</span>
                  {showAddForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showAddForm && (
                  <div style={{ padding: "0 16px 16px" }}>
                    {/* Base de medida */}
                    <div style={{ marginBottom: "12px" }}>
                      <div className="label" style={{ marginBottom: "6px" }}>Base de medida</div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {["100g", "1 unidade", "1 fatia"].map((u) => (
                          <button key={u} onClick={() => setCfUnit(u)}
                            style={{ flex: 1, padding: "7px 0", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: "700", fontFamily: "'DM Sans',sans-serif",
                              background: cfUnit === u ? "#f97316" : "rgba(255,255,255,0.07)", color: cfUnit === u ? "#fff" : "rgba(255,255,255,0.5)" }}>
                            {u}
                          </button>
                        ))}
                      </div>
                      <div className="small" style={{ marginTop: "5px" }}>
                        Os valores abaixo são referentes a <strong style={{ color: "#f97316" }}>{cfUnit}</strong>
                      </div>
                    </div>

                    {[
                      { label: "Nome", val: cfName, set: setCfName, type: "text", placeholder: "Ex: Pasta de Amendoim" },
                      { label: `Calorias (por ${cfUnit})`, val: cfKcal, set: setCfKcal, type: "number", placeholder: "Ex: 588" },
                      { label: "Proteína (g)", val: cfProtein, set: setCfProtein, type: "number", placeholder: "Ex: 24" },
                      { label: "Carboidrato (g)", val: cfCarbs, set: setCfCarbs, type: "number", placeholder: "Ex: 20" },
                      { label: "Gordura (g)", val: cfFat, set: setCfFat, type: "number", placeholder: "Ex: 49" },
                    ].map((s, i) => (
                      <div style={{ marginBottom: "10px" }} key={i}>
                        <div className="label">{s.label}</div>
                        <input type={s.type} value={s.val} onChange={(e) => s.set(e.target.value)} placeholder={s.placeholder} />
                      </div>
                    ))}
                    <button className="btn btn-primary" style={{ width: "100%", marginTop: "4px" }} onClick={() => { handleSaveCustom(); setShowAddForm(false); }}>
                      Salvar Alimento
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── BIBLIOTECA ── */}
        </div>
      )}
    </div>
  );
}
