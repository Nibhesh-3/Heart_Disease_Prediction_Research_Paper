import { API_BASE } from "../../config";
import { useState, useEffect } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Image,
  useWindowDimensions,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

if (Platform.OS !== "web") {
  GoogleSignin.configure({
    webClientId:
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
      "969098472980-0n6u2tbrk9j6g14je8sduu1pr19gaqum.apps.googleusercontent.com",
    iosClientId:
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
      "969098472980-213deq4egm8ab4kcgaq9vkkdkps7lhqs.apps.googleusercontent.com",
    offlineAccess: true,
    forceCodeForRefreshToken: false,
  });
}

export default function Signup() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768 || (Platform.OS === "ios" && Boolean((Platform as any).isPad));

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const promptAsync = async () => {
    try {
      setGoogleLoading(true);
      setError("");
      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      // Force account chooser by clearing any cached Google session on device
      try {
        await GoogleSignin.signOut();
      } catch (_) {}
      const userInfo = await GoogleSignin.signIn();
      // Supports both v13+ (userInfo.data.idToken) and older versions (userInfo.idToken)
      const idToken = (userInfo as any).data?.idToken || (userInfo as any).idToken;
      if (idToken) {
        await handleGoogleLogin({ id_token: idToken });
      } else {
        setError("Failed to get ID token from Google.");
      }
    } catch (error: any) {
      if (error.code === 'SIGN_IN_CANCELLED' || error.code === '12501') {
        // user cancelled the login flow
      } else if (error.code === 'IN_PROGRESS') {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        setError("Google Play Services not available or outdated.");
      } else if (error.code === 'DEVELOPER_ERROR' || error.code === '10' || error.message?.includes('DEVELOPER_ERROR')) {
        setError("Google Sign-In configuration error: Please register the EAS Keystore SHA-1 fingerprint in Google Cloud Console.");
      } else {
        setError(error.message || "Google Sign-Up failed.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async (payload: { id_token?: string; access_token?: string }) => {
    setError("");
    try {
      const res = await fetch(API_BASE + "/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let errMsg = "Google authentication failed on server.";
        try {
          const data = await res.json();
          errMsg = data.detail || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      await AsyncStorage.setItem("access_token", data.access_token);
      router.replace("/(tabs)/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const handleSubmit = async () => {
    setError("");
    const cleanEmail = email.trim();
    if (!username.trim() || !cleanEmail || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address (e.g. name@example.com).");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_BASE + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email: cleanEmail, password }),
      });
      if (!response.ok) {
        let errMsg = "Failed to create account";
        try {
          const data = await response.json();
          errMsg = data.detail || errMsg;
        } catch {
          errMsg = "Server error during registration. Please try again.";
        }
        throw new Error(errMsg);
      }

      // Auto-login on successful registration
      try {
        const tokenForm = new URLSearchParams();
        tokenForm.append("username", username);
        tokenForm.append("password", password);
        const tokenRes = await fetch(API_BASE + "/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: tokenForm.toString(),
        });
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          await AsyncStorage.setItem("access_token", tokenData.access_token);
          router.replace("/(tabs)/home");
          return;
        }
      } catch {
        // Fallback to signin screen if auto-token fails
      }
      router.replace("/signin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-[#0a0a0a]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: isTablet ? 40 : 20,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: "100%",
            maxWidth: isTablet ? 500 : "100%",
            paddingHorizontal: isTablet ? 0 : 20,
          }}
        >
          <View
            className={
              isTablet
                ? "bg-white dark:bg-[#141414] rounded-3xl p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm"
                : "py-6"
            }
          >
            {/* Branding */}
            <View className="mb-8 flex-row items-center gap-3.5">
              <Image
                source={require("../../../assets/images/app-logo.png")}
                style={{ width: 44, height: 44, borderRadius: 12 }}
                resizeMode="contain"
              />
              <View>
                <Text className="text-[22px] font-extrabold text-neutral-900 dark:text-white">Auralis</Text>
                <Text className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 tracking-[1.5px] mt-0.5">
                  CARDIOVASCULAR AI TELEMETRY
                </Text>
              </View>
            </View>

            {/* Title */}
            <View className="mb-6">
              <Text className="text-3xl font-extrabold text-neutral-900 dark:text-white">Create Account</Text>
              <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 leading-5">
                Register to begin logging clinical assessments and SHAP feature breakdowns.
              </Text>
            </View>

            {/* Error */}
            {error ? (
              <View className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
                <Text className="text-sm text-red-600 dark:text-red-300 font-medium">{error}</Text>
              </View>
            ) : null}

            {/* Username */}
            <View className="mb-4">
              <Text className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 tracking-[1.2px] mb-1.5">USERNAME</Text>
              <TextInput
                className="border border-neutral-300 dark:border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-900 dark:text-white bg-white dark:bg-[#161616]"
                placeholder="johndoe"
                placeholderTextColor="#737373"
                autoCapitalize="none"
                underlineColorAndroid="transparent"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 tracking-[1.2px] mb-1.5">EMAIL ADDRESS</Text>
              <TextInput
                className="border border-neutral-300 dark:border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-900 dark:text-white bg-white dark:bg-[#161616]"
                placeholder="name@example.com"
                placeholderTextColor="#737373"
                autoCapitalize="none"
                keyboardType="email-address"
                underlineColorAndroid="transparent"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password */}
            <View className="mb-4">
              <Text className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 tracking-[1.2px] mb-1.5">PASSWORD</Text>
              <TextInput
                className="border border-neutral-300 dark:border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-900 dark:text-white bg-white dark:bg-[#161616]"
                placeholder="••••••••"
                placeholderTextColor="#737373"
                secureTextEntry
                underlineColorAndroid="transparent"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Confirm Password */}
            <View className="mb-6">
              <Text className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 tracking-[1.2px] mb-1.5">CONFIRM PASSWORD</Text>
              <TextInput
                className="border border-neutral-300 dark:border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-900 dark:text-white bg-white dark:bg-[#161616]"
                placeholder="••••••••"
                placeholderTextColor="#737373"
                secureTextEntry
                underlineColorAndroid="transparent"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              className="bg-neutral-900 dark:bg-white rounded-xl py-3.5 items-center justify-center"
              style={{ opacity: loading ? 0.5 : 1, ...Platform.select({ android: { elevation: 3 }, default: {} }) }}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Platform.OS === 'ios' ? '#888' : '#000'} />
              ) : (
                <Text className="text-white dark:text-black text-sm font-bold">Sign Up</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
              <Text className="mx-3 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 tracking-[1.2px]">
                OR CONTINUE WITH
              </Text>
              <View className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              className="flex-row items-center justify-center border border-neutral-300 dark:border-neutral-700 rounded-xl py-3 bg-white dark:bg-[#161616]"
              style={{ opacity: googleLoading ? 0.5 : 1, ...Platform.select({ android: { elevation: 1 }, default: {} }) }}
              activeOpacity={0.85}
              disabled={googleLoading}
              onPress={promptAsync}
            >
              {googleLoading ? (
                <ActivityIndicator color="#4285F4" />
              ) : (
                <>
                  <View className="w-5 h-5 rounded-full bg-white border border-neutral-200 items-center justify-center mr-2.5">
                    <Text className="text-xs font-bold" style={{ color: "#4285F4" }}>G</Text>
                  </View>
                  <Text className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Sign up with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-sm text-neutral-600 dark:text-neutral-400">Already have an account? </Text>
              <Link href="/signin">
                <Text className="text-sm font-bold text-neutral-900 dark:text-white">
                  Sign In
                </Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
