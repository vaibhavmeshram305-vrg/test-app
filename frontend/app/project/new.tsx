import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  spacing,
  radius,
} from "../../src/theme";

import { api } from "../../src/lib/api";

const STATES = [
  "Maharashtra",
  "Gujarat",
  "Rajasthan",
  "Karnataka",
  "Tamil Nadu",
  "Delhi",
  "Uttar Pradesh",
  "Punjab",
  "Haryana",
  "Kerala",
  "West Bengal",
  "Andhra Pradesh",
  "Telangana",
  "Madhya Pradesh",
  "Odisha",
];

export default function NewProject() {
  const [name, setName] = useState("");
  const [customerName, setCustomerName] =
    useState("");
  const [customerPhone, setCustomerPhone] =
    useState("");
  const [address, setAddress] =
    useState("");
  const [bill, setBill] = useState("");
  const [tariff, setTariff] =
    useState("8");
  const [area, setArea] = useState("");
  const [state, setState] =
    useState("Maharashtra");

  const [systemType, setSystemType] =
    useState<
      "on_grid" | "off_grid" | "hybrid"
    >("on_grid");

  const [loading, setLoading] =
    useState(false);
  const [err, setErr] = useState<
    string | null
  >(null);
  const [preview, setPreview] =
    useState<any>(null);

  const disabled =
    !name ||
    !customerName ||
    !bill ||
    !area ||
    loading;

  const runPreview = async () => {
    setErr(null);
    setLoading(true);
    setPreview(null);

    try {
      const s = await api.calcSizing({
        monthly_bill_inr:
          parseFloat(bill),
        tariff_inr_per_unit:
          parseFloat(tariff),
        roof_area_sqft:
          parseFloat(area),
        state,
        system_type: systemType,
        shading_factor: 0.95,
      });

      setPreview(s);
    } catch (e: any) {
      setErr(
        e.message || "Preview failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setErr(null);
    setLoading(true);

    try {
      const p =
        await api.createProject({
          name,
          customer_name:
            customerName,
          customer_phone:
            customerPhone ||
            undefined,
          customer_address:
            address || undefined,

          sizing_input: {
            monthly_bill_inr:
              parseFloat(bill),
            tariff_inr_per_unit:
              parseFloat(tariff),
            roof_area_sqft:
              parseFloat(area),
            state,
            system_type:
              systemType,
            shading_factor: 0.95,
          },
        });

      router.replace(
        `/project/${p.id}`
      );
    } catch (e: any) {
      setErr(
        e.message ||
          "Failed to create project"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.root}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
      >
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="close"
              size={26}
              color={
                colors.onSurface
              }
            />
          </Pressable>

          <Text style={styles.title}>
            New Project
          </Text>

          <View
            style={{ width: 26 }}
          />
        </View>

        <ScrollView
          contentContainerStyle={
            styles.scroll
          }
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.section}>
            Project
          </Text>

          <Text style={styles.label}>
            Project Name*
          </Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Sharma Villa 5kW"
          />

          <Text style={styles.label}>
            Customer Name*
          </Text>

          <TextInput
            style={styles.input}
            value={customerName}
            onChangeText={
              setCustomerName
            }
            placeholder="Mr. Rajesh Sharma"
          />

          <Text style={styles.label}>
            Monthly Bill (₹)
          </Text>

          <TextInput
            style={styles.input}
            value={bill}
            onChangeText={setBill}
            keyboardType="numeric"
            placeholder="6000"
          />

          <Text style={styles.label}>
            Tariff (₹/kWh)
          </Text>

          <TextInput
            style={styles.input}
            value={tariff}
            onChangeText={setTariff}
            keyboardType="numeric"
          />

          <Text style={styles.label}>
            Roof Area (sq ft)
          </Text>

          <TextInput
            style={styles.input}
            value={area}
            onChangeText={setArea}
            keyboardType="numeric"
          />

          <Text style={styles.label}>
            State
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={{
              paddingVertical: 4,
            }}
          >
            {STATES.map((s) => (
              <Pressable
                key={s}
                onPress={() =>
                  setState(s)
                }
                style={[
                  styles.chip,
                  state === s &&
                    styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipTxt,
                    state === s && {
                      color: "#fff",
                    },
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            onPress={runPreview}
            disabled={
              !bill ||
              !area ||
              loading
            }
            style={[
              styles.previewBtn,
              (!bill ||
                !area) && {
                opacity: 0.5,
              },
            ]}
          >
            <Ionicons
              name="calculator-outline"
              size={16}
              color={
                colors.brandPrimary
              }
            />

            <Text
              style={
                styles.previewTxt
              }
            >
              Preview Sizing
            </Text>
          </Pressable>

          {preview && (
            <View
              style={
                styles.previewBox
              }
            >
              <Text
                style={
                  styles.previewLabel
                }
              >
                Recommended System
              </Text>

              <Text
                style={
                  styles.previewValue
                }
              >
                {preview.final_kw} kW
              </Text>

              <Text
                style={
                  styles.previewMeta
                }
              >
                {
                  preview.panels_count
                }{" "}
                ×{" "}
                {
                  preview.panel_wattage
                }
                W Panels
              </Text>
            </View>
          )}

          {err && (
            <Text
              style={styles.error}
            >
              {err}
            </Text>
          )}
        </ScrollView>

        <View style={styles.bottom}>
          <Pressable
            onPress={save}
            disabled={disabled}
            style={[
              styles.primary,
              disabled && {
                opacity: 0.5,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={
                  styles.primaryTxt
                }
              >
                Create Project
              </Text>
            )}
          </Pressable>
        </View>
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

  header: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
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

  section: {
    fontSize: 12,
    fontWeight: "700",
    color:
      colors.brandPrimary,
    marginBottom:
      spacing.sm,
  },

  label: {
    fontSize: 12,
    marginTop: spacing.md,
    marginBottom: 6,
    color:
      colors.onSurfaceTertiary,
  },

  input: {
    backgroundColor:
      colors.surfaceSecondary,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius:
      radius.md,
    padding: spacing.md,
    color: colors.onSurface,
  },

  chip: {
    backgroundColor:
      colors.surfaceSecondary,
    borderWidth: 1,
    borderColor:
      colors.border,
    borderRadius:
      radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },

  chipActive: {
    backgroundColor:
      colors.brandPrimary,
    borderColor:
      colors.brandPrimary,
  },

  chipTxt: {
    color: colors.onSurface,
  },

  previewBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      colors.brandTertiary,
    borderRadius:
      radius.md,
    paddingVertical: 12,
    marginTop: spacing.lg,
  },

  previewTxt: {
    color:
      colors.brandPrimary,
    marginLeft: 6,
    fontWeight: "700",
  },

  previewBox: {
    backgroundColor:
      colors.surfaceSecondary,
    padding: spacing.lg,
    borderRadius:
      radius.lg,
    marginTop: spacing.md,
    alignItems: "center",
  },

  previewLabel: {
    color:
      colors.onSurfaceTertiary,
  },

  previewValue: {
    fontSize: 40,
    fontWeight: "700",
    color:
      colors.brandPrimary,
  },

  previewMeta: {
    color:
      colors.onSurfaceTertiary,
  },

  error: {
    color: colors.error,
    marginTop: spacing.md,
  },

  bottom: {
    padding: spacing.lg,
  },

  primary: {
    backgroundColor:
      colors.brandPrimary,
    borderRadius:
      radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },

  primaryTxt: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});