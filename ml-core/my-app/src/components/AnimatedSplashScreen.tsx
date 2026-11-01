import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  useColorScheme,
  useWindowDimensions,
  Platform,
} from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import * as SplashScreen from "expo-splash-screen";

// Prevent native splash screen from auto-hiding before our animation starts
SplashScreen.preventAutoHideAsync().catch(() => {});

interface AnimatedSplashScreenProps {
  onFinish?: () => void;
  children: React.ReactNode;
}

export default function AnimatedSplashScreen({ onFinish, children }: AnimatedSplashScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { width } = useWindowDimensions();

  const [isSplashComplete, setIsSplashComplete] = useState(false);

  // Animation values
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const pulseRingScale = useRef(new Animated.Value(0.9)).current;
  const pulseRingOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(18)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const ecgProgress = useRef(new Animated.Value(0)).current;
  const splashContainerOpacity = useRef(new Animated.Value(1)).current;
  const splashContainerScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hide the native OS splash screen once the component mounts
    SplashScreen.hideAsync().catch(() => {});

    // Orchestrated entry animation sequence
    const animSequence = Animated.sequence([
      // 1. Initial fade-in & pop-in of heart logo and background glow
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: isDark ? 0.35 : 0.25,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 1.25,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]),

      // 2. Heartbeat "lub-dub" double pulse effect + pulse ring expansion + ECG draw
      Animated.parallel([
        // Heartbeat bounce 1 & 2
        Animated.sequence([
          // Beat 1 (lub)
          Animated.timing(logoScale, {
            toValue: 1.14,
            duration: 130,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
          Animated.timing(logoScale, {
            toValue: 0.98,
            duration: 110,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
          // Beat 2 (dub)
          Animated.timing(logoScale, {
            toValue: 1.18,
            duration: 140,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
          Animated.timing(logoScale, {
            toValue: 1.0,
            duration: 220,
            useNativeDriver: true,
            easing: Easing.out(Easing.back(1.5)),
          }),
        ]),

        // Pulse acoustic ring expansion
        Animated.sequence([
          Animated.delay(100),
          Animated.parallel([
            Animated.timing(pulseRingOpacity, {
              toValue: 0.7,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(pulseRingScale, {
              toValue: 1.8,
              duration: 650,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            }),
          ]),
          Animated.timing(pulseRingOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),

        // Brand text & tagline reveal
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
          }),
          Animated.timing(textTranslateY, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.out(Easing.back(1.2)),
          }),
          Animated.timing(ecgProgress, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
        ]),
      ]),

      // 3. Short pause for brand visual recognition
      Animated.delay(350),

      // 4. Smooth exit transition to reveal main screen
      Animated.parallel([
        Animated.timing(splashContainerOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(splashContainerScale, {
          toValue: 1.08,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]),
    ]);

    animSequence.start(() => {
      setIsSplashComplete(true);
      if (onFinish) onFinish();
    });
  }, []);

  return (
    <View style={styles.rootContainer}>
      {/* Underlying App Interface */}
      {children}

      {/* Animated Splash Screen Overlay */}
      {!isSplashComplete && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.splashContainer,
            {
              backgroundColor: isDark ? "#09090b" : "#ffffff",
              opacity: splashContainerOpacity,
              transform: [{ scale: splashContainerScale }],
            },
          ]}
        >
          {/* Subtle Ambient Radial Glow in background */}
          <Animated.View
            style={[
              styles.ambientGlow,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
                backgroundColor: isDark ? "#e11d48" : "#fb7185",
              },
            ]}
          />

          {/* Pulse Ripple Ring */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                opacity: pulseRingOpacity,
                transform: [{ scale: pulseRingScale }],
                borderColor: isDark ? "rgba(244, 63, 94, 0.4)" : "rgba(225, 29, 72, 0.25)",
              },
            ]}
          />

          {/* Center Logo Group */}
          <View style={styles.centerGroup}>
            <Animated.View
              style={[
                styles.logoWrapper,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                },
              ]}
            >
              <Image
                source={require("../../assets/images/icon.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Brand Title & Tagline */}
            <Animated.View
              style={[
                styles.textWrapper,
                {
                  opacity: textOpacity,
                  transform: [{ translateY: textTranslateY }],
                },
              ]}
            >
              <Text
                style={[
                  styles.brandName,
                  { color: isDark ? "#ffffff" : "#0f172a" },
                ]}
              >
                AURALIS
              </Text>
              
              <Text
                style={[
                  styles.brandTagline,
                  { color: isDark ? "#94a3b8" : "#64748b" },
                ]}
              >
                Cardiovascular Diagnostics
              </Text>

              {/* Decorative Animated ECG Wave Line */}
              <Animated.View style={[styles.ecgContainer, { opacity: ecgProgress }]}>
                <Svg width={120} height={20} viewBox="0 0 120 20" fill="none">
                  <Defs>
                    <LinearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
                      <Stop offset="50%" stopColor="#e11d48" stopOpacity="1" />
                      <Stop offset="100%" stopColor="#f43f5e" stopOpacity="0.2" />
                    </LinearGradient>
                  </Defs>
                  <Path
                    d="M0 10 H35 L42 2 L49 18 L56 7 L62 12 L67 10 H120"
                    stroke="url(#ecgGrad)"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Animated.View>
            </Animated.View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  splashContainer: {
    zIndex: 99999,
    alignItems: "center",
    justifyContent: "center",
  },
  ambientGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    filter: Platform.OS === "web" ? "blur(70px)" : undefined,
  },
  pulseRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
  },
  centerGroup: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#e11d48",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  logoImage: {
    width: 110,
    height: 110,
  },
  textWrapper: {
    alignItems: "center",
    marginTop: 22,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 6,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 6,
  },
  ecgContainer: {
    marginTop: 14,
    alignItems: "center",
  },
});
