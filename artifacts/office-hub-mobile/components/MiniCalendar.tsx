import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";
import { apiJson } from "@/lib/api";

interface EventRecord {
  id: string;
  title: string;
  date: string;
  endDate?: string | null;
  description?: string | null;
  time?: string | null;
  location?: string | null;
  category?: string | null;
}
interface UserRecord {
  id: string;
  fullName?: string | null;
  birthDate?: string | null;
  startDate?: string | null;
  active?: boolean;
}
interface OfficialHoliday {
  id: string;
  year: number;
  name: string;
  date: string;
}
interface Snipperdag {
  id: string;
  name: string;
  date: string;
}

type EntryType =
  | "event"
  | "verjaardag"
  | "jubileum"
  | "feestdag"
  | "snipperdag";

interface CalEntry {
  id: string;
  title: string;
  date: string;
  type: EntryType;
  description?: string | null;
  time?: string | null;
  location?: string | null;
  category?: string | null;
}

const MAANDEN = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

const WEEKDAGEN_LANG = [
  "zondag",
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
];

const TYPE_DOT: Record<EntryType, string> = {
  event: "#27865A",
  verjaardag: "#ec4899",
  jubileum: "#f59e0b",
  feestdag: "#38bdf8",
  snipperdag: "#ef4444",
};

const TYPE_LABEL: Record<EntryType, string> = {
  event: "Evenement",
  verjaardag: "Verjaardag",
  jubileum: "Jubileum",
  feestdag: "Feestdag",
  snipperdag: "Snipperdag",
};

