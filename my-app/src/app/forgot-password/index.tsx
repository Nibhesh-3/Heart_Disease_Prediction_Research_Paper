import { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  Image,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from "react-native-svg";

import { API_BASE } from "../../config";

// Comprehensive email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

function KeyLockIcon({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="lockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#f43f5e" />
          <Stop offset="100%" stopColor="#be123c" />
        </LinearGradient>
        <LinearGradient id="lockFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#ffe4e6" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#fecdd3" stopOpacity="0.3" />
        </LinearGradient>
      </Defs>
      {/* Lock Shackle */}
      <Path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke="url(#lockGrad)"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lock Body */}
      <Rect
        x="4"
        y="11"
        width="16"
        height="10"
        rx="3"
        fill="url(#lockFill)"
        stroke="url(#lockGrad)"
        strokeWidth={2}
      />
      {/* Keyhole */}
      <Circle cx="12" cy="15.5" r="1.5" fill="#be123c" />
      <Path d="M12 17v2" stroke="#be123c" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function SuccessCheckIcon({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#10b981" />
          <Stop offset="100%" stopColor="#047857" />
        </LinearGradient>
        <LinearGradient id="checkFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#d1fae5" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#a7f3d0" stopOpacity="0.3" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="10" fill="url(#checkFill)" stroke="url(#checkGrad)" strokeWidth={2} />
      <Path
        d="M8 12.5l2.5 2.5 5.5-5.5"
        stroke="url(#checkGrad)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function ForgotPassword() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Focus states
  const [emailFocused, setEmailFocused] = useState(false);
  const [newPwdFocused, setNewPwdFocused] = useState(false);
  const [confirmPwdFocused, setConfirmPwdFocused] = useState(false);

  // Real-time email validation check
  const isEmailTouched = email.trim().length > 0;
  const isEmailValid = isValidEmail(email);

  const handleResetPassword = async () => {
    const cleanEmail = email.trim();
    const cleanPwd = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address (e.g. name@example.com).");
      return;
    }

    if (!cleanPwd) {
      setError("Please enter a new password.");
      return;
    }
    if (cleanPwd.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (cleanPwd !== cleanConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_or_username: cleanEmail,
          new_password: cleanPwd,
          confirm_password: cleanConfirm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to reset password. Please check your email.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const getBorderColor = (isFocused: boolean, touched: boolean, isValid: boolean, defaultColor: string) => {
    if (touched && !isValid && isFocused) return "#ef4444";
    if (touched && !isValid && !isFocused) return "#f87171";
    if (touched && isValid && isFocused) return "#10b981";
    if (touched && isValid && !isFocused) return "#34d399";
    return isFocused ? "#6366f1" : defaultColor;
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-[#050505]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: "100%",
            maxWidth: isTablet ? 520 : "100%",
            paddingHorizontal: 24,
          }}
        >
          {/* Top Back Nav Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="flex-row items-center gap-2 mb-8 self-start py-2 px-3 -ml-3 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm"
          >
            <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-300">← Back to Sign In</Text>
          </TouchableOpacity>

          {/* Branding */}
          <View className="mb-8 flex-row items-center justify-center gap-3">
            <Image
              source={require("../../../assets/images/app-logo.png")}
              style={{ width: 36, height: 36, borderRadius: 10 }}
              resizeMode="contain"
            />
            <View>
              <Text className="text-xl font-extrabold text-neutral-900 dark:text-white">Auralis</Text>
              <Text className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 tracking-[1.5px] mt-0.5">
                CARDIOVASCULAR AI TELEMETRY
              </Text>
            </View>
          </View>

          {/* Main Card */}
          <View className="bg-white dark:bg-[#121212] rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-200/60 dark:border-neutral-800/60">
            {/* Icon Header */}
            <View className="mb-8 items-center">
              <View className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 items-center justify-center mb-4 shadow-sm">
                {success ? <SuccessCheckIcon size={34} /> : <KeyLockIcon size={34} />}
              </View>
              <Text className="text-2xl font-extrabold text-neutral-900 dark:text-white text-center">
                {success ? "Password Reset Complete" : "Reset Password"}
              </Text>
              <Text className="text-sm text-neutral-500 dark:text-neutral-400 text-center mt-2 max-w-xs leading-5">
                {success
                  ? "Your credentials have been securely updated. You can now log into your account."
                  : "Enter your registered email address to verify your account and set a new password."}
              </Text>
            </View>

            {/* Success Screen State */}
            {success ? (
              <View className="mt-2">
                <View className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl mb-8 shadow-sm">
                  <Text className="text-xs text-emerald-800 dark:text-emerald-300 leading-5 text-center font-medium">
                    ✓ Your new password is now active. You can now sign in with your updated credentials.
                  </Text>
                </View>

                <TouchableOpacity
                  className="bg-neutral-900 dark:bg-white rounded-xl py-4 items-center justify-center shadow-md"
                  onPress={() => router.replace("/signin")}
                  activeOpacity={0.85}
                >
                  <Text className="text-white dark:text-black text-sm font-bold tracking-wide">Proceed to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Reset Form */
              <View>
                {/* Error Message */}
                {error ? (
                  <View className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl shadow-sm">
                    <Text className="text-xs font-medium text-red-600 dark:text-red-400 text-center">{error}</Text>
                  </View>
                ) : null}

                {/* Registered Email Input */}
                <View className="mb-5">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 tracking-[1.5px] uppercase">
                      Registered Email
                    </Text>
                    {isEmailTouched && (
                      <View className="flex-row items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-800">
                        <View
                          className="w-1.5 h-1.5 rounded-full shadow-sm"
                          style={{ backgroundColor: isEmailValid ? "#10b981" : "#ef4444" }}
                        />
                        <Text
                          className="text-[9px] font-bold uppercase tracking-wider"
                          style={{ color: isEmailValid ? "#059669" : "#dc2626" }}
                        >
                          {isEmailValid ? "Valid" : "Invalid"}
                        </Text>
                      </View>
                    )}
                  </View>
                  <TextInput
                    className="border rounded-xl px-4 py-3.5 text-sm text-neutral-900 dark:text-white bg-white dark:bg-[#161616]"
                    style={{
                      borderColor: getBorderColor(emailFocused, isEmailTouched, isEmailValid, "#e5e5e5"),
                      borderWidth: emailFocused ? 1.5 : 1,
                      backgroundColor: Platform.OS === 'ios' && emailFocused ? '#fafafa' : undefined,
                    }}
                    placeholder="name@example.com"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (error) setError("");
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>

                {/* New Password Input */}
                <View className="mb-5">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 tracking-[1.5px] uppercase">
                      New Password
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                      className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700"
                    >
                      <Text className="text-[9px] font-bold text-neutral-600 dark:text-neutral-300 tracking-[1px] uppercase">
                        {showPassword ? "HIDE" : "SHOW"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    className="border rounded-xl px-4 py-3.5 text-sm text-neutral-900 dark:text-white bg-white dark:bg-[#161616]"
                    style={{
                      borderColor: newPwdFocused ? "#6366f1" : "#e5e5e5",
                      borderWidth: newPwdFocused ? 1.5 : 1,
                    }}
                    placeholder="Minimum 6 characters"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      if (error) setError("");
                    }}
                    onFocus={() => setNewPwdFocused(true)}
                    onBlur={() => setNewPwdFocused(false)}
                  />
                </View>

                {/* Confirm New Password Input */}
                <View className="mb-8">
                  <Text className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 tracking-[1.5px] mb-2 uppercase">
                    Confirm New Password
                  </Text>
                  <TextInput
                    className="border rounded-xl px-4 py-3.5 text-sm text-neutral-900 dark:text-white bg-white dark:bg-[#161616]"
                    style={{
                      borderColor: confirmPwdFocused ? "#6366f1" : "#e5e5e5",
                      borderWidth: confirmPwdFocused ? 1.5 : 1,
                    }}
                    placeholder="Re-type new password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (error) setError("");
                    }}
                    onFocus={() => setConfirmPwdFocused(true)}
                    onBlur={() => setConfirmPwdFocused(false)}
                  />
                </View>

                {/* Reset Password Button */}
                <TouchableOpacity
                  className="bg-neutral-900 dark:bg-white rounded-xl py-4 items-center justify-center shadow-md"
                  style={{ opacity: loading ? 0.7 : 1, ...Platform.select({ android: { elevation: 4 }, default: {} }) }}
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={Platform.OS === 'ios' ? '#888' : '#000'} size="small" />
                  ) : (
                    <Text className="text-white dark:text-black text-sm font-bold tracking-wide">Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Back to Sign In Link (Moved below the card for cleaner separation) */}
          {!success && (
            <View className="flex-row justify-center items-center mt-8">
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">Remember your password? </Text>
              <Link href="/signin" asChild>
                <TouchableOpacity activeOpacity={0.7} className="px-2 py-1">
                  <Text className="text-sm font-bold text-neutral-900 dark:text-white">
                    Sign In
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

