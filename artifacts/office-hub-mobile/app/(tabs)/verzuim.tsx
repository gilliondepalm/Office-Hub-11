import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

const ABSENCE_TYPES: { value: string; label: string }[] = [
  { value: "vacation", label: "Vakantie" },
  { value: "persoonlijk", label: "Persoonlijk" },
  { value: "sick", label: "Ziek" },
  { value: "bvvd", label: "BVVD" },
  { value: "other", label: "Overig" },
];

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

function isValidDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + "T00:00:00").getTime());
}

function toDutchError(err: unknown): string {
  const fallback = "Indienen mislukt. Controleer uw invoer en probeer opnieuw.";
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "";
  if (!raw) return fallback;

  // Pass through messages that are clearly already Dutch (from our API).
  const dutchMarkers = [
    "Validatiefout",
    "Niet ingelogd",
    "Geen rechten",
    "niet gevonden",
    "mislukt",
    "Onvoldoende",
    "ongeldig",
    "Vakantiesaldo",
    "saldo",
    "Verzuim",
    "vakantie",
  ];
  if (dutchMarkers.some((m) => raw.toLowerCase().includes(m.toLowerCase()))) {
    return raw;
  }

  // Map common backend / Zod english fragments to Dutch.
  const lower = raw.toLowerCase();
  if (lower.includes("required") || lower.startsWith("[")) {
    return "Niet alle verplichte velden zijn ingevuld.";
  }
  if (lower.includes("invalid") && lower.includes("date")) {
    return "Een van de datums is ongeldig.";
  }
  if (lower.includes("invalid")) {
    return "Een van de ingevulde waarden is ongeldig.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Geen verbinding met de server. Probeer het opnieuw.";
  }
  if (lower.startsWith("request mislukt")) {
    return "Indienen mislukt door een serverfout. Probeer het later opnieuw.";
  }
  return fallback;
}

export default function VerzuimScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);

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

        <Pressable
          onPress={() => setFormOpen(true)}
          style={({ pressed }) => [
            styles.newButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          testID="button-new-absence"
        >
          <Feather name="plus" size={18} color={colors.primaryForeground} />
          <Text
            style={{
              color: colors.primaryForeground,
              fontFamily: "Inter_600SemiBold",
              fontSize: 14,
              marginLeft: 6,
            }}
          >
            Nieuwe aanvraag
          </Text>
        </Pressable>

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

      <NewAbsenceModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        userId={user?.id}
      />
    </ScrollView>
  );
}

function NewAbsenceModal({
  open,
  onClose,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  userId: number | string | undefined;
}) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [type, setType] = useState<string>("vacation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setType("vacation");
    setStartDate("");
    setEndDate("");
    setReason("");
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const validation = useMemo(() => {
    if (!startDate || !endDate) return "Vul start- en einddatum in";
    if (!isValidDate(startDate) || !isValidDate(endDate))
      return "Gebruik datumformaat JJJJ-MM-DD";
    if (endDate < startDate) return "Einddatum mag niet voor startdatum liggen";
    return null;
  }, [startDate, endDate]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Niet ingelogd");
      return apiJson("/api/absences", {
        method: "POST",
        body: JSON.stringify({
          userId,
          type,
          startDate,
          endDate,
          halfDay: null,
          status: "pending",
          reason: reason.trim() || null,
          bvvdReason: null,
          approvedBy: null,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences-mine"] });
      queryClient.invalidateQueries({ queryKey: ["vacation-balance"] });
      close();
    },
    onError: (err: unknown) => {
      setError(toDutchError(err));
    },
  });

  const submit = () => {
    setError(null);
    if (validation) {
      setError(validation);
      return;
    }
    mutation.mutate();
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalRoot}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <View style={styles.sheetHeader}>
            <Text
              style={{
                color: colors.foreground,
                fontFamily: "Inter_700Bold",
                fontSize: 18,
              }}
            >
              Nieuwe aanvraag
            </Text>
            <Pressable
              onPress={close}
              hitSlop={10}
              testID="button-close-absence"
            >
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView
            style={{ maxHeight: 480 }}
            contentContainerStyle={{ paddingBottom: 12 }}
            keyboardShouldPersistTaps="handled"
          >
            <Label text="Type" />
            <View style={styles.typeRow}>
              {ABSENCE_TYPES.map((t) => {
                const selected = type === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => setType(t.value)}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: selected ? colors.primary : colors.card,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                    testID={`chip-type-${t.value}`}
                  >
                    <Text
                      style={{
                        color: selected
                          ? colors.primaryForeground
                          : colors.foreground,
                        fontFamily: "Inter_500Medium",
                        fontSize: 13,
                      }}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Label text="Startdatum" />
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="JJJJ-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              testID="input-start-date"
            />

            <Label text="Einddatum" />
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder="JJJJ-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              testID="input-end-date"
            />

            <Label text="Reden (optioneel)" />
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Korte toelichting"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  minHeight: 80,
                  textAlignVertical: "top",
                },
              ]}
              testID="input-reason"
            />

            {error ? (
              <View
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: "#fee2e2",
                }}
              >
                <Text
                  style={{
                    color: "#991b1b",
                    fontSize: 13,
                    fontFamily: "Inter_500Medium",
                  }}
                  testID="text-absence-error"
                >
                  {error}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.sheetFooter}>
            <Pressable
              onPress={close}
              style={[
                styles.footerBtn,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
              testID="button-cancel-absence"
            >
              <Text
                style={{
                  color: colors.foreground,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 14,
                }}
              >
                Annuleren
              </Text>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={mutation.isPending}
              style={[
                styles.footerBtn,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  opacity: mutation.isPending ? 0.7 : 1,
                  flex: 1.2,
                },
              ]}
              testID="button-submit-absence"
            >
              {mutation.isPending ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text
                  style={{
                    color: colors.primaryForeground,
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                  }}
                >
                  Indienen
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Label({ text }: { text: string }) {
  const colors = useColors();
  return (
    <Text
      style={{
        color: colors.mutedForeground,
        fontSize: 12,
        fontFamily: "Inter_600SemiBold",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginTop: 12,
        marginBottom: 6,
      }}
    >
      {text}
    </Text>
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
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  sheetFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
