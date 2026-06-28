import React from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";

function MentzerMustache({ color = "#f97316", size = 30 }) {
  const h = Math.round(size * 0.72);
  return (
    <svg width={size} height={h} viewBox="0 0 100 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 26 C45 24,36 22,26 22 C17 22,9 25,5 30 C2 34,2 39,5 43 C9 47,16 47,24 44 C33 41,43 35,50 28 Z" fill="#c8850c"/>
      <path d="M50 29 C43 33,33 38,23 43 C14 47,6 48,4 43 C3 48,4 54,10 57 C17 60,27 59,37 55 C43 52,50 48,50 46 Z" fill="#a06208"/>
      <path d="M50 26 C55 24,64 22,74 22 C83 22,91 25,95 30 C98 34,98 39,95 43 C91 47,84 47,76 44 C67 41,57 35,50 28 Z" fill="#c8850c"/>
      <path d="M50 29 C57 33,67 38,77 43 C86 47,94 48,96 43 C97 48,96 54,90 57 C83 60,73 59,63 55 C57 52,50 48,50 46 Z" fill="#a06208"/>
      <path d="M46 21 C48 24,49 27,50 29 C51 27,52 24,54 21" stroke="#0c0c14" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.65"/>
      <path d="M27 23 C35 19,43 17,46 22" stroke="#e8a020" strokeWidth="1.4" fill="none" opacity="0.35" strokeLinecap="round"/>
      <path d="M73 23 C65 19,57 17,54 22" stroke="#e8a020" strokeWidth="1.4" fill="none" opacity="0.35" strokeLinecap="round"/>
    </svg>
  );
}

export default function Header({ todaySched, user, isSyncing }) {
  const getFormattedDate = () => new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long"
  });
  const schedColor = todaySched?.color || "#f97316";

  return (
    <div style={{ padding: "28px 20px 4px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", fontWeight: "500", textTransform: "capitalize" }}>
            {getFormattedDate()}
          </span>
          {isSyncing && (
            <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", background:"rgba(249,115,22,0.14)", border:"1px solid rgba(249,115,22,0.25)", color:"#f97316", borderRadius:"99px", padding:"2px 8px", fontSize:"9px", fontWeight:"700" }}>
              <RefreshCw size={9} style={{ animation: "spin 1s linear infinite" }}/> SINCRONIZANDO
            </span>
          )}
          {!isSyncing && user && (
            <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.22)", color:"#10b981", borderRadius:"99px", padding:"2px 8px", fontSize:"9px", fontWeight:"700" }}>
              <Cloud size={9}/> NUVEM ATIVA
            </span>
          )}
          {!isSyncing && !user && (
            <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.35)", borderRadius:"99px", padding:"2px 8px", fontSize:"9px", fontWeight:"700" }}>
              <CloudOff size={9}/> VISITANTE
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MentzerMustache color={schedColor} size={32} />
          <div className="syne" style={{ fontSize: "24px", fontWeight: "900", letterSpacing: "-0.8px", lineHeight: 1.1 }}>
            <span style={{ color: "#ffffff" }}>Heavy</span>
            <span style={{ color: schedColor, filter: `drop-shadow(0 0 8px ${schedColor}88)` }}>Duty</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", marginLeft: "4px" }}>OS</span>
          </div>
        </div>
      </div>
      {todaySched && (
        <div style={{ background:`${schedColor}18`, border:`1px solid ${schedColor}35`, borderRadius:"14px", padding:"9px 14px", fontSize:"11px", fontWeight:"700", color:schedColor, maxWidth:"130px", textAlign:"center", lineHeight:1.3 }}>
          {todaySched.type}
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }}/>
    </div>
  );
}
