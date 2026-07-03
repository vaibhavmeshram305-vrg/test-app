import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useLocalSearchParams,
  useFocusEffect,
  router,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  spacing,
  radius,
  shadow,
} from "../../src/theme";

import { api } from "../../src/lib/api";

function inr(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

type Tab = "design" | "financial" | "bom";

export default function ProjectDetails() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] =
    useState<Tab>("design");
  const [err, setErr] = useState<
    string | null
  >(null);

  const load = useCallback(async () => {
    try {
      const p =
        await api.getProject(id!);
      setProject(p);
    } catch (e: any) {
      setErr(
        e.message ||
          "Failed to load project"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const remove = async () => {
    try {
      await api.deleteProject(id!);
      router.replace(
        "/(tabs)/projects"
      );
    } catch (e: any) {
      setErr(
        e.message ||
          "Failed to delete project"
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator
          color={colors.brandPrimary}
          style={{
            marginTop:
              spacing.xxxl,
          }}
        />
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.root}>
        <Text
          style={{
            color: colors.error,
            padding: spacing.lg,
          }}
        >
          {err ||
            "Project not found"}
        </Text>
      </SafeAreaView>
    );
  }

  const sr = project.sizing_result;
  const fr =
    project.financial_result;
  const bom = project.bom_result;

  return (
    <SafeAreaView
      style={styles.root}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="chevron-back"
            size={26}
            color={
              colors.onSurface
            }
          />
        </Pressable>

        <Text
          style={styles.headerTitle}
          numberOfLines={1}
        >
          {project.name}
        </Text>

        <Pressable
          onPress={remove}
        >
          <Ionicons
            name="trash-outline"
            size={22}
            color={colors.error}
          />
        </Pressable>
      </View>

      <ScrollView
        stickyHeaderIndices={[0]}
        contentContainerStyle={{
          paddingBottom:
            spacing.xxxl,
        }}
      >
        <View style={styles.tabs}>
          {(
            [
              "design",
              "financial",
              "bom",
            ] as Tab[]
          ).map((t) => (
            <Pressable
              key={t}
              onPress={() =>
                setTab(t)
              }
              style={[
                styles.tab,
                tab === t &&
                  styles.tabActive,
              ]}
            >
              <Text
                style={[
                  styles.tabTxt,
                  tab === t && {
                    color:
                      colors.brandPrimary,
                  },
                ]}
              >
                {t === "bom"
                  ? "BOM"
                  : t[0].toUpperCase() +
                    t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View
          style={{
            padding:
              spacing.lg,
          }}
        >
          <View
            style={
              styles.customerBox
            }
          >
            <Text
              style={
                styles.customerName
              }
            >
              {
                project.customer_name
              }
            </Text>

            {project.customer_phone ? (
              <Text
                style={
                  styles.customerMeta
                }
              >
                {
                  project.customer_phone
                }
              </Text>
            ) : null}

            {project.customer_address ? (
              <Text
                style={
                  styles.customerMeta
                }
              >
                {
                  project.customer_address
                }
              </Text>
            ) : null}
          </View>

          {tab === "design" && (
            <>
              <View
                style={[
                  styles.heroCard,
                  shadow.card,
                ]}
              >
                <Text
                  style={
                    styles.heroLabel
                  }
                >
                  Recommended
                  System
                </Text>

                <Text
                  style={
                    styles.heroValue
                  }
                >
                  {sr.final_kw} kW
                </Text>

                <Text
                  style={
                    styles.heroSub
                  }
                >
                  {
                    sr.panels_count
                  }{" "}
                  ×{" "}
                  {
                    sr.panel_wattage
                  }
                  W ·{" "}
                  {sr.inverter_kw}
                  kW inverter
                </Text>
              </View>

              <View
                style={styles.grid}
              >
                <Stat
                  label="Monthly units"
                  value={`${sr.monthly_units_kwh} kWh`}
                />
                <Stat
                  label="Daily units"
                  value={`${sr.daily_units_kwh} kWh`}
                />
                <Stat
                  label="Annual generation"
                  value={`${sr.annual_generation_kwh.toLocaleString()} kWh`}
                />
                <Stat
                  label="CO₂ offset"
                  value={`${sr.co2_offset_tons_yr} t/yr`}
                />
              </View>
            </>
          )}

          {tab === "financial" &&
            fr && (
              <>
                <View
                  style={[
                    styles.heroCard,
                    {
                      backgroundColor:
                        colors.brandTertiary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.heroLabel,
                      {
                        color:
                          colors.brandPrimary,
                      },
                    ]}
                  >
                    Payback
                  </Text>

                  <Text
                    style={[
                      styles.heroValue,
                      {
                        color:
                          colors.brandPrimary,
                      },
                    ]}
                  >
                    {
                      fr.payback_years
                    }{" "}
                    years
                  </Text>

                  <Text
                    style={[
                      styles.heroSub,
                      {
                        color:
                          colors.brandPrimary,
                      },
                    ]}
                  >
                    ROI:{" "}
                    {fr.roi_pct}%
                  </Text>
                </View>

                <View
                  style={
                    styles.grid
                  }
                >
                  <Stat
                    label="System cost"
                    value={inr(
                      fr.system_cost_inr
                    )}
                  />
                  <Stat
                    label="After subsidy"
                    value={inr(
                      fr.net_cost_after_subsidy_inr
                    )}
                  />
                  <Stat
                    label="Year 1 savings"
                    value={inr(
                      fr.year1_savings_inr
                    )}
                    accent
                  />
                  <Stat
                    label="Lifetime savings"
                    value={inr(
                      fr.lifetime_savings_inr
                    )}
                    accent
                  />
                </View>
              </>
            )}

          {tab === "bom" &&
            bom && (
              <>
                {bom.items.map(
                  (
                    it: any,
                    i: number
                  ) => (
                    <View
                      key={i}
                      style={
                        styles.bomItem
                      }
                    >
                      <View
                        style={{
                          flex: 1,
                        }}
                      >
                        <Text
                          style={
                            styles.bomName
                          }
                        >
                          {
                            it.name
                          }
                        </Text>

                        <Text
                          style={
                            styles.bomMeta
                          }
                        >
                          {it.brand} ·{" "}
                          {
                            it.quantity
                          }{" "}
                          {
                            it.unit
                          }
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.bomTotal
                        }
                      >
                        {inr(
                          it.total_inr
                        )}
                      </Text>
                    </View>
                  )
                )}
              </>
            )}

          <Pressable
            onPress={() =>
              router.push(
                `/project/proposal/${project.id}`
              )
            }
            style={styles.propBtn}
          >
            <Ionicons
              name="document-text-outline"
              size={18}
              color="#fff"
            />

            <Text
              style={
                styles.propBtnTxt
              }
            >
              Generate Proposal PDF
            </Text>
          </Pressable>

          {err && (
            <Text
              style={{
                color:
                  colors.error,
                marginTop:
                  spacing.md,
              }}
            >
              {err}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.statValue,
          accent && {
            color:
              colors.brandSecondary,
          },
        ]}
      >
        {value}
      </Text>
    </View>
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
    alignItems: "center",
    justifyContent:
      "space-between",
    padding: spacing.lg,
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: colors.onSurface,
    paddingHorizontal:
      spacing.md,
  },

  tabs: {
    flexDirection: "row",
    backgroundColor:
      colors.surface,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
  },

  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },

  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor:
      colors.brandPrimary,
  },

  tabTxt: {
    color:
      colors.onSurfaceTertiary,
    fontWeight: "600",
  },

  customerBox: {
    backgroundColor:
      colors.surfaceTertiary,
    borderRadius:
      radius.md,
    padding: spacing.md,
    marginBottom:
      spacing.lg,
  },

  customerName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.onSurface,
  },

  customerMeta: {
    color:
      colors.onSurfaceTertiary,
    marginTop: 2,
  },

  heroCard: {
    backgroundColor:
      colors.surfaceInverse,
    borderRadius:
      radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom:
      spacing.lg,
  },

  heroLabel: {
    color:
      "rgba(255,255,255,0.75)",
  },

  heroValue: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "700",
  },

  heroSub: {
    color:
      "rgba(255,255,255,0.8)",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent:
      "space-between",
  },

  stat: {
    width: "48%",
    backgroundColor:
      colors.surfaceSecondary,
    borderRadius:
      radius.md,
    padding: spacing.md,
    marginBottom:
      spacing.sm,
  },

  statLabel: {
    color:
      colors.onSurfaceTertiary,
    fontSize: 12,
  },

  statValue: {
    color:
      colors.brandPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },

  bomItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      colors.surfaceSecondary,
    borderRadius:
      radius.md,
    padding: spacing.md,
    marginBottom:
      spacing.sm,
  },

  bomName: {
    fontWeight: "600",
    color: colors.onSurface,
  },

  bomMeta: {
    color:
      colors.onSurfaceTertiary,
    fontSize: 12,
    marginTop: 2,
  },

  bomTotal: {
    color:
      colors.brandPrimary,
    fontWeight: "700",
  },

  propBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "center",
    backgroundColor:
      colors.brandPrimary,
    borderRadius:
      radius.lg,
    paddingVertical: 16,
    marginTop:
      spacing.xl,
  },

  propBtnTxt: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
  },
});