const CATEGORY_DOT: Record<string, string> = {
  vergadering: "#3b82f6",
  training: "#22c55e",
  sociaal: "#a855f7",
  deadline: "#ef4444",
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function computeEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function defaultDutchHolidays(year: number): CalEntry[] {
  const easter = computeEaster(year);
  const goedeVrijdag = new Date(easter);
  goedeVrijdag.setDate(easter.getDate() - 2);
  const tweedePaasdag = new Date(easter);
  tweedePaasdag.setDate(easter.getDate() + 1);
  const hemelvaartsdag = new Date(easter);
  hemelvaartsdag.setDate(easter.getDate() + 39);
  const eerstePinksterdag = new Date(easter);
  eerstePinksterdag.setDate(easter.getDate() + 49);
  const tweedePinksterdag = new Date(easter);
  tweedePinksterdag.setDate(easter.getDate() + 50);

  const list: { name: string; date: Date }[] = [
    { name: "Nieuwjaarsdag", date: new Date(year, 0, 1) },
    { name: "Goede Vrijdag", date: goedeVrijdag },
    { name: "Eerste Paasdag", date: easter },
    { name: "Tweede Paasdag", date: tweedePaasdag },
    { name: "Koningsdag", date: new Date(year, 3, 27) },
    { name: "Bevrijdingsdag", date: new Date(year, 4, 5) },
    { name: "Hemelvaartsdag", date: hemelvaartsdag },
    { name: "Eerste Pinksterdag", date: eerstePinksterdag },
    { name: "Tweede Pinksterdag", date: tweedePinksterdag },
    { name: "Eerste Kerstdag", date: new Date(year, 11, 25) },
    { name: "Tweede Kerstdag", date: new Date(year, 11, 26) },
  ];
  return list.map((h) => ({
    id: `feestdag-${h.name}-${year}`,
    title: h.name,
    date: ymd(h.date),
    type: "feestdag",
    description: "Nationale feestdag",
  }));
}

function birthdaysFor(users: UserRecord[], year: number, month: number): CalEntry[] {
  const out: CalEntry[] = [];
  for (const u of users) {
    if (!u.birthDate || u.active === false) continue;
    const bd = new Date(u.birthDate + "T00:00:00");
    if (bd.getMonth() !== month) continue;
    const age = year - bd.getFullYear();
    out.push({
      id: `verjaardag-${u.id}-${year}`,
      title: `${u.fullName} (${age} jaar)`,
      date: `${year}-${pad(month + 1)}-${pad(bd.getDate())}`,
      type: "verjaardag",
    });
  }
  return out;
}

function anniversariesFor(
  users: UserRecord[],
  year: number,
  month: number,
): CalEntry[] {
  const out: CalEntry[] = [];
  for (const u of users) {
    if (!u.startDate || u.active === false) continue;
    const sd = new Date(u.startDate + "T00:00:00");
    if (sd.getMonth() !== month || sd.getFullYear() >= year) continue;
    const years = year - sd.getFullYear();
    out.push({
      id: `jubileum-${u.id}-${year}`,
      title: `${u.fullName} (${years} jaar in dienst)`,
      date: `${year}-${pad(month + 1)}-${pad(sd.getDate())}`,
      type: "jubileum",
    });
  }
  return out;
}

export default function MiniCalendar() {
  const colors = useColors();
  const today = new Date();
  const [cursor, setCursor] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const eventsQ = useQuery({
    queryKey: ["cal-events"],
    queryFn: () => apiJson<EventRecord[]>("/api/events"),
  });
  const usersQ = useQuery({
    queryKey: ["cal-users"],
    queryFn: () => apiJson<UserRecord[]>("/api/users"),
  });
  const holidaysQ = useQuery({
    queryKey: ["cal-holidays"],
    queryFn: () => apiJson<OfficialHoliday[]>("/api/official-holidays"),
  });
  const snipperQ = useQuery({
    queryKey: ["cal-snipperdagen"],
    queryFn: () => apiJson<Snipperdag[]>("/api/snipperdagen"),
  });

  const allEntries = useMemo<CalEntry[]>(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const entries: CalEntry[] = [];

    for (const ev of eventsQ.data || []) {
      entries.push({
        id: `event-${ev.id}`,
        title: ev.title,
        date: ev.date,
        type: "event",
        description: ev.description,
        time: ev.time,
        location: ev.location,
        category: ev.category,
      });
    }
    if (usersQ.data) {
      const us = usersQ.data;
      [-1, 0, 1].forEach((delta) => {
        const m = month + delta;
        const y = m < 0 ? year - 1 : m > 11 ? year + 1 : year;
        const mm = ((m % 12) + 12) % 12;
        entries.push(...birthdaysFor(us, y, mm));
        entries.push(...anniversariesFor(us, y, mm));
      });
    }
    const addHol = (y: number) => {
      const uploaded = (holidaysQ.data || []).filter((h) => h.year === y);
      if (uploaded.length > 0) {
        for (const h of uploaded) {
          entries.push({
            id: `feestdag-uploaded-${h.id}`,
            title: h.name,
            date: h.date,
            type: "feestdag",
            description: "Officiële vakantiedag",
          });
        }
      } else {
        entries.push(...defaultDutchHolidays(y));
      }
    };
    addHol(year);
    if (month === 0) addHol(year - 1);
    if (month === 11) addHol(year + 1);

    for (const s of snipperQ.data || []) {
      entries.push({
        id: `snipperdag-${s.id}`,
        title: s.name,
        date: s.date,
        type: "snipperdag",
        description: "Snipperdag",
      });
    }
    return entries;
  }, [eventsQ.data, usersQ.data, holidaysQ.data, snipperQ.data, cursor]);

  // Build calendar grid (Mon-Sun)
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  // weekday: 0=Sun..6=Sat. Want Mon=0..Sun=6
  const startWeekday = (monthStart.getDay() + 6) % 7;
  const endWeekday = (monthEnd.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - startWeekday);
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(monthEnd.getDate() + (6 - endWeekday));
  const days: Date[] = [];
  for (
    let d = new Date(gridStart);
    d <= gridEnd;
    d.setDate(d.getDate() + 1)
  ) {
    days.push(new Date(d));
  }

  const entriesByDay = useMemo(() => {
    const m: Record<string, CalEntry[]> = {};
    for (const e of allEntries) (m[e.date] = m[e.date] || []).push(e);
    return m;
  }, [allEntries]);

  const todayKey = ymd(today);
  const selectedEntries = selectedDay ? entriesByDay[selectedDay] || [] : [];

  function prevMonth() {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  }
  function goToday() {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  const weekHeaders = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

  return (
    <Card style={{ padding: 12 }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable
          onPress={prevMonth}
          style={styles.navBtn}
          testID="cal-prev"
        >
          <Feather name="chevron-left" size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.monthLabel, { color: colors.foreground }]}>
          {MAANDEN[cursor.getMonth()]} {cursor.getFullYear()}
        </Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <Pressable
            onPress={goToday}
            style={[
              styles.todayBtn,
              { borderColor: colors.border },
            ]}
            testID="cal-today"
          >
            <Text
              style={{
                color: colors.foreground,
                fontSize: 11,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              Vandaag
            </Text>
          </Pressable>
          <Pressable
            onPress={nextMonth}
            style={styles.navBtn}
            testID="cal-next"
          >
            <Feather
              name="chevron-right"
              size={18}
              color={colors.foreground}
            />
          </Pressable>
        </View>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekRow}>
        {weekHeaders.map((d) => (
          <Text
            key={d}
            style={[styles.weekHead, { color: colors.mutedForeground }]}
          >
            {d}
          </Text>
        ))}
      </View>

      {/* Days grid */}
      <View style={styles.grid}>
        {days.map((d) => {
          const key = ymd(d);
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = key === todayKey;
          const dayEntries = entriesByDay[key] || [];
          const dotTypes = Array.from(
            new Set(dayEntries.map((e) => e.type)),
          ).slice(0, 4);
          return (
            <Pressable
              key={key}
              onPress={() => setSelectedDay(key)}
              style={[
                styles.dayCell,
                {
                  backgroundColor: inMonth ? colors.card : "transparent",
                  borderColor: colors.border,
                  opacity: inMonth ? 1 : 0.4,
                },
                isToday && {
                  borderColor: colors.primary,
                  borderWidth: 1.5,
                },
              ]}
              testID={`cal-day-${key}`}
            >
              <Text
                style={[
                  styles.dayNum,
                  {
                    color: isToday ? colors.primary : colors.foreground,
                    fontFamily: isToday
                      ? "Inter_700Bold"
                      : "Inter_500Medium",
                  },
                ]}
              >
                {d.getDate()}
              </Text>
              {dotTypes.length > 0 ? (
                <View style={styles.dotRow}>
                  {dotTypes.map((t) => (
                    <View
                      key={t}
                      style={[
                        styles.dot,
                        { backgroundColor: TYPE_DOT[t] },
                      ]}
                    />
                  ))}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {(
          [
            "event",
            "verjaardag",
            "jubileum",
            "feestdag",
            "snipperdag",
          ] as EntryType[]
        ).map((t) => (
          <View key={t} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: TYPE_DOT[t] }]} />
            <Text
              style={{ color: colors.mutedForeground, fontSize: 10 }}
            >
              {TYPE_LABEL[t]}
            </Text>
          </View>
        ))}
      </View>

      {/* Day detail modal */}
      <Modal
        visible={!!selectedDay}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDay(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedDay(null)}
        >
          <Pressable
            style={[
              styles.modalSheet,
              { backgroundColor: colors.background },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedDay ? (
              <>
                <Text
                  style={[styles.modalTitle, { color: colors.foreground }]}
                >
                  {(() => {
                    const d = new Date(selectedDay + "T00:00:00");
                    return `${WEEKDAGEN_LANG[d.getDay()]} ${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`;
                  })()}
                </Text>
                <ScrollView style={{ maxHeight: 460 }}>
                  {selectedEntries.length === 0 ? (
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        textAlign: "center",
                        paddingVertical: 24,
                      }}
                    >
                      Geen items op deze dag
                    </Text>
                  ) : (
                    selectedEntries.map((e) => {
                      const dotColor =
                        e.type === "event" && e.category
                          ? CATEGORY_DOT[e.category] || TYPE_DOT[e.type]
                          : TYPE_DOT[e.type];
                      return (
                        <View
                          key={e.id}
                          style={[
                            styles.entryRow,
                            { borderBottomColor: colors.border },
                          ]}
                        >
                          <View
                            style={[
                              styles.entryIcon,
                              { backgroundColor: dotColor + "33" },
                            ]}
                          >
                            <View
                              style={[styles.dot, { backgroundColor: dotColor }]}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.entryTitle,
                                { color: colors.foreground },
                              ]}
                            >
                              {e.title}
                            </Text>
                            {e.description ? (
                              <Text
                                style={[
                                  styles.entrySub,
                                  { color: colors.mutedForeground },
                                ]}
                              >
                                {e.description}
                              </Text>
                            ) : null}
                            <View style={styles.entryMeta}>
                              <View
                                style={[
                                  styles.typeBadge,
                                  { borderColor: colors.border },
                                ]}
                              >
                                <Text
                                  style={{
                                    color: colors.mutedForeground,
                                    fontSize: 10,
                                    fontFamily: "Inter_600SemiBold",
                                  }}
                                >
                                  {TYPE_LABEL[e.type]}
                                </Text>
                              </View>
                              {e.time ? (
                                <View style={styles.metaItem}>
                                  <Feather
                                    name="clock"
                                    size={11}
                                    color={colors.mutedForeground}
                                  />
                                  <Text
                                    style={{
                                      color: colors.mutedForeground,
                                      fontSize: 11,
                                    }}
                                  >
                                    {e.time}
                                  </Text>
                                </View>
                              ) : null}
                              {e.location ? (
                                <View style={styles.metaItem}>
                                  <Feather
                                    name="map-pin"
                                    size={11}
                                    color={colors.mutedForeground}
                                  />
                                  <Text
                                    style={{
                                      color: colors.mutedForeground,
                                      fontSize: 11,
                                    }}
                                  >
                                    {e.location}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  todayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    textTransform: "capitalize",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekHead: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingVertical: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayNum: {
    fontSize: 13,
    marginTop: 2,
  },
  dotRow: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 2,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 24,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    marginBottom: 12,
    textTransform: "capitalize",
  },
  entryRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entryIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  entryTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  entrySub: {
    fontSize: 12,
    marginTop: 2,
  },
  entryMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
    alignItems: "center",
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
});
