import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useConnectionBanner } from "@/lib/ConnectionBannerContext";
import { useOfflineQueue } from "@/lib/OfflineQueueContext";

export function PendingQueueBadge() {
  const { pendingCount } = useOfflineQueue();
  const { bannerVisible } = useConnectionBanner();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  const showBadge = pendingCount > 0 && !bannerVisible;

  useEffect(() => {
    if (showBadge) {
      setMounted(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setMounted(false);
      });
    }
  }, [showBadge, scaleAnim]);

  if (!mounted && !showBadge) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 8,
          backgroundColor: colors.accent,
          transform: [{ scale: scaleAnim }],
          opacity: scaleAnim,
        },
      ]}
      testID="badge-pending-queue"
    >
      <View style={styles.content}>
        <Feather name="upload-cloud" size={13} color={colors.accentForeground} />
        <Text
          style={[styles.text, { color: colors.accentForeground }]}
        >
          {pendingCount} in wachtrij
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 12,
    zIndex: 9998,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
});
