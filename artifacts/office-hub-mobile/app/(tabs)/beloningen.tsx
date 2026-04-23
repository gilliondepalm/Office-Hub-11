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

const photo = require("../../assets/brand/beloningen.jpg");

interface Reward {
  id: number;
  title?: string;
  description?: string;
  points?: number;
  date?: string;
  createdAt?: string;
}

function formatDate(d?: string) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export default function BeloningenScreen() {
  const colors = useColors();
  const { user } = useAuth();

  const mine = useQuery({
    queryKey: ["rewards-mine"],
    queryFn: () => apiJson<Reward[]>("/api/rewards/mine"),
  });

  const total = mine.data?.reduce((sum, r) => sum + (r.points || 0), 0) || 0;

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
          <Text style={styles.heroEyebrow}>Beloningen</Text>
          <Text style={styles.heroTitle}>Mijn waardering</Text>
          <Text style={styles.heroSubtitle}>
            {user?.fullName || user?.username}
          </Text>
        </View>
      </ImageBackground>

      <View style={{ padding: 16 }}>
        <Card
          style={{
            marginBottom: 16,
            alignItems: "center",
            paddingVertical: 24,
          }}
        >
          <Feather name="award" size={28} color={colors.sidebarPrimary} />
          <Text
            style={{
              color: colors.foreground,
              fontFamily: "Inter_700Bold",
              fontSize: 32,
              marginTop: 8,
            }}
          >
            {total}
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Totaal punten
          </Text>
        </Card>

        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_600SemiBold",
            fontSize: 15,
            marginBottom: 8,
          }}
        >
          Geschiedenis
        </Text>

        {mine.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : !mine.data?.length ? (
          <EmptyState text="Nog geen beloningen ontvangen" />
        ) : (
          mine.data.map((r) => (
            <Card
              key={r.id}
              style={{
                marginBottom: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather
                  name="star"
                  size={18}
                  color={colors.accentForeground}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                  }}
                >
                  {r.title || "Beloning"}
                </Text>
                {r.description ? (
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {r.description}
                  </Text>
                ) : null}
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: 11,
                    marginTop: 2,
                  }}
                >
                  {formatDate(r.date || r.createdAt)}
                </Text>
              </View>
              {r.points != null ? (
                <View
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      color: colors.primaryForeground,
                      fontFamily: "Inter_700Bold",
                      fontSize: 13,
                    }}
                  >
                    +{r.points}
                  </Text>
                </View>
              ) : null}
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { height: 150, justifyContent: "flex-end" },
  heroContent: { padding: 16 },
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
});
