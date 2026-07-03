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

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const socialNotice = () => {
    setErr(
      "Social login coming soon — please use email/password for now."
    );
  };

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
            testID="login-back-btn"
            style={styles.backBtn}
          >
            <Text style={styles.backTxt}>
              ← Back
            </Text>
          </Pressable>

          <Text style={styles.title}>
            Welcome back
          </Text>

          <Text style={styles.subtitle}>
            Sign in to continue designing.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>
              Email
            </Text>

            <TextInput
              testID="login-email-input"
              style={styles.input}
              placeholder="you@company.in"
              placeholderTextColor={
                colors.muted
              }
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>
              Password
            </Text>

            <TextInput
              testID="login-password-input"
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={
                colors.muted
              }
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {err ? (
              <Text
                testID="login-error-text"
                style={styles.error}
              >
                {err}
              </Text>
            ) : null}

            <Pressable
              testID="login-submit-btn"
              onPress={submit}
              disabled={
                loading ||
                !email ||
                !password
              }
              style={({ pressed }) => [
                styles.primary,
                (loading ||
                  !email ||
                  !password) && {
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
                  ? "Signing in..."
                  : "Sign in"}
              </Text>
            </Pressable>

            <View
              style={styles.dividerRow}
            >
              <View
                style={styles.divider}
              />
              <Text
                style={
                  styles.dividerTxt
                }
              >
                OR
              </Text>
              <View
                style={styles.divider}
              />
            </View>

            <Pressable
              testID="login-google-btn"
              onPress={socialNotice}
              style={styles.social}
            >
              <Text
                style={styles.socialTxt}
              >
                Continue with Google
              </Text>
            </Pressable>

            <Pressable
              testID="login-facebook-btn"
              onPress={socialNotice}
              style={styles.social}
            >
              <Text
                style={styles.socialTxt}
              >
                Continue with Facebook
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                router.replace(
                  "/(auth)/signup"
                )
              }
              style={{
                marginTop:
                  spacing.lg,
              }}
            >
              <Text style={styles.link}>
                New here?{" "}
                <Text
                  style={{
                    color:
                      colors.brandPrimary,
                    fontWeight:
                      "700",
                  }}
                >
                  Create account
                </Text>
              </Text>
            </Pressable>
          </View>
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
      spacing.xxl,
  },

  backBtn: {
    paddingVertical:
      spacing.sm,
  },

  backTxt: {
    color:
      colors.onSurfaceTertiary,
    fontSize: 14,
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
      spacing.xl,
  },

  form: {},

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

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical:
      spacing.lg,
    gap: spacing.md,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor:
      colors.border,
  },

  dividerTxt: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },

  social: {
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius:
      radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom:
      spacing.md,
    backgroundColor:
      colors.surfaceSecondary,
  },

  socialTxt: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: "600",
  },

  link: {
    textAlign: "center",
    color:
      colors.onSurfaceTertiary,
    fontSize: 14,
  },
});