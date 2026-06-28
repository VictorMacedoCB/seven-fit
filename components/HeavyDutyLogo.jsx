"use client";

// Bigode chevron estilo Mike Mentzer — espesso, largo, divisão central natural
function MentzerMustache({ size = 100, color = "#f97316" }) {
  const w = size;
  const h = Math.round(size * 0.72);
  return (
    <svg width={w} height={h} viewBox="0 0 100 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* glow */}
      <ellipse cx="50" cy="55" rx="46" ry="14" fill={color} opacity="0.08"/>

      {/* lado esquerdo — camada superior */}
      <path d="M50 26 C45 24,36 22,26 22 C17 22,9 25,5 30 C2 34,2 39,5 43
        C9 47,16 47,24 44 C33 41,43 35,50 28 Z" fill="#c8850c"/>
      {/* lado esquerdo — volume */}
      <path d="M50 29 C43 33,33 38,23 43 C14 47,6 48,4 43 C3 48,4 54,10 57
        C17 60,27 59,37 55 C43 52,50 48,50 46 Z" fill="#a06208"/>

      {/* lado direito — camada superior */}
      <path d="M50 26 C55 24,64 22,74 22 C83 22,91 25,95 30 C98 34,98 39,95 43
        C91 47,84 47,76 44 C67 41,57 35,50 28 Z" fill="#c8850c"/>
      {/* lado direito — volume */}
      <path d="M50 29 C57 33,67 38,77 43 C86 47,94 48,96 43 C97 48,96 54,90 57
        C83 60,73 59,63 55 C57 52,50 48,50 46 Z" fill="#a06208"/>

      {/* divisão central (filtrum) */}
      <path d="M46 21 C48 24,49 27,50 29 C51 27,52 24,54 21"
        stroke="#0c0c14" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.65"/>

      {/* borda superior — linha de crescimento */}
      <path d="M26 22 C34 19,42 18,46 22"
        stroke="#e8a020" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round"/>
      <path d="M74 22 C66 19,58 18,54 22"
        stroke="#e8a020" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round"/>

      {/* pelos esquerda */}
      <path d="M46 22 C38 26,28 31,16 37" stroke="#7a4d02" strokeWidth="0.8" fill="none" opacity="0.55" strokeLinecap="round"/>
      <path d="M40 24 C30 29,20 35,9 41" stroke="#7a4d02" strokeWidth="0.7" fill="none" opacity="0.45" strokeLinecap="round"/>
      <path d="M30 28 C20 34,10 40,4 47" stroke="#7a4d02" strokeWidth="0.6" fill="none" opacity="0.38" strokeLinecap="round"/>

      {/* pelos direita */}
      <path d="M54 22 C62 26,72 31,84 37" stroke="#7a4d02" strokeWidth="0.8" fill="none" opacity="0.55" strokeLinecap="round"/>
      <path d="M60 24 C70 29,80 35,91 41" stroke="#7a4d02" strokeWidth="0.7" fill="none" opacity="0.45" strokeLinecap="round"/>
      <path d="M70 28 C80 34,90 40,96 47" stroke="#7a4d02" strokeWidth="0.6" fill="none" opacity="0.38" strokeLinecap="round"/>

      {/* highlight */}
      <path d="M27 23 C35 19,43 17,46 22" stroke="white" strokeWidth="1.2" fill="none" opacity="0.15" strokeLinecap="round"/>
      <path d="M73 23 C65 19,57 17,54 22" stroke="white" strokeWidth="1.2" fill="none" opacity="0.15" strokeLinecap="round"/>
    </svg>
  );
}

export default function HeavyDutyLogo({ size = 64, withText = false }) {
  return (
    <div style={{ display:"inline-flex", flexDirection:"column", alignItems:"center",
      gap: withText ? Math.round(size * 0.1) : 0, userSelect:"none" }}>
      <MentzerMustache size={size} />
      {withText && (
        <div style={{ textAlign:"center", lineHeight:1, letterSpacing:"-0.04em" }}>
          <span className="syne" style={{ fontSize:Math.round(size*0.38), fontWeight:900, color:"#ffffff" }}>Heavy</span>
          <span className="syne" style={{ fontSize:Math.round(size*0.38), fontWeight:900, color:"#f97316" }}>Duty</span>
          <span className="syne" style={{
            fontSize:Math.round(size*0.2), fontWeight:700,
            color:"rgba(255,255,255,0.38)", letterSpacing:"0.16em", marginLeft:3,
          }}>OS</span>
        </div>
      )}
    </div>
  );
}
