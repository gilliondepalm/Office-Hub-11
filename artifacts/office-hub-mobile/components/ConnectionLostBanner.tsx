import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useConnectionBanner } from "@/lib/ConnectionBannerContext";
import { useOfflineQueue } from "@/lib/OfflineQueueContext";

export function ConnectionLostBanner() {
  const { bannerVisible, slowConnection, dismiss, dismissSlow, retry } =
    useConnectionBanner();
  const { pendingCount } = useOfflineQueue();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [retrying, setRetrying] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const [mounted, setMounted] = useState(false);

  const showBanner = bannerVisible || slowConnection;
  const isSlowOnly = slowConnection && !bannerVisible;

  useEffect(() => {
    if (showBanner) {
      setMounted(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setMounted(false);
      });
    }
  }, [showBanner, slideAnim]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retry();
    } finally {
      setRetrying(false);
    }
  };

  const handleDismiss = () => {
    if (isSlowOnly) {
      dismissSlow();
    } else {
      dismiss();
    }
  };

  if (!mounted && !showBanner) return null;

  const bgColor = isSlowOnly ? colors.warning : colors.destructive;
  const textColor = isSlowOnly ? "#422006" : "#fff";

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor: bgColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Feather
          name={isSlowOnly ? "alert-triangle" : "wifi-off"}
          size={16}
          color={textColor}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.text, { color: textColor }]}>
            {isSlowOnly ? "Trage verbinding" : "Verbinding verloren"}
          </Text>
          {isSlowOnly ? (
            <Text style={[styles.subText, { color: textColor }]}>
              Reacties van de server duren langer dan normaal
            </Text>
          ) : pendingCount > 0 ? (
            <Text style={[styles.subText, { color: textColor }]}>
              {pendingCount} {pendingCount === 1 ? "actie" : "acties"} in
              wachtrij
            </Text>
          ) : null}
        </View>
        <View style={styles.actions}>
          {!isSlowOnly && (
            <Pressable
              onPress={handleRetry}
              disabled={retrying}
              style={({ pressed }) => [
                styles.retryButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              {retrying ? (
                <ActivityIndicator size="small" color={textColor} />
              ) : (
                <Feather name="refresh-cw" size={14} color={textColor} />
              )}
            </Pressable>
          )}
          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [
              styles.dismissButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="x" size={16} color={textColor} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  subText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginTop: 1,
    opacity: 0.85,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  retryButton: {
    padding: 6,
  },
  dismissButton: {
    padding: 6,
  },
});
