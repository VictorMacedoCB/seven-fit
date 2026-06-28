"use client";

import React from "react";
import { LayoutDashboard, Utensils, Dumbbell, Camera, Settings } from "lucide-react";

export default function TabBar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "dashboard", label: "Dash",    icon: LayoutDashboard },
    { id: "diet",      label: "Dieta",   icon: Utensils        },
    { id: "workout",   label: "Treino",  icon: Dumbbell        },
    { id: "progress",  label: "Prog.",   icon: Camera          },
    { id: "settings",  label: "Config",  icon: Settings        },
  ];

  return (
    <div className="tab-bar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`tab-btn ${isActive ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.8}
              color={isActive ? "#f97316" : "rgba(255,255,255,0.55)"}
            />
            <small style={{ color: isActive ? "#f97316" : undefined }}>
              {tab.label}
            </small>
          </button>
        );
      })}
    </div>
  );
}
