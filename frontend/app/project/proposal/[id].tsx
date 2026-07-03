import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  spacing,
  radius,
  shadow,
} from "../../../src/theme";

import { api } from "../../../src/lib/api";

function inr(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export default function Proposal() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [project, setProject] =
    useState<any>(null);
  const [aiLoading, setAiLoading] =
    useState(false);
  const [summary, setSummary] =
    useState<string | null>(null);
  const [pdfB64, setPdfB64] =
    useState<string | null>(null);
  const [pdfName, setPdfName] =
    useState("proposal.pdf");
  const [pdfLoading, setPdfLoading] =
    useState(false);
  const [err, setErr] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!id) return;

    api
      .getProject(id)
      .then((p) => {
        setProject(p);
        setSummary(p.ai_summary);
      })
      .catch((e) =>
        setErr(e.message)
      );
  }, [id]);

  const genAI = async () => {
    setAiLoading(true);
    setErr(null);

    try {
      const r =
        await api.aiSummary(id!);
      setSummary(r.summary);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const genPdf = async () => {
    setPdfLoading(true);
    setErr(null);

    try {
      const r =
        await api.generatePdf(id!);

      setPdfB64(r.pdf_base64);
      setPdfName(r.filename);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!pdfB64) return;

    if (Platform.OS === "web") {
      const byteChars =
        atob(pdfB64);

      const bytes =
        new Uint8Array(
          byteChars.length
        );

      for (
        let i = 0;
        i < byteChars.length;
        i++
      ) {
        bytes[i] =
          byteChars.charCodeAt(i);
      }

      const blob = new Blob(
        [bytes],
        {
          type: "application/pdf",
        }
      );

      const url =
        URL.createObjectURL(blob);

      const a =
        document.createElement("a");

      a.href = url;
      a.download = pdfName;
      a.click();

      URL.revokeObjectURL(url);
    }
  };

  if (!project) {
    return (
      <SafeAreaView
        style={styles.root}
      >
        {err ? (
          <Text
            style={{
              color:
                colors.error,
              padding:
                spacing.lg,
            }}
          >
            {err}
          </Text>
        ) : (
          <ActivityIndicator
            color={
              colors.brandPrimary
            }
            style={{
              marginTop:
                spacing.xxxl,
            }}
          />
        )}
      </SafeAreaView>
    );
  }

  const sr =
    project.sizing_result;
  const fr =
    project.financial_result;

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

        <Text style={styles.title}>
          Proposal
        </Text>

        <View
          style={{ width: 26 }}
        />
      </View>

      <ScrollView
        contentContainerStyle={
          styles.scroll
        }
      >
        <View
          style={[
            styles.doc,
            shadow.card,
          ]}
        >
          <View
            style={styles.docHeader}
          >
            <Text
              style={styles.docBrand}
            >
              PVDesign AI
            </Text>

            <Text
              style={styles.docSub}
            >
              Solar Proposal
            </Text>
          </View>

          <View
            style={{
              padding:
                spacing.lg,
            }}
          >
            <Text
              style={styles.docTitle}
            >
              {project.name}
            </Text>

            <Text
              style={styles.docMeta}
            >
              Prepared for{" "}
              {
                project.customer_name
              }
            </Text>

            <SectionTitle title="System Design" />

            <KV
              k="Capacity"
              v={`${sr.final_kw} kW`}
            />

            <KV
              k="Panels"
              v={`${sr.panels_count} × ${sr.panel_wattage}W`}
            />

            <KV
              k="Inverter"
              v={`${sr.inverter_kw} kW`}
            />

            <KV
              k="Annual generation"
              v={`${sr.annual_generation_kwh.toLocaleString()} kWh`}
            />

            <KV
              k="CO₂ offset"
              v={`${sr.co2_offset_tons_yr} tons/yr`}
            />

            {fr && (
              <>
                <SectionTitle title="Financials" />

                <KV
                  k="System cost"
                  v={inr(
                    fr.system_cost_inr
                  )}
                />

                <KV
                  k="Year-1 savings"
                  v={inr(
                    fr.year1_savings_inr
                  )}
                  accent
                />

                <KV
                  k="Payback"
                  v={`${fr.payback_years} years`}
                />

                <KV
                  k="25-yr ROI"
                  v={`${fr.roi_pct}%`}
                />

                <KV
                  k="Lifetime savings"
                  v={inr(
                    fr.lifetime_savings_inr
                  )}
                  accent
                />
              </>
            )}

            <SectionTitle title="Executive Summary" />

            {summary ? (
              <Text
                style={
                  styles.summary
                }
              >
                {summary}
              </Text>
            ) : (
              <Pressable
                onPress={genAI}
                disabled={
                  aiLoading
                }
                style={
                  styles.aiBtn
                }
              >
                {aiLoading ? (
                  <ActivityIndicator
                    color={
                      colors.brandPrimary
                    }
                  />
                ) : (
                  <>
                    <Ionicons
                      name="sparkles-outline"
                      size={16}
                      color={
                        colors.brandPrimary
                      }
                    />

                    <Text
                      style={
                        styles.aiBtnTxt
                      }
                    >
                      Generate AI
                      Summary
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </View>

        <Pressable
          onPress={genPdf}
          disabled={pdfLoading}
          style={styles.primary}
        >
          {pdfLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="document-outline"
                size={18}
                color="#fff"
              />

              <Text
                style={
                  styles.primaryTxt
                }
              >
                {pdfB64
                  ? "Regenerate PDF"
                  : "Generate PDF"}
              </Text>
            </>
          )}
        </Pressable>

        {pdfB64 &&
          Platform.OS ===
            "web" && (
            <Pressable
              onPress={
                downloadPdf
              }
              style={
                styles.dlBtn
              }
            >
              <Text
                style={
                  styles.dlTxt
                }
              >
                Download PDF
              </Text>
            </Pressable>
          )}

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
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <Text style={styles.section}>
      {title}
    </Text>
  );
}

function KV({
  k,
  v,
  accent,
}: {
  k: string;
  v: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvK}>
        {k}
      </Text>

      <Text
        style={[
          styles.kvV,
          accent && {
            color:
              colors.brandSecondary,
          },
        ]}
      >
        {v}
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

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.onSurface,
  },

  scroll: {
    padding: spacing.lg,
    paddingBottom:
      spacing.xxxl,
  },

  doc: {
    backgroundColor:
      colors.surfaceSecondary,
    borderRadius:
      radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor:
      colors.border,
  },

  docHeader: {
    backgroundColor:
      colors.brandPrimary,
    padding: spacing.lg,
  },

  docBrand: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  docSub: {
    color:
      "rgba(255,255,255,0.8)",
    fontSize: 12,
  },

  docTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.onSurface,
  },

  docMeta: {
    color:
      colors.onSurfaceTertiary,
    marginTop: 4,
  },

  section: {
    color:
      colors.brandPrimary,
    fontWeight: "700",
    marginTop:
      spacing.lg,
    marginBottom:
      spacing.sm,
  },

  kvRow: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.divider,
  },

  kvK: {
    color:
      colors.onSurfaceTertiary,
  },

  kvV: {
    color: colors.onSurface,
    fontWeight: "700",
  },

  summary: {
    color: colors.onSurface,
    lineHeight: 20,
  },

  aiBtn: {
    flexDirection: "row",
    justifyContent:
      "center",
    alignItems: "center",
    backgroundColor:
      colors.brandTertiary,
    borderRadius:
      radius.md,
    paddingVertical: 12,
    marginTop:
      spacing.sm,
  },

  aiBtnTxt: {
    color:
      colors.brandPrimary,
    fontWeight: "700",
    marginLeft: 6,
  },

  primary: {
    flexDirection: "row",
    justifyContent:
      "center",
    alignItems: "center",
    backgroundColor:
      colors.brandPrimary,
    borderRadius:
      radius.lg,
    paddingVertical: 16,
    marginTop:
      spacing.lg,
  },

  primaryTxt: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
  },

  dlBtn: {
    backgroundColor:
      colors.brandSecondary,
    borderRadius:
      radius.pill,
    paddingHorizontal:
      spacing.lg,
    paddingVertical: 12,
    alignSelf: "center",
    marginTop:
      spacing.md,
  },

  dlTxt: {
    color: "#fff",
    fontWeight: "700",
  },
});