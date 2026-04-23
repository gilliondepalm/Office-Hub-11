import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import { apiJson } from "@/lib/api";

const photo = require("../../assets/brand/werktijden.jpg");

// ── Types ────────────────────────────────────────────────────────────────────
interface Werktijd {
  logid: number;
  userid: string;
  checktime: string;
  checktype: string;
}

interface AbsenceRecord {
  id: number;
  userId: number;
  startDate: string;
  endDate: string;
  status: string;
  type: string;
}

interface UserLite {
  id: number;
  fullName?: string | null;
  username: string;
  kadasterId?: string | null;
  active?: boolean;
  department?: string | null;
}

type WorkPair = {
  inRec: Werktijd;
  outRec: Werktijd | null;
  inTime: Date;
  outTime: Date | null;
  durSec: number | null;
  werktijdSec: number | null;
};

type PauzePair = {
  outRec: Werktijd;
  inRec: Werktijd;
  outTime: Date;
  inTime: Date;
  durSec: number;
};

type DagAnalyse = {
  datum: string;
  dagStr: string;
  weekdagKort: string;
  isFriday: boolean;
  pairs: WorkPair[];
  completePairs: WorkPair[];
  incompletePairs: WorkPair[];
  pauze: PauzePair | null;
  totaalWerktijdSec: number;
  targetSec: number;
  verschilSec: number;
  blok1Ok: boolean;
  blok2Ok: boolean;
  blok3Ok: boolean;
  blok4Ok: boolean;
  teLaat: Array<{ rec: Werktijd; tijd: string }>;
  teVroegIn: Array<{ rec: Werktijd; tijd: string }>;
  teVroegUit: Array<{ rec: Werktijd; tijd: string }>;
  isAbsent: boolean;
};

// ── Constants ────────────────────────────────────────────────────────────────
const _H = 3600,
  _M = 60;
const ANA_BLK1_S = 7 * _H;
const ANA_BLK1_E = 8 * _H;
const ANA_BLK2_S = 11 * _H + 45 * _M;
const ANA_BLK2_E = 12 * _H;
const ANA_BLK3_S = 13 * _H + 30 * _M;
const ANA_BLK3_E = 14 * _H;
const ANA_BLK4_WD = 16 * _H + 45 * _M;
const ANA_BLK4_FR = 16 * _H + 30 * _M;
const ANA_BLK4_E = 18 * _H;
const ANA_BREAK_S = 12 * _H;
const ANA_BREAK_E = 13 * _H + 30 * _M;
const ANA_TARGET_WD = 8 * _H;
const ANA_TARGET_FR = 7 * _H + 30 * _M;
const ANA_PAUZE_OUT_MIN = 11 * _H + 30 * _M;
const ANA_PAUZE_OUT_MAX = 13 * _H + 30 * _M;
const ANA_PAUZE_IN_MIN = 12 * _H;
const ANA_PAUZE_IN_MAX = 15 * _H;

