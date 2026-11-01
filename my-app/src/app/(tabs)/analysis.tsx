import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { getToken } from "../../lib/auth";
import { useAppTheme } from "../../context/ThemeContext";
import CustomAlertModal, { AlertType } from "../../components/CustomAlertModal";
import { API_BASE } from "../../config";

interface FeatureExplanation {
  feature: string;
  label: string;
  patient_value: number;
  unit: string;
  shap_value: number;
  direction: "INCREASES_RISK" | "REDUCES_RISK";
  clinical_note: string;
}

interface ShapResponse {
  patient_id: string;
  base_risk: number;
  final_predicted_risk: number;
  local_explanations: FeatureExplanation[];
}

interface PatientRecord {
  id: number;
  age?: number;
  sex?: number;
  trestbps?: number;
  chol?: number;
  thalach?: number;
  fbs?: number;
  cp?: number;
  restecg?: number;
  exang?: number;
  oldpeak?: number;
  slope?: number;
  ca?: number;
  thal?: number;
  prediction_code?: number;
  risk_score?: number;
}

const DEFAULT_VITALS = {
  age: 55,
  sex: 1,
  cp: 0,
  trestbps: 130,
  chol: 240,
  fbs: 0,
  restecg: 0,
  thalach: 145,
  exang: 0,
  oldpeak: 1.2,
  slope: 1,
  ca: 0,
  thal: 2,
};

