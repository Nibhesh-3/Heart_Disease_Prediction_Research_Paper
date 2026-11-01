import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";

export type AlertType = "success" | "error" | "warning" | "info";

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: AlertType;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  onClose?: () => void;
}

export default function CustomAlertModal({
  visible,
  title,
  message,
  type = "info",
  primaryButtonText = "Got it",
  secondaryButtonText,
  onPrimaryPress,
  onSecondaryPress,
  onClose,
}: CustomAlertProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      // Haptic feedback on display
      try {
        if (type === "error") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else if (type === "success") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (type === "warning") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } catch {}

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, type]);

  if (!visible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
          iconBorder: "border-emerald-500/20 dark:border-emerald-500/30",
          iconColor: "#10b981",
          iconChar: "✓",
          buttonBg: "bg-emerald-600 hover:bg-emerald-700",
          buttonText: "text-white",
          tagBg: "bg-emerald-50 dark:bg-emerald-950/40",
          tagText: "text-emerald-700 dark:text-emerald-400",
          tag: "SUCCESS",
        };
      case "error":
        return {
          iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
          iconBorder: "border-rose-500/20 dark:border-rose-500/30",
          iconColor: "#f43f5e",
          iconChar: "✕",
          buttonBg: "bg-rose-600 hover:bg-rose-700",
          buttonText: "text-white",
          tagBg: "bg-rose-50 dark:bg-rose-950/40",
          tagText: "text-rose-700 dark:text-rose-400",
          tag: "ATTENTION REQUIRED",
        };
      case "warning":
        return {
          iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
          iconBorder: "border-amber-500/20 dark:border-amber-500/30",
          iconColor: "#f59e0b",
          iconChar: "!",
          buttonBg: "bg-neutral-900 dark:bg-white",
          buttonText: "text-white dark:text-black",
          tagBg: "bg-amber-50 dark:bg-amber-950/40",
          tagText: "text-amber-700 dark:text-amber-400",
          tag: "NOTICE",
        };
      default:
        return {
          iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
          iconBorder: "border-blue-500/20 dark:border-blue-500/30",
          iconColor: "#3b82f6",
          iconChar: "i",
          buttonBg: "bg-neutral-900 dark:bg-white",
          buttonText: "text-white dark:text-black",
          tagBg: "bg-blue-50 dark:bg-blue-950/40",
          tagText: "text-blue-700 dark:text-blue-400",
          tag: "INFO",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        className="flex-1 items-center justify-center bg-black/60 px-6"
        style={{ opacity: fadeAnim }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="absolute inset-0"
        />

        <Animated.View
          style={[
            {
              transform: [{ scale: scaleAnim }],
              maxWidth: 400,
              width: "100%",
            },
            Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.25,
                shadowRadius: 32,
              },
              android: {
                elevation: 24,
              },
            }),
          ]}
          className="bg-white dark:bg-neutral-900 rounded-[32px] p-6 border border-neutral-100 dark:border-neutral-800"
        >
          {/* Top Tag & Icon Badge */}
          <View className="flex-row items-center justify-between mb-4">
            <View className={`px-2.5 py-1 rounded-full ${styles.tagBg}`}>
              <Text className={`text-[10px] font-black tracking-widest ${styles.tagText}`}>
                {styles.tag}
              </Text>
            </View>

            <View
              className={`w-11 h-11 rounded-2xl items-center justify-center border ${styles.iconBg} ${styles.iconBorder}`}
            >
              <Text
                style={{ color: styles.iconColor, fontSize: 18, fontWeight: "900" }}
              >
                {styles.iconChar}
              </Text>
            </View>
          </View>

          {/* Title & Message */}
          <Text className="text-xl font-black text-neutral-950 dark:text-white tracking-tight mb-2">
            {title}
          </Text>
          <Text className="text-sm text-neutral-600 dark:text-neutral-300 leading-5 mb-6 font-medium">
            {message}
          </Text>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            {secondaryButtonText ? (
              <TouchableOpacity
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  onSecondaryPress?.();
                }}
                activeOpacity={0.7}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 items-center justify-center"
              >
                <Text className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                  {secondaryButtonText}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } catch {}
                if (onPrimaryPress) {
                  onPrimaryPress();
                } else if (onClose) {
                  onClose();
                }
              }}
              activeOpacity={0.85}
              className={`flex-1 py-3.5 px-4 rounded-2xl ${styles.buttonBg} items-center justify-center shadow-sm`}
            >
              <Text className={`text-sm font-bold ${styles.buttonText}`}>
                {primaryButtonText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
