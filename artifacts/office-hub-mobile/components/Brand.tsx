import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

export function BrandMark({
  size = 40,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          backgroundColor: colors.sidebarPrimary,
          borderRadius: 8,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: "#1a2e22",
          fontFamily: "Inter_700Bold",
          fontSize: size * 0.4,
        }}
      >
        KD
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: "center",
    justifyContent: "center",
  },
});
