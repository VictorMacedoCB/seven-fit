"use client";

import React, { useEffect, useRef, useState } from "react";
import { Barcode, Camera as CameraIcon, AlertCircle } from "lucide-react";

/**
 * Escaneia código de barras usando a câmera do dispositivo.
 *
 * Antes usava a API nativa `BarcodeDetector`, que só existe no Chrome/Chromium em
 * Android (e olhe lá, dependendo da versão) — no Safari/iOS ela nunca existiu, então
 * o app caía direto na mensagem de "navegador incompatível" pra qualquer pessoa usando
 * iPhone, além de vários navegadores Android/desktop. Agora usa a biblioteca @zxing/browser
 * (JS puro, gratuita, roda em cima de getUserMedia + canvas), que funciona em praticamente
 * qualquer navegador moderno — Safari incluso. Só cai no aviso de "não suportado" se o
 * próprio getUserMedia não existir, o que é raro hoje em dia.
 */
export default function CameraBarcodeScanner({ onDetected }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | starting | scanning | unsupported | denied | error
  const lastCodeRef = useRef("");

  const supported =
    typeof window !== "undefined" &&
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const stop = () => {
    if (controlsRef.current) {
      try { controlsRef.current.stop(); } catch (e) { /* noop */ }
      controlsRef.current = null;
    }
  };

  const start = async () => {
    if (!supported) {
      setStatus("unsupported");
      return;
    }
    setStatus("starting");
    try {
      // Import dinâmico: mantém essas libs fora do bundle inicial, já que só são
      // necessárias quando o scanner de câmera é realmente aberto.
      const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
        import("@zxing/browser"),
        import("@zxing/library"),
      ]);

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.QR_CODE,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150 });

      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current,
        (result, err) => {
          if (result) {
            const value = result.getText();
            if (value && value !== lastCodeRef.current) {
              lastCodeRef.current = value;
              if (navigator.vibrate) navigator.vibrate(80);
              stop();
              onDetected && onDetected(value);
            }
          }
          // "err" dispara a cada frame sem código detectado (NotFoundException) —
          // isso é esperado e não deve ser tratado como falha.
        }
      );
      controlsRef.current = controls;
      setStatus("scanning");
    } catch (e) {
      setStatus(e && e.name === "NotAllowedError" ? "denied" : "error");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!supported || status === "unsupported") {
    return (
      <div style={boxStyle}>
        <Barcode size={48} style={{ color: "rgba(255,255,255,0.25)" }} />
        <span style={{ fontSize: "13px", textAlign: "center", padding: "0 20px", color: "rgba(255,255,255,0.4)" }}>
          Leitura por câmera não é suportada neste navegador.<br />Digite o código abaixo.
        </span>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div style={boxStyle}>
        <AlertCircle size={40} style={{ color: "#ef4444" }} />
        <span style={{ fontSize: "13px", textAlign: "center", padding: "0 20px", color: "rgba(255,255,255,0.4)" }}>
          Permissão de câmera negada. Ative o acesso à câmera nas configurações do navegador ou digite o código abaixo.
        </span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={boxStyle}>
        <AlertCircle size={40} style={{ color: "#ef4444" }} />
        <span style={{ fontSize: "13px", textAlign: "center", padding: "0 20px", color: "rgba(255,255,255,0.4)" }}>
          Não foi possível acessar a câmera. Digite o código abaixo.
        </span>
      </div>
    );
  }

  return (
    <div style={{ ...boxStyle, position: "relative", overflow: "hidden", padding: 0 }}>
      <video ref={videoRef} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "20px" }} />
      <div style={{
        position: "absolute", inset: "20%", border: "2px solid rgba(249,115,22,0.8)",
        borderRadius: "12px", boxShadow: "0 0 0 2000px rgba(0,0,0,0.35)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center",
        fontSize: "12px", color: "#fff", fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.8)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <CameraIcon size={13} /> {status === "starting" ? "Iniciando câmera..." : "Aponte para o código de barras"}
      </div>
    </div>
  );
}

const boxStyle = {
  flex: 1,
  background: "#111",
  margin: "0 20px",
  borderRadius: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  gap: "12px",
  color: "rgba(255,255,255,0.4)",
  minHeight: "220px",
};
