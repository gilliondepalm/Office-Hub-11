import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import { apiJson } from "@/lib/api";
import { EmptyState } from "./index";

const photo = require("../../assets/brand/werktijden.png");

interface DepartmentInfo {
  id: number;
  name: string;
  startTime?: string;
  endTime?: string;
  workDays?: string;
}

const DAGEN = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

export default function WerktijdenScreen() {
  const colors = useColors();
  const { user } = useAuth();

  const departments = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiJson<DepartmentInfo[]>("/api/departments"),
  });

  const myDept = departments.data?.find(
    (d) => d.name?.toLowerCase() === (user?.department || "").toLowerCase(),
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <ImageBackground source={photo} style={styles.hero}>
        <LinearGradient
          colors={["rgba(33,59,47,0.45)", "rgba(20,40,30,0.92)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>Werktijden</Text>
          <Text style={styles.heroTitle}>Mijn rooster</Text>
          <Text style={styles.heroSubtitle}>
            {user?.department || "Geen afdeling"}
          </Text>
        </View>
      </ImageBackground>

      <View style={{ padding: 16 }}>
        {departments.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : myDept ? (
          <>
            <Card style={{ marginBottom: 12 }}>
              <View style={styles.row}>
                <Feather name="clock" size={18} color={colors.primary} />
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  Werktijden
                </Text>
              </View>
              <Text style={[styles.value, { color: colors.foreground }]}>
                {myDept.startTime || "—"} – {myDept.endTime || "—"}
              </Text>
            </Card>

            <Card>
              <View style={styles.row}>
                <Feather name="calendar" size={18} color={colors.primary} />
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  Werkdagen
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                {DAGEN.map((d, i) => {
                  const active = myDept.workDays
                    ?.toLowerCase()
                    .includes(d.toLowerCase());
                  return (
                    <View
                      key={i}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: active
                          ? colors.primary
                          : colors.muted,
                      }}
                    >
                      <Text
                        style={{
                          color: active
                            ? colors.primaryForeground
                            : colors.mutedForeground,
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 12,
                        }}
                      >
                        {d}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          </>
        ) : (
          <EmptyState text="Geen werktijden gevonden voor uw afdeling" />
        )}

        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_600SemiBold",
            fontSize: 15,
            marginTop: 24,
            marginBottom: 8,
          }}
        >
          Alle afdelingen
        </Text>
        {departments.data?.map((d) => (
          <Card key={d.id} style={{ marginBottom: 8 }}>
            <Text style={[styles.value, { color: colors.foreground }]}>
              {d.name}
            </Text>
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 13,
                marginTop: 2,
              }}
            >
              {d.startTime || "—"} – {d.endTime || "—"}
              {d.workDays ? ` · ${d.workDays}` : ""}
            </Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 150,
    justifyContent: "flex-end",
  },
  heroContent: {
    padding: 16,
  },
  heroEyebrow: {
    color: "#FACC14",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    marginTop: 2,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginTop: 4,
  },
});
