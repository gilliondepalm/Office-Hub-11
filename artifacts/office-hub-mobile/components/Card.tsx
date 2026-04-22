import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { useColors } from "@/hooks/useColors";

export function Card({ style, ...rest }: ViewProps) {
  const colors = useColors();
  return (
    <View
      {...rest}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
});
