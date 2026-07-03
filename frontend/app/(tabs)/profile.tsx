import React from "react";
import {
  View,
 Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  spacing,
  radius,
  shadow,
} from "@/src/theme";

import { useAuth } from "@/src/context/AuthContext";

export default function Profile() {
  const { user, logout } = useAuth();

  const initials = (user?.name || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const doLogout = async () => {
    await logout();
    router.replace("/(auth)/welcome");
  };

  return (
    <SafeAreaView
      style={styles.root}
      edges={["top"]}
      testID="profile-screen"
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>
          Profile
        </Text>

        <View
          style={[styles.card, shadow.card]}
          testID="profile-header-card"
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>
              {initials}
            </Text>
          </View>

          <Text style={styles.name}>
            {user?.name}
          </Text>

          <Text style={styles.email}>
            {user?.email}
          </Text>

          {user?.company ? (
            <Text style={styles.company}>
              {user.company}
            </Text>
          ) : null}

          <View style={styles.planPill}>
            <Ionicons
              name="star"
              size={12}
              color={colors.brandPrimary}
            />

            <Text style={styles.planTxt}>
              {(user?.plan || "free").toUpperCase()} PLAN
            </Text>
          </View>
        </View>

        <Pressable
          testID="profile-manage-plan"
          onPress={() =>
            router.push("/(tabs)/subscription")
          }
          style={[styles.row, shadow.card]}
        >
          <Ionicons
            name="rocket-outline"
            size={20}
            color={colors.brandPrimary}
          />

          <Text style={styles.rowTxt}>
            Manage subscription
          </Text>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.muted}
          />
        </Pressable>

        <Pressable
          testID="profile-projects"
          onPress={() =>
            router.push("/(tabs)/projects")
          }
          style={[styles.row, shadow.card]}
        >
          <Ionicons
            name="folder-outline"
            size={20}
            color={colors.brandPrimary}
          />

          <Text style={styles.rowTxt}>
            My projects
          </Text>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.muted}
          />
        </Pressable>

        <Pressable
          testID="profile-logout-btn"
          onPress={doLogout}
          style={[
            styles.row,
            shadow.card,
            { marginTop: spacing.lg },
          ]}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={colors.error}
          />

          <Text
            style={[
              styles.rowTxt,
              { color: colors.error },
            ]}
          >
            Log out
          </Text>

          <View style={{ width: 18 }} />
        </Pressable>

        <Text style={styles.footer}>
          PVDesign AI v1.0 · Built for Indian
          solar installers
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.onSurface,
    marginBottom: spacing.lg,
  },

  card: {
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },

  avatarTxt: {
    color: colors.brandPrimary,
    fontSize: 26,
    fontWeight: "700",
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.onSurface,
  },

  email: {
    fontSize: 13,
    color: colors.onSurfaceTertiary,
    marginTop: 4,
  },

  company: {
    fontSize: 13,
    color: colors.onSurfaceTertiary,
    marginTop: 2,
  },

  planPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },

  planTxt: {
    color: colors.brandPrimary,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },

  rowTxt: {
    flex: 1,
    fontSize: 14,
    color: colors.onSurface,
    fontWeight: "600",
    marginLeft: spacing.md,
  },

  footer: {
    color: colors.muted,
    fontSize: 11,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});