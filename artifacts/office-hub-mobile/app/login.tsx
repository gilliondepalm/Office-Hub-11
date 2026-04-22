import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandMark } from "@/components/Brand";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";

const loginPhoto = require("../assets/brand/login.jpg");

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert(
        "Inloggegevens ontbreken",
        "Voer uw gebruikersnaam en wachtwoord in.",
      );
      return;
    }
    setSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (e: any) {
      Alert.alert(
        "Inloggen mislukt",
        e?.message || "Controleer uw gebruikersnaam en wachtwoord.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ImageBackground source={loginPhoto} style={styles.photo}>
        <LinearGradient
          colors={["rgba(33,59,47,0.55)", "rgba(20,40,30,0.9)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.photoContent, { paddingTop: insets.top + 24 }]}>
          <View style={styles.brandRow}>
            <BrandMark size={40} />
            <Text style={styles.brandText}>Kadaster Dashboard</Text>
          </View>
          <View>
            <Text style={styles.heroTitle}>
              Uw kantoor,{"\n"}overzichtelijk beheerd
            </Text>
            <Text style={styles.heroSubtitle}>
              Beheer medewerkers, evenementen, afwezigheden en meer.
            </Text>
            <View style={styles.statRow}>
              <Stat value="9+" label="Modules" />
              <View style={styles.divider} />
              <Stat value="100%" label="Veilig" />
              <View style={styles.divider} />
              <Stat value="24/7" label="Toegang" />
            </View>
          </View>
        </View>
      </ImageBackground>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.formArea, { backgroundColor: colors.background }]}
      >
        <View style={styles.formInner}>
          <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
            Welkom terug
          </Text>
          <Text
            style={[
              styles.welcomeSubtitle,
              { color: colors.mutedForeground },
            ]}
          >
            Voer uw gegevens in om toegang te krijgen tot het dashboard
          </Text>

          <Field
            icon="user"
            placeholder="Gebruikersnaam"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            colors={colors}
            testID="input-username"
          />
          <Field
            icon="lock"
            placeholder="Wachtwoord"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            colors={colors}
            testID="input-password"
          />

          <Pressable
            onPress={handleLogin}
            disabled={submitting}
            style={({ pressed }) => [
              styles.loginButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed || submitting ? 0.85 : 1,
              },
            ]}
            testID="button-login"
          >
            {submitting ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Feather
                  name="log-in"
                  size={16}
                  color={colors.primaryForeground}
                />
                <Text
                  style={[
                    styles.loginButtonText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Inloggen
                </Text>
              </>
            )}
          </Pressable>

          <Text
            style={[
              styles.footer,
              { color: colors.mutedForeground },
            ]}
          >
            Kadaster Dashboard v2.0 · GDP © ir. G.G. de Palm
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Field({
  icon,
  colors,
  testID,
  ...rest
}: {
  icon: keyof typeof Feather.glyphMap;
  colors: ReturnType<typeof useColors>;
  testID?: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View
      style={[
        styles.field,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Feather
        name={icon}
        size={16}
        color={colors.mutedForeground}
        style={{ marginRight: 8 }}
      />
      <TextInput
        {...rest}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.fieldInput, { color: colors.foreground }]}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    height: 300,
    justifyContent: "space-between",
  },
  photoContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  heroTitle: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    lineHeight: 34,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 8,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 16,
  },
  statValue: {
    color: "#FACC14",
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  statLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  formArea: {
    flex: 1,
  },
  formInner: {
    padding: 24,
    gap: 14,
  },
  welcomeTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginBottom: 8,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  fieldInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  loginButton: {
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  loginButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  footer: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 8,
    fontFamily: "Inter_400Regular",
  },
});
