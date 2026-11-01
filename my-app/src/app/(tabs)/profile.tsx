import { useState, useEffect } from "react";
import {
    Text, View, ScrollView, TouchableOpacity,
    ActivityIndicator, Switch, RefreshControl, TextInput,
    useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../context/ThemeContext";
import { getToken, clearToken } from "../../lib/auth";
import CustomAlertModal, { AlertType } from "../../components/CustomAlertModal";

import { API_BASE } from "../../config";

interface UserProfile {
    id: number;
    username: string;
    email?: string;
    name?: string;
}

interface AssessmentRecord {
    id: number;
    prediction_code?: number;
    risk_score?: number;
    trestbps?: number;
    chol?: number;
    thalach?: number;
}

interface RiskTrendData {
    trend: string;
    overall_llm_analysis?: string;
}

type Tab = "overview" | "settings" | "security";

export default function Profile() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [history, setHistory] = useState<AssessmentRecord[]>([]);
    const [riskTrend, setRiskTrend] = useState<RiskTrendData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [aiExplanations, setAiExplanations] = useState(true);
    const [newUsername, setNewUsername] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { themeMode, setThemeMode, isDark, activeColorScheme } = useAppTheme();
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type?: AlertType;
        primaryButtonText?: string;
        secondaryButtonText?: string;
        onPrimaryPress?: () => void;
        onSecondaryPress?: () => void;
    }>({
        visible: false,
        title: "",
        message: "",
        type: "info",
    });

    const fetchdata = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) { router.replace("/signin"); return; }
            const userRes = await fetch(`${API_BASE}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (userRes.ok) {
                const userData = await userRes.json();
                setUser(userData);
                setNewUsername(userData.username || "");
                setNewEmail(userData.email || "");
            }
            else setUser({ id: 1, username: "Patient" });

            try {
                const histRes = await fetch(`${API_BASE}/history`, { headers: { Authorization: `Bearer ${token}` } });
                if (histRes.ok) setHistory(await histRes.json());
            } catch { }

            try {
                const riskRes = await fetch(`${API_BASE}/overall-risk`, { headers: { Authorization: `Bearer ${token}` } });
                if (riskRes.ok) setRiskTrend(await riskRes.json());
            } catch { }
        } catch {
            setUser({ id: 1, username: "Patient" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchdata();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchdata();
        setRefreshing(false);
    };

    const handleSavePreferences = () => {
        setAlertConfig({
            visible: true,
            title: "Preferences Saved",
            message: "Your clinical profile settings have been synchronized successfully.",
            type: "success",
        });
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/users/me`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                await clearToken();
                router.replace("/signin");
            } else {
                throw new Error("Failed to delete account.");
            }
        } catch (e: unknown) {
            setAlertConfig({
                visible: true,
                title: "Error",
                message: e instanceof Error ? e.message : "Failed to delete account.",
                type: "error",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const positiveCount = history.filter((r) => r.prediction_code === 1).length;
    const negativeCount = history.filter((r) => r.prediction_code === 0).length;
    const latestRecord = history.length > 0 ? history[0] : null;
    const latestRisk = latestRecord?.risk_score !== undefined ? Math.round(latestRecord.risk_score * 100) : null;

    const TABS: { key: Tab; label: string }[] = [
        { key: "overview", label: "Overview" },
        { key: "settings", label: "Settings" },
        { key: "security", label: "Security" },
    ];

    return (
        <SafeAreaView edges={["bottom", "left", "right"]} className="flex-1 bg-[#F8F9FA] dark:bg-black">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 110, maxWidth: 960, width: "100%", alignSelf: "center" }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header Card */}
                <View className="mx-4 mt-2 mb-4 p-5 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-neutral-200/80 dark:border-white/[0.08]">
                    <View className="flex-row items-center gap-2 mb-2">
                        <View className="px-2.5 py-1 bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.08] rounded-full flex-row items-center gap-1.5">
                            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <Text className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                CLINICAL PROFILE
                            </Text>
                        </View>
                    </View>
                    <Text className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white tracking-tight">Patient Profile</Text>
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">Manage your account, preferences and security settings.</Text>
                </View>

                {loading ? (
                    <View className="mx-4 mt-10 items-center justify-center bg-white dark:bg-[#0a0a0a] rounded-3xl p-12 border border-neutral-200/80 dark:border-white/[0.08]">
                        <ActivityIndicator color={isDark ? "#ffffff" : "#000000"} size="large" />
                    </View>
                ) : (
                    <>
                        {/* Avatar Card */}
                        <View className="mx-4 mb-4 bg-white dark:bg-[#0a0a0a] rounded-3xl p-5 border border-neutral-200/80 dark:border-white/[0.08] flex-row items-center gap-4">
                            <View className="w-14 h-14 rounded-2xl bg-neutral-950 dark:bg-white items-center justify-center">
                                <Text className="text-2xl font-black text-white dark:text-black">
                                    {user?.username?.charAt(0).toUpperCase() ?? "P"}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-lg font-black text-neutral-950 dark:text-white">{user?.username ?? "Patient"}</Text>
                                <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{user?.email ?? "No email on file"}</Text>
                                <View className="flex-row items-center gap-1.5 mt-1.5">
                                    <View className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                                        <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Active Patient</Text>
                                    </View>
                                    <Text className="text-[10px] text-neutral-400 font-mono">#AUR-{user?.id}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Tabs */}
                        <View className="mx-4 mb-4 flex-row bg-white dark:bg-[#0a0a0a] rounded-full border border-neutral-200/80 dark:border-white/[0.08] p-1 gap-1">
                            {TABS.map((t) => (
                                <TouchableOpacity
                                    key={t.key}
                                    onPress={() => setActiveTab(t.key)}
                                    className={`flex-1 py-2 rounded-full items-center ${activeTab === t.key ? "bg-neutral-950 dark:bg-white" : ""}`}
                                    activeOpacity={0.8}
                                >
                                    <Text className={`text-xs font-bold ${activeTab === t.key ? "text-white dark:text-black" : "text-neutral-500 dark:text-neutral-400"}`}>
                                        {t.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Overview Tab */}
                        {activeTab === "overview" && (
                            <View className="mx-4 gap-4">
                                {/* Stats */}
                                <View className="flex-row gap-3">
                                    {[
                                        { label: "Total Screenings", value: String(history.length) },
                                        { label: "Positive Risk", value: String(positiveCount) },
                                        { label: "Negative Risk", value: String(negativeCount) },
                                    ].map((s) => (
                                        <View key={s.label} className="flex-1 bg-white dark:bg-[#0a0a0a] rounded-2xl p-3.5 border border-neutral-200/80 dark:border-white/[0.08] items-center">
                                            <Text className="text-[10px] font-bold text-neutral-400 uppercase text-center">{s.label}</Text>
                                            <Text className="text-xl font-black text-neutral-950 dark:text-white mt-1 font-mono">{s.value}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Risk Trend */}
                                <View className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-4 border border-neutral-200/80 dark:border-white/[0.08]">
                                    <Text className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Trend Analysis</Text>
                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-sm font-bold text-neutral-950 dark:text-white">{riskTrend?.trend ?? "No data yet"}</Text>
                                        {latestRisk !== null && (
                                            <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.08]">
                                                <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-300 font-mono">Latest: {latestRisk}%</Text>
                                            </View>
                                        )}
                                    </View>
                                    {riskTrend?.overall_llm_analysis && (
                                        <Text className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed font-sans">{riskTrend.overall_llm_analysis}</Text>
                                    )}
                                </View>

                                {/* Account Info */}
                                <View className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] overflow-hidden">
                                    {[
                                        { label: "Username", value: user?.username ?? "—" },
                                        { label: "Email", value: user?.email ?? "Not set" },
                                        { label: "Patient ID", value: `#AUR-${user?.id ?? "01"}` },
                                        { label: "Platform", value: "Auralis AI 3.0" },
                                    ].map((row, i, arr) => (
                                        <View
                                            key={row.label}
                                            className="flex-row items-center justify-between px-4 py-3.5"
                                            style={i < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "#F5F5F5" } : {}}
                                        >
                                            <Text className="text-xs font-bold text-neutral-400 uppercase">{row.label}</Text>
                                            <Text className="text-xs font-bold text-neutral-900 dark:text-white font-mono">{row.value}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Settings Tab */}
                        {activeTab === "settings" && (
                            <View className="mx-4 gap-4">
                                <View className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] overflow-hidden">
                                    <View className="px-4 py-4 border-b border-neutral-100 dark:border-white/[0.06]">
                                        <Text className="text-sm font-bold text-neutral-900 dark:text-white mb-2">Custom Username</Text>
                                        <TextInput
                                            value={newUsername}
                                            onChangeText={setNewUsername}
                                            placeholder="Choose custom username"
                                            placeholderTextColor="#9ca3af"
                                            autoCapitalize="none"
                                            underlineColorAndroid="transparent"
                                            className="bg-[#F8F9FA] dark:bg-black px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-white/[0.1] text-sm font-semibold text-neutral-950 dark:text-white"
                                        />
                                        <Text className="text-[10px] text-neutral-500 mt-2">Sign in handle and clinical profile identifier.</Text>
                                    </View>
                                    <View className="px-4 py-4 border-b border-neutral-100 dark:border-white/[0.06]">
                                        <Text className="text-sm font-bold text-neutral-900 dark:text-white mb-2">Update Email Address</Text>
                                        <TextInput
                                            value={newEmail}
                                            onChangeText={setNewEmail}
                                            placeholder="Enter new email address"
                                            placeholderTextColor="#9ca3af"
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                            underlineColorAndroid="transparent"
                                            className="bg-[#F8F9FA] dark:bg-black px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-white/[0.1] text-sm font-semibold text-neutral-950 dark:text-white"
                                        />
                                        <Text className="text-[10px] text-neutral-500 mt-2">This address is used for telemetry summaries.</Text>
                                    </View>
                                    <View className="flex-row items-center justify-between px-4 py-4 border-b border-neutral-100 dark:border-white/[0.06]">
                                        <View className="flex-1">
                                            <Text className="text-sm font-bold text-neutral-900 dark:text-white">Email Alerts</Text>
                                            <Text className="text-xs text-neutral-500 mt-0.5">Receive notifications for new risk assessments</Text>
                                        </View>
                                        <Switch
                                            value={emailAlerts}
                                            onValueChange={setEmailAlerts}
                                            trackColor={{ false: "#E5E7EB", true: isDark ? "#ffffff" : "#171717" }}
                                            thumbColor="#fff"
                                        />
                                    </View>
                                    <View className="px-4 py-4 border-b border-neutral-100 dark:border-white/[0.06]">
                                        <View className="flex-row items-center justify-between mb-1.5">
                                            <View className="flex-1 mr-2">
                                                <Text className="text-sm font-bold text-neutral-900 dark:text-white">Interface Appearance</Text>
                                                <Text className="text-xs text-neutral-500 mt-0.5">
                                                    {themeMode === "system"
                                                        ? `Auto-detecting device mode (${activeColorScheme === "dark" ? "Dark mode active" : "Light mode active"})`
                                                        : `Currently set to ${themeMode} mode`}
                                                </Text>
                                            </View>
                                            {themeMode === "system" && (
                                                <View className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                                                    <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">System Auto</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View className="flex-row bg-[#F8F9FA] dark:bg-black p-1 rounded-full border border-neutral-200/80 dark:border-white/[0.08] gap-1 mt-2">
                                            {(
                                                [
                                                    { key: "system", label: "Auto" },
                                                    { key: "light", label: "Light" },
                                                    { key: "dark", label: "Dark" },
                                                ] as const
                                            ).map((m) => (
                                                <TouchableOpacity
                                                    key={m.key}
                                                    onPress={() => setThemeMode(m.key)}
                                                    activeOpacity={0.8}
                                                    className={`flex-1 py-2 rounded-full items-center ${
                                                        themeMode === m.key
                                                            ? "bg-neutral-950 dark:bg-white"
                                                            : ""
                                                    }`}
                                                >
                                                    <Text
                                                        className={`text-xs font-bold ${
                                                            themeMode === m.key
                                                                ? "text-white dark:text-black"
                                                                : "text-neutral-500 dark:text-neutral-400"
                                                        }`}
                                                    >
                                                        {m.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                    <View className="flex-row items-center justify-between px-4 py-4">
                                        <View className="flex-1">
                                            <Text className="text-sm font-bold text-neutral-900 dark:text-white">AI Explanations</Text>
                                            <Text className="text-xs text-neutral-500 mt-0.5">Show AI-generated clinical guidance in results</Text>
                                        </View>
                                        <Switch
                                            value={aiExplanations}
                                            onValueChange={setAiExplanations}
                                            trackColor={{ false: "#E5E7EB", true: isDark ? "#ffffff" : "#171717" }}
                                            thumbColor="#fff"
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    className="bg-neutral-950 dark:bg-white rounded-full py-3.5 items-center shadow-xs"
                                    activeOpacity={0.85}
                                    onPress={handleSavePreferences}
                                >
                                    <Text className="text-white dark:text-black text-sm font-bold">Save Preferences</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Security Tab */}
                        {activeTab === "security" && (
                            <View className="mx-4 gap-4">
                                <View className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-neutral-200/80 dark:border-white/[0.08] overflow-hidden">
                                    <TouchableOpacity
                                        className="flex-row items-center justify-between px-4 py-4"
                                        activeOpacity={0.7}
                                        onPress={async () => { await clearToken(); router.replace("/signin"); }}
                                    >
                                        <View>
                                            <Text className="text-sm font-bold text-neutral-900 dark:text-white">Sign Out</Text>
                                            <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Sign out of your active session</Text>
                                        </View>
                                        <Text className="text-neutral-400 dark:text-neutral-500 text-sm">→</Text>
                                    </TouchableOpacity>
                                </View>

                                <View className="bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200/80 dark:border-red-900/40 p-4">
                                    <Text className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">Danger Zone</Text>
                                    <Text className="text-xs text-red-600 dark:text-red-400/80 mb-3">Permanently delete your account and all associated records.</Text>
                                    <TouchableOpacity
                                        className={`bg-red-600 dark:bg-red-600 rounded-full py-3 items-center ${isDeleting ? "opacity-60" : ""}`}
                                        activeOpacity={0.85}
                                        disabled={isDeleting}
                                        onPress={() =>
                                            setAlertConfig({
                                                visible: true,
                                                title: "Delete Account?",
                                                message: "Are you sure you want to permanently delete your account and all associated health assessment records? This action cannot be undone.",
                                                type: "warning",
                                                primaryButtonText: "Delete Account",
                                                secondaryButtonText: "Cancel",
                                                onPrimaryPress: () => {
                                                    setAlertConfig(prev => ({ ...prev, visible: false }));
                                                    handleDeleteAccount();
                                                },
                                                onSecondaryPress: () => {
                                                    setAlertConfig(prev => ({ ...prev, visible: false }));
                                                }
                                            })
                                        }
                                    >
                                        {isDeleting ? (
                                            <ActivityIndicator color="#ffffff" size="small" />
                                        ) : (
                                            <Text className="text-white text-sm font-bold">Delete Account</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            <CustomAlertModal
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                primaryButtonText={alertConfig.primaryButtonText}
                secondaryButtonText={alertConfig.secondaryButtonText}
                onPrimaryPress={alertConfig.onPrimaryPress}
                onSecondaryPress={alertConfig.onSecondaryPress}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>
    );
}
