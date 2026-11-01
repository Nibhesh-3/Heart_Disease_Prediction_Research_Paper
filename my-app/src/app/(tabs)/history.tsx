import { useState, useEffect, useCallback } from "react";
import {
  Text, View, TouchableOpacity,
  ActivityIndicator, TextInput, FlatList,
  useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useRouter } from "expo-router";
import { getToken } from "../../lib/auth";
import { useAppTheme } from "../../context/ThemeContext";
import CustomAlertModal, { AlertType } from "../../components/CustomAlertModal";

import { API_BASE } from "../../config";

interface PatientRecord {
  id: number;
  age?: number;
  sex?: number;
  cp?: number;
  trestbps?: number;
  chol?: number;
  thalach?: number;
  oldpeak?: number;
  prediction_code?: number;
  risk_score?: number;
  clinical_guidance?: string;
}

interface RiskTrendData {
  trend: string;
  prediction_codes: number[];
  overall_llm_analysis?: string;
}

export default function History() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const [history, setHistory] = useState<PatientRecord[]>([]);
  const [riskTrend, setRiskTrend] = useState<RiskTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<PatientRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "positive" | "negative">("all");
  const [refreshing, setRefreshing] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
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

  const handleDownloadPdf = async (record: PatientRecord) => {
    setIsDownloadingPdf(true);
    try {
      const token = await getToken();
      const payload = {
        age: Number(record.age ?? 55),
        sex: Number(record.sex ?? 1),
        cp: Number(record.cp ?? 0),
        trestbps: Number(record.trestbps ?? 120),
        chol: Number(record.chol ?? 200),
        fbs: 0,
        restecg: 0,
        thalach: Number(record.thalach ?? 150),
        exang: 0,
        oldpeak: Number(record.oldpeak ?? 0.0),
        slope: 1,
        ca: 0,
        thal: 2,
      };

      const res = await fetch(`${API_BASE}/pdfcreate`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to generate PDF report");

      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64data = reader.result as string;
          const base64String = base64data.split(',')[1];
          const fileUri = `${FileSystem.documentDirectory}Auralis_Heart_Report_${record.id}.pdf`;
          await FileSystem.writeAsStringAsync(fileUri, base64String, {
            encoding: FileSystem.EncodingType.Base64,
          });

          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'application/pdf',
              dialogTitle: `Auralis Telemetry Report #${record.id}`,
              UTI: 'com.adobe.pdf',
            });
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Error saving PDF file.";
          setAlertConfig({
            visible: true,
            title: "Export Error",
            message: msg,
            type: "error",
          });
        } finally {
          setIsDownloadingPdf(false);
        }
      };
      reader.onerror = () => {
        setIsDownloadingPdf(false);
        setAlertConfig({
          visible: true,
          title: "PDF Read Error",
          message: "Error reading PDF blob stream.",
          type: "error",
        });
      };
      reader.readAsDataURL(blob as any);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error downloading PDF.";
      setAlertConfig({
        visible: true,
        title: "Download Failed",
        message: msg,
        type: "error",
      });
      setIsDownloadingPdf(false);
    }
  };

  const fetch_data = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) { router.replace("/signin"); return; }
      const res = await fetch(`${API_BASE}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setHistory(await res.json());
      else if (res.status === 404) setHistory([]);
      else throw new Error("Unable to retrieve diagnostic history.");

      try {
        const trendRes = await fetch(`${API_BASE}/overall-risk`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (trendRes.ok) setRiskTrend(await trendRes.json());
      } catch { }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load history.");
    } finally {
      if (!isRefresh) setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetch_data();
  }, [fetch_data]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetch_data(true);
    setRefreshing(false);
  }, [fetch_data]);

  const filtered = history.filter((r) => {
    const matchFilter =
      filter === "all" ? true :
        filter === "positive" ? r.prediction_code === 1 :
          r.prediction_code === 0;
    const matchSearch = searchQuery === "" || String(r.id).includes(searchQuery);
    return matchFilter && matchSearch;
  });

  const renderHeader = () => (
    <>
      {/* Header Card */}
      <View className="mx-4 mt-2 mb-4 p-5 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-neutral-200/80 dark:border-white/[0.08]">
        <View className="flex-row items-center gap-2 mb-2">
          <View className="px-2.5 py-1 bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.08] rounded-full flex-row items-center gap-1.5">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <Text className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              LONGITUDINAL LOG
            </Text>
          </View>
        </View>
        <Text className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
          Assessment History
        </Text>
        <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
          Chronological audit trail of all patient screenings, predictions, and clinical interventions.
        </Text>
      </View>

      {/* Risk Trend Banner */}
      {riskTrend && (
        <View className="mx-4 mb-4 bg-white dark:bg-[#0a0a0a] rounded-2xl p-4 border border-neutral-200/80 dark:border-white/[0.08] flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Overall Trend</Text>
            <Text className="text-base font-black text-neutral-950 dark:text-white mt-0.5">{riskTrend.trend}</Text>
          </View>
          <View className="items-end">
            <Text className="text-[10px] font-bold text-neutral-400 uppercase">Total Screenings</Text>
            <Text className="text-base font-black text-neutral-950 dark:text-white mt-0.5">{history.length}</Text>
          </View>
        </View>
      )}

      {/* Search + Filter */}
      <View className="mx-4 mb-4 gap-2.5">
        <TextInput
          className="bg-white dark:bg-[#0a0a0a] border border-neutral-200/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-neutral-950 dark:text-white"
          placeholder="Search by record ID..."
          placeholderTextColor="#a3a3a3"
          underlineColorAndroid="transparent"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View className="flex-row gap-2">
          {(["all", "positive", "negative"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className={`flex-1 py-2 rounded-full border items-center ${filter === f ? "bg-neutral-950 dark:bg-white border-neutral-950 dark:border-white" : "bg-white dark:bg-[#0a0a0a] border-neutral-200/80 dark:border-white/[0.08]"}`}
              activeOpacity={0.8}
            >
              <Text className={`text-xs font-bold capitalize ${filter === f ? "text-white dark:text-black" : "text-neutral-700 dark:text-neutral-300"}`}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error ? (
        <View className="mx-4 mb-4 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl">
          <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>
        </View>
      ) : null}
    </>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View className="mx-4 mt-4 items-center justify-center bg-white dark:bg-[#0a0a0a] rounded-3xl p-12 border border-neutral-200/80 dark:border-white/[0.08]">
          <ActivityIndicator color={isDark ? "#ffffff" : "#000000"} size="large" />
          <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-4">Loading history records...</Text>
        </View>
      );
    }
    return (
      <View className="mx-4 bg-white dark:bg-[#0a0a0a] rounded-3xl p-8 border border-neutral-200/80 dark:border-white/[0.08] items-center">
        <Text className="text-sm font-bold text-neutral-900 dark:text-white mb-1">No records found</Text>
        <Text className="text-xs text-neutral-400 text-center">
          {history.length === 0
            ? "No previous diagnostic screenings found. Execute a screening to populate this view."
            : "No records match your current filter query."}
        </Text>
      </View>
    );
  };

  const renderItem = ({ item: record }: { item: PatientRecord }) => {
    const isPositive = record.prediction_code === 1;
    const pct = record.risk_score !== undefined ? Math.round(record.risk_score * 100) : null;
    return (
      <View className="px-4 mb-3">
        <TouchableOpacity
          onPress={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
          activeOpacity={0.8}
          className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-4 border border-neutral-200/80 dark:border-white/[0.08]"
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-black text-neutral-950 dark:text-white">#AUR-{record.id}</Text>
            <View className="flex-row items-center gap-2">
              {pct !== null && (
                <Text className="text-xs font-bold text-neutral-500 font-mono">{pct}%</Text>
              )}
              <View
                className="px-2.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: isPositive ? "#FEF2F2" : "#ECFDF5",
                  borderColor: isPositive ? "#FECACA" : "#A7F3D0",
                }}
              >
                <Text className="text-[10px] font-bold uppercase" style={{ color: isPositive ? "#DC2626" : "#059669" }}>
                  {isPositive ? "Positive Risk" : "Negative Risk"}
                </Text>
              </View>
            </View>
          </View>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            BP: {record.trestbps ?? "—"} mmHg · Chol: {record.chol ?? "—"} mg/dL · HR: {record.thalach ?? "—"} BPM
          </Text>

          {/* Expanded Detail */}
          {selectedRecord?.id === record.id && (
            <View className="mt-3 pt-3 border-t border-neutral-100 dark:border-white/[0.06] gap-2.5">
              <View className="flex-row flex-wrap gap-2">
                {[
                  { label: "Age", value: record.age },
                  { label: "Sex", value: record.sex === 1 ? "Male" : "Female" },
                  { label: "Oldpeak", value: record.oldpeak?.toFixed(1) },
                ].map((item) => (
                  <View key={item.label} className="flex-row gap-1 bg-neutral-100 dark:bg-white/[0.06] px-2 py-1 rounded">
                    <Text className="text-xs font-bold text-neutral-500">{item.label}:</Text>
                    <Text className="text-xs text-neutral-900 dark:text-neutral-100 font-mono">{item.value ?? "—"}</Text>
                  </View>
                ))}
              </View>
              {record.clinical_guidance ? (
                <View className="p-3 bg-[#F8F9FA] dark:bg-black rounded-xl border border-neutral-200/60 dark:border-white/[0.08]">
                  <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Clinical Guidance</Text>
                  <Text className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">{record.clinical_guidance}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={() => handleDownloadPdf(record)}
                disabled={isDownloadingPdf}
                className="mt-2 flex-row items-center justify-center gap-2 py-3 bg-neutral-950 dark:bg-white rounded-full shadow-xs"
              >
                {isDownloadingPdf ? (
                  <ActivityIndicator size="small" color={isDark ? "#000" : "#fff"} />
                ) : (
                  <Text className="text-white dark:text-black text-xs font-bold">Download Structured PDF Report →</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-[#F8F9FA] dark:bg-black">
      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingBottom: 110, maxWidth: 960, width: "100%", alignSelf: "center" }}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

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
