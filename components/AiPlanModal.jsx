"use client";
import { useState } from "react";
import { X, Sparkles, CheckCircle2 } from "lucide-react";

const GOAL_OPTIONS = [
  { id:"hipertrofia", label:"Hipertrofia 📈", color:"#10b981" },
  { id:"forca",       label:"Força 🏋️",       color:"#3b82f6" },
  { id:"cutting",     label:"Cutting 🔥",      color:"#ef4444" },
  { id:"bulking",     label:"Bulking 💪",      color:"#f97316" },
];
const DAYS_OPTIONS = [2,3,4,5,6];

export default function AiPlanModal({ group, onClose, onApply, saveWorkoutPlan }) {
  const [goal, setGoal]       = useState("hipertrofia");
  const [days, setDays]       = useState(4);
  const [obs, setObs]         = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [applying, setApplying] = useState(false);

  const generate = async () => {
    setLoading(true);
    setResult(null);
    const groqKey = (typeof window !== "undefined" && localStorage.getItem("hdos_groq_key")) || "";
    try {
      const res = await fetch("/api/coach-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(groqKey ? { "x-groq-key": groqKey } : {}),
        },
        body: JSON.stringify({
          message: `Crie um plano de treino semanal COMPLETO para ${goal} com ${days} dias de treino por semana.
${obs ? `Observações: ${obs}` : ""}

Use nomes de exercícios em português do Brasil.
Máximo 6-7 exercícios por dia de treino.
Responda SOMENTE com JSON neste formato exato (sem texto fora do JSON):
{
  "semana": [
    { "dia": "Segunda", "tipo": "Push", "exercicios": ["Supino Reto", "Desenvolvimento com Halteres", "Crucifixo", "Elevação Lateral", "Tríceps Corda"] },
    { "dia": "Terça",   "tipo": "Pull", "exercicios": ["Puxada Frente", "Remada Curvada", "Remada Unilateral", "Rosca Direta", "Rosca Martelo"] },
    { "dia": "Quarta",  "tipo": "Descanso", "exercicios": [] },
    { "dia": "Quinta",  "tipo": "Legs", "exercicios": ["Agachamento Livre", "Leg Press", "Cadeira Extensora", "Mesa Flexora", "Panturrilha em Pé"] }
  ],
  "metodologia": "Breve descrição do método (1-2 frases)",
  "dica": "Uma dica baseada no Heavy Duty de Mentzer"
}`,
          history: [],
          userProfile: { objetivo: goal },
        }),
      });
      const data = await res.json();
      const match = data.reply?.match(/\{[\s\S]*\}/);
      if (match) {
        try { setResult(JSON.parse(match[0])); }
        catch { setResult({ raw: data.reply }); }
      } else {
        setResult({ raw: data.reply || "Sem resposta." });
      }
    } catch(e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const applyPlan = async () => {
    if (!result?.semana) return;
    setApplying(true);
    // Cria um plano no workoutPlans para cada dia de treino
    result.semana
      .filter(d => d.tipo !== "Descanso" && d.exercicios?.length)
      .forEach(d => {
        saveWorkoutPlan(d.tipo || d.dia, d.exercicios);
      });
    setApplying(false);
    onClose();
  };

  const handleBackdrop = e => { if (e.target === e.currentTarget) onClose(); };
  const goalMeta = GOAL_OPTIONS.find(g => g.id === goal);

  return (
    <div onClick={handleBackdrop} style={{
      position:"fixed",inset:0,zIndex:800,
      background:"rgba(0,0,0,0.88)",backdropFilter:"blur(7px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16,
    }}>
      <div style={{
        width:"100%",maxWidth:440,
        background:"linear-gradient(170deg,#15151f,#0c0c14)",
        border:"1px solid rgba(255,255,255,0.1)",
        borderRadius:24,overflow:"hidden",
        maxHeight:"90dvh",display:"flex",flexDirection:"column",
      }}>
        {/* Header */}
        <div style={{ padding:"14px 16px 12px",flexShrink:0,borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div>
            <div className="syne" style={{ fontSize:16,fontWeight:800 }}>
              <span style={{color:"#f97316"}}>✨</span> IA montar plano semanal
            </div>
            <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:2 }}>
              Baseado nos vídeos dos influenciadores treinados
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)",border:"none",borderRadius:10,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"rgba(255,255,255,0.7)" }}>
            <X size={15}/>
          </button>
        </div>

        <div style={{ overflowY:"auto",flex:1,padding:"14px 16px 20px" }}>
          {!result ? (
            <>
              {/* Objetivo */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:.7,marginBottom:7 }}>Objetivo</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
                  {GOAL_OPTIONS.map(g=>(
                    <button key={g.id} onClick={()=>setGoal(g.id)} style={{
                      padding:"9px 8px",borderRadius:10,border:"none",cursor:"pointer",
                      fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif",
                      background:goal===g.id?g.color+"22":"rgba(255,255,255,0.05)",
                      color:goal===g.id?g.color:"rgba(255,255,255,0.5)",
                      border:goal===g.id?`1px solid ${g.color}44`:"1px solid rgba(255,255,255,0.07)",
                    }}>{g.label}</button>
                  ))}
                </div>
              </div>

              {/* Dias */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:.7,marginBottom:7 }}>Dias de treino por semana</div>
                <div style={{ display:"flex",gap:6 }}>
                  {DAYS_OPTIONS.map(d=>(
                    <button key={d} onClick={()=>setDays(d)} style={{
                      flex:1,padding:"9px 4px",borderRadius:10,border:"none",cursor:"pointer",
                      fontSize:14,fontWeight:800,fontFamily:"'DM Sans',sans-serif",
                      background:days===d?goalMeta?.color+"22":"rgba(255,255,255,0.05)",
                      color:days===d?goalMeta?.color:"rgba(255,255,255,0.4)",
                      border:days===d?`1px solid ${goalMeta?.color}44`:"1px solid rgba(255,255,255,0.07)",
                    }}>{d}x</button>
                  ))}
                </div>
              </div>

              {/* Observações */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:.7,marginBottom:7 }}>
                  Observações <span style={{fontWeight:400,textTransform:"none",opacity:.6}}>(opcional)</span>
                </div>
                <textarea value={obs} onChange={e=>setObs(e.target.value)}
                  placeholder="Ex: não tenho máquinas, foco em compound, lesão no ombro..."
                  rows={2} style={{ width:"100%",fontSize:12,resize:"none" }}/>
              </div>

              <button onClick={generate} disabled={loading} className="btn btn-primary"
                style={{ width:"100%",padding:14,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:loading?.65:1 }}>
                {loading?(
                  <><div style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .6s linear infinite"}}/>Gerando plano...</>
                ):(
                  <><Sparkles size={16}/>Gerar Plano Semanal com IA</>
                )}
              </button>
            </>
          ) : result.error ? (
            <>
              <div style={{ color:"#ef4444",fontSize:13,textAlign:"center",padding:"16px 0",lineHeight:1.6 }}>{result.error}</div>
              <button onClick={()=>setResult(null)} className="btn btn-ghost" style={{ width:"100%",fontSize:13,padding:12 }}>Tentar novamente</button>
            </>
          ) : result.raw ? (
            <>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.7)",lineHeight:1.7,whiteSpace:"pre-wrap",background:"rgba(255,255,255,0.03)",borderRadius:12,padding:12 }}>{result.raw}</div>
              <button onClick={()=>setResult(null)} className="btn btn-ghost" style={{ width:"100%",marginTop:10,fontSize:13,padding:12 }}>Tentar novamente</button>
            </>
          ) : (
            <>
              {/* Metodologia */}
              {(result.metodologia || result.dica) && (
                <div style={{ background:"rgba(249,115,22,0.07)",border:"1px solid rgba(249,115,22,0.18)",borderRadius:12,padding:"10px 12px",marginBottom:12 }}>
                  {result.metodologia && <div style={{ fontSize:12,color:"rgba(255,255,255,0.8)",lineHeight:1.55,marginBottom:result.dica?6:0 }}>{result.metodologia}</div>}
                  {result.dica && <div style={{ fontSize:11,color:"#f97316",fontStyle:"italic" }}>💡 {result.dica}</div>}
                </div>
              )}

              {/* Semana */}
              <div style={{ display:"flex",flexDirection:"column",gap:7,marginBottom:14 }}>
                {(result.semana||[]).map((dia,i)=>(
                  <div key={i} style={{
                    background: dia.tipo==="Descanso"?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.05)",
                    border:`1px solid ${dia.tipo==="Descanso"?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.1)"}`,
                    borderRadius:14,padding:"11px 13px",
                    opacity: dia.tipo==="Descanso"?.5:1,
                  }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:dia.exercicios?.length?7:0 }}>
                      <span style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",minWidth:60 }}>{dia.dia}</span>
                      <span style={{ fontSize:12,fontWeight:800,color:dia.tipo==="Descanso"?"rgba(255,255,255,0.3)":"#f97316" }}>{dia.tipo}</span>
                    </div>
                    {dia.exercicios?.length>0 && (
                      <div style={{ display:"flex",flexWrap:"wrap",gap:"3px 6px" }}>
                        {dia.exercicios.map((ex,j)=>(
                          <span key={j} style={{ fontSize:10,color:"rgba(255,255,255,0.65)",background:"rgba(255,255,255,0.05)",borderRadius:5,padding:"2px 7px" }}>{ex}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display:"flex",gap:8 }}>
                <button onClick={()=>setResult(null)} className="btn btn-ghost" style={{ flex:1,fontSize:13,padding:11 }}>
                  Refazer
                </button>
                <button onClick={applyPlan} disabled={applying} className="btn btn-primary"
                  style={{ flex:2,fontSize:13,padding:11,display:"flex",alignItems:"center",justifyContent:"center",gap:7 }}>
                  <CheckCircle2 size={15}/>
                  {applying?"Aplicando...":"Aplicar ao App"}
                </button>
              </div>
            </>
          )}
        </div>
        <style dangerouslySetInnerHTML={{__html:`@keyframes spin{to{transform:rotate(360deg)}}`}}/>
      </div>
    </div>
  );
}
