import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
import MiniCalendar from "@/components/MiniCalendar";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import { apiJson } from "@/lib/api";

const dashboardPhoto = require("../../assets/brand/dashboard.jpg");

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

interface AbsenceTodayEmployee {
  name: string;
  type: string;
  status: string;
  halfDay: string | null;
}

interface AbsenceTodayDepartment {
  managerName: string;
  managerRole: string;
  department: string;
  employees: AbsenceTodayEmployee[];
}

interface AbsenceTodayResponse {
  date: string;
  totalAbsent: number;
  departments: AbsenceTodayDepartment[];
}

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
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
    queryFn: () => apiJson<AbsenceTodayResponse>("/api/absences/today"),
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

      <Section title="Kalender">
        <MiniCalendar />
      </Section>

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

      <Section
        title="Vandaag afwezig"
        right={
          today.data && today.data.totalAbsent > 0 ? (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 999,
                backgroundColor: colors.accent,
              }}
              testID="badge-absent-total"
            >
              <Text
                style={{
                  color: colors.accentForeground,
                  fontSize: 12,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                {today.data.totalAbsent} totaal
              </Text>
            </View>
          ) : null
        }
      >
        {today.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : !today.data?.totalAbsent ? (
          <EmptyState text="Niemand is vandaag afwezig" />
        ) : (
          today.data.departments.map((dept) => {
            const roleLabels: Record<string, string> = {
              admin: "Beheerder",
              manager: "Manager",
              directeur: "Directeur",
            };
            const managerSuffix = dept.managerRole
              ? ` (${roleLabels[dept.managerRole] || dept.managerRole})`
              : "";
            return (
              <View
                key={dept.department}
                style={{ marginBottom: 12 }}
                testID={`dept-absence-${dept.department}`}
              >
                <Pressable
                  onPress={() =>
                    router.push(
                      `/department/${encodeURIComponent(dept.department)}` as never,
                    )
                  }
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 6,
                    paddingHorizontal: 2,
                    paddingVertical: 2,
                    opacity: pressed ? 0.6 : 1,
                  })}
                  testID={`button-dept-${dept.department}`}
                >
                  <Feather
                    name="briefcase"
                    size={13}
                    color={colors.mutedForeground}
                  />
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 13,
                    }}
                  >
                    {dept.department}
                  </Text>
                  {dept.managerName ? (
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        fontSize: 12,
                        flexShrink: 1,
                      }}
                      numberOfLines={1}
                    >
                      — {dept.managerName}
                      {managerSuffix}
                    </Text>
                  ) : null}
                  <Feather
                    name="chevron-right"
                    size={14}
                    color={colors.mutedForeground}
                    style={{ marginLeft: "auto" }}
                  />
                </Pressable>
                {dept.employees.map((emp, idx) => (
                  <Card
                    key={`${dept.department}-${emp.name}-${idx}`}
                    style={{ marginBottom: 6, flexDirection: "row", gap: 10 }}
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
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        <Text
                          style={[
                            styles.cardTitle,
                            { color: colors.foreground },
                          ]}
                          testID={`text-absent-name-${idx}`}
                        >
                          {emp.name || "Medewerker"}
                        </Text>
                        {emp.halfDay === "am" || emp.halfDay === "pm" ? (
                          <HalfDayBadge part={emp.halfDay} />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.cardBody,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {emp.type || "Afwezig"}
                      </Text>
                    </View>
                  </Card>
                ))}
              </View>
            );
          })
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
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_600SemiBold",
            fontSize: 15,
          }}
        >
          {title}
        </Text>
        {right}
      </View>
      {children}
    </View>
  );
}

function HalfDayBadge({ part }: { part: "am" | "pm" }) {
  const colors = useColors();
  const label = part === "am" ? "Ochtend" : "Middag";
  return (
    <View
      style={{
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
      }}
      testID={`badge-halfday-${part}`}
    >
      <Text
        style={{
          color: colors.mutedForeground,
          fontSize: 11,
          fontFamily: "Inter_500Medium",
        }}
      >
        {label}
      </Text>
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