export default function AnalysisScreen() {
  const { width } = useWindowDimensions();
  const { isDark } = useAppTheme();
  const isTablet = width >= 768 || (Platform.OS === "ios" && Boolean((Platform as any).isPad));

  const [history, setHistory] = useState<PatientRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<number | "custom">("custom");
  const [currentVitals, setCurrentVitals] = useState({ ...DEFAULT_VITALS });
  const [shapData, setShapData] = useState<ShapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: AlertType;
  }>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const runShapAnalysis = useCallback(
    async (vitalsToUse: typeof DEFAULT_VITALS, patientId = "LIVE_PATIENT") => {
      setAnalyzing(true);
      setError("");
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE}/feature-importances`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            patient_id: String(patientId),
            patient_data: vitalsToUse,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Unable to compute SHAP attributions.");
        }

        const data: ShapResponse = await res.json();
        setShapData(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error generating SHAP explanation.");
      } finally {
        setAnalyzing(false);
        setLoading(false);
      }
    },
    []
  );

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (token) {
        const historyRes = await fetch(`${API_BASE}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (historyRes.ok) {
          const historyData: PatientRecord[] = await historyRes.json();
          setHistory(historyData);

          if (historyData.length > 0) {
            const latest = historyData[0];
            setSelectedRecordId(latest.id);
            const vitals = {
              age: latest.age ?? DEFAULT_VITALS.age,
              sex: latest.sex ?? DEFAULT_VITALS.sex,
              cp: latest.cp ?? DEFAULT_VITALS.cp,
              trestbps: latest.trestbps ?? DEFAULT_VITALS.trestbps,
              chol: latest.chol ?? DEFAULT_VITALS.chol,
              fbs: latest.fbs ?? DEFAULT_VITALS.fbs,
              restecg: latest.restecg ?? DEFAULT_VITALS.restecg,
              thalach: latest.thalach ?? DEFAULT_VITALS.thalach,
              exang: latest.exang ?? DEFAULT_VITALS.exang,
              oldpeak: latest.oldpeak ?? DEFAULT_VITALS.oldpeak,
              slope: latest.slope ?? DEFAULT_VITALS.slope,
              ca: latest.ca ?? DEFAULT_VITALS.ca,
              thal: latest.thal ?? DEFAULT_VITALS.thal,
            };
            setCurrentVitals(vitals);
            await runShapAnalysis(vitals, String(latest.id));
            return;
          }
        }
      }
      setSelectedRecordId("custom");
      setCurrentVitals({ ...DEFAULT_VITALS });
      await runShapAnalysis(DEFAULT_VITALS, "BASELINE");
    } catch {
      await runShapAnalysis(DEFAULT_VITALS, "BASELINE");
    } finally {
      setLoading(false);
    }
  }, [runShapAnalysis]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, [loadInitialData]);

  const handleRecordSelect = (id: number | "custom") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRecordId(id);
    if (id === "custom") {
      setCurrentVitals({ ...DEFAULT_VITALS });
      runShapAnalysis(DEFAULT_VITALS, "BASELINE");
    } else {
      const rec = history.find((h) => h.id === id);
      if (rec) {
        const vitals = {
          age: rec.age ?? DEFAULT_VITALS.age,
          sex: rec.sex ?? DEFAULT_VITALS.sex,
          cp: rec.cp ?? DEFAULT_VITALS.cp,
          trestbps: rec.trestbps ?? DEFAULT_VITALS.trestbps,
          chol: rec.chol ?? DEFAULT_VITALS.chol,
          fbs: rec.fbs ?? DEFAULT_VITALS.fbs,
          restecg: rec.restecg ?? DEFAULT_VITALS.restecg,
          thalach: rec.thalach ?? DEFAULT_VITALS.thalach,
          exang: rec.exang ?? DEFAULT_VITALS.exang,
          oldpeak: rec.oldpeak ?? DEFAULT_VITALS.oldpeak,
          slope: rec.slope ?? DEFAULT_VITALS.slope,
          ca: rec.ca ?? DEFAULT_VITALS.ca,
          thal: rec.thal ?? DEFAULT_VITALS.thal,
        };
        setCurrentVitals(vitals);
        runShapAnalysis(vitals, String(rec.id));
      }
    }
  };

  const handleEmailReport = async () => {
    setSendingEmail(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required.");

      const res = await fetch(`${API_BASE}/email-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(currentVitals),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Unable to send email report.");
      }

      setAlertConfig({
        visible: true,
        title: "Report Delivered",
        message: "Your diagnostic SHAP assessment report has been securely emailed to your account.",
        type: "success",
      });
    } catch (e) {
      setAlertConfig({
        visible: true,
        title: "Email Dispatch Failed",
        message: e instanceof Error ? e.message : "An unexpected error occurred while dispatching the report.",
        type: "error",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Top escalators & protective factors
  const topEscalators = useMemo(() => {
    if (!shapData) return [];
    return shapData.local_explanations
      .filter((e) => e.direction === "INCREASES_RISK")
      .sort((a, b) => b.shap_value - a.shap_value)
      .slice(0, 3);
  }, [shapData]);

  const topProtective = useMemo(() => {
    if (!shapData) return [];
    return shapData.local_explanations
      .filter((e) => e.direction === "REDUCES_RISK")
      .sort((a, b) => a.shap_value - b.shap_value)
      .slice(0, 3);
  }, [shapData]);

  const maxAbsShap = shapData?.local_explanations.length
    ? Math.max(...shapData.local_explanations.map((e) => Math.abs(e.shap_value)), 0.1)
    : 1.0;

  const basePercent = shapData ? Math.round(shapData.base_risk * 100) : 45;
  const riskPercent = shapData ? Math.round(shapData.final_predicted_risk * 100) : 50;

  const getRiskBadge = (percent: number) => {
    if (percent >= 70) return { label: "High Risk", bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-800" };
    if (percent >= 40) return { label: "Moderate Risk", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" };
    return { label: "Low Risk", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" };
  };

  const riskBadge = getRiskBadge(riskPercent);

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA] dark:bg-black justify-center items-center">
        <ActivityIndicator size="large" color={isDark ? "#ffffff" : "#000000"} />
        <Text className="mt-4 text-neutral-500 dark:text-neutral-400 font-semibold">Computing Feature Importances...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} className="flex-1 bg-[#F8F9FA] dark:bg-black">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 16, maxWidth: 960, width: "100%", alignSelf: "center" }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Card */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View className="p-5 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="px-2.5 py-1 bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.08] rounded-full flex-row items-center gap-1.5">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <Text className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  SHAP EXPLAINABILITY
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleEmailReport}
                disabled={sendingEmail}
                className={`px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5 ${sendingEmail ? "bg-neutral-300 dark:bg-neutral-700" : "bg-neutral-950 dark:bg-white"}`}
              >
                {sendingEmail ? (
                  <ActivityIndicator size="small" color="#94a3b8" />
                ) : (
                  <Text className="text-xs font-bold text-white dark:text-black">Email PDF</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text className="text-2xl font-black text-neutral-950 dark:text-white tracking-tight">
              Biomarker Attribution
            </Text>
            <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Deconstruct clinical outputs with patient-level Shapley value contributions and actionable guidance.
            </Text>
          </View>
        </Animated.View>

        {/* Screening Selector Bar */}
        <View className="mb-4">
          <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
            SELECT SCREENING PATIENT
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleRecordSelect("custom")}
              className={`px-4 py-2 rounded-full border mr-2 ${
                selectedRecordId === "custom"
                  ? "bg-neutral-950 border-neutral-950 dark:bg-white dark:border-white"
                  : "bg-white dark:bg-[#0a0a0a] border-neutral-200/80 dark:border-white/[0.08]"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  selectedRecordId === "custom"
                    ? "text-white dark:text-black"
                    : "text-neutral-700 dark:text-neutral-300"
                }`}
              >
                Standard Baseline (55y)
              </Text>
            </TouchableOpacity>

            {history.map((rec) => {
              const isSelected = selectedRecordId === rec.id;
              return (
                <TouchableOpacity
                  key={rec.id}
                  onPress={() => handleRecordSelect(rec.id)}
                  className={`px-4 py-2 rounded-full border mr-2 ${
                    isSelected
                      ? "bg-neutral-950 border-neutral-950 dark:bg-white dark:border-white"
                      : "bg-white dark:bg-[#0a0a0a] border-neutral-200/80 dark:border-white/[0.08]"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected
                        ? "text-white dark:text-black"
                        : "text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    Screening #{rec.id} ({rec.age ?? 55}y)
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Error Notification */}
        {error ? (
          <Animated.View entering={FadeIn.duration(300)} className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl flex-row justify-between items-center">
            <Text className="text-sm text-red-600 dark:text-red-400 flex-1">{error}</Text>
            <TouchableOpacity onPress={() => loadInitialData()} className="ml-2 bg-white dark:bg-black px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800">
              <Text className="text-red-700 dark:text-red-400 font-bold text-xs">Retry</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : null}

        {/* KPI Summary Cards & Highlights */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white dark:bg-[#0a0a0a] rounded-2xl p-4 border border-neutral-200/80 dark:border-white/[0.08]">
              <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                Baseline Risk
              </Text>
              <Text className="text-2xl font-black text-neutral-950 dark:text-white font-mono">{basePercent}%</Text>
              <Text className="text-[10px] text-neutral-400 mt-0.5">Cohort Average</Text>
            </View>

            <View className="flex-1 bg-white dark:bg-[#0a0a0a] rounded-2xl p-4 border border-neutral-200/80 dark:border-white/[0.08]">
              <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                Predicted Risk
              </Text>
              <View className="flex-row items-center flex-wrap gap-1.5">
                <Text className="text-2xl font-black text-neutral-950 dark:text-white font-mono">{riskPercent}%</Text>
                <View className={`px-2 py-0.5 rounded-full border ${riskBadge.bg} ${riskBadge.border}`}>
                  <Text className={`text-[9px] font-bold uppercase ${riskBadge.text}`}>{riskBadge.label}</Text>
                </View>
              </View>
              <Text className="text-[10px] text-neutral-400 mt-0.5">
                {analyzing ? "Computing..." : "Model Assessment"}
              </Text>
            </View>
          </View>

          {/* Quick Summary Highlights: Escalators & Protective */}
          {(topEscalators.length > 0 || topProtective.length > 0) && (
            <View className="flex-row gap-3 mb-4">
              {topEscalators.length > 0 && (
                <View className="flex-1 bg-red-50/70 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 rounded-2xl p-3.5">
                  <Text className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1.5">
                    Top Risk Drivers
                  </Text>
                  {topEscalators.map((e) => (
                    <View key={e.feature} className="flex-row items-center justify-between py-0.5">
                      <Text className="text-xs font-bold text-neutral-900 dark:text-white" numberOfLines={1}>
                        {e.label}
                      </Text>
                      <Text className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                        +{e.shap_value.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {topProtective.length > 0 && (
                <View className="flex-1 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 rounded-2xl p-3.5">
                  <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1.5">
                    Protective Factors
                  </Text>
                  {topProtective.map((e) => (
                    <View key={e.feature} className="flex-row items-center justify-between py-0.5">
                      <Text className="text-xs font-bold text-neutral-900 dark:text-white" numberOfLines={1}>
                        {e.label}
                      </Text>
                      <Text className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {e.shap_value.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Waterfall Decomposition List */}
          <View className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-5 border border-neutral-200/80 dark:border-white/[0.08] mb-5">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-base font-black text-neutral-950 dark:text-white tracking-tight">
                Biomarker SHAP Decomposition
              </Text>
              {analyzing && <ActivityIndicator size="small" color={isDark ? "#ffffff" : "#000000"} />}
            </View>
            <Text className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed font-sans">
              Marginal impact of each physiological metric on the predicted cardiovascular likelihood.
            </Text>

            {shapData?.local_explanations.map((item, idx) => {
              const barWidth = Math.min(100, Math.round((Math.abs(item.shap_value) / maxAbsShap) * 100));
              const isRisk = item.direction === "INCREASES_RISK";

              return (
                <Animated.View
                  key={item.feature}
                  entering={FadeInDown.duration(250).delay(idx * 30)}
                  className="p-3.5 bg-[#F8F9FA] dark:bg-black rounded-xl border border-neutral-200/60 dark:border-white/[0.08] mb-2.5"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1 flex-row items-center gap-1.5 flex-wrap">
                      <View className={`w-2 h-2 rounded-full ${isRisk ? "bg-red-500" : "bg-emerald-500"}`} />
                      <Text className="font-bold text-neutral-950 dark:text-white text-xs">
                        {item.label}
                      </Text>
                      <View className="bg-white dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-neutral-200/80 dark:border-white/[0.08]">
                        <Text className="font-mono font-bold text-[10px] text-neutral-600 dark:text-neutral-400">
                          {item.patient_value} {item.unit}
                        </Text>
                      </View>
                    </View>
                    <Text className={`font-mono font-bold text-xs ${isRisk ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {item.shap_value > 0 ? `+${item.shap_value.toFixed(4)}` : item.shap_value.toFixed(4)}
                    </Text>
                  </View>

                  {/* Visual Bar Indicator */}
                  <View className="w-full bg-neutral-200/60 dark:bg-white/[0.08] rounded-full h-1.5 overflow-hidden mb-2">
                    <View
                      className={`h-full rounded-full ${isRisk ? "bg-red-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.max(6, barWidth)}%` }}
                    />
                  </View>

                  <Text className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
                    {item.clinical_note}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}
