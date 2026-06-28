import React, { useState, useContext } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AppProvider, AppContext } from "./context/AppContext";
import DashboardTab from "./components/DashboardTab";
import DietTab from "./components/DietTab";
import WorkoutTab from "./components/WorkoutTab";
import ProgressTab from "./components/ProgressTab";
import SettingsTab from "./components/SettingsTab";
import { Compass, Apple, Dumbbell, BarChart2, Settings } from "lucide-react-native";

function AppContent() {
  const { isHydrated } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Seven Fit CuttingOS...</Text>
      </View>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab />;
      case "diet":
        return <DietTab />;
      case "workout":
        return <WorkoutTab />;
      case "progress":
        return <ProgressTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Active Screen Area */}
      <View style={styles.screenArea}>
        {renderActiveTab()}
      </View>

      {/* Tab Navigation Bar */}
      <View style={styles.tabBar}>
        {[
          { id: "dashboard", label: "Geral", icon: Compass },
          { id: "diet", label: "Dieta", icon: Apple },
          { id: "workout", label: "Treino", icon: Dumbbell },
          { id: "progress", label: "Progresso", icon: BarChart2 },
          { id: "settings", label: "Config", icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon size={20} color={isActive ? "#f97316" : "rgba(255,255,255,0.4)"} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06060c",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#06060c",
    alignItems: "center",
    justifyContent: "center",
    gap: 16
  },
  loadingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: "0.5px"
  },
  screenArea: {
    flex: 1,
  },
  tabBar: {
    height: 60,
    backgroundColor: "#0d0d15",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 4
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: "100%",
  },
  tabLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 4
  },
  tabLabelActive: {
    color: "#f97316",
    fontWeight: "700"
  }
});
