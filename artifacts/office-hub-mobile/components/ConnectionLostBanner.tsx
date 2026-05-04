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

export function ConnectionLostBanner() {
  const { bannerVisible, dismiss, retry } = useConnectionBanner();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [retrying, setRetrying] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (bannerVisible) {
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
  }, [bannerVisible, slideAnim]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retry();
    } finally {
      setRetrying(false);
    }
  };

  if (!mounted && !bannerVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor: colors.destructive,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Feather name="wifi-off" size={16} color="#fff" />
        <Text style={styles.text}>Verbinding verloren</Text>
        <View style={styles.actions}>
          <Pressable
            onPress={handleRetry}
            disabled={retrying}
            style={({ pressed }) => [
              styles.retryButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            {retrying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="refresh-cw" size={14} color="#fff" />
            )}
          </Pressable>
          <Pressable
            onPress={dismiss}
            style={({ pressed }) => [
              styles.dismissButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="x" size={16} color="#fff" />
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
    flex: 1,
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
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
