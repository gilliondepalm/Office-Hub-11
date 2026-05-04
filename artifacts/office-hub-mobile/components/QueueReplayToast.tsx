import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useOfflineQueue } from "@/lib/OfflineQueueContext";

export function QueueReplayToast() {
  const { replayResult, dismissReplayToast } = useOfflineQueue();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);
  const lastResultRef = useRef(replayResult);

  if (replayResult !== null) {
    lastResultRef.current = replayResult;
  }

  const show = replayResult !== null;
  const displayResult = replayResult ?? lastResultRef.current;

  useEffect(() => {
    if (show) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
        lastResultRef.current = null;
      });
    }
  }, [show, translateY, opacity]);

  if (!mounted && !show) return null;

  const hasFailed = displayResult !== null && displayResult.failed > 0;
  const hasSucceeded = displayResult !== null && displayResult.succeeded > 0;

  const bgColor = hasFailed ? "#fef2f2" : "#f0fdf4";
  const borderColor = hasFailed ? "#fecaca" : "#bbf7d0";
  const iconColor = hasFailed ? colors.destructive : colors.success;
  const iconName = hasFailed ? "alert-triangle" : "check-circle";

  let message = "";
  if (displayResult) {
    if (hasSucceeded && !hasFailed) {
      message =
        displayResult.succeeded === 1
          ? "1 actie succesvol verstuurd"
          : `${displayResult.succeeded} acties succesvol verstuurd`;
    } else if (hasFailed && !hasSucceeded) {
      message =
        displayResult.failed === 1
          ? "1 actie mislukt bij versturen"
          : `${displayResult.failed} acties mislukt bij versturen`;
    } else if (hasSucceeded && hasFailed) {
      message = `${displayResult.succeeded} verstuurd, ${displayResult.failed} mislukt`;
    }
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 8,
          backgroundColor: bgColor,
          borderColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      testID="toast-queue-replay"
    >
      <Pressable
        onPress={dismissReplayToast}
        style={styles.pressable}
        accessibilityRole="alert"
        accessibilityLabel={message}
      >
        <View style={styles.content}>
          <Feather name={iconName} size={16} color={iconColor} />
          <Text style={[styles.text, { color: colors.foreground }]}>
            {message}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  pressable: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    flex: 1,
  },
});
