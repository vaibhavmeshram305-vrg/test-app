import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import {
  colors,
  spacing,
  radius,
} from "@/src/theme";

const HERO =
  "https://images.unsplash.com/photo-1724041875334-0a6397111c7e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzb2xhciUyMHBhbmVsJTIwcm9vZiUyMGNsb3NlJTIwdXB8ZW58MHx8fHwxNzgzMDg3ODU4fDA&ixlib=rb-4.1.0&q=85";

export default function Welcome() {
  return (
    <View
      style={styles.root}
      testID="welcome-screen"
    >
      <ImageBackground
        source={{ uri: HERO }}
        style={styles.bg}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            "rgba(28,32,36,0.2)",
            "rgba(28,32,36,0.9)",
          ]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView
          style={styles.content}
          edges={["top", "bottom"]}
        >
          <View style={styles.top}>
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>
                PV DESIGN AI
              </Text>
            </View>
          </View>

          <View style={styles.bottom}>
            <Text style={styles.title}>
              Design Solar Proposals in minutes,
              not hours.
            </Text>

            <Text style={styles.subtitle}>
              Sizing, financial modeling, BOM and
              PDF proposals — the toolkit built for
              Indian solar installers.
            </Text>

            <Pressable
              testID="welcome-signup-btn"
              onPress={() =>
                router.push("/(auth)/signup")
              }
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.primaryBtnTxt}>
                Get started — Free
              </Text>
            </Pressable>

            <Pressable
              testID="welcome-login-btn"
              onPress={() =>
                router.push("/(auth)/login")
              }
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnTxt}>
                I already have an account
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceInverse,
  },

  bg: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
  },

  top: {
    paddingTop: spacing.lg,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor:
      "rgba(255,255,255,0.14)",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.25)",
  },

  badgeTxt: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  bottom: {
    paddingBottom: spacing.md,
  },

  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
    marginBottom: spacing.md,
  },

  subtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },

  primaryBtn: {
    backgroundColor:
      colors.brandSecondary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: spacing.md,
  },

  primaryBtnTxt: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  secondaryBtn: {
    paddingVertical: 14,
    alignItems: "center",
  },

  secondaryBtnTxt: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});