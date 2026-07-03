import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import {
  colors,
  spacing,
  radius,
} from "@/src/theme";

import { useAuth } from "@/src/context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);

    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        company: company.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      router.replace("/(tabs)");
    } catch (e: any) {
      setErr(e?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const disabled =
    loading ||
    !name ||
    !email ||
    password.length < 6;

  return (
    <SafeAreaView
      style={styles.root}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => router.back()}
            testID="signup-back-btn"
            style={{
              paddingVertical: spacing.sm,
            }}
          >
            <Text
              style={{
                color:
                  colors.onSurfaceTertiary,
                fontSize: 14,
              }}
            >
              ← Back
            </Text>
          </Pressable>

          <Text style={styles.title}>
            Create your account
          </Text>

          <Text style={styles.subtitle}>
            Start with 3 free projects. No
            credit card required.
          </Text>

          <Text style={styles.label}>
            Full name*
          </Text>

          <TextInput
            testID="signup-name-input"
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ravi Kumar"
            placeholderTextColor={
              colors.muted
            }
          />

          <Text style={styles.label}>
            Company
          </Text>

          <TextInput
            testID="signup-company-input"
            style={styles.input}
            value={company}
            onChangeText={setCompany}
            placeholder="SunPower Installers"
            placeholderTextColor={
              colors.muted
            }
          />

          <Text style={styles.label}>
            Email*
          </Text>

          <TextInput
            testID="signup-email-input"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.in"
            placeholderTextColor={
              colors.muted
            }
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>
            Phone
          </Text>

          <TextInput
            testID="signup-phone-input"
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 98XXXXXXXX"
            placeholderTextColor={
              colors.muted
            }
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>
            Password* (min 6 chars)
          </Text>

          <TextInput
            testID="signup-password-input"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={
              colors.muted
            }
            secureTextEntry
          />

          {err ? (
            <Text
              testID="signup-error-text"
              style={styles.error}
            >
              {err}
            </Text>
          ) : null}

          <Pressable
            testID="signup-submit-btn"
            onPress={submit}
            disabled={disabled}
            style={({ pressed }) => [
              styles.primary,
              disabled && {
                opacity: 0.5,
              },
              pressed && {
                opacity: 0.9,
              },
            ]}
          >
            <Text
              style={styles.primaryTxt}
            >
              {loading
                ? "Creating account..."
                : "Create account"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.replace(
                "/(auth)/login"
              )
            }
            style={{
              marginTop:
                spacing.lg,
            }}
          >
            <Text style={styles.link}>
              Already have an account?{" "}
              <Text
                style={{
                  color:
                    colors.brandPrimary,
                  fontWeight:
                    "700",
                }}
              >
                Sign in
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor:
      colors.surface,
  },

  scroll: {
    padding: spacing.lg,
    paddingBottom:
      spacing.xxxl,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.onSurface,
    marginTop: spacing.md,
  },

  subtitle: {
    fontSize: 14,
    color:
      colors.onSurfaceTertiary,
    marginTop: 4,
    marginBottom:
      spacing.lg,
  },

  label: {
    fontSize: 12,
    color:
      colors.onSurfaceTertiary,
    marginBottom: 6,
    marginTop: spacing.md,
    fontWeight: "600",
  },

  input: {
    backgroundColor:
      colors.surfaceSecondary,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius:
      radius.md,
    paddingHorizontal:
      spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.onSurface,
  },

  error: {
    color: colors.error,
    fontSize: 13,
    marginTop: spacing.md,
  },

  primary: {
    backgroundColor:
      colors.brandPrimary,
    borderRadius:
      radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    marginTop:
      spacing.xl,
  },

  primaryTxt: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  link: {
    textAlign: "center",
    color:
      colors.onSurfaceTertiary,
    fontSize: 14,
  },
});