import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  useWindowDimensions,
} from "react-native";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../context/ThemeContext";
import * as Haptics from "expo-haptics";
import { TabSvgIcon } from "./TabBarIcons";

interface TabConfig {
  name: string;
  label: string;
  badge?: string;
  isHero?: boolean;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  home: {
    name: "home",
    label: "Home",
  },
  healthdata: {
    name: "healthdata",
    label: "Screening",
    isHero: true,
  },
  history: {
    name: "history",
    label: "History",
  },
  profile: {
    name: "profile",
    label: "Profile",
  },
  analysis: {
    name: "analysis",
    label: "Analysis",
  },
};

function TabItem({
  route,
  isFocused,
  isTablet,
  isDark,
  onPress,
  onLongPress,
}: {
  route: { key: string; name: string };
  isFocused: boolean;
  isTablet: boolean;
  isDark: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const config = TAB_CONFIGS[route.name] || {
    name: route.name,
    label: route.name,
  };
  const isHero = config.isHero ?? false;

  // Smooth micro-animation on focus change
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0.95)).current;
  const pillOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1.03 : 0.97,
        useNativeDriver: true,
        friction: 6,
        tension: 100,
      }),
      Animated.timing(pillOpacity, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(scaleAnim, {
      toValue: 0.92,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.03 : 0.97,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={config.label}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
    >
      <Animated.View
        style={[
          styles.tabContent,
          isTablet && styles.tabContentTablet,
          isFocused && styles.tabContentActive,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Active Pill Glow Layer */}
        {isFocused && (
          <Animated.View
            style={[
              styles.activePillBackground,
              isDark && styles.activePillBackgroundDark,
              isTablet && styles.activePillBackgroundTablet,
              { opacity: pillOpacity },
            ]}
          />
        )}

        {/* SVG Icon with active state */}
        <View style={[styles.iconContainer, isTablet && styles.iconContainerTablet]}>
          <TabSvgIcon
            name={config.name}
            focused={isFocused}
            size={isTablet ? (isHero && isFocused ? 26 : 24) : (isHero && isFocused ? 25 : 22)}
            color="#94a3b8"
            activeColor="#e11d48"
          />
          {/* Active Top Mini Glowing Indicator Dot (phone mode) */}
          {isFocused && !isTablet && <View style={styles.activeDot} />}
        </View>

        {/* Text Label */}
        <Text
          style={[
            styles.tabLabel,
            isTablet && styles.tabLabelTablet,
            isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
          numberOfLines={1}
        >
          {config.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { isDark } = useAppTheme();

  // iPad / tablet detection based on screen width or iOS device idiom
  const isTablet =
    width >= 768 || (Platform.OS === "ios" && Boolean((Platform as any).isPad));
  const isLandscape = width > height;

  // Responsive dock sizing
  const bottomInset = Math.max(insets.bottom, isTablet ? 20 : 12);
  const maxDockWidth = isLandscape ? 620 : 540;
  const dockWidth = isTablet ? Math.min(width - 64, maxDockWidth) : undefined;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.tabBarContainer,
        {
          bottom: bottomInset,
        },
      ]}
    >
      <View
        style={[
          styles.tabBarCard,
          isDark && styles.tabBarCardDark,
          isTablet && {
            width: dockWidth,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 32,
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              isTablet={isTablet}
              isDark={isDark}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingHorizontal: 16,
  },
  tabBarCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 26,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.85)",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow:
          "0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)",
      },
    }),
  },
  tabBarCardDark: {
    backgroundColor: "#171717",
    borderColor: "rgba(38, 38, 38, 0.85)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.3,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 18,
    width: "100%",
    position: "relative",
  },
  tabContentTablet: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
  },
  tabContentActive: {
    backgroundColor: "rgba(255, 241, 242, 0.75)",
  },
  activePillBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    backgroundColor: "#ffe4e6",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.2)",
  },
  activePillBackgroundDark: {
    backgroundColor: "rgba(225, 29, 72, 0.2)",
    borderColor: "rgba(225, 29, 72, 0.4)",
  },
  activePillBackgroundTablet: {
    borderRadius: 22,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 28,
    position: "relative",
  },
  iconContainerTablet: {
    height: 26,
  },
  activeDot: {
    position: "absolute",
    top: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e11d48",
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    letterSpacing: -0.1,
  },
  tabLabelTablet: {
    fontSize: 13,
    marginTop: 0,
    letterSpacing: 0,
  },
  tabLabelActive: {
    fontWeight: "700",
    color: "#e11d48",
  },
  tabLabelInactive: {
    fontWeight: "500",
    color: "#64748b",
  },
});
