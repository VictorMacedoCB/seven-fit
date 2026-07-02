"use client";

import React, { useEffect, useRef, useState } from "react";
import { Barcode, Camera as CameraIcon, AlertCircle } from "lucide-react";

/**
 * Escaneia código de barras usando a câmera do dispositivo, via BarcodeDetector nativo
 * (suportado em Chrome/Android e navegadores baseados em Chromium). Em navegadores sem
 * suporte (ex: Safari/iOS mais antigo), cai graciosamente para o campo manual já existente.
 */
export default function CameraBarcodeScanner({ onDetected }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | starting | scanning | unsupported | denied | error
  const [lastCode, setLastCode] = useState("");

  const supported = typeof window !== "undefined" && "BarcodeDetector" in window;

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const start = async () => {
    if (!supported) {
      setStatus("unsupported");
      return;
    }
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("scanning");

      const detector = new window.BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
      });

      const tick = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes && codes.length > 0) {
            const value = codes[0].rawValue;
            if (value && value !== lastCode) {
              setLastCode(value);
              if (navigator.vibrate) navigator.vibrate(80);
              stop();
              onDetected && onDetected(value);
              return;
            }
          }
        } catch (e) { /* frame não decodificável, tenta o próximo */ }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
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
