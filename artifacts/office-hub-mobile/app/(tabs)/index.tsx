import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import { apiJson } from "@/lib/api";

const dashboardPhoto = require("../../assets/brand/dashboard.png");

interface DashboardStats {
  totalEmployees?: number;
  todayAbsent?: number;
  upcomingEvents?: number;
  pendingRequests?: number;
}

interface Announcement {
  id: number;
  title: string;
  content?: string;
  createdAt?: string;
}

interface AbsenceToday {
  id: number;
  userName?: string;
  type?: string;
  reason?: string;
}

export default function DashboardScreen() {
  const colors = useColors();
  const { user, logout } = useAuth();

  const stats = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => apiJson<DashboardStats>("/api/dashboard/stats"),
  });

  const announcements = useQuery({
    queryKey: ["announcements"],
    queryFn: () => apiJson<Announcement[]>("/api/announcements"),
  });

  const today = useQuery({
    queryKey: ["absences-today"],
    queryFn: () => apiJson<AbsenceToday[]>("/api/absences/today"),
  });

  const refreshing =
    stats.isFetching || announcements.isFetching || today.isFetching;

  const onRefresh = () => {
    stats.refetch();
    announcements.refetch();
    today.refetch();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing && !stats.isLoading}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <ImageBackground source={dashboardPhoto} style={styles.hero}>
        <LinearGradient
          colors={["rgba(33,59,47,0.55)", "rgba(20,40,30,0.92)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroContent}>
          <View>
            <Text style={styles.heroEyebrow}>Welkom terug</Text>
            <Text style={styles.heroTitle}>
              {user?.fullName || user?.username || "Medewerker"}
            </Text>
            <Text style={styles.heroSubtitle}>
              {user?.jobTitle || user?.department || "Kadaster Dashboard"}
            </Text>
          </View>
          <Pressable
            onPress={logout}
            style={styles.logoutBtn}
            testID="button-logout"
          >
            <Feather name="log-out" size={16} color="#fff" />
          </Pressable>
        </View>
      </ImageBackground>

      <View style={styles.statsRow}>
        <StatCard
          icon="users"
          label="Medewerkers"
          value={stats.data?.totalEmployees}
          loading={stats.isLoading}
        />
        <StatCard
          icon="user-x"
          label="Afwezig vandaag"
          value={stats.data?.todayAbsent}
          loading={stats.isLoading}
        />
      </View>
      <View style={styles.statsRow}>
        <StatCard
          icon="calendar"
          label="Komende events"
          value={stats.data?.upcomingEvents}
          loading={stats.isLoading}
        />
        <StatCard
          icon="inbox"
          label="Open verzoeken"
          value={stats.data?.pendingRequests}
          loading={stats.isLoading}
        />
      </View>

      <Section title="Aankondigingen">
        {announcements.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : !announcements.data?.length ? (
          <EmptyState text="Geen aankondigingen" />
        ) : (
          announcements.data.slice(0, 5).map((a) => (
            <Card key={a.id} style={{ marginBottom: 10 }}>
              <Text
                style={[styles.cardTitle, { color: colors.foreground }]}
              >
                {a.title}
              </Text>
              {a.content ? (
                <Text
                  style={[styles.cardBody, { color: colors.mutedForeground }]}
                  numberOfLines={3}
                >
                  {a.content}
                </Text>
              ) : null}
            </Card>
          ))
        )}
      </Section>

      <Section title="Vandaag afwezig">
        {today.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : !today.data?.length ? (
          <EmptyState text="Niemand is vandaag afwezig" />
        ) : (
          today.data.map((t) => (
            <Card
              key={t.id}
              style={{ marginBottom: 8, flexDirection: "row", gap: 10 }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather
                  name="user"
                  size={16}
                  color={colors.accentForeground}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.cardTitle, { color: colors.foreground }]}
                >
                  {t.userName || "Medewerker"}
                </Text>
                <Text
                  style={[
                    styles.cardBody,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {t.type || t.reason || "Afwezig"}
                </Text>
              </View>
            </Card>
          ))
        )}
      </Section>
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: number | undefined;
  loading: boolean;
}) {
  const colors = useColors();
  return (
    <Card style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <Feather name={icon} size={16} color={colors.primary} />
        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
          {label}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_700Bold",
            fontSize: 22,
          }}
        >
          {value ?? "—"}
        </Text>
      )}
    </Card>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
      <Text
        style={{
          color: colors.foreground,
          fontFamily: "Inter_600SemiBold",
          fontSize: 15,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

export function EmptyState({ text }: { text: string }) {
  const colors = useColors();
  return (
    <Card style={{ alignItems: "center", paddingVertical: 24 }}>
      <Feather name="inbox" size={20} color={colors.mutedForeground} />
      <Text
        style={{ color: colors.mutedForeground, marginTop: 6, fontSize: 13 }}
      >
        {text}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 170,
    justifyContent: "flex-end",
  },
  heroContent: {
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
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
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  cardBody: {
    fontSize: 13,
    marginTop: 4,
  },
});
