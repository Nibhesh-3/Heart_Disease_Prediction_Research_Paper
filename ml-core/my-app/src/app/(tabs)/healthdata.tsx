import { useState, useRef, useEffect } from "react";
import {
  Text, View, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Modal, Platform, Vibration,
  useWindowDimensions
} from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedProps,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { getToken } from "../../lib/auth";
import { useAppTheme } from "../../context/ThemeContext";

import { API_BASE } from "../../config";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ModernRiskGauge({
  percentage,
  risk,
  isDark,
  size = 170,
}: {
  percentage: number;
  risk: { label: string; color: string; bg: string; border: string; dot?: string };
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

interface PredictionResponse {
  prediction: number;
  probability_positive: number;
  probability_negative: number;
  risk_score: number;
  llm_analysis?: string;
}

type HealthForm = {
  age: string; sex: string; cp: string; trestbps: string;
  chol: string; fbs: string; restecg: string; thalach: string;
  exang: string; oldpeak: string; slope: string; ca: string; thal: string;
};

// ── CUSTOM UI COMPONENTS ──

function SectionHeader({ title, subtitle, icon }: { title: string; subtitle: string; icon: string }) {
  return (
    <View className="mb-3 mt-6 flex-row items-center gap-2.5">
      <View className="w-8 h-8 rounded-lg bg-neutral-950 dark:bg-white items-center justify-center">
        <Text className="text-white dark:text-black text-sm">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-black text-neutral-950 dark:text-white tracking-tight">{title}</Text>
        <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{subtitle}</Text>
      </View>
    </View>
  );
}

function LabeledInput({ label, value, onChangeText, keyboardType = "numeric", placeholder = "" }: {
  label: string; value: string; onChangeText: (v: string) => void; keyboardType?: any; placeholder?: string;
}) {
  return (
    <View className="mb-3.5">
      <Text className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">{label}</Text>
      <TextInput
        className="border border-neutral-200/80 dark:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-neutral-950 dark:text-white bg-[#F8F9FA] dark:bg-black font-medium"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#a3a3a3"
        underlineColorAndroid="transparent"
      />
    </View>
  );
}

function DropdownSelect({ label, value, options, onChange, placeholder = "Select..." }: {
  label: string; value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View className="mb-3.5">
      <Text className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">{label}</Text>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        className="flex-row items-center justify-between border border-neutral-200/80 dark:border-white/[0.1] rounded-xl px-4 py-3 bg-[#F8F9FA] dark:bg-black"
        activeOpacity={0.7}
      >
        <Text 
          className={`text-sm flex-1 mr-2 ${selected ? 'text-neutral-950 dark:text-white font-semibold' : 'text-neutral-400 dark:text-neutral-500'}`}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Text className="text-neutral-400 text-[10px]">▼</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <View className="flex-1 bg-neutral-950/60 justify-end">
          <TouchableOpacity className="absolute inset-0" activeOpacity={1} onPress={() => setVisible(false)} />
          <View className="bg-white dark:bg-[#0a0a0a] rounded-t-3xl p-6 pb-10 max-h-[70%] border-t border-neutral-200/80 dark:border-white/[0.12]">
            <View className="w-12 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full self-center mb-6" />
            <Text className="text-lg font-black text-neutral-950 dark:text-white mb-4">{label}</Text>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {options.map(o => (
                <TouchableOpacity
                  key={o.value}
                  onPress={() => { onChange(o.value); setVisible(false); }}
                  className={`flex-row items-center justify-between p-3.5 mb-2 rounded-xl border ${value === o.value ? 'bg-neutral-950 border-neutral-950 dark:bg-white dark:border-white' : 'bg-[#F8F9FA] dark:bg-black border-neutral-200/60 dark:border-white/[0.08]'}`}
                  activeOpacity={0.7}
                >
                  <Text className={`text-sm font-semibold ${value === o.value ? 'text-white dark:text-black' : 'text-neutral-700 dark:text-neutral-300'}`}>{o.label}</Text>
                  {value === o.value && (
                    <View className="w-4 h-4 rounded-full bg-white/20 dark:bg-black/20 items-center justify-center">
                      <Text className="text-white dark:text-black text-[10px]">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getRiskLevel(score: number) {
  if (score >= 0.7) return { label: "High Risk", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", dot: "#EF4444" };
  if (score >= 0.4) return { label: "Moderate Risk", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B" };
  return { label: "Low Risk", color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", dot: "#10B981" };
}

export default function HealthData() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [form, setForm] = useState<HealthForm>({
    age: "", sex: "1", cp: "1", trestbps: "", chol: "",
    fbs: "0", restecg: "0", thalach: "", exang: "0",
    oldpeak: "", slope: "1", ca: "0", thal: "3",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState("");

  const set = (key: keyof HealthForm) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  useEffect(() => {
    if (result) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [result]);

  const handleSubmit = async () => {
    setError("");
    setResult(null);
    if (!form.age || !form.trestbps || !form.chol || !form.thalach || !form.oldpeak) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Vibration.vibrate(100);
      } catch {}
      setError("Please fill in all numeric biomarker fields.");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
    Vibration.vibrate([0, 180, 80, 220]);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) { router.replace("/signin"); return; }
      const response = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          age: Number(form.age), sex: Number(form.sex), cp: Number(form.cp),
          trestbps: Number(form.trestbps), chol: Number(form.chol), fbs: Number(form.fbs),
          restecg: Number(form.restecg), thalach: Number(form.thalach), exang: Number(form.exang),
          oldpeak: Number(form.oldpeak), slope: Number(form.slope), ca: Number(form.ca), thal: Number(form.thal),
        }),
      });
      if (!response.ok) {
        const d = await response.json();
        throw new Error(d.detail || "Prediction failed.");
      }
      const data = await response.json();
      setResult(data);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Vibration.vibrate(80);
      } catch {}
    } catch (err: unknown) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Vibration.vibrate([0, 100, 80, 100]);
      } catch {}
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const { width } = useWindowDimensions();
  const { isDark } = useAppTheme();
  const isTablet = width >= 768 || (Platform.OS === "ios" && Boolean((Platform as any).isPad));

  const risk = result ? getRiskLevel(result.risk_score) : null;
  const pct = result ? Math.round(result.risk_score * 100) : 0;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-[#F8F9FA] dark:bg-black">
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 110, maxWidth: 920, width: "100%", alignSelf: "center" }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View className="mx-4 mt-2 p-5 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-neutral-200/80 dark:border-white/[0.08]">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="px-2.5 py-1 bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.08] rounded-full flex-row items-center gap-1.5">
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <Text className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                13 BIOMARKERS • XGBOOST
              </Text>
            </View>
          </View>
          <Text className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
            Clinical Screening
          </Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed font-sans">
            Input standardized clinical telemetry parameters to execute sub-second machine learning risk stratification.
          </Text>
        </View>

        {error ? (
          <View className="mx-4 mt-4 p-4 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/25 rounded-2xl flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-lg bg-rose-500/20 items-center justify-center">
              <Text className="text-rose-600 dark:text-rose-400 font-black text-sm">!</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Diagnostic Notice</Text>
              <Text className="text-xs font-medium text-rose-900 dark:text-rose-200 mt-0.5">{error}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setError("")}
              className="w-6 h-6 rounded-lg bg-rose-500/10 items-center justify-center"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View className="px-4">
          {/* Section: Demographics */}
          <SectionHeader title="Demographics" subtitle="Basic Patient Info" icon="👤" />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <LabeledInput label="Age (Yrs)" value={form.age} onChangeText={set("age")} placeholder="e.g. 54" />
            </View>
            <View className="flex-1">
              <DropdownSelect label="Sex" value={form.sex} onChange={set("sex")}
                options={[{ label: "Male", value: "1" }, { label: "Female", value: "0" }]} />
            </View>
          </View>

          {/* Section: Clinical Vitals */}
          <SectionHeader title="Clinical Vitals" subtitle="Metabolic & Pressures" icon="🩸" />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <LabeledInput label="Resting BP" value={form.trestbps} onChangeText={set("trestbps")} placeholder="120 mmHg" />
            </View>
            <View className="flex-1">
              <LabeledInput label="Cholesterol" value={form.chol} onChangeText={set("chol")} placeholder="200 mg/dL" />
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <LabeledInput label="Max HR" value={form.thalach} onChangeText={set("thalach")} placeholder="150 BPM" />
            </View>
            <View className="flex-1">
              <DropdownSelect label="Fasting Sugar" value={form.fbs} onChange={set("fbs")}
                options={[{ label: "≤120 mg/dL (0)", value: "0" }, { label: ">120 mg/dL (1)", value: "1" }]} />
            </View>
          </View>

          {/* Section: Symptoms */}
          <SectionHeader title="Symptomology" subtitle="Angina Profile" icon="🫁" />
          {isTablet ? (
            <View className="flex-row gap-3">
              <View className="flex-1">
                <DropdownSelect label="Chest Pain Type (CP)" value={form.cp} onChange={set("cp")}
                  options={[
                    { label: "Typical Angina (1)", value: "1" },
                    { label: "Atypical Angina (2)", value: "2" },
                    { label: "Non-Anginal (3)", value: "3" },
                    { label: "Asymptomatic (4)", value: "4" },
                  ]} />
              </View>
              <View className="flex-1">
                <DropdownSelect label="Exercise Induced Angina" value={form.exang} onChange={set("exang")}
                  options={[{ label: "No (0)", value: "0" }, { label: "Yes (1)", value: "1" }]} />
              </View>
            </View>
          ) : (
            <>
              <DropdownSelect label="Chest Pain Type (CP)" value={form.cp} onChange={set("cp")}
                options={[
                  { label: "Typical Angina (1)", value: "1" },
                  { label: "Atypical Angina (2)", value: "2" },
                  { label: "Non-Anginal (3)", value: "3" },
                  { label: "Asymptomatic (4)", value: "4" },
                ]} />
              <DropdownSelect label="Exercise Induced Angina" value={form.exang} onChange={set("exang")}
                options={[{ label: "No (0)", value: "0" }, { label: "Yes (1)", value: "1" }]} />
            </>
          )}

          {/* Section: Diagnostics & Imaging */}
          <SectionHeader title="Diagnostics" subtitle="ECG & Imaging Data" icon="📊" />
          <DropdownSelect label="Resting ECG Results" value={form.restecg} onChange={set("restecg")}
            options={[
              { label: "Normal (0)", value: "0" },
              { label: "ST-T Wave Abnormality (1)", value: "1" },
              { label: "Left Ventricular Hypertrophy (2)", value: "2" },
            ]} />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <LabeledInput label="ST Depr. (Oldpeak)" value={form.oldpeak} onChangeText={set("oldpeak")} placeholder="0.0" keyboardType="decimal-pad" />
            </View>
            <View className="flex-1">
              <DropdownSelect label="ST Slope" value={form.slope} onChange={set("slope")}
                options={[{ label: "Upsloping (1)", value: "1" }, { label: "Flat (2)", value: "2" }, { label: "Downsloping (3)", value: "3" }]} />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <DropdownSelect label="Major Vessels (CA)" value={form.ca} onChange={set("ca")}
                options={[{ label: "0 Vessels", value: "0" }, { label: "1 Vessel", value: "1" }, { label: "2 Vessels", value: "2" }, { label: "3 Vessels", value: "3" }]} />
            </View>
            <View className="flex-1">
              <DropdownSelect label="Thalassemia (Thal)" value={form.thal} onChange={set("thal")}
                options={[
                  { label: "Normal (3)", value: "3" },
                  { label: "Fixed Defect (6)", value: "6" },
                  { label: "Reversible (7)", value: "7" },
                ]} />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="w-full bg-neutral-950 dark:bg-white rounded-full py-4 items-center justify-center mt-6 shadow-xs"
            style={{ opacity: loading ? 0.6 : 1 }}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={isDark ? "#000000" : "#ffffff"} />
            ) : (
              <Text className="text-white dark:text-black text-sm font-bold tracking-wide">
                Calculate Risk →
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Results Card */}
        {result && risk && (
          <View className="mx-4 mt-10">
            <View className="flex-row items-center justify-center mb-6">
              <View className="h-px flex-1 bg-neutral-200 dark:bg-white/[0.08]" />
              <Text className="mx-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Inference Complete</Text>
              <View className="h-px flex-1 bg-neutral-200 dark:bg-white/[0.08]" />
            </View>

            <View className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-6 border border-neutral-200/80 dark:border-white/[0.08] shadow-xs">
              <View className="items-center mb-6">
                <ModernRiskGauge
                  percentage={pct}
                  risk={risk}
                  isDark={isDark}
                  size={180}
                />
              </View>

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 bg-[#F8F9FA] dark:bg-black rounded-2xl p-4 border border-neutral-200/60 dark:border-white/[0.08]">
                  <Text className="text-[10px] font-bold text-neutral-400 uppercase mb-1 tracking-widest">Diagnosis Output</Text>
                  <Text className="text-base font-black text-neutral-950 dark:text-white">
                    {result.prediction === 1 ? "Positive Risk" : "Negative Risk"}
                  </Text>
                </View>
                <View className="flex-1 bg-[#F8F9FA] dark:bg-black rounded-2xl p-4 border border-neutral-200/60 dark:border-white/[0.08]">
                  <Text className="text-[10px] font-bold text-neutral-400 uppercase mb-1 tracking-widest">Risk Stratification</Text>
                  <Text className="text-base font-black" style={{ color: risk.color }}>{risk.label}</Text>
                </View>
              </View>

              {result.llm_analysis ? (
                <View className="bg-[#F8F9FA] dark:bg-black rounded-2xl p-4 border border-neutral-200/60 dark:border-white/[0.08]">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Clinical Synthesis</Text>
                    <View className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/40 rounded border border-purple-200 dark:border-purple-900/50">
                      <Text className="text-[9px] font-bold text-purple-700 dark:text-purple-400 uppercase">AI GUIDANCE</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                    {result.llm_analysis}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
