import React from "react";
import Svg, {
  Path,
  Rect,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  G,
} from "react-native-svg";

interface IconProps {
  focused: boolean;
  size?: number;
  color?: string;
  activeColor?: string;
}

/**
 * Modern Home / Dashboard Icon
 */
export function HomeTabIcon({
  focused,
  size = 24,
  color = "#94a3b8",
  activeColor = "#e11d48",
}: IconProps) {
  if (!focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Modern roof & walls */}
        <Path
          d="M3 10.5L12 3l9 7.5v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9.5z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Door line */}
        <Path
          d="M9 22V12h6v10"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="homeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#f43f5e" />
          <Stop offset="100%" stopColor="#be123c" />
        </LinearGradient>
        <LinearGradient id="homeFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#ffe4e6" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#fecdd3" stopOpacity="0.4" />
        </LinearGradient>
      </Defs>

      {/* Tinted background body */}
      <Path
        d="M3 10.5L12 3l9 7.5v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9.5z"
        fill="url(#homeFill)"
        stroke="url(#homeGrad)"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Accent doorway */}
      <Path
        d="M9 22V12a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v10"
        fill="#ffffff"
        stroke={activeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Tiny active spark in window */}
      <Circle cx="12" cy="7.5" r="1.5" fill={activeColor} />
    </Svg>
  );
}

/**
 * Medical Screening / AI Cardiac Pulse Icon
 */
export function ScreeningTabIcon({
  focused,
  size = 24,
  color = "#94a3b8",
  activeColor = "#e11d48",
}: IconProps) {
  if (!focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Heart boundary */}
        <Path
          d="M19.5 12.572L12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.566z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* ECG pulse rhythm */}
        <Path
          d="M3.5 12h4l2.2-3.8 3.6 7.6 2.2-4.8 1.5 1h3.5"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#fb7185" />
          <Stop offset="50%" stopColor="#f43f5e" />
          <Stop offset="100%" stopColor="#e11d48" />
        </LinearGradient>
        <LinearGradient id="glowGlow" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Vibrant Gradient Filled Heart */}
      <Path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="url(#heartGrad)"
      />

      {/* Soft upper highlight */}
      <Path
        d="M12 4.5C9.5 2.5 5 3.5 4 7c3-1 6-1 8 1 2-2 5-2 8-1-1-3.5-5.5-4.5-8-2.5z"
        fill="url(#glowGlow)"
      />

      {/* Crisp White ECG wave cutting across */}
      <Path
        d="M3.5 12h3.2l2.3-3.6 3.2 7.2 2.3-4.6 1.5 1h4.5"
        stroke="#ffffff"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Historical Screenings / Medical Records Icon
 */
export function HistoryTabIcon({
  focused,
  size = 24,
  color = "#94a3b8",
  activeColor = "#e11d48",
}: IconProps) {
  if (!focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Clipboard outline */}
        <Path
          d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Clip top */}
        <Path
          d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v0z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Report data lines */}
        <Path
          d="M9 12h6M9 16h4"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="histGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#f43f5e" />
          <Stop offset="100%" stopColor="#be123c" />
        </LinearGradient>
        <LinearGradient id="histFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#ffe4e6" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#fecdd3" stopOpacity="0.4" />
        </LinearGradient>
      </Defs>

      {/* Tinted clipboard body */}
      <Path
        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
        fill="url(#histFill)"
        stroke="url(#histGrad)"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Clip top badge */}
      <Path
        d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v0z"
        fill="#e11d48"
        stroke="#e11d48"
        strokeWidth={1}
      />
      {/* Crisp active records and checkmark */}
      <Path
        d="M8.5 12h7"
        stroke={activeColor}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Path
        d="M8.5 16h4.5"
        stroke={activeColor}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      {/* Verified indicator dot */}
      <Circle cx="15.5" cy="16" r="1.5" fill={activeColor} />
    </Svg>
  );
}

/**
 * Patient Profile / Settings Icon
 */
export function ProfileTabIcon({
  focused,
  size = 24,
  color = "#94a3b8",
  activeColor = "#e11d48",
}: IconProps) {
  if (!focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* User body */}
        <Path
          d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Head */}
        <Circle
          cx="12"
          cy="7"
          r="4"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="profGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#f43f5e" />
          <Stop offset="100%" stopColor="#be123c" />
        </LinearGradient>
        <LinearGradient id="profFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#ffe4e6" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#fecdd3" stopOpacity="0.4" />
        </LinearGradient>
      </Defs>

      {/* Shoulders */}
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        fill="url(#profFill)"
        stroke="url(#profGrad)"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Head with gradient fill & stroke */}
      <Circle
        cx="12"
        cy="7"
        r="4"
        fill="url(#profFill)"
        stroke="url(#profGrad)"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner status badge dot */}
      <Circle cx="12" cy="7" r="1.5" fill={activeColor} />
    </Svg>
  );
}

/**
 * SHAP Analysis / Data Waterfall Icon
 */
export function AnalysisTabIcon({
  focused,
  size = 24,
  color = "#94a3b8",
  activeColor = "#e11d48",
}: IconProps) {
  if (!focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Simple Bar Chart */}
        <Path
          d="M18 20V10"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12 20V4"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M6 20v-6"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#f43f5e" />
          <Stop offset="100%" stopColor="#be123c" />
        </LinearGradient>
      </Defs>

      {/* Active Bar Chart */}
      <Path
        d="M18 20V10"
        stroke="url(#barGrad)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 20V4"
        stroke="url(#barGrad)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 20v-6"
        stroke="url(#barGrad)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Active indicator dot */}
      <Circle cx="12" cy="2" r="1.5" fill={activeColor} />
    </Svg>
  );
}

/**
 * Universal dispatcher component
 */
export function TabSvgIcon({
  name,
  focused,
  size = 24,
  color,
  activeColor,
}: {
  name: string;
  focused: boolean;
  size?: number;
  color?: string;
  activeColor?: string;
}) {
  switch (name) {
    case "home":
      return (
        <HomeTabIcon
          focused={focused}
          size={size}
          color={color}
          activeColor={activeColor}
        />
      );
    case "healthdata":
      return (
        <ScreeningTabIcon
          focused={focused}
          size={size}
          color={color}
          activeColor={activeColor}
        />
      );
    case "history":
      return (
        <HistoryTabIcon
          focused={focused}
          size={size}
          color={color}
          activeColor={activeColor}
        />
      );
    case "profile":
      return (
        <ProfileTabIcon
          focused={focused}
          size={size}
          color={color}
          activeColor={activeColor}
        />
      );
    case "analysis":
      return (
        <AnalysisTabIcon
          focused={focused}
          size={size}
          color={color}
          activeColor={activeColor}
        />
      );
    default:
      return (
        <HomeTabIcon
          focused={focused}
          size={size}
          color={color}
          activeColor={activeColor}
        />
      );
  }
}
