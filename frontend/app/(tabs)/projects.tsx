import React, { useCallback, useState } from "react";
import {
  View,
  Text,
 StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  spacing,
  radius,
  shadow,
} from "@/src/theme";

import { api } from "@/src/lib/api";

function inr(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.listProjects();
      setProjects(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <SafeAreaView
        style={styles.root}
        edges={["top"]}
      >
        <ActivityIndicator
          color={colors.brandPrimary}
          style={{ marginTop: spacing.xxl }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.root}
      edges={["top"]}
      testID="projects-screen"
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          Projects
        </Text>

        <Pressable
          testID="projects-new-btn"
          onPress={() =>
            router.push("/project/new")
          }
          style={styles.newBtn}
        >
          <Ionicons
            name="add"
            size={18}
            color="#fff"
          />
          <Text style={styles.newBtnTxt}>
            New
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing.xxxl,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.brandPrimary}
          />
        }
        ListEmptyComponent={
          <View
            style={styles.empty}
            testID="projects-empty"
          >
            <Ionicons
              name="folder-open-outline"
              size={40}
              color={colors.brandSecondary}
            />

            <Text style={styles.emptyTxt}>
              No projects yet.
            </Text>
          </View>
        }
        renderItem={({ item: p }) => (
          <Pressable
            testID={`project-item-${p.id}`}
            onPress={() =>
              router.push(
                `/project/${p.id}`
              )
            }
            style={({ pressed }) => [
              styles.card,
              shadow.card,
              pressed && {
                opacity: 0.85,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {p.name}
              </Text>

              <Text style={styles.cardSub}>
                {p.customer_name}
              </Text>

              <View
                style={styles.rowMeta}
              >
                <View style={styles.chip}>
                  <Text
                    style={styles.chipTxt}
                  >
                    {
                      p.sizing_result
                        ?.final_kw
                    }{" "}
                    kW
                  </Text>
                </View>

                <View style={styles.chip}>
                  <Text
                    style={styles.chipTxt}
                  >
                    {inr(
                      p.financial_result
                        ?.year1_savings_inr ||
                        0
                    )}
                    /yr
                  </Text>
                </View>

                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        colors.brandTertiary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipTxt,
                      {
                        color:
                          colors.brandPrimary,
                      },
                    ]}
                  >
                    {
                      p.financial_result
                        ?.payback_years
                    }
                    y payback
                  </Text>
                </View>
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.muted}
            />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor:
      colors.surface,
  },

  header: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.onSurface,
  },

  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      colors.brandPrimary,
    paddingHorizontal:
      spacing.md,
    paddingVertical: 10,
    borderRadius:
      radius.pill,
  },

  newBtnTxt: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 4,
  },

  empty: {
    alignItems: "center",
    padding: spacing.xxl,
  },

  emptyTxt: {
    color:
      colors.onSurfaceTertiary,
    marginTop: spacing.sm,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      colors.surfaceSecondary,
    borderRadius:
      radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor:
      colors.border,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.onSurface,
  },

  cardSub: {
    fontSize: 12,
    color:
      colors.onSurfaceTertiary,
    marginTop: 2,
  },

  rowMeta: {
    flexDirection: "row",
    marginTop: 8,
    flexWrap: "wrap",
  },

  chip: {
    backgroundColor:
      colors.surfaceTertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius:
      radius.pill,
    marginRight: 6,
    marginBottom: 6,
  },

  chipTxt: {
    fontSize: 11,
    color:
      colors.onSurfaceTertiary,
    fontWeight: "600",
  },
});