const WEEKDAGEN = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
const ADMIN_ROLES = new Set([
  "admin",
  "superadmin",
  "super_admin",
  "manager",
  "manager_az",
]);

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseChecktime(ct: string): Date {
  const s = ct.replace(/Z$/, "").replace(" ", "T");
  return new Date(s);
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function dateKey(d: Date | string): string {
  const dt = typeof d === "string" ? parseChecktime(d) : d;
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

function ymdToDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatDDMMYYYY(s: string): string {
  const [y, m, d] = s.split("-");
  return `${d}-${m}-${y}`;
}

function secOfDay(d: Date): number {
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

function formatHMS(sec: number): string {
  const abs = Math.abs(Math.round(sec));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildPairs(recs: Werktijd[]): WorkPair[] {
  const sorted = [...recs].sort(
    (a, b) =>
      parseChecktime(a.checktime).getTime() -
      parseChecktime(b.checktime).getTime(),
  );
  const pairs: WorkPair[] = [];
  let pendingIn: Werktijd | null = null;
  for (const r of sorted) {
    if (r.checktype === "in") {
      if (pendingIn !== null) {
        pairs.push({
          inRec: pendingIn,
          outRec: null,
          inTime: parseChecktime(pendingIn.checktime),
          outTime: null,
          durSec: null,
          werktijdSec: null,
        });
      }
      pendingIn = r;
    } else {
      if (pendingIn !== null) {
        const inTime = parseChecktime(pendingIn.checktime);
        const outTime = parseChecktime(r.checktime);
        const durSec = (outTime.getTime() - inTime.getTime()) / 1000;
        const inSec = secOfDay(inTime);
        const outSec = secOfDay(outTime);
        const brkOv = Math.max(
          0,
          Math.min(outSec, ANA_BREAK_E) - Math.max(inSec, ANA_BREAK_S),
        );
        const werktijdSec = Math.max(0, durSec - brkOv);
        pairs.push({
          inRec: pendingIn,
          outRec: r,
          inTime,
          outTime,
          durSec,
          werktijdSec,
        });
        pendingIn = null;
      }
    }
  }
  if (pendingIn !== null) {
    pairs.push({
      inRec: pendingIn,
      outRec: null,
      inTime: parseChecktime(pendingIn.checktime),
      outTime: null,
      durSec: null,
      werktijdSec: null,
    });
  }
  return pairs;
}

function detectPauze(pairs: WorkPair[]): PauzePair | null {
  for (let i = 0; i < pairs.length - 1; i++) {
    const s1 = pairs[i];
    const s2 = pairs[i + 1];
    if (!s1.outRec || !s1.outTime || !s2.inTime) continue;
    const outSec = secOfDay(s1.outTime);
    const inSec = secOfDay(s2.inTime);
    const gapSec = (s2.inTime.getTime() - s1.outTime.getTime()) / 1000;
    if (
      outSec >= ANA_PAUZE_OUT_MIN &&
      outSec <= ANA_PAUZE_OUT_MAX &&
      inSec >= ANA_PAUZE_IN_MIN &&
      inSec <= ANA_PAUZE_IN_MAX &&
      gapSec >= 30 * 60 &&
      gapSec <= 180 * 60
    ) {
      return {
        outRec: s1.outRec,
        inRec: s2.inRec,
        outTime: s1.outTime,
        inTime: s2.inTime,
        durSec: gapSec,
      };
    }
  }
  return null;
}

function computeDag(
  datum: string,
  recs: Werktijd[],
  isAbsent: boolean,
): DagAnalyse {
  const d = ymdToDate(datum);
  const isFriday = d.getDay() === 5;
  const targetSec = isFriday ? ANA_TARGET_FR : ANA_TARGET_WD;
  const b4Start = isFriday ? ANA_BLK4_FR : ANA_BLK4_WD;

  const pairs = buildPairs(recs);
  const completePairs = pairs.filter((p) => p.outRec !== null);
  const incompletePairs = pairs.filter((p) => p.outRec === null);
  const pauze = detectPauze(pairs);

  const totaalWerktijdSec = completePairs.reduce(
    (s, p) => s + (p.werktijdSec ?? 0),
    0,
  );
  const verschilSec = totaalWerktijdSec - targetSec;

  const sorted = [...recs].sort(
    (a, b) =>
      parseChecktime(a.checktime).getTime() -
      parseChecktime(b.checktime).getTime(),
  );
  const inRecs = sorted.filter((r) => r.checktype === "in");
  const outRecs = sorted.filter((r) => r.checktype === "out");

  const blok1Ok = inRecs.some((r) => {
    const s = secOfDay(parseChecktime(r.checktime));
    return s >= ANA_BLK1_S && s <= ANA_BLK1_E;
  });
  const blok2Ok = outRecs.some((r) => {
    const s = secOfDay(parseChecktime(r.checktime));
    return s >= ANA_BLK2_S && s <= ANA_BLK2_E + 30 * 60;
  });
  const blok3Ok = inRecs.some((r) => {
    const s = secOfDay(parseChecktime(r.checktime));
    return s >= ANA_BLK3_S && s <= ANA_BLK3_E + 30 * 60;
  });
  const blok4Ok = outRecs.some((r) => {
    const s = secOfDay(parseChecktime(r.checktime));
    return s >= b4Start - 15 * 60 && s <= ANA_BLK4_E;
  });

  const teLaat: Array<{ rec: Werktijd; tijd: string }> = [];
  const teVroegIn: Array<{ rec: Werktijd; tijd: string }> = [];
  const teVroegUit: Array<{ rec: Werktijd; tijd: string }> = [];

  for (const r of sorted) {
    const dt = parseChecktime(r.checktime);
    const sec = secOfDay(dt);
    const tijd = formatTime(dt);
    if (r.checktype === "in") {
      if (sec < ANA_BLK1_S) teVroegIn.push({ rec: r, tijd });
      else if (sec > ANA_BLK1_E && sec < 13 * _H) teLaat.push({ rec: r, tijd });
      else if (sec > ANA_BLK3_E && sec >= 12 * _H)
        teLaat.push({ rec: r, tijd });
    } else {
      if (!isAbsent && sec >= ANA_BREAK_E && sec < b4Start)
        teVroegUit.push({ rec: r, tijd });
    }
  }

  const dt = ymdToDate(datum);
  return {
    datum,
    dagStr: formatDDMMYYYY(datum),
    weekdagKort: WEEKDAGEN[dt.getDay()],
    isFriday,
    pairs,
    completePairs,
    incompletePairs,
    pauze,
    totaalWerktijdSec,
    targetSec,
    verschilSec,
    blok1Ok,
    blok2Ok,
    blok3Ok,
    blok4Ok,
    teLaat,
    teVroegIn,
    teVroegUit,
    isAbsent,
  };
}

// ── Sub-components ───────────────────────────────────────────────────────────
function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  sub?: string;
  color: string;
  bg: string;
}) {
  const colors = useColors();
  return (
    <Card style={styles.kpiCard}>
      <View style={[styles.kpiIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.kpiValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
      {sub ? (
        <Text style={[styles.kpiSub, { color: colors.mutedForeground }]}>
          {sub}
        </Text>
      ) : null}
    </Card>
  );
}

function SectionRow({
  cells,
  colors,
  highlight,
}: {
  cells: string[];
  colors: ReturnType<typeof useColors>;
  highlight?: string;
}) {
  return (
    <View style={[styles.tableRow, { borderTopColor: colors.border }]}>
      {cells.map((c, i) => (
        <Text
          key={i}
          style={[
            styles.cell,
            {
              color: highlight && i === cells.length - 1 ? highlight : colors.foreground,
              fontFamily:
                highlight && i === cells.length - 1
                  ? "Inter_600SemiBold"
                  : "Inter_400Regular",
            },
          ]}
          numberOfLines={1}
        >
          {c}
        </Text>
      ))}
    </View>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const colors = useColors();
  const [show, setShow] = useState(false);

  if (Platform.OS === "web") {
    return (
      <View style={{ flex: 1 }}>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        <View
          style={[
            styles.dateBtn,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <Feather name="calendar" size={14} color={colors.mutedForeground} />
          {React.createElement("input" as any, {
            type: "date",
            value: value,
            onChange: (e: any) => onChange(e.target.value),
            style: {
              border: "none",
              outline: "none",
              background: "transparent",
              color: colors.foreground,
              fontSize: 13,
              fontFamily: "Inter_400Regular",
              flex: 1,
              padding: 0,
            },
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Pressable
        onPress={() => setShow(true)}
        style={[
          styles.dateBtn,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        <Feather name="calendar" size={14} color={colors.mutedForeground} />
        <Text style={{ color: colors.foreground, fontSize: 13 }}>
          {value ? formatDDMMYYYY(value) : "Kies"}
        </Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={value ? ymdToDate(value) : new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(_e, d) => {
            setShow(Platform.OS === "ios");
            if (d) onChange(dateKey(d));
          }}
        />
      )}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function WerktijdenScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const isManager = ADMIN_ROLES.has((user?.role || "").toLowerCase());

  // Default: current month
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const [from, setFrom] = useState(dateKey(monthStart));
  const [to, setTo] = useState(dateKey(today));
  const [pickedKadasterId, setPickedKadasterId] = useState<string>(
    user?.kadasterId || "",
  );
  const [userPickerOpen, setUserPickerOpen] = useState(false);

  const usersQ = useQuery({
    queryKey: ["users-werktijden"],
    queryFn: () => apiJson<UserLite[]>("/api/users"),
    enabled: isManager,
  });

  const recordsQ = useQuery({
    queryKey: ["werktijden", isManager ? pickedKadasterId : "self"],
    queryFn: () =>
      apiJson<Werktijd[]>(
        isManager && pickedKadasterId
          ? `/api/werktijden?userid=${encodeURIComponent(pickedKadasterId)}`
          : "/api/werktijden",
      ),
  });

  const absencesQ = useQuery({
    queryKey: ["absences-werktijden"],
    queryFn: () => apiJson<AbsenceRecord[]>("/api/absences"),
  });

  const activeUsers = useMemo(
    () =>
      (usersQ.data || []).filter(
        (u) => u.active !== false && !!u.kadasterId,
      ),
    [usersQ.data],
  );

  const targetKadasterId = isManager
    ? pickedKadasterId
    : user?.kadasterId || "";
  const targetUser = isManager
    ? activeUsers.find((u) => u.kadasterId === targetKadasterId)
    : ({
        id: user?.id,
        fullName: user?.fullName,
        username: user?.username,
        kadasterId: user?.kadasterId,
      } as UserLite | undefined);

  const analyseData = useMemo<DagAnalyse[] | null>(() => {
    if (!targetKadasterId) return null;
    const recs = (recordsQ.data || []).filter((r) => {
      if (r.userid !== targetKadasterId) return false;
      const dk = dateKey(r.checktime);
      if (from && dk < from) return false;
      if (to && dk > to) return false;
      return true;
    });
    const byDay: Record<string, Werktijd[]> = {};
    for (const r of recs) {
      const k = dateKey(r.checktime);
      (byDay[k] = byDay[k] || []).push(r);
    }
    const isAbsent = (datum: string) =>
      !!targetUser?.id &&
      (absencesQ.data || []).some(
        (a) =>
          a.userId === targetUser.id &&
          a.status === "approved" &&
          datum >= a.startDate.slice(0, 10) &&
          datum <= a.endDate.slice(0, 10),
      );
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, recs]) => computeDag(d, recs, isAbsent(d)));
  }, [recordsQ.data, absencesQ.data, targetKadasterId, targetUser?.id, from, to]);

  const data = analyseData || [];
  const verzuimDagen = data.filter(
    (d) =>
      !d.isAbsent &&
      d.completePairs.length > 0 &&
      (!d.blok1Ok || !d.blok2Ok || !d.blok3Ok || !d.blok4Ok),
  );
  const allTeLaat = data.flatMap((d) =>
    d.teLaat.map((t) => ({ ...t, dag: d })),
  );
  const allTeVroegIn = data.flatMap((d) =>
    d.teVroegIn.map((t) => ({ ...t, dag: d })),
  );
  const allTeVroegUit = data.flatMap((d) =>
    d.teVroegUit.map((t) => ({ ...t, dag: d })),
  );
  const allPauzes = data
    .filter((d) => d.pauze !== null)
    .map((d) => ({ pauze: d.pauze!, dag: d }));
  const totalPauzeSec = allPauzes.reduce((s, p) => s + p.pauze.durSec, 0);
  const totalWerktijdSec = data.reduce((s, d) => s + d.totaalWerktijdSec, 0);
  const totalDagenGewerkt = data.filter(
    (d) => d.completePairs.length > 0,
  ).length;
  const totalIncomplete = data.reduce(
    (s, d) => s + d.incompletePairs.length,
    0,
  );
  const variabelSaldoSec = data.reduce(
    (s, d) => s + (d.isAbsent ? 0 : d.verschilSec),
    0,
  );

  const isLoading = recordsQ.isLoading || absencesQ.isLoading;

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
          <Text style={styles.heroEyebrow}>Werktijden · Analyse</Text>
          <Text style={styles.heroTitle}>
            {targetUser?.fullName || targetUser?.username || "Mijn analyse"}
          </Text>
          <Text style={styles.heroSubtitle}>
            {formatDDMMYYYY(from)} t/m {formatDDMMYYYY(to)}
          </Text>
        </View>
      </ImageBackground>

      <View style={{ padding: 16, gap: 12 }}>
        {/* Filters */}
        <Card>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <DateField label="Van" value={from} onChange={setFrom} />
            <DateField label="T/m" value={to} onChange={setTo} />
          </View>
          {isManager ? (
            <Pressable
              onPress={() => setUserPickerOpen(true)}
              style={[
                styles.userBtn,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Feather name="user" size={14} color={colors.mutedForeground} />
              <Text style={{ color: colors.foreground, fontSize: 13, flex: 1 }}>
                {targetUser?.fullName ||
                  targetUser?.username ||
                  "Kies medewerker"}
              </Text>
              <Feather
                name="chevron-down"
                size={16}
                color={colors.mutedForeground}
              />
            </Pressable>
          ) : null}
        </Card>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : !targetKadasterId ? (
          <Card>
            <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
              Geen medewerker gekoppeld aan een kadasterId.
            </Text>
          </Card>
        ) : (
          <>
            {/* KPIs */}
            <View style={styles.kpiGrid}>
              <KpiCard
                icon="alert-octagon"
                label="Verzuim te klokken"
                value={String(verzuimDagen.length)}
                sub="dag(en)"
                color="#dc2626"
                bg="rgba(220,38,38,0.12)"
              />
              <KpiCard
                icon="clock"
                label="Te laat"
                value={String(allTeLaat.length)}
                sub="keer"
                color="#d97706"
                bg="rgba(217,119,6,0.12)"
              />
              <KpiCard
                icon="log-out"
                label="Te vroeg uit"
                value={String(allTeVroegUit.length)}
                sub="keer"
                color="#ea580c"
                bg="rgba(234,88,12,0.12)"
              />
              <KpiCard
                icon={variabelSaldoSec >= 0 ? "trending-up" : "trending-down"}
                label="Variabel saldo"
                value={`${variabelSaldoSec >= 0 ? "+" : "-"}${formatHMS(Math.abs(variabelSaldoSec))}`}
                sub={variabelSaldoSec >= 0 ? "te veel" : "te weinig"}
                color={variabelSaldoSec >= 0 ? "#16a34a" : "#ea580c"}
                bg={
                  variabelSaldoSec >= 0
                    ? "rgba(22,163,74,0.12)"
                    : "rgba(234,88,12,0.12)"
                }
              />
              <KpiCard
                icon="briefcase"
                label="Totaal gewerkt"
                value={formatHMS(totalWerktijdSec)}
                sub={`${totalDagenGewerkt} dag(en)`}
                color="#2563eb"
                bg="rgba(37,99,235,0.12)"
              />
            </View>

            {/* Gewerkte uren per dag */}
            <SectionCard
              title="Gewerkte werkuren"
              icon="clock"
              colors={colors}
              empty={data.length === 0 ? "Geen werkuren in deze periode" : null}
              footer={
                data.length > 0
                  ? `Totaal: ${formatHMS(totalWerktijdSec)} · ${totalDagenGewerkt} dag(en)`
                  : undefined
              }
            >
              {totalIncomplete > 0 ? (
                <Text
                  style={{
                    color: "#d97706",
                    fontSize: 12,
                    fontFamily: "Inter_600SemiBold",
                    paddingHorizontal: 12,
                    paddingTop: 8,
                  }}
                >
                  Incomplete werkuren: {totalIncomplete}
                </Text>
              ) : null}
              <View
                style={[styles.tableRow, { borderTopColor: "transparent" }]}
              >
                <Text
                  style={[styles.headCell, { color: colors.mutedForeground }]}
                >
                  Datum
                </Text>
                <Text
                  style={[styles.headCell, { color: colors.mutedForeground }]}
                >
                  In
                </Text>
                <Text
                  style={[styles.headCell, { color: colors.mutedForeground }]}
                >
                  Out
                </Text>
                <Text
                  style={[styles.headCell, { color: colors.mutedForeground }]}
                >
                  Tot
                </Text>
                <Text
                  style={[styles.headCell, { color: colors.mutedForeground }]}
                >
                  ±
                </Text>
              </View>
              {data.map((dag) => {
                const rows: { label: string; in: string; out: string }[] = [];
                dag.completePairs.forEach((p) =>
                  rows.push({
                    label: "",
                    in: formatTime(p.inTime),
                    out: p.outTime ? formatTime(p.outTime) : "—",
                  }),
                );
                dag.incompletePairs.forEach((p) =>
                  rows.push({
                    label: "",
                    in: formatTime(p.inTime),
                    out: "open",
                  }),
                );
                if (rows.length === 0) return null;
                return rows.map((r, idx) => {
                  const isLast = idx === rows.length - 1;
                  return (
                    <SectionRow
                      key={`${dag.datum}-${idx}`}
                      colors={colors}
                      cells={[
                        idx === 0 ? `${dag.weekdagKort} ${dag.dagStr.slice(0, 5)}` : "",
                        r.in,
                        r.out,
                        isLast ? formatHMS(dag.totaalWerktijdSec) : "",
                        isLast
                          ? `${dag.verschilSec >= 0 ? "+" : "-"}${formatHMS(Math.abs(dag.verschilSec))}`
                          : "",
                      ]}
                      highlight={
                        isLast
                          ? dag.verschilSec >= 0
                            ? "#16a34a"
                            : "#dc2626"
                          : undefined
                      }
                    />
                  );
                });
              })}
            </SectionCard>

            {/* Te laat */}
            <SectionCard
              title="Te laat ingeklokt"
              icon="alert-circle"
              tint="#d97706"
              colors={colors}
              empty={
                allTeLaat.length === 0 ? "Geen te laat geregistreerd" : null
              }
            >
              {allTeLaat.length > 0 ? (
                <View
                  style={[styles.tableRow, { borderTopColor: "transparent" }]}
                >
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    Dag
                  </Text>
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    Datum
                  </Text>
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    Tijd
                  </Text>
                </View>
              ) : null}
              {allTeLaat.map((item, i) => (
                <SectionRow
                  key={`tl-${item.rec.logid}-${i}`}
                  colors={colors}
                  cells={[item.dag.weekdagKort, item.dag.dagStr, item.tijd]}
                  highlight="#dc2626"
                />
              ))}
            </SectionCard>

            {/* Te vroeg uit */}
            <SectionCard
              title="Te vroeg uitgeklokt"
              icon="log-out"
              tint="#ea580c"
              colors={colors}
              empty={
                allTeVroegUit.length === 0
                  ? "Geen te vroeg uitgeklokt"
                  : null
              }
            >
              {allTeVroegUit.length > 0 ? (
                <View
                  style={[styles.tableRow, { borderTopColor: "transparent" }]}
                >
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    Dag
                  </Text>
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    Datum
                  </Text>
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    Tijd
                  </Text>
                </View>
              ) : null}
              {allTeVroegUit.map((item, i) => (
                <SectionRow
                  key={`tvu-${item.rec.logid}-${i}`}
                  colors={colors}
                  cells={[item.dag.weekdagKort, item.dag.dagStr, item.tijd]}
                  highlight="#ea580c"
                />
              ))}
            </SectionCard>

            {/* Te vroeg in */}
            {allTeVroegIn.length > 0 ? (
              <SectionCard
                title="Te vroeg ingeklokt (vóór 07:00)"
                icon="sunrise"
                tint="#2563eb"
                colors={colors}
              >
                <View
                  style={[styles.tableRow, { borderTopColor: "transparent" }]}
                >
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    Dag
                  </Text>
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    Datum
                  </Text>
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    Tijd
                  </Text>
                </View>
                {allTeVroegIn.map((item, i) => (
                  <SectionRow
                    key={`tvi-${item.rec.logid}-${i}`}
                    colors={colors}
                    cells={[item.dag.weekdagKort, item.dag.dagStr, item.tijd]}
                    highlight="#2563eb"
                  />
                ))}
              </SectionCard>
            ) : null}

            {/* Pauzes */}
            <SectionCard
              title="Pauze overzicht"
              icon="coffee"
              colors={colors}
              empty={allPauzes.length === 0 ? "Geen pauzes geregistreerd" : null}
              footer={
                allPauzes.length > 0
                  ? `Totaal pauze: ${formatHMS(totalPauzeSec)}`
                  : undefined
              }
            >
              {allPauzes.length > 0 ? (
                <View
                  style={[styles.tableRow, { borderTopColor: "transparent" }]}
                >
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    Datum
                  </Text>
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    Out
                  </Text>
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    In
                  </Text>
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    Duur
                  </Text>
                </View>
              ) : null}
              {allPauzes.map(({ pauze, dag }, i) => (
                <SectionRow
                  key={`pa-${pauze.outRec.logid}-${i}`}
                  colors={colors}
                  cells={[
                    `${dag.weekdagKort} ${dag.dagStr.slice(0, 5)}`,
                    formatTime(pauze.outTime),
                    formatTime(pauze.inTime),
                    formatHMS(pauze.durSec),
                  ]}
                />
              ))}
            </SectionCard>

            {/* Verzuim bloktijden */}
            {verzuimDagen.length > 0 ? (
              <SectionCard
                title="Verzuim — gemiste bloktijden"
                icon="alert-octagon"
                tint="#dc2626"
                colors={colors}
              >
                <View
                  style={[styles.tableRow, { borderTopColor: "transparent" }]}
                >
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    Dag
                  </Text>
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    Bl1
                  </Text>
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    Bl2
                  </Text>
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    Bl3
                  </Text>
                  <Text
                    style={[styles.headCell, { color: colors.mutedForeground }]}
                  >
                    Bl4
                  </Text>
                </View>
                {verzuimDagen.map((dag) => (
                  <View
                    key={`vz-${dag.datum}`}
                    style={[styles.tableRow, { borderTopColor: colors.border }]}
                  >
                    <Text
                      style={[styles.cell, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {dag.weekdagKort} {dag.dagStr.slice(0, 5)}
                    </Text>
                    {[dag.blok1Ok, dag.blok2Ok, dag.blok3Ok, dag.blok4Ok].map(
                      (ok, i) => (
                        <View key={i} style={styles.cell}>
                          <Feather
                            name={ok ? "check-circle" : "x-circle"}
                            size={16}
                            color={ok ? "#16a34a" : "#dc2626"}
                          />
                        </View>
                      ),
                    )}
                  </View>
                ))}
              </SectionCard>
            ) : null}
          </>
        )}
      </View>

      {/* User Picker Modal */}
      <Modal
        visible={userPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setUserPickerOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setUserPickerOpen(false)}
        >
          <Pressable
            style={[styles.modalSheet, { backgroundColor: colors.background }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Kies medewerker
            </Text>
            <ScrollView style={{ maxHeight: 480 }}>
              {activeUsers.map((u) => (
                <Pressable
                  key={u.id}
                  onPress={() => {
                    setPickedKadasterId(u.kadasterId || "");
                    setUserPickerOpen(false);
                  }}
                  style={[
                    styles.userRow,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text style={{ color: colors.foreground, fontSize: 14 }}>
                    {u.fullName || u.username}
                  </Text>
                  <Text
                    style={{ color: colors.mutedForeground, fontSize: 11 }}
                  >
                    {u.kadasterId} · {u.department || "—"}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function SectionCard({
  title,
  icon,
  tint,
  colors,
  empty,
  footer,
  children,
}: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  tint?: string;
  colors: ReturnType<typeof useColors>;
  empty?: string | null;
  footer?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          padding: 12,
          paddingBottom: 8,
        }}
      >
        <Feather name={icon} size={16} color={tint || colors.primary} />
        <Text
          style={{
            color: tint || colors.foreground,
            fontFamily: "Inter_600SemiBold",
            fontSize: 14,
          }}
        >
          {title}
        </Text>
      </View>
      {empty ? (
        <Text
          style={{
            color: colors.mutedForeground,
            textAlign: "center",
            paddingVertical: 16,
            fontSize: 13,
          }}
        >
          {empty}
        </Text>
      ) : (
        children
      )}
      {footer ? (
        <View
          style={{
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
            padding: 12,
          }}
        >
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 12,
              textAlign: "right",
            }}
          >
            {footer}
          </Text>
        </View>
      ) : null}
    </Card>
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
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  userBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  kpiCard: {
    width: "48%",
    padding: 12,
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  kpiSub: { fontSize: 11, marginTop: 1 },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  headCell: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  cell: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
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
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  userRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
