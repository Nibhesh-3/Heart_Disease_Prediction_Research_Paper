import { useState, useEffect, useCallback, useRef } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Animated as RNAnimated,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  useAnimatedProps,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { LineChart } from "react-native-chart-kit";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../../context/ThemeContext";
import { getToken, clearToken } from "../../lib/auth";

import { API_BASE } from "../../config";


const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── MODERN VERCEL/CLINICAL RISK GAUGE ──
function ModernRiskGauge({
  percentage,
  risk,
  isDark,
  size = 180,
}: {
  percentage: number;
  risk: { label: string; color: string; bg: string; border: string; dot: string };
  isDark: boolean;
  size?: number;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(percentage, {
      duration: 1400,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage]);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: circumference - (progress.value / 100) * circumference,
    };
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center", position: "relative" }}>
      <View style={{ position: "absolute", width: size, height: size, transform: [{ rotate: "-90deg" }] }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={risk.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
          />
        </Svg>
      </View>

      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">
          RISK SCORE
        </Text>
        <View className="flex-row items-baseline">
          <Text className="text-5xl font-black text-neutral-950 dark:text-white">{percentage}</Text>
          <Text className="text-2xl font-bold text-neutral-950 dark:text-white">%</Text>
        </View>
        <View
          className="px-2.5 py-0.5 mt-1.5 rounded-full border"
          style={{
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : risk.bg,
            borderColor: isDark ? "rgba(255,255,255,0.12)" : risk.border,
          }}
        >
          <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: risk.color }}>
            {risk.label}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── ANIMATED CARD WRAPPER ──
function AnimatedCard({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: any;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animStyle, style]}>
      {children}
    </Animated.View>
  );
}

// ── DATA TYPES ──
interface UserProfile { id: number; username: string; email?: string; }
interface PatientRecord {
  id: number; trestbps?: number; chol?: number; thalach?: number;
  oldpeak?: number; prediction_code?: number; risk_score?: number; clinical_guidance?: string;
}
interface RiskTrendData {
  trend: string;
  prediction_codes: number[];
  overall_llm_analysis?: string;
  overall_risk_score?: number;
  overall_risk_percentage?: number;
  latest_risk_score?: number;
  latest_risk_percentage?: number;
  risk_level?: string;
  state_label?: string;
  total_assessments?: number;
}

