import "../../global.css";
import React, { useEffect } from "react";
import { View, Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import { useUpdates } from "expo-updates";
import * as WebBrowser from "expo-web-browser";

import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { ThemeProvider, useAppTheme } from "../context/ThemeContext";

WebBrowser.maybeCompleteAuthSession();

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

function RootContent() {
  const { isDark } = useAppTheme();
  const { isUpdatePending } = useUpdates();

  // EAS Updates: Automatically reload when an update has finished downloading
  useEffect(() => {
    if (isUpdatePending) {
      console.log("⚡ EAS OTA Update downloaded! Reloading app...");
      Updates.reloadAsync();
    }
  }, [isUpdatePending]);

  // EAS Updates: Proactively check and fetch updates on app launch
  useEffect(() => {
    async function checkOTAUpdates() {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          console.log("📦 New EAS Update available. Fetching in background...");
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        console.log("OTA update check error:", e);
      }
    }
    checkOTAUpdates();
  }, []);

  return (
    <View className={`flex-1 ${isDark ? "dark" : ""}`}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootContent />
    </ThemeProvider>
  );
}



