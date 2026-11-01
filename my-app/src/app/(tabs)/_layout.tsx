import { Tabs, useRouter } from "expo-router";
import { CustomTabBar } from "../../components/navigation/CustomTabBar";
import { TouchableOpacity, View, Text, Platform } from "react-native";
import Svg, { Path } from "react-native-svg";
import { clearToken, getToken } from "../../lib/auth";
import { useState, useEffect } from "react";
import { API_BASE } from "../../config";
import { useAppTheme } from "../../context/ThemeContext";
import '../../../global.css';

export default function TabsLayout() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const [username, setUsername] = useState("P");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await getToken();
        if (token) {
          const userRes = await fetch(`${API_BASE}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            if (userData?.username) {
              setUsername(userData.username.charAt(0).toUpperCase());
            }
          }
        }
      } catch (err) { }
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await clearToken();
    router.replace("/signin");
  };

  const bgColor = isDark ? "#000000" : "#f8f9fa";
  const textColor = isDark ? "#ffffff" : "#0a0a0a";

  return (
    <Tabs
      tabBar={(props: any) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerTitle: "",
        headerStyle: {
          backgroundColor: bgColor,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerLeft: () => (
          <View className="ml-5 flex-row items-center gap-2">
            <View className="w-7 h-7 rounded-lg bg-neutral-950 dark:bg-white items-center justify-center shadow-xs">
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path
                  fill={isDark ? "#000000" : "#ffffff"}
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </Svg>
            </View>
            <Text
              style={{ color: textColor }}
              className="text-xl font-black tracking-tight"
            >
              Auralis
            </Text>
            <View className="px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-white/10 border border-neutral-300/40 dark:border-white/10">
              <Text className="text-[9px] font-bold text-neutral-600 dark:text-neutral-400">
                AI 3.0
              </Text>
            </View>
          </View>
        ),
        headerRight: () => (
          <View className="flex-row items-center mr-5 gap-2">
            <TouchableOpacity
              onPress={handleSignOut}
              activeOpacity={0.7}
              className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
            >
              <Text className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">Sign Out</Text>
            </TouchableOpacity>
            <View className="w-7 h-7 rounded-full bg-neutral-950 dark:bg-white items-center justify-center">
              <Text className="text-xs font-bold text-white dark:text-neutral-950">{username}</Text>
            </View>
          </View>
        ),
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="healthdata" options={{ title: "Screening" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="analysis" options={{ title: "Analysis" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
