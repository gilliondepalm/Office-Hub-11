import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BrandMark } from "@/components/Brand";
import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";

const photo = require("../../assets/brand/personalia.png");

export default function PersoonlijkScreen() {
  const colors = useColors();
  const { user, logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert("Uitloggen", "Weet u zeker dat u wilt uitloggen?", [
      { text: "Annuleren", style: "cancel" },
      { text: "Uitloggen", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <ImageBackground source={photo} style={styles.hero}>
        <LinearGradient
          colors={["rgba(33,59,47,0.55)", "rgba(20,40,30,0.92)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroContent}>
          <BrandMark size={56} />
          <Text style={styles.name}>
            {user?.fullName || user?.username || "Medewerker"}
          </Text>
          <Text style={styles.role}>
            {user?.functie || user?.jobTitle || "Medewerker"}
          </Text>
        </View>
      </ImageBackground>

      <View style={{ padding: 16 }}>
        <Card style={{ marginBottom: 12 }}>
          <Field
            icon="user"
            label="Gebruikersnaam"
            value={user?.username}
          />
          <Field icon="mail" label="E-mailadres" value={user?.email} />
          <Field
            icon="briefcase"
            label="Functie"
            value={user?.functie || user?.jobTitle}
          />
          <Field icon="grid" label="Afdeling" value={user?.department} last />
        </Card>

        <Pressable
          onPress={confirmLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            {
              backgroundColor: colors.destructive,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          testID="button-logout-personal"
        >
          <Feather
            name="log-out"
            size={16}
            color={colors.destructiveForeground}
          />
          <Text
            style={{
              color: colors.destructiveForeground,
              fontFamily: "Inter_600SemiBold",
              fontSize: 15,
            }}
          >
            Uitloggen
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Field({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string | null;
  last?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.field,
        !last && {
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.muted,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Feather name={icon} size={14} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
          {label}
        </Text>
        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_500Medium",
            fontSize: 14,
            marginTop: 1,
          }}
        >
          {value || "—"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 200, justifyContent: "flex-end" },
  heroContent: { padding: 16 },
  name: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    marginTop: 12,
  },
  role: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 2,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 8,
    marginTop: 8,
  },
});
