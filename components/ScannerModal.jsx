"use client";

import React, { useState, useEffect } from "react";
import { Camera, X, Search, Barcode, FileText, AlertCircle, Image as IconImage, Sparkles } from "lucide-react";
import NextImage from 'next/image';
import CameraBarcodeScanner from "@/components/CameraBarcodeScanner";

export default function ScannerModal({ isOpen, onClose, onFoodScanned, allFoods = [], initialTab = "barcode" }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Barcode tab states
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeError, setBarcodeError] = useState("");
  const [isBarcodeLoading, setIsBarcodeLoading] = useState(false);

  // Label tab states
  const [labelName, setLabelName] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isLabelLoading, setIsLabelLoading] = useState(false);
  const [labelStatus, setLabelStatus] = useState("");
  const [labelStatusColor, setLabelStatusColor] = useState("rgba(255,255,255,0.5)");

  // Search tab states
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [modalOnlineFoods, setModalOnlineFoods] = useState([]);
  const [isModalSearching, setIsModalSearching] = useState(false);

  // Sync activeTab with initialTab when modal opens
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(initialTab);
       
      setBarcodeError("");
       
      setBarcodeInput("");
       
      setModalSearchQuery("");
       
      setModalOnlineFoods([]);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!modalSearchQuery || modalSearchQuery.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setModalOnlineFoods([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsModalSearching(true);
      try {
        const response = await fetch(`/api/food-search?query=${encodeURIComponent(modalSearchQuery)}`);
        const data = await response.json();
        if (response.ok && data.success) {
          setModalOnlineFoods(data.foods);
        }
      } catch (err) {
        console.error("Modal online search error:", err);
      } finally {
        setIsModalSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [modalSearchQuery]);

  const filteredLocalFoods = modalSearchQuery
    ? allFoods.filter((f) => f.name.toLowerCase().includes(modalSearchQuery.toLowerCase())).slice(0, 5)
    : [];

  const handleSelectFood = (food) => {
    onFoodScanned(food);
    // Reset and close
    setModalSearchQuery("");
    setModalOnlineFoods([]);
    onClose();
  };

  if (!isOpen) return null;

  const handleBarcodeSearch = async (explicitCode) => {
    const code = (explicitCode !== undefined ? String(explicitCode) : barcodeInput).trim();
    if (!code) {
      setBarcodeError("Digite o código de barras.");
      return;
    }
    setBarcodeError("");
    setIsBarcodeLoading(true);

    try {
      const response = await fetch(`/api/barcode?code=${code}`);
      const data = await response.json();

      if (response.ok && data.success) {
        onFoodScanned(data.food);
        // Reset states and close modal
        setBarcodeInput("");
        onClose();
      } else {
        setBarcodeError(data.error || "Produto não encontrado.");
      }
    } catch (e) {
      setBarcodeError("Erro de conexão ao buscar produto.");
    } finally {
      setIsBarcodeLoading(false);
    }
  };

  const handleLabelPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
      setLabelStatus("");
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeLabel = async () => {
    if (!imagePreview) return;
    setIsLabelLoading(true);
    setLabelStatusColor("rgba(255,255,255,0.5)");
    setLabelStatus("Enviando imagem para análise com Claude Vision...");

    try {
      const response = await fetch("/api/analyze-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imagePreview,
          customName: labelName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onFoodScanned(data.food);
        // Reset states and close
        setLabelName("");
        setImagePreview(null);
        setLabelStatus("");
        onClose();
      } else {
        throw new Error(data.error || "Erro ao analisar imagem.");
      }
    } catch (e) {
      setLabelStatusColor("#ef4444");
      setLabelStatus(e.message || "Erro ao analisar. Tente uma foto mais nítida da tabela.");
    } finally {
      setIsLabelLoading(false);
    }
  };

  const isSearchActive = activeTab === "search";
  const isBarcodeActive = activeTab === "barcode";
  const isLabelActive = activeTab === "label";
 
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.97)",
        zIndex: 500,
        display: "flex",
        flexDirection: "column",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      {/* HEADER */}
      <div className="row-sb" style={{ padding: "calc(20px + env(safe-area-inset-top, 0px)) 20px 10px" }}>
        <div className="syne" style={{ fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
          <Camera size={18} /> Buscar Alimento
        </div>
        <button
          className="btn btn-ghost"
          style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px" }}
          onClick={() => {
            // reset and close
            setBarcodeInput("");
            setLabelName("");
            setImagePreview(null);
            setBarcodeError("");
            setLabelStatus("");
            setModalSearchQuery("");
            onClose();
          }}
        >
          <X size={16} /> Fechar
        </button>
      </div>
 
      {/* SCANNER SUB-TABS (Three tabs) */}
      <div style={{ display: "flex", gap: "6px", padding: "0 20px 12px" }}>
        <button
          onClick={() => setActiveTab("search")}
          style={{
            flex: 1,
            padding: "9px 0",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: "700",
            fontFamily: "'DM Sans',sans-serif",
            background: isSearchActive ? "#f97316" : "rgba(255,255,255,0.08)",
            color: isSearchActive ? "#fff" : "rgba(255,255,255,0.5)",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px"
          }}
        >
          <Search size={12} /> Nome
        </button>
        <button
          onClick={() => setActiveTab("barcode")}
          style={{
            flex: 1,
            padding: "9px 0",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: "700",
            fontFamily: "'DM Sans',sans-serif",
            background: isBarcodeActive ? "#f97316" : "rgba(255,255,255,0.08)",
            color: isBarcodeActive ? "#fff" : "rgba(255,255,255,0.5)",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px"
          }}
        >
          <Barcode size={12} /> Código de Barras
        </button>
        <button
          onClick={() => setActiveTab("label")}
          style={{
            flex: 1,
            padding: "9px 0",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: "700",
            fontFamily: "'DM Sans',sans-serif",
            background: isLabelActive ? "#f97316" : "rgba(255,255,255,0.08)",
            color: isLabelActive ? "#fff" : "rgba(255,255,255,0.5)",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px"
          }}
        >
          <FileText size={12} /> Tabela Nutricional
        </button>
      </div>

      {/* SEARCH BY NAME PANEL */}
      {isSearchActive && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "0 20px 10px" }}>
            <input
              type="text"
              placeholder="🔍 Buscar alimento por nome..."
              value={modalSearchQuery}
              onChange={(e) => setModalSearchQuery(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
            {modalSearchQuery && (
              <div
                style={{
                  background: "rgba(18,18,28,0.99)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.4)",
                }}
              >
                {/* Local Foods Section */}
                {filteredLocalFoods.length > 0 && (
                  <div>
                    <div className="small" style={{ padding: "10px 16px 6px", background: "rgba(255,255,255,0.02)", textTransform: "uppercase", fontSize: "9px", letterSpacing: "0.5px" }}>
                      Alimentos Locais
                    </div>
                    {filteredLocalFoods.map((f) => (
                      <div key={f.id} className="ex-item" onClick={() => handleSelectFood(f)}>
                        <span>{f.name}</span>
                        <span className="small" style={{ flexShrink: 0, marginLeft: "8px" }}>
                          {f.kcal} kcal/{f.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Online Foods Section */}
                {modalOnlineFoods.length > 0 && (
                  <div>
                    <div className="small" style={{ padding: "10px 16px 6px", background: "rgba(255,255,255,0.02)", textTransform: "uppercase", fontSize: "9px", letterSpacing: "0.5px", color: "#f97316" }}>
                      Busca na Nuvem 🌐
                    </div>
                    {modalOnlineFoods
                      .filter((of) => !filteredLocalFoods.some((lf) => lf.name.toLowerCase() === of.name.toLowerCase()))
                      .slice(0, 8)
                      .map((f) => (
                        <div key={f.id} className="ex-item" onClick={() => handleSelectFood(f)}>
                          <span>{f.name}</span>
                          <span className="small" style={{ flexShrink: 0, marginLeft: "8px" }}>
                            {f.kcal} kcal/{f.unit}
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Searching online loader */}
                {isModalSearching && (
                  <div style={{ padding: "14px 16px", fontSize: "12px", color: "rgba(255,255,255,0.4)", display: "flex", gap: "8px", alignItems: "center" }}>
                    <div style={{ width: "12px", height: "12px", border: "2px solid rgba(255,255,255,0.05)", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                    <span>Buscando na nuvem...</span>
                  </div>
                )}

                {/* No results placeholder */}
                {filteredLocalFoods.length === 0 && modalOnlineFoods.length === 0 && !isModalSearching && (
                  <div style={{ padding: "20px", fontSize: "13px", color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
                    Nenhum alimento encontrado com esse nome.
                  </div>
                )}
              </div>
            )}

            {!modalSearchQuery && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px 20px",
                  gap: "12px",
                  color: "rgba(255,255,255,0.35)",
                  textAlign: "center"
                }}
              >
                <Search size={40} style={{ color: "rgba(255,255,255,0.25)" }} />
                <div style={{ fontSize: "13px", lineHeight: "1.45" }}>
                  Busque por qualquer alimento para ver as calorias e macronutrientes correspondentes.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
 
      {/* BARCODE PANEL */}
      {isBarcodeActive && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <CameraBarcodeScanner
            onDetected={(code) => {
              setBarcodeInput(code);
              handleBarcodeSearch(code);
            }}
          />
          <div style={{ padding: "20px" }}>
            <div className="label" style={{ marginBottom: "8px" }}>
              Ou digite o código de barras
            </div>
            <div className="row" style={{ gap: "10px" }}>
              <input
                type="number"
                placeholder="Ex: 7891000315507"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBarcodeSearch()}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                style={{ flexShrink: 0 }}
                onClick={() => handleBarcodeSearch()}
                disabled={isBarcodeLoading}
              >
                {isBarcodeLoading ? "Buscando..." : "Buscar"}
              </button>
            </div>
            {barcodeError && (
              <div style={{ 
                marginTop: "16px",
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                <div style={{ color: "#ef4444", fontSize: "13px", lineHeight: "1.45", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertCircle size={14} /> {barcodeError}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => {
                      setActiveTab("label");
                      setBarcodeError("");
                    }}
                    style={{
                      background: "#f97316",
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <FileText size={12} /> Fotografar Tabela
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("search");
                      setBarcodeError("");
                    }}
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      color: "#fff",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <Search size={12} /> Buscar por Nome
                  </button>
                </div>
              </div>
            )}
            <div className="small" style={{ marginTop: "10px" }}>
              Powered by Open Food Facts
            </div>
          </div>
        </div>
      )}
 
      {/* NUTRITIONAL LABEL PANEL */}
      {isLabelActive && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              flex: 1,
              background: "#111",
              margin: "0 20px",
              borderRadius: "20px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "12px",
              color: "rgba(255,255,255,0.4)",
              minHeight: "160px",
            }}
          >
            {imagePreview ? (
              <NextImage src={imagePreview} alt="Tabela Nutricional" width={800} height={600} style={{ width: "100%", height: "100%", objectFit: "contain" }} unoptimized />
            ) : (
              <>
                <FileText size={48} style={{ color: "rgba(255,255,255,0.25)" }} />
                <span style={{ fontSize: "13px", textAlign: "center", padding: "0 20px" }}>
                  Tire foto da tabela nutricional
                </span>
              </>
            )}
          </div>
          <div style={{ padding: "20px" }}>
            <div className="label" style={{ marginBottom: "6px" }}>
              Nome do produto (Opcional)
            </div>
            <input
              placeholder="Ex: Aveia Quaker"
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              style={{ marginBottom: "12px" }}
            />
            <div className="row" style={{ gap: "10px", marginBottom: "12px" }}>
              <label
                style={{
                  flex: 1,
                  background: "#f97316",
                  borderRadius: "12px",
                  padding: "12px 0",
                  textAlign: "center",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  color: "#fff",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                <Camera size={14} /> Fotografar
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={handleLabelPhoto}
                />
              </label>
              <label
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  padding: "12px 0",
                  textAlign: "center",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  color: "#fff",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                <IconImage size={14} /> Galeria
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleLabelPhoto} />
              </label>
            </div>
            {imagePreview && (
              <button
                className="btn btn-primary"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                onClick={handleAnalyzeLabel}
                disabled={isLabelLoading}
              >
                {isLabelLoading ? "Analisando..." : <><Sparkles size={16} /> Analisar com IA</>}
              </button>
            )}
            {labelStatus && (
              <div style={{ marginTop: "10px", fontSize: "13px", color: labelStatusColor, textAlign: "center" }}>
                {labelStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
