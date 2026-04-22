import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";
import { apiJson } from "@/lib/api";

interface User {
  id: string;
  fullName?: string | null;
  username?: string;
  department?: string | null;
  jobTitle?: string | null;
  role?: string;
  active?: boolean;
}

interface Absence {
  id: string;
  userId: string;
  userName?: string | null;
  userDepartment?: string | null;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  halfDay: string | null;
  reason?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Beheerder",
  manager: "Manager",
  manager_az: "Manager A&Z",
  directeur: "Directeur",
  medewerker: "Medewerker",
};

const ABSENCE_TYPE_LABELS: Record<string, string> = {
  sick: "Ziekte",
  vacation: "Vakantie",
  personal: "Geoorloofd",
  other: "Ongeoorloofd",
  bvvd: "BVVD",
  persoonlijk: "Persoonlijk",
};

function fmtDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${parseInt(d, 10)}-${parseInt(m, 10)}-${y}`;
}

function fmtRange(start: string, end: string): string {
  if (!start) return "";
  if (!end || start === end) return fmtDate(start);
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}

export default function DepartmentDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ name: string }>();
  const departmentName = decodeURIComponent(
    (Array.isArray(params.name) ? params.name[0] : params.name) || "",
  );

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => apiJson<User[]>("/api/users"),
  });

  const absencesQuery = useQuery({
    queryKey: ["absences"],
    queryFn: () => apiJson<Absence[]>("/api/absences"),
  });

  const refreshing = usersQuery.isFetching || absencesQuery.isFetching;
  const onRefresh = () => {
    usersQuery.refetch();
    absencesQuery.refetch();
  };

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const teamMembers = useMemo(() => {
    if (!usersQuery.data) return [];
    return usersQuery.data
      .filter(
        (u) => (u.active ?? true) && (u.department || "") === departmentName,
      )
      .sort((a, b) =>
        (a.fullName || a.username || "").localeCompare(
          b.fullName || b.username || "",
        ),
      );
  }, [usersQuery.data, departmentName]);

  const manager = useMemo(
    () =>
      teamMembers.find(
        (u) => u.role === "manager" || u.role === "manager_az",
      ) || null,
    [teamMembers],
  );

  const deptAbsences = useMemo(() => {
    if (!absencesQuery.data) return [];
    return absencesQuery.data.filter(
      (a) =>
        (a.userDepartment || "") === departmentName &&
        (a.status === "approved" || a.status === "pending"),
    );
  }, [absencesQuery.data, departmentName]);

  const todayAbsences = useMemo(
    () =>
      deptAbsences
        .filter((a) => a.startDate <= today && a.endDate >= today)
        .sort((a, b) =>
          (a.userName || "").localeCompare(b.userName || ""),
        ),
    [deptAbsences, today],
  );

  const upcomingAbsences = useMemo(
    () =>
      deptAbsences
        .filter((a) => a.startDate > today)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [deptAbsences, today],
  );

  const absentUserIds = useMemo(
    () => new Set(todayAbsences.map((a) => a.userId)),
    [todayAbsences],
  );

  const presentCount = teamMembers.filter(
    (u) => !absentUserIds.has(u.id),
  ).length;

  const isLoading = usersQuery.isLoading || absencesQuery.isLoading;
  const loadError =
    (usersQuery.error as Error | null)?.message ||
    (absencesQuery.error as Error | null)?.message ||
    null;

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.sidebar }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.sidebar,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          testID="button-back"
          hitSlop={10}
        >
          <Feather
            name="chevron-left"
            size={22}
            color={colors.sidebarForeground}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.sidebarForeground },
            ]}
            numberOfLines={1}
            testID="text-department-name"
          >
            {departmentName || "Afdeling"}
          </Text>
          {manager ? (
            <Text
              style={[
                styles.headerSubtitle,
                { color: colors.sidebarForeground, opacity: 0.75 },
              ]}
              numberOfLines={1}
            >
              {manager.fullName}
              {manager.role
                ? ` (${ROLE_LABELS[manager.role] || manager.role})`
                : ""}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing && !isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : loadError ? (
          <Card
            style={{ alignItems: "center", paddingVertical: 18 }}
            testID="card-error"
          >
            <Feather
              name="alert-triangle"
              size={20}
              color={colors.mutedForeground}
            />
            <Text
              style={{
                color: colors.foreground,
                fontFamily: "Inter_600SemiBold",
                fontSize: 13,
                marginTop: 8,
              }}
            >
              Kon teamgegevens niet laden
            </Text>
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 12,
                marginTop: 4,
                textAlign: "center",
              }}
            >
              {loadError}
            </Text>
            <Pressable
              onPress={onRefresh}
              style={({ pressed }) => ({
                marginTop: 12,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 6,
                backgroundColor: colors.primary,
                opacity: pressed ? 0.7 : 1,
              })}
              testID="button-retry"
            >
              <Text
                style={{
                  color: colors.primaryForeground,
                  fontFamily: "Inter_500Medium",
                  fontSize: 13,
                }}
              >
                Opnieuw proberen
              </Text>
            </Pressable>
          </Card>
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatTile
                icon="users"
                label="Teamleden"
                value={teamMembers.length}
              />
              <StatTile
                icon="user-check"
                label="Aanwezig"
                value={presentCount}
              />
              <StatTile
                icon="user-x"
                label="Afwezig"
                value={todayAbsences.length}
              />
            </View>

            <SectionTitle title="Vandaag afwezig" />
            {todayAbsences.length === 0 ? (
              <EmptyCard text="Niemand uit dit team is vandaag afwezig" />
            ) : (
              todayAbsences.map((a) => (
                <AbsenceCard
                  key={a.id}
                  absence={a}
                  testID={`card-today-absence-${a.id}`}
                  showRange={false}
                />
              ))
            )}

            <SectionTitle title="Komend verlof" />
            {upcomingAbsences.length === 0 ? (
              <EmptyCard text="Geen gepland verlof in dit team" />
            ) : (
              upcomingAbsences.map((a) => (
                <AbsenceCard
                  key={a.id}
                  absence={a}
                  testID={`card-upcoming-absence-${a.id}`}
                  showRange
                />
              ))
            )}

            <SectionTitle title={`Teamleden (${teamMembers.length})`} />
            {teamMembers.length === 0 ? (
              <EmptyCard text="Geen teamleden gevonden" />
            ) : (
              teamMembers.map((u) => {
                const isAbsent = absentUserIds.has(u.id);
                return (
                  <Card
                    key={u.id}
                    style={{
                      marginBottom: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                    testID={`card-team-member-${u.id}`}
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
                        style={{
                          color: colors.foreground,
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 14,
                        }}
                        numberOfLines={1}
                      >
                        {u.fullName || u.username || "Medewerker"}
                      </Text>
                      <Text
                        style={{
                          color: colors.mutedForeground,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {u.jobTitle ||
                          (u.role ? ROLE_LABELS[u.role] || u.role : "")}
                      </Text>
                    </View>
                    <StatusPill present={!isAbsent} />
                  </Card>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: number;
}) {
  const colors = useColors();
  return (
    <Card style={{ flex: 1, padding: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginBottom: 4,
        }}
      >
        <Feather name={icon} size={14} color={colors.primary} />
        <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
          {label}
        </Text>
      </View>
      <Text
        style={{
          color: colors.foreground,
          fontFamily: "Inter_700Bold",
          fontSize: 20,
        }}
        testID={`stat-${label}`}
      >
        {value}
      </Text>
    </Card>
  );
}

function SectionTitle({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text
      style={{
        color: colors.foreground,
        fontFamily: "Inter_600SemiBold",
        fontSize: 14,
        marginTop: 18,
        marginBottom: 8,
      }}
    >
      {title}
    </Text>
  );
}

function EmptyCard({ text }: { text: string }) {
  const colors = useColors();
  return (
    <Card style={{ alignItems: "center", paddingVertical: 18 }}>
      <Feather name="inbox" size={18} color={colors.mutedForeground} />
      <Text
        style={{
          color: colors.mutedForeground,
          fontSize: 12,
          marginTop: 6,
        }}
      >
        {text}
      </Text>
    </Card>
  );
}

function StatusPill({ present }: { present: boolean }) {
  const colors = useColors();
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: present ? colors.accent : colors.card,
      }}
    >
      <Text
        style={{
          color: present ? colors.accentForeground : colors.mutedForeground,
          fontSize: 11,
          fontFamily: "Inter_500Medium",
        }}
      >
        {present ? "Aanwezig" : "Afwezig"}
      </Text>
    </View>
  );
}

function AbsenceCard({
  absence,
  testID,
  showRange,
}: {
  absence: Absence;
  testID?: string;
  showRange: boolean;
}) {
  const colors = useColors();
  const typeLabel = ABSENCE_TYPE_LABELS[absence.type] || absence.type;
  const isHalfDay = absence.halfDay === "am" || absence.halfDay === "pm";
  return (
    <Card style={{ marginBottom: 8 }} testID={testID}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_600SemiBold",
            fontSize: 14,
            flexShrink: 1,
          }}
        >
          {absence.userName || "Medewerker"}
        </Text>
        {isHalfDay ? (
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
            }}
          >
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 11,
                fontFamily: "Inter_500Medium",
              }}
            >
              {absence.halfDay === "am" ? "Ochtend" : "Middag"}
            </Text>
          </View>
        ) : null}
        {absence.status === "pending" ? (
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
            }}
          >
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 11,
                fontFamily: "Inter_500Medium",
              }}
            >
              In afwachting
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        style={{
          color: colors.mutedForeground,
          fontSize: 13,
          marginTop: 4,
        }}
      >
        {typeLabel}
        {showRange ? ` · ${fmtRange(absence.startDate, absence.endDate)}` : ""}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
});
