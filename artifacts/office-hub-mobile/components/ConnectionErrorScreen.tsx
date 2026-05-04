import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { API_BASE } from "@/lib/api";

export function ConnectionErrorScreen({
  onRetry,
}: {
  onRetry: () => Promise<void>;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  const monoFont = Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.destructive + "18" },
          ]}
        >
          <Feather name="wifi-off" size={40} color={colors.destructive} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          Geen verbinding
        </Text>

        <Text style={[styles.message, { color: colors.mutedForeground }]}>
          De app kan de server niet bereiken. Controleer je internetverbinding en
          probeer het opnieuw.
        </Text>

        <Pressable
          onPress={handleRetry}
          disabled={retrying}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: retrying ? 0.7 : pressed ? 0.9 : 1,
              transform: [{ scale: pressed && !retrying ? 0.98 : 1 }],
            },
          ]}
        >
          {retrying ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <View style={styles.buttonContent}>
              <Feather
                name="refresh-cw"
                size={18}
                color={colors.primaryForeground}
              />
              <Text
                style={[
                  styles.buttonText,
                  { color: colors.primaryForeground },
                ]}
              >
                Opnieuw proberen
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {__DEV__ ? (
        <View
          style={[
            styles.devBanner,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 8,
            },
          ]}
        >
          <Feather
            name="code"
            size={14}
            color={colors.mutedForeground}
            style={styles.devIcon}
          />
          <Text
            style={[
              styles.devText,
              { color: colors.mutedForeground, fontFamily: monoFont },
            ]}
            selectable
            numberOfLines={2}
          >
            API_BASE: {API_BASE || "(leeg)"}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  button: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    minWidth: 220,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  devBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  devIcon: {
    marginRight: 8,
  },
  devText: {
    fontSize: 11,
    flex: 1,
  },
});
