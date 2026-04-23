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

interface BeoordelingScore {
  id: string;
  reviewId: string;
  competencyId?: string;
  score: number;
}

function BeoordelingDetails({
  review,
  parseScore,
}: {
  review: { id: string; totalScore?: string | null; periode?: string | null };
  parseScore: (raw?: string | null) => { total?: number; label?: string };
}) {
  const colors = useColors();
  const scores = useQuery({
    queryKey: ["beoordeling-scores", review.id],
    queryFn: () =>
      apiJson<BeoordelingScore[]>(`/api/beoordeling/${review.id}/scores`),
  });

  const { total: sum, label } = parseScore(review.totalScore);
  const maxPossible =
    scores.data && scores.data.length > 0 ? scores.data.length * 5 : undefined;

  if (sum == null && !label) {
    return (
      <Text
        style={{
          color: colors.foreground,
          fontFamily: "Inter_600SemiBold",
          fontSize: 14,
        }}
      >
        {review.totalScore || "Geregistreerd"}
      </Text>
    );
  }

  return (
    <>
      {maxPossible != null ? (
        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_600SemiBold",
            fontSize: 14,
          }}
        >
          Totaal: {maxPossible}
        </Text>
      ) : null}
      {sum != null ? (
        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_600SemiBold",
            fontSize: 14,
            marginTop: 2,
          }}
        >
          Aantal gescoord: {sum}
        </Text>
      ) : null}
      {label ? (
        <Text
          style={{
            color: colors.primary,
            fontFamily: "Inter_600SemiBold",
            fontSize: 14,
            marginTop: 2,
          }}
        >
          {label}
        </Text>
      ) : null}
      {review.periode ? (
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 11,
            marginTop: 2,
          }}
        >
          {review.periode}
        </Text>
      ) : null}
    </>
  );
}

interface BeoordelingReview {
  id: string;
  userId: string;
  year: number;
  totalScore?: string | null;
  datum?: string | null;
  periode?: string | null;
  beoordelaar?: string | null;
}

interface YearlyAward {
  id: string;
  year: number;
  type: string;
  name: string;
  awardedAt?: string;
}

export default function BeloningenScreen() {
  const colors = useColors();
  const { user } = useAuth();

  const reviews = useQuery({
    queryKey: ["beoordeling-mine"],
    queryFn: () => apiJson<BeoordelingReview[]>("/api/beoordeling/mine"),
  });

  const awards = useQuery({
    queryKey: ["yearly-awards"],
    queryFn: () => apiJson<YearlyAward[]>("/api/yearly-awards"),
  });

  const loading = reviews.isLoading || awards.isLoading;

  const naamMetInitialen = React.useMemo(() => {
    const full = (user?.fullName || "").trim();
    if (!full) return "";
    const parts = full.split(/\s+/);
    if (parts.length === 1) return parts[0];
    const tussen = new Set([
      "de", "van", "der", "den", "het", "ten", "ter", "'t", "te", "op", "aan",
    ]);
    const initialen: string[] = [];
    let i = 0;
    while (i < parts.length - 1 && !tussen.has(parts[i].toLowerCase())) {
      initialen.push(parts[i].charAt(0).toUpperCase() + ".");
      i++;
    }
    if (initialen.length === 0) {
      initialen.push(parts[0].charAt(0).toUpperCase() + ".");
      i = 1;
    }
    const achternaam = parts.slice(i).join(" ");
    return `${initialen.join("")} ${achternaam}`;
  }, [user?.fullName]);

  const scoreLabels: Record<number, string> = {
    1: "Onvoldoende",
    2: "Nog te ontwikkelen",
    3: "Normaal/goed",
    4: "Zeer goed/aantoonbaar beter",
    5: "Uitstekend/voorbeeld voor anderen",
  };

  function parseScore(raw?: string | null): { total?: number; label?: string } {
    if (!raw) return {};
    const totalMatch = raw.match(/Totaal:\s*(\d+(?:[.,]\d+)?)/i);
    const gemMatch = raw.match(/Gemiddeld:\s*(\d+(?:[.,]\d+)?)/i);
    const total = totalMatch
      ? parseFloat(totalMatch[1].replace(",", "."))
      : undefined;
    const gem = gemMatch
      ? parseFloat(gemMatch[1].replace(",", "."))
      : undefined;
    let label: string | undefined;
    if (gem != null) {
      const rounded = Math.max(1, Math.min(5, Math.round(gem)));
      label = scoreLabels[rounded];
    }
    return { total, label };
  }

  const years = React.useMemo(() => {
    const set = new Set<number>();
    reviews.data?.forEach((r) => set.add(r.year));
    awards.data
      ?.filter((a) => a.type === "department")
      .forEach((a) => set.add(a.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [reviews.data, awards.data]);

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
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : years.length === 0 ? (
          <EmptyState text="Nog geen beoordelingen of awards beschikbaar" />
        ) : (
          years.map((year) => {
            const myReview = reviews.data?.find((r) => r.year === year);
            const deptAwards =
              awards.data?.filter(
                (a) => a.type === "department" && a.year === year,
              ) || [];

            return (
              <View key={year} style={{ marginBottom: 18 }}>
                <Text
                  style={[
                    styles.yearLabel,
                    { color: colors.foreground, marginBottom: 8 },
                  ]}
                >
                  {year}
                </Text>

                <Card style={{ marginBottom: 10 }}>
                  <View style={styles.row}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: colors.accent },
                    ]}
                  >
                    <Feather
                      name="star"
                      size={16}
                      color={colors.accentForeground}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.rowLabel, { color: colors.mutedForeground }]}
                    >
                      Beoordeling{naamMetInitialen ? ` ${naamMetInitialen}` : ""}
                    </Text>
                    {myReview ? (
                      <BeoordelingDetails
                        review={myReview}
                        parseScore={parseScore}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.rowValue,
                          { color: colors.mutedForeground, fontStyle: "italic" },
                        ]}
                      >
                        Geen beoordeling
                      </Text>
                    )}
                  </View>
                  </View>
                </Card>

                <Card>
                  <View style={styles.row}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Feather
                      name="award"
                      size={16}
                      color={colors.primaryForeground}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.rowLabel, { color: colors.mutedForeground }]}
                    >
                      Afdeling van het Jaar
                    </Text>
                    {deptAwards.length > 0 ? (
                      deptAwards.map((a) => (
                        <Text
                          key={a.id}
                          style={[styles.rowValue, { color: colors.foreground }]}
                        >
                          {a.name}
                        </Text>
                      ))
                    ) : (
                      <Text
                        style={[
                          styles.rowValue,
                          { color: colors.mutedForeground, fontStyle: "italic" },
                        ]}
                      >
                        Niet toegekend
                      </Text>
                    )}
                  </View>
                  </View>
                </Card>
              </View>
            );
          })
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
  yearHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  yearLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rowValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 18,
  },
  rowMeta: {
    fontSize: 11,
    marginTop: 2,
  },
});
