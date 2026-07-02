"use client";

import { useState, useEffect } from "react";
import { X, Plus, Clock, Trash2, Search } from "lucide-react";
import foodsDb from "@/lib/foods-ptbr.json";

// Base de alimentos comuns em PT-BR com macros por 100g
// Alimentos carregados de lib/foods-ptbr.json (fonte: TACO/UNICAMP)
const COMMON_FOODS = foodsDb;

const OBJECTIVE_LABELS = {
  cutting:    { label:"Cutting 🔥",    color:"#ef4444" },
  bulking:    { label:"Bulking 💪",    color:"#f97316" },
  manutencao: { label:"Manutenção ⚖️", color:"#3b82f6" },
};

export default function DietPlanEditor({ mealPlan, saveMealPlan, targets, objetivo = "cutting" }) {
  // O plano agora é por objetivo: { cutting: [...], bulking: [...], manutencao: [...] }
  // Mas mantemos compatibilidade com { normal: [...], heavy: [...] }
  const [activeObj, setActiveObj] = useState(objetivo);
  const [meals, setMeals]         = useState([]);
  const [dirty, setDirty]         = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeFoodMeal, setActiveFoodMeal] = useState(null); // índice da refeição buscando alimento
  const [selectedFood, setSelectedFood]     = useState(null);
  const [foodQty, setFoodQty]               = useState("100");
  const [searching, setSearching]           = useState(false);
  const [showMealAdd, setShowMealAdd]       = useState(false);
  const [newMealName, setNewMealName]       = useState("");
  const [newMealTime, setNewMealTime]       = useState("08:00");

  // Carrega refeições do plano atual
  useEffect(() => {
    const plan = mealPlan?.[activeObj] || mealPlan?.normal || [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMeals(plan.map(m => ({ ...m, foods: m.foods?.map(f =>
      typeof f === "string" ? { name:f, qty:100, kcal:0, protein:0, carbs:0, fat:0 } : f
    ) || [] })));
     
    setDirty(false);
  }, [activeObj, mealPlan]);

  // Salva automaticamente quando dirty
  useEffect(() => {
    if (!dirty) return;
    const timeout = setTimeout(() => {
      const updated = { ...mealPlan, [activeObj]: meals };
      // Compat legada
      if (activeObj === "cutting")    updated.normal = meals;
      if (activeObj === "bulking")    updated.heavy  = meals;
      saveMealPlan(updated);
      setDirty(false);
    }, 800);
    return () => clearTimeout(timeout);
  }, [meals, dirty, activeObj, mealPlan, saveMealPlan]);

  // Busca de alimentos — local + Open Food Facts
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([]);
      return;
    }
    const local = COMMON_FOODS.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
    setSearchResults(local);
    // Busca remota (debounced)
    const t = setTimeout(async () => {
      try {
        setSearching(true);
        const r = await fetch(`/api/food-search?query=${encodeURIComponent(searchQuery)}`);
        const d = await r.json();
        if (d.foods?.length) {
          const remote = d.foods.filter(f => !local.some(l => l.name.toLowerCase() === f.name.toLowerCase()));
          setSearchResults([...local, ...remote.slice(0, 5)]);
        }
      } catch {} finally { setSearching(false); }
    }, 600);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const addMeal = () => {
    if (!newMealName.trim()) return;
    setMeals(prev => [...prev, { name: newMealName.trim(), time: newMealTime, kcal: 0, foods: [] }]);
    setNewMealName(""); setNewMealTime("08:00"); setShowMealAdd(false); setDirty(true);
  };

  const removeMeal = (idx) => {
    setMeals(prev => prev.filter((_,i) => i !== idx)); setDirty(true);
  };

  const updateMeal = (idx, field, val) => {
    setMeals(prev => prev.map((m,i) => i===idx ? {...m,[field]:val} : m)); setDirty(true);
  };

  const addFoodToMeal = (mealIdx, food, qty) => {
    const g    = parseFloat(qty) || 100;
    const mult = g / 100;
    const entry = {
      name:    food.name,
      qty:     g,
      kcal:    Math.round((food.kcal || 0) * mult),
      protein: parseFloat(((food.protein || 0)*mult).toFixed(1)),
      carbs:   parseFloat(((food.carbs   || 0)*mult).toFixed(1)),
      fat:     parseFloat(((food.fat     || 0)*mult).toFixed(1)),
    };
    setMeals(prev => prev.map((m,i) => i===mealIdx
      ? { ...m, foods:[...m.foods, entry], kcal: m.kcal + entry.kcal }
      : m
    ));
    setDirty(true);
    setSelectedFood(null); setSearchQuery(""); setSearchResults([]); setFoodQty("100");
  };

  const removeFoodFromMeal = (mealIdx, foodIdx) => {
    setMeals(prev => prev.map((m,i) => {
      if (i !== mealIdx) return m;
      const foods  = m.foods.filter((_,j) => j !== foodIdx);
      const kcal   = foods.reduce((a,f) => a + (f.kcal||0), 0);
      return { ...m, foods, kcal };
    }));
    setDirty(true);
  };

  // Totais do plano
  const planTotal = meals.reduce((acc, m) => ({
    kcal:    acc.kcal    + m.foods.reduce((a,f)=>a+(f.kcal||0),0),
    protein: acc.protein + m.foods.reduce((a,f)=>a+(f.protein||0),0),
    carbs:   acc.carbs   + m.foods.reduce((a,f)=>a+(f.carbs||0),0),
    fat:     acc.fat     + m.foods.reduce((a,f)=>a+(f.fat||0),0),
  }), {kcal:0,protein:0,carbs:0,fat:0});

  const tgt = targets || {};
  const objMeta = OBJECTIVE_LABELS[activeObj] || OBJECTIVE_LABELS.cutting;

  return (
    <div>
      {/* Seletor de objetivo */}
      <div style={{ display:"flex", gap:6, marginBottom:14, background:"rgba(255,255,255,0.04)", borderRadius:12, padding:3 }}>
        {Object.entries(OBJECTIVE_LABELS).map(([id, meta]) => (
          <button key={id} onClick={()=>setActiveObj(id)} style={{
            flex:1, padding:"8px 4px", borderRadius:9, border:"none", cursor:"pointer",
            fontSize:10, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
            background: activeObj===id ? meta.color : "none",
            color: activeObj===id ? "#fff" : "rgba(255,255,255,0.4)",
            transition:"all 0.15s",
          }}>{meta.label}</button>
        ))}
      </div>

      {/* Resumo de metas vs plano */}
      <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:14, padding:"12px 14px", marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:.7, marginBottom:8 }}>
          Plano {objMeta.label} · Total
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
          {[
            { label:"Kcal",  val:Math.round(planTotal.kcal),              tgt:tgt.kcal,    color:"#f97316" },
            { label:"Carb",  val:Math.round(planTotal.carbs),  unit:"g", tgt:tgt.carbs,   color:"#8b5cf6" },
            { label:"Prot",  val:Math.round(planTotal.protein),unit:"g", tgt:tgt.protein, color:"#3b82f6" },
            { label:"Gord",  val:Math.round(planTotal.fat),    unit:"g", tgt:tgt.fat,     color:"#f59e0b" },
          ].map(m => {
            const pct = m.tgt ? Math.min(Math.round((m.val/m.tgt)*100),120) : null;
            const over = pct && pct > 105;
            return (
              <div key={m.label} style={{ background:`${m.color}10`, borderRadius:10, padding:"8px 6px", textAlign:"center" }}>
                <div style={{ fontSize:14, fontWeight:800, color: over ? "#ef4444" : m.color }}>
                  {m.val}{m.unit||""}
                </div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginTop:1 }}>{m.label}</div>
                {pct !== null && (
                  <div style={{ fontSize:8, color: over?"#ef4444":"rgba(255,255,255,0.3)", marginTop:1 }}>{pct}%</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de refeições */}
      {meals.length === 0 && (
        <div style={{ textAlign:"center", padding:"24px 0", fontSize:12, color:"rgba(255,255,255,0.3)" }}>
          Nenhuma refeição. Adicione abaixo.
        </div>
      )}

      {meals.map((meal, mIdx) => {
        const mTotal = {
          kcal:    meal.foods.reduce((a,f)=>a+(f.kcal||0),0),
          protein: meal.foods.reduce((a,f)=>a+(f.protein||0),0),
          carbs:   meal.foods.reduce((a,f)=>a+(f.carbs||0),0),
          fat:     meal.foods.reduce((a,f)=>a+(f.fat||0),0),
        };
        const isActive = activeFoodMeal === mIdx;

        return (
          <div key={mIdx} className="card" style={{ padding:0, overflow:"hidden", marginBottom:10 }}>
            {/* Header da refeição */}
            <div style={{ padding:"12px 14px 10px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <Clock size={12} style={{ color:"rgba(255,255,255,0.35)", flexShrink:0 }}/>
                <input
                  type="time" value={meal.time||"08:00"}
                  onChange={e=>updateMeal(mIdx,"time",e.target.value)}
                  style={{ background:"none", border:"none", color:"rgba(255,255,255,0.5)", fontSize:11, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", outline:"none", width:54 }}
                />
                <input
                  type="text" value={meal.name}
                  onChange={e=>updateMeal(mIdx,"name",e.target.value)}
                  style={{ flex:1, background:"none", border:"none", color:"#fff", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", outline:"none" }}
                />
                <span style={{ fontSize:12, fontWeight:700, color:"#f97316", flexShrink:0 }}>
                  {Math.round(mTotal.kcal)} kcal
                </span>
                <button onClick={()=>removeMeal(mIdx)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.25)", cursor:"pointer", padding:2 }}>
                  <Trash2 size={13}/>
                </button>
              </div>
              {/* Macros mini */}
              <div style={{ display:"flex", gap:8, fontSize:10, color:"rgba(255,255,255,0.4)" }}>
                <span>C: {Math.round(mTotal.carbs)}g</span>
                <span>P: {Math.round(mTotal.protein)}g</span>
                <span>G: {Math.round(mTotal.fat)}g</span>
              </div>
            </div>

            {/* Alimentos */}
            {meal.foods.map((food, fIdx) => (
              <div key={fIdx} style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 14px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{food.name}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:1 }}>
                    {food.qty}g · P:{food.protein}g C:{food.carbs}g G:{food.fat}g
                  </div>
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:"#f97316", flexShrink:0 }}>{food.kcal} kcal</span>
                <button onClick={()=>removeFoodFromMeal(mIdx,fIdx)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.2)", cursor:"pointer", padding:2 }}>
                  <X size={12}/>
                </button>
              </div>
            ))}

            {/* Busca de alimento */}
            {isActive ? (
              <div style={{ padding:"10px 14px 12px" }}>
                <div style={{ position:"relative", marginBottom:8 }}>
                  <Search size={12} style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.3)" }}/>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Buscar alimento..."
                    value={searchQuery}
                    onChange={e=>{setSearchQuery(e.target.value);setSelectedFood(null);}}
                    style={{ paddingLeft:28, fontSize:12 }}
                  />
                </div>

                {/* Resultados */}
                {searchResults.length > 0 && !selectedFood && (
                  <div style={{ display:"flex", flexDirection:"column", gap:3, marginBottom:8 }}>
                    {searchResults.map((f,i)=>(
                      <button key={i} onClick={()=>{setSelectedFood(f);setSearchQuery(f.name);}}
                        style={{ padding:"8px 10px", borderRadius:9, border:"none", background:"rgba(255,255,255,0.06)", cursor:"pointer", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:12, color:"#fff", fontFamily:"'DM Sans',sans-serif" }}>{f.name}</span>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontFamily:"'DM Sans',sans-serif" }}>
                          {f.kcal} kcal · P:{f.protein}g
                        </span>
                      </button>
                    ))}
                    {searching && <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", textAlign:"center" }}>Buscando online...</div>}
                  </div>
                )}

                {/* Quantidade + Adicionar */}
                {selectedFood && (
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, fontWeight:600, marginBottom:4 }}>{selectedFood.name}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>
                        por {foodQty}g → {Math.round((selectedFood.kcal||0)*parseFloat(foodQty||0)/100)} kcal
                        · P:{((selectedFood.protein||0)*parseFloat(foodQty||0)/100).toFixed(1)}g
                      </div>
                    </div>
                    <input type="number" value={foodQty} onChange={e=>setFoodQty(e.target.value)}
                      style={{ width:60, textAlign:"center", fontSize:13, fontWeight:700 }}/>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>g</span>
                    <button onClick={()=>addFoodToMeal(mIdx,selectedFood,foodQty)}
                      className="btn btn-primary" style={{ padding:"8px 12px", fontSize:12, flexShrink:0 }}>
                      + Add
                    </button>
                  </div>
                )}

                <button onClick={()=>{setActiveFoodMeal(null);setSearchQuery("");setSelectedFood(null);setSearchResults([]);}}
                  style={{ marginTop:6, background:"none", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>
                  Fechar busca
                </button>
              </div>
            ) : (
              <button onClick={()=>{setActiveFoodMeal(mIdx);setSearchQuery("");setSelectedFood(null);}}
                style={{ width:"100%", background:"none", border:"none", cursor:"pointer", padding:"11px 14px", display:"flex", alignItems:"center", gap:6, color:"#f97316", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>
                <Plus size={14}/> Adicionar alimento
              </button>
            )}
          </div>
        );
      })}

      {/* Adicionar nova refeição */}
      {showMealAdd ? (
        <div className="card" style={{ padding:"12px 14px" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#f97316", marginBottom:10 }}>Nova Refeição</div>
          <input type="text" placeholder='Nome (ex: "Pré-treino", "Ceia"...)' value={newMealName}
            onChange={e=>setNewMealName(e.target.value)} style={{ marginBottom:8 }}/>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
            <Clock size={13} style={{ color:"rgba(255,255,255,0.4)" }}/>
            <input type="time" value={newMealTime} onChange={e=>setNewMealTime(e.target.value)}
              style={{ fontSize:13, padding:"8px 10px", flex:1 }}/>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{setShowMealAdd(false);setNewMealName("");}} className="btn btn-ghost" style={{ flex:1, fontSize:12, padding:10 }}>Cancelar</button>
            <button onClick={addMeal} className="btn btn-primary" style={{ flex:2, fontSize:12, padding:10 }}>Adicionar</button>
          </div>
        </div>
      ) : (
        <button onClick={()=>setShowMealAdd(true)}
          style={{ width:"100%", padding:"12px 14px", borderRadius:14, border:"1px dashed rgba(249,115,22,0.35)", background:"rgba(249,115,22,0.06)", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", color:"#f97316", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <Plus size={15}/> Nova refeição
        </button>
      )}

      {dirty && (
        <div style={{ textAlign:"center", fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:8 }}>
          Salvando automaticamente...
        </div>
      )}
    </div>
  );
}
