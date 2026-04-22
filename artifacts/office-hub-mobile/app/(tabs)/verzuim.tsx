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

const photo = require("../../assets/brand/verzuim.png");

interface Absence {
  id: number;
  startDate: string;
  endDate: string;
  type?: string;
  reason?: string;
  status?: string;
}

interface VacationBalance {
  totalDays?: number;
  usedDays?: number;
  remainingDays?: number;
  saldoOud?: number;
}

function formatDate(d: string) {
  if (!d) return "—";
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

export default function VerzuimScreen() {
  const colors = useColors();
  const { user } = useAuth();

  const balance = useQuery({
    queryKey: ["vacation-balance"],
    queryFn: () =>
      apiJson<VacationBalance>("/api/vacation-balance"),
  });

  const mine = useQuery({
    queryKey: ["absences-mine"],
    queryFn: () => apiJson<Absence[]>("/api/absences/mine"),
  });

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
          <Text style={styles.heroEyebrow}>Verzuim & verlof</Text>
          <Text style={styles.heroTitle}>Mijn vakantiesaldo</Text>
          <Text style={styles.heroSubtitle}>
            {user?.fullName || user?.username}
          </Text>
        </View>
      </ImageBackground>

      <View style={{ padding: 16 }}>
        <Card style={{ marginBottom: 16 }}>
          {balance.isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={styles.balanceRow}>
              <BalanceCell
                label="Resterend"
                value={balance.data?.remainingDays}
                highlight
              />
              <BalanceCell label="Gebruikt" value={balance.data?.usedDays} />
              <BalanceCell label="Totaal" value={balance.data?.totalDays} />
            </View>
          )}
          {balance.data?.saldoOud != null && balance.data.saldoOud > 0 ? (
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 12,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Saldo vorig jaar: {balance.data.saldoOud} dagen
            </Text>
          ) : null}
        </Card>

        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_600SemiBold",
            fontSize: 15,
            marginBottom: 8,
          }}
        >
          Mijn afwezigheden
        </Text>

        {mine.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : !mine.data?.length ? (
          <EmptyState text="Geen geregistreerde afwezigheden" />
        ) : (
          mine.data.map((a) => (
            <Card key={a.id} style={{ marginBottom: 8 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    {a.type || "Afwezig"}
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: 13,
                      marginTop: 2,
                    }}
                  >
                    {formatDate(a.startDate)} – {formatDate(a.endDate)}
                  </Text>
                  {a.reason ? (
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      {a.reason}
                    </Text>
                  ) : null}
                </View>
                <StatusBadge status={a.status} />
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function BalanceCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | undefined;
  highlight?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text
        style={{
          color: highlight ? colors.primary : colors.foreground,
          fontFamily: "Inter_700Bold",
          fontSize: 28,
        }}
      >
        {value ?? "—"}
      </Text>
      <Text
        style={{
          color: colors.mutedForeground,
          fontSize: 11,
          marginTop: 2,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const colors = useColors();
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    approved: { bg: "#dcfce7", fg: "#166534", label: "Goedgekeurd" },
    pending: { bg: colors.accent, fg: colors.accentForeground, label: "Open" },
    rejected: { bg: "#fee2e2", fg: "#991b1b", label: "Afgekeurd" },
    cancelled: { bg: colors.muted, fg: colors.mutedForeground, label: "Geannuleerd" },
  };
  const conf = map[(status || "").toLowerCase()] || {
    bg: colors.muted,
    fg: colors.mutedForeground,
    label: status || "—",
  };
  return (
    <View
      style={{
        backgroundColor: conf.bg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
      }}
    >
      <Text
        style={{
          color: conf.fg,
          fontSize: 11,
          fontFamily: "Inter_600SemiBold",
        }}
      >
        {conf.label}
      </Text>
    </View>
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
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
});