function getRiskLevel(score: number) {
  if (score >= 0.7) return { label: "High Risk", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", dot: "#EF4444" };
  if (score >= 0.4) return { label: "Moderate Risk", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B" };
  return { label: "Low Risk", color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", dot: "#10B981" };
}

function VitalCard({ label, value, unit, tag, iconColor }: {
  label: string; value: string | number; unit: string; tag: string; iconColor: string;
}) {
  return (
    <View className="flex-1 bg-white dark:bg-[#0a0a0a] rounded-2xl p-4 border border-neutral-200/80 dark:border-white/[0.08]">
      <View className="flex-row items-center justify-between mb-2.5">
        <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</Text>
        <View className="w-2 h-2 rounded-full" style={{ backgroundColor: iconColor }} />
      </View>
      <View className="flex-row items-baseline gap-1">
        <Text className="text-2xl font-black text-neutral-950 dark:text-white tracking-tight">{value}</Text>
        <Text className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold">{unit}</Text>
      </View>
      <View className="mt-2 self-start bg-neutral-100 dark:bg-white/[0.06] rounded px-2 py-0.5 border border-neutral-200/60 dark:border-white/[0.08]">
        <Text className="text-[9px] font-bold text-neutral-600 dark:text-neutral-400">{tag}</Text>
      </View>
    </View>
  );
}



export default function Home() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<PatientRecord[]>([]);
  const [riskTrend, setRiskTrend] = useState<RiskTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [animatedPct, setAnimatedPct] = useState(0);

  const fetch_data = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) { router.replace("/signin"); return; }
      const userRes = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userRes.ok) setUser(await userRes.json());
      else if (userRes.status === 401) { await clearToken(); router.replace("/signin"); return; }

      try {
        const histRes = await fetch(`${API_BASE}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (histRes.ok) setHistory(await histRes.json());
      } catch { }

      try {
        const trendRes = await fetch(`${API_BASE}/overall-risk`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (trendRes.ok) setRiskTrend(await trendRes.json());
      } catch { }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load clinical telemetry data.");
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

  const latest = history.length > 0 ? history[0] : null;

  // Authoritative backend-computed overall longitudinal risk (with fallback to latest record)
  const computedPercentage = (() => {
    if (riskTrend?.overall_risk_percentage !== undefined) {
      return riskTrend.overall_risk_percentage;
    }
    if (!latest) return 0;
    if (latest.risk_score !== undefined && latest.risk_score !== null) {
      return Math.round(latest.risk_score * 100);
    }
    return latest.prediction_code === 1 ? 74 : 14;
  })();

  // Animated counter for risk %
  useEffect(() => {
    const end = computedPercentage;
    if (end === 0) { setAnimatedPct(0); return; }
    let startTime: number | null = null;
    let animationFrameId: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / 1200, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedPct(Math.floor(easeOut * end));
      if (progress < 1) animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [computedPercentage]);

  const { width } = useWindowDimensions();
  const isTablet = width >= 768 || (Platform.OS === "ios" && Boolean((Platform as any).isPad));
  const riskScore = riskTrend?.overall_risk_score !== undefined
    ? riskTrend.overall_risk_score
    : computedPercentage / 100;
  const risk = getRiskLevel(riskScore);
  const stateLabel = riskTrend?.state_label || (
    !latest ? "NO REPORT YET" : computedPercentage <= 30 ? "OPTIMAL STATE" : computedPercentage <= 65 ? "MODERATE STATE" : "ELEVATED STATE"
  );

  const tabletChartWidth = Math.min(Math.floor(width * 0.52), 520);
  const mobileChartWidth = Math.min(width - 56, 380);

  const chartData = history.length > 0 ? {
    labels: history.slice(0, 6).reverse().map(r => `#${r.id}`),
    datasets: [{
      data: history.slice(0, 6).reverse().map(r =>
        r.risk_score !== undefined ? Math.round(r.risk_score * 100) : (r.prediction_code === 1 ? 74 : 14)
      ),
    }]
  } : null;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-[#F8F9FA] dark:bg-black">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 110, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="w-full max-w-5xl px-4 sm:px-6">
          {/* ── HEADER ── */}
          <AnimatedCard delay={0}>
            <View className="pt-2 pb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-black text-neutral-950 dark:text-white tracking-tight">
                  Clinical Dashboard
                </Text>
                <View className="flex-row items-center gap-1.5 mt-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <Text className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    TELEMETRY LIVE • 200 OK
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/healthdata")}
                activeOpacity={0.8}
                className="px-4 py-2 rounded-full bg-neutral-950 dark:bg-white flex-row items-center gap-1.5 shadow-xs"
              >
                <Text className="text-white dark:text-neutral-950 text-xs font-bold">+ New Screening</Text>
              </TouchableOpacity>
            </View>
          </AnimatedCard>

          {/* ── ERROR ── */}
          {error ? (
            <Animated.View entering={FadeIn.duration(300)} className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl">
              <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>
            </Animated.View>
          ) : null}

          {loading ? (
            <AnimatedCard delay={100}>
              <View className="mt-10 items-center justify-center bg-white dark:bg-[#0a0a0a] rounded-3xl p-12 border border-neutral-200/80 dark:border-white/[0.08]">
                <ActivityIndicator color={isDark ? "#ffffff" : "#000000"} size="large" />
                <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-4">
                  Synthesizing dashboard metrics...
                </Text>
              </View>
            </AnimatedCard>
          ) : (
            <>
              {/* ── TOP HERO ROW (RESPONSIVE) ── */}
              {isTablet ? (
                <View className="flex-row gap-4 mb-4">
                  {/* ── RISK SCORE CARD (TABLET) ── */}
                  <AnimatedCard delay={100} style={{ flex: 1 }}>
                    <View className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-6 border border-neutral-200/80 dark:border-white/[0.08] items-center">
                      <View className="w-full flex-row items-center justify-between mb-4">
                        <Text className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                          Telemetry Assessment
                        </Text>
                        <View
                          className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full border"
                          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : risk.bg, borderColor: isDark ? "rgba(255,255,255,0.12)" : risk.border }}
                        >
                          <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: risk.dot }} />
                          <Text className="text-[10px] font-bold" style={{ color: risk.color }}>
                            {risk.label}
                          </Text>
                        </View>
                      </View>

                      <View className="my-3">
                        <ModernRiskGauge
                          percentage={animatedPct}
                          risk={risk}
                          isDark={isDark}
                          size={180}
                        />
                      </View>

                      <View className="w-full flex-row items-center justify-between pt-4 mt-2 border-t border-neutral-100 dark:border-white/[0.06]">
                        <Text className="text-xs text-neutral-500">
                          Model: <Text className="font-bold text-neutral-800 dark:text-neutral-200">XGBoost ML</Text>
                        </Text>
                        <Text className="text-xs text-neutral-500">
                          Status: <Text className="font-bold text-neutral-800 dark:text-neutral-200">{history.length} Logged</Text>
                        </Text>
                      </View>
                    </View>
                  </AnimatedCard>

                  {/* ── WELCOME / AI INSIGHT CARD (TABLET) ── */}
                  <AnimatedCard delay={200} style={{ flex: 1.35 }}>
                    <View className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-6 border border-neutral-200/80 dark:border-white/[0.08]">
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1">
                          <Text className="text-2xl font-black text-neutral-950 dark:text-white tracking-tight">
                            Welcome back, {user?.username || "Patient"}
                          </Text>
                          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Longitudinal cardiovascular health assessment & clinical telemetry overview.
                          </Text>
                        </View>
                        <View className="ml-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
                          <Text className="text-xs font-bold text-purple-700 dark:text-purple-400">DeepSeek AI</Text>
                        </View>
                      </View>

                      <View className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-black border border-neutral-200/80 dark:border-white/[0.08] mt-2">
                        {riskTrend?.overall_llm_analysis ? (
                          <>
                            <View className="flex-row items-center justify-between mb-2">
                              <Text className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                Longitudinal Synthesis
                              </Text>
                              <Text className="text-xs font-bold text-neutral-900 dark:text-white">
                                Trend: <Text className="text-purple-700 dark:text-purple-400">{riskTrend.trend}</Text>
                              </Text>
                            </View>
                            <Text className="text-xs text-neutral-700 dark:text-neutral-300 leading-5">
                              {riskTrend.overall_llm_analysis}
                            </Text>
                          </>
                        ) : latest?.clinical_guidance ? (
                          <>
                            <Text className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                              Latest Screening Guidance
                            </Text>
                            <Text className="text-xs text-neutral-700 dark:text-neutral-300 leading-5">
                              {latest.clinical_guidance}
                            </Text>
                          </>
                        ) : (
                          <Text className="text-xs text-neutral-500 dark:text-neutral-400 text-center py-2">
                            No screening assessments recorded yet. Run your first assessment to calculate your cardiovascular index.
                          </Text>
                        )}
                      </View>

                      <View className="flex-row gap-3 mt-4 pt-3 border-t border-neutral-100 dark:border-white/[0.06]">
                        {[
                          { label: "Screenings", value: String(history.length) },
                          { label: "Trend", value: riskTrend?.trend || "Stable" },
                          { label: "Patient ID", value: `#AUR-${user?.id || "01"}` },
                        ].map((s) => (
                          <View key={s.label} className="flex-1 items-center p-3 bg-[#F8F9FA] dark:bg-black rounded-2xl border border-neutral-200/60 dark:border-white/[0.08]">
                            <Text className="text-[10px] font-bold text-neutral-400 uppercase">{s.label}</Text>
                            <Text className="text-base font-black text-neutral-950 dark:text-white mt-0.5" numberOfLines={1}>{s.value}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </AnimatedCard>
                </View>
              ) : (
                <View className="mb-4">
                  {/* ── RISK SCORE GAUGE (MOBILE) ── */}
                  <AnimatedCard delay={100}>
                    <View className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-6 border border-neutral-200/80 dark:border-white/[0.08] items-center mb-4">
                      <View className="w-full flex-row items-center justify-between mb-3">
                        <Text className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                          Telemetry Assessment
                        </Text>
                        <View
                          className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full border"
                          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : risk.bg, borderColor: isDark ? "rgba(255,255,255,0.12)" : risk.border }}
                        >
                          <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: risk.dot }} />
                          <Text className="text-[10px] font-bold" style={{ color: risk.color }}>
                            {risk.label}
                          </Text>
                        </View>
                      </View>

                      <View className="my-2">
                        <ModernRiskGauge
                          percentage={animatedPct}
                          risk={risk}
                          isDark={isDark}
                          size={180}
                        />
                      </View>

                      <View className="w-full flex-row items-center justify-between pt-4 mt-2 border-t border-neutral-100 dark:border-white/[0.06]">
                        <Text className="text-xs text-neutral-500">
                          Model: <Text className="font-bold text-neutral-800 dark:text-neutral-200">XGBoost ML</Text>
                        </Text>
                        <Text className="text-xs text-neutral-500">
                          Status: <Text className="font-bold text-neutral-800 dark:text-neutral-200">{history.length} Logged</Text>
                        </Text>
                      </View>
                    </View>
                  </AnimatedCard>

                  {/* ── WELCOME / AI INSIGHT CARD (MOBILE) ── */}
                  <AnimatedCard delay={200}>
                    <View className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-5 border border-neutral-200/80 dark:border-white/[0.08]">
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                          <Text className="text-xl font-black text-neutral-950 dark:text-white tracking-tight">
                            Welcome back, {user?.username || "Patient"}
                          </Text>
                          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Longitudinal cardiovascular health assessment & clinical overview.
                          </Text>
                        </View>
                        <View className="ml-2 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
                          <Text className="text-[10px] font-bold text-purple-700 dark:text-purple-400">DeepSeek AI</Text>
                        </View>
                      </View>

                      <View className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-black border border-neutral-200/80 dark:border-white/[0.08]">
                        {riskTrend?.overall_llm_analysis ? (
                          <>
                            <View className="flex-row items-center justify-between mb-2">
                              <Text className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                Longitudinal Synthesis
                              </Text>
                              <Text className="text-xs font-bold text-neutral-900 dark:text-white">
                                Trend: <Text className="text-purple-700 dark:text-purple-400">{riskTrend.trend}</Text>
                              </Text>
                            </View>
                            <Text className="text-xs text-neutral-700 dark:text-neutral-300 leading-5">
                              {riskTrend.overall_llm_analysis}
                            </Text>
                          </>
                        ) : latest?.clinical_guidance ? (
                          <>
                            <Text className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                              Latest Screening Guidance
                            </Text>
                            <Text className="text-xs text-neutral-700 dark:text-neutral-300 leading-5">
                              {latest.clinical_guidance}
                            </Text>
                          </>
                        ) : (
                          <Text className="text-xs text-neutral-500 dark:text-neutral-400 text-center py-2">
                            No screening assessments recorded yet. Run your first assessment to calculate your cardiovascular index.
                          </Text>
                        )}
                      </View>

                      <View className="flex-row gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-white/[0.06]">
                        {[
                          { label: "Screenings", value: String(history.length) },
                          { label: "Trend", value: riskTrend?.trend || "Stable" },
                          { label: "Patient ID", value: `#AUR-${user?.id || "01"}` },
                        ].map((s) => (
                          <View key={s.label} className="flex-1 items-center p-2.5 bg-[#F8F9FA] dark:bg-black rounded-2xl border border-neutral-200/60 dark:border-white/[0.08]">
                            <Text className="text-[10px] font-bold text-neutral-400 uppercase">{s.label}</Text>
                            <Text className="text-sm font-black text-neutral-950 dark:text-white mt-0.5" numberOfLines={1}>{s.value}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </AnimatedCard>
                </View>
              )}

              {/* ── 4 VITAL CARDS ── */}
              <AnimatedCard delay={300}>
                <View className="mb-4">
                  {isTablet ? (
                    <View className="flex-row gap-4">
                      <VitalCard label="Resting BP" value={latest?.trestbps ?? 120} unit="mmHg" tag="<120 Normal" iconColor="#2563EB" />
                      <VitalCard label="Cholesterol" value={latest?.chol ?? 200} unit="mg/dL" tag="<200 Target" iconColor="#D97706" />
                      <VitalCard label="Max HR" value={latest?.thalach ?? 150} unit="BPM" tag="Reserve OK" iconColor="#DC2626" />
                      <VitalCard label="ST Depr" value={latest?.oldpeak !== undefined ? latest.oldpeak.toFixed(1) : "0.0"} unit="ECG" tag="Perfusion OK" iconColor="#7C3AED" />
                    </View>
                  ) : (
                    <>
                      <View className="flex-row gap-3 mb-3">
                        <VitalCard label="Resting BP" value={latest?.trestbps ?? 120} unit="mmHg" tag="<120 Normal" iconColor="#2563EB" />
                        <VitalCard label="Cholesterol" value={latest?.chol ?? 200} unit="mg/dL" tag="<200 Target" iconColor="#D97706" />
                      </View>
                      <View className="flex-row gap-3">
                        <VitalCard label="Max HR" value={latest?.thalach ?? 150} unit="BPM" tag="Reserve OK" iconColor="#DC2626" />
                        <VitalCard label="ST Depr" value={latest?.oldpeak !== undefined ? latest.oldpeak.toFixed(1) : "0.0"} unit="ECG" tag="Perfusion OK" iconColor="#7C3AED" />
                      </View>
                    </>
                  )}
                </View>
              </AnimatedCard>

              {/* ── RESPONSIVE ANALYTICS & ACTIONS SECTION ── */}
              {isTablet ? (
                <View className="flex-row gap-4 items-start">
                  {/* LEFT COLUMN: PROGRESSION CHART & RECENT SCREENINGS */}
                  <View style={{ flex: 1.25 }} className="gap-4">
                    {/* ── LONGITUDINAL TREND CHART ── */}
                    {chartData && (
                      <AnimatedCard delay={400}>
                        <View className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-6 border border-neutral-200/80 dark:border-white/[0.08] overflow-hidden">
                          <Text className="text-base font-bold text-neutral-950 dark:text-white mb-0.5">Risk Progression</Text>
                          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">Longitudinal telemetry risk trend over time</Text>
                          <LineChart
                            data={chartData}
                            width={tabletChartWidth}
                            height={240}
                            yAxisSuffix="%"
                            withInnerLines={true}
                            withOuterLines={false}
                            chartConfig={{
                              backgroundColor: "transparent",
                              backgroundGradientFromOpacity: 0,
                              backgroundGradientToOpacity: 0,
                              decimalPlaces: 0,
                              color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                              labelColor: (opacity = 1) => `rgba(163, 163, 163, ${opacity})`,
                              style: { borderRadius: 16 },
                              propsForDots: { r: "4", strokeWidth: "2", stroke: isDark ? "#ffffff" : "#000000" }
                            }}
                            bezier
                            style={{ marginVertical: 8, borderRadius: 16, marginLeft: -15 }}
                          />
                        </View>
                      </AnimatedCard>
                    )}

                    {/* ── RECENT SCREENINGS ── */}
                    <AnimatedCard delay={500}>
                      <View className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-6 border border-neutral-200/80 dark:border-white/[0.08]">
                        <View className="flex-row items-center justify-between mb-4">
                          <View>
                            <Text className="text-base font-bold text-neutral-950 dark:text-white">Recent Screenings</Text>
                            <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Historical telemetry evaluation outputs</Text>
                          </View>
                          <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
                            <Text className="text-xs font-bold text-neutral-900 dark:text-neutral-300">View all →</Text>
                          </TouchableOpacity>
                        </View>
                        {history.length > 0 ? (
                          history.slice(0, 4).map((record, idx) => (
                            <View
                              key={record.id || idx}
                              className="py-3 border-b border-neutral-100 dark:border-white/[0.06]"
                              style={idx === Math.min(history.length, 4) - 1 ? { borderBottomWidth: 0 } : {}}
                            >
                              <View className="flex-row items-center justify-between">
                                <Text className="text-xs font-bold text-neutral-900 dark:text-white">#AUR-{record.id}</Text>
                                <View
                                  className="px-2.5 py-0.5 rounded-full border"
                                  style={{
                                    backgroundColor: record.prediction_code === 1 ? "#FEF2F2" : "#ECFDF5",
                                    borderColor: record.prediction_code === 1 ? "#FECACA" : "#A7F3D0",
                                  }}
                                >
                                  <Text className="text-[10px] font-bold uppercase" style={{ color: record.prediction_code === 1 ? "#DC2626" : "#059669" }}>
                                    {record.prediction_code === 1 ? "Positive Risk" : "Negative Risk"}
                                  </Text>
                                </View>
                              </View>
                              <Text className="text-xs text-neutral-500 mt-1">
                                BP: {record.trestbps || 120} mmHg · Chol: {record.chol || 200} mg/dL · HR: {record.thalach || 150} BPM
                              </Text>
                            </View>
                          ))
                        ) : (
                          <View className="py-6 items-center">
                            <Text className="text-xs text-neutral-400">No previous diagnostic screenings found.</Text>
                          </View>
                        )}
                      </View>
                    </AnimatedCard>
                  </View>

                  {/* RIGHT COLUMN: QUICK ACTIONS GRID */}
                  <View style={{ flex: 1 }} className="gap-4">


                    {/* ── CLINICAL REFERENCE CARD ── */}
                    <AnimatedCard delay={550}>
                      <View className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-6 border border-neutral-200/80 dark:border-white/[0.08]">
                        <Text className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
                          Clinical Target Benchmarks
                        </Text>
                        <View className="gap-2.5">
                          <View className="flex-row items-center justify-between py-1.5 border-b border-neutral-100 dark:border-white/[0.06]">
                            <Text className="text-xs text-neutral-600 dark:text-neutral-400">Resting Blood Pressure</Text>
                            <Text className="text-xs font-bold text-neutral-900 dark:text-white">&lt; 120/80 mmHg</Text>
                          </View>
                          <View className="flex-row items-center justify-between py-1.5 border-b border-neutral-100 dark:border-white/[0.06]">
                            <Text className="text-xs text-neutral-600 dark:text-neutral-400">Serum Cholesterol</Text>
                            <Text className="text-xs font-bold text-neutral-900 dark:text-white">&lt; 200 mg/dL</Text>
                          </View>
                          <View className="flex-row items-center justify-between py-1.5 border-b border-neutral-100 dark:border-white/[0.06]">
                            <Text className="text-xs text-neutral-600 dark:text-neutral-400">Max Heart Rate Reserve</Text>
                            <Text className="text-xs font-bold text-neutral-900 dark:text-white">220 - Age BPM</Text>
                          </View>
                          <View className="flex-row items-center justify-between py-1.5">
                            <Text className="text-xs text-neutral-600 dark:text-neutral-400">ST Depression (ECG)</Text>
                            <Text className="text-xs font-bold text-neutral-900 dark:text-white">&lt; 1.0 mm</Text>
                          </View>
                        </View>
                      </View>
                    </AnimatedCard>
                  </View>
                </View>
              ) : (
                <>
                  {/* ── LONGITUDINAL TREND CHART (MOBILE) ── */}
                  {chartData && (
                    <AnimatedCard delay={400}>
                      <View className="mb-4 bg-white dark:bg-[#0a0a0a] rounded-3xl p-5 border border-neutral-200/80 dark:border-white/[0.08] overflow-hidden">
                        <Text className="text-sm font-bold text-neutral-950 dark:text-white mb-0.5">Risk Progression</Text>
                        <Text className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">Longitudinal telemetry risk trend over time</Text>
                        <LineChart
                          data={chartData}
                          width={mobileChartWidth}
                          height={220}
                          yAxisSuffix="%"
                          withInnerLines={true}
                          withOuterLines={false}
                          chartConfig={{
                            backgroundColor: "transparent",
                            backgroundGradientFromOpacity: 0,
                            backgroundGradientToOpacity: 0,
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(163, 163, 163, ${opacity})`,
                            style: { borderRadius: 16 },
                            propsForDots: { r: "4", strokeWidth: "2", stroke: isDark ? "#ffffff" : "#000000" }
                          }}
                          bezier
                          style={{ marginVertical: 8, borderRadius: 16, marginLeft: -15 }}
                        />
                      </View>
                    </AnimatedCard>
                  )}

                  {/* ── RECENT SCREENINGS (MOBILE) ── */}
                  <AnimatedCard delay={500}>
                    <View className="mb-4 bg-white dark:bg-[#0a0a0a] rounded-3xl p-5 border border-neutral-200/80 dark:border-white/[0.08]">
                      <View className="flex-row items-center justify-between mb-4">
                        <View>
                          <Text className="text-base font-bold text-neutral-950 dark:text-white">Recent Screenings</Text>
                          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Historical telemetry evaluation outputs</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
                          <Text className="text-xs font-bold text-neutral-900 dark:text-neutral-300">View all →</Text>
                        </TouchableOpacity>
                      </View>
                      {history.length > 0 ? (
                        history.slice(0, 4).map((record, idx) => (
                          <View
                            key={record.id || idx}
                            className="py-3 border-b border-neutral-100 dark:border-white/[0.06]"
                            style={idx === Math.min(history.length, 4) - 1 ? { borderBottomWidth: 0 } : {}}
                          >
                            <View className="flex-row items-center justify-between">
                              <Text className="text-xs font-bold text-neutral-900 dark:text-white">#AUR-{record.id}</Text>
                              <View
                                className="px-2.5 py-0.5 rounded-full border"
                                style={{
                                  backgroundColor: record.prediction_code === 1 ? "#FEF2F2" : "#ECFDF5",
                                  borderColor: record.prediction_code === 1 ? "#FECACA" : "#A7F3D0",
                                }}
                              >
                                <Text className="text-[10px] font-bold uppercase" style={{ color: record.prediction_code === 1 ? "#DC2626" : "#059669" }}>
                                  {record.prediction_code === 1 ? "Positive Risk" : "Negative Risk"}
                                </Text>
                              </View>
                            </View>
                            <Text className="text-xs text-neutral-500 mt-1">
                              BP: {record.trestbps || 120} mmHg · Chol: {record.chol || 200} mg/dL · HR: {record.thalach || 150} BPM
                            </Text>
                          </View>
                        ))
                      ) : (
                        <View className="py-6 items-center">
                          <Text className="text-xs text-neutral-400">No previous diagnostic screenings found.</Text>
                        </View>
                      )}
                    </View>
                  </AnimatedCard>


                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
