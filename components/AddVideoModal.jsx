"use client";
import { useState } from "react";
import { X, Link, CheckCircle2, AlertCircle } from "lucide-react";

const TOPIC_OPTIONS = [
  {id:"treino",    label:"Treino 🏋️"},
  {id:"dieta",     label:"Dieta 🥗"},
  {id:"cardio",    label:"Cardio 🏃"},
  {id:"suplemento",label:"Suplementos 💊"},
  {id:"descanso",  label:"Descanso 😴"},
  {id:"mentalidade",label:"Mentalidade 🧠"},
];

export default function AddVideoModal({ onClose }) {
  const [url,       setUrl]      = useState("");
  const [channel,   setChannel]  = useState("");
  const [title,     setTitle]    = useState("");
  const [topics,    setTopics]   = useState([]);
  const [loading,   setLoading]  = useState(false);
  const [result,    setResult]   = useState(null); // {ok, message, useScript}

  const toggleTopic = id => setTopics(t => t.includes(id)?t.filter(x=>x!==id):[...t,id]);

  const handleSubmit = async () => {
    if (!url.trim()||!channel.trim()||!title.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const groqKey = (typeof window !== "undefined" && localStorage.getItem("hdos_groq_key")) || "";
      const res = await fetch("/api/add-video",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          ...(groqKey ? { "x-groq-key": groqKey } : {}),
        },
        body:JSON.stringify({url:url.trim(),channel:channel.trim(),videoTitle:title.trim(),topics}),
      });
      const data = await res.json();
      setResult({ ok: res.ok && !data.useScript, message: data.message || data.error, useScript: data.useScript });
    } catch(e) {
      setResult({ok:false, message:e.message});
    } finally {
      setLoading(false);
    }
  };

  const handleBackdrop = e => { if(e.target===e.currentTarget) onClose(); };

  return (
    <div onClick={handleBackdrop} style={{
      position:"fixed",inset:0,zIndex:800,
      background:"rgba(0,0,0,0.85)",backdropFilter:"blur(7px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16,
    }}>
      <div style={{
        width:"100%",maxWidth:440,
        background:"linear-gradient(170deg,#15151f,#0c0c14)",
        border:"1px solid rgba(255,255,255,0.1)",
        borderRadius:24,overflow:"hidden",
        maxHeight:"88dvh",display:"flex",flexDirection:"column",
      }}>
        <div style={{padding:"14px 16px 12px",flexShrink:0,borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div className="syne" style={{fontSize:16,fontWeight:800}}>Treinar o Coach com Vídeo</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>Whisper Large v3 via Groq · Gratuito</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:10,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"rgba(255,255,255,0.7)"}}>
            <X size={15}/>
          </button>
        </div>

        <div style={{overflowY:"auto",flex:1,padding:"14px 16px 20px"}}>
          {!result ? (
            <>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:.7,marginBottom:6}}>Link do YouTube</div>
                <div style={{position:"relative"}}>
                  <Link size={13} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"rgba(255,255,255,0.3)"}}/>
                  <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." style={{paddingLeft:30,fontSize:13}}/>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:.7,marginBottom:6}}>Canal</div>
                  <input value={channel} onChange={e=>setChannel(e.target.value)} placeholder="Ex: Alberto Pereira" style={{fontSize:13}}/>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:.7,marginBottom:6}}>Título</div>
                  <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex: Cutting perfeito" style={{fontSize:13}}/>
                </div>
              </div>

              <div style={{marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:.7,marginBottom:7}}>Tópicos do vídeo</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {TOPIC_OPTIONS.map(t=>(
                    <button key={t.id} onClick={()=>toggleTopic(t.id)} style={{
                      padding:"6px 10px",borderRadius:9,border:"none",cursor:"pointer",
                      fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif",
                      background:topics.includes(t.id)?"rgba(249,115,22,0.2)":"rgba(255,255,255,0.05)",
                      color:topics.includes(t.id)?"#f97316":"rgba(255,255,255,0.45)",
                      border:topics.includes(t.id)?"1px solid rgba(249,115,22,0.35)":"1px solid rgba(255,255,255,0.07)",
                    }}>{t.label}</button>
                  ))}
                </div>
              </div>

              <div style={{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:"10px 12px",marginBottom:16,fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>
                ℹ️ O vídeo será baixado, transcrito com Whisper e adicionado à base de conhecimento do Coach automaticamente.
              </div>

              <button onClick={handleSubmit} disabled={loading||!url||!channel||!title}
                className="btn btn-primary"
                style={{width:"100%",padding:14,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:!url||!channel||!title?0.45:loading?0.7:1}}>
                {loading?(
                  <><div style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .6s linear infinite"}}/>Transcrevendo...</>
                ):(
                  <>🎙️ Transcrever e Treinar Coach</>
                )}
              </button>
            </>
          ) : (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,padding:"20px 0",textAlign:"center"}}>
              {result.ok ? (
                <CheckCircle2 size={44} style={{color:"#10b981"}}/>
              ) : (
                <AlertCircle size={44} style={{color:result.useScript?"#f97316":"#ef4444"}}/>
              )}
              <div style={{fontSize:14,fontWeight:700,color:result.ok?"#10b981":result.useScript?"#f97316":"#ef4444"}}>
                {result.ok?"Vídeo adicionado com sucesso!":result.useScript?"Ambiente serverless detectado":"Erro"}
              </div>
              {result.useScript ? (
                <div style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"12px 14px",fontSize:11,color:"rgba(255,255,255,0.7)",lineHeight:1.8,textAlign:"left",width:"100%"}}>
                  <div style={{fontWeight:700,marginBottom:6,color:"#f97316"}}>Use o script local:</div>
                  <div>1. Adicione o link em <code style={{color:"#f97316"}}>data/influencer-videos.json</code></div>
                  <div>2. <code style={{color:"#10b981"}}>node --env-file=.env.local scripts/transcribe-videos.mjs</code></div>
                  <div>3. <code style={{color:"#10b981"}}>node scripts/build-knowledge-base.mjs</code></div>
                  <div>4. Faça commit de <code style={{color:"#f97316"}}>data/knowledge-base.json</code></div>
                </div>
              ) : (
                <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>{result.message}</div>
              )}
              <button onClick={onClose} className="btn btn-primary" style={{width:"100%",padding:13,fontSize:13}}>Fechar</button>
            </div>
          )}
        </div>
        <style dangerouslySetInnerHTML={{__html:`@keyframes spin{to{transform:rotate(360deg)}}`}}/>
      </div>
    </div>
  );
}
