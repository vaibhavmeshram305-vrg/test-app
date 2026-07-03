import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  spacing,
  radius,
  shadow,
} from "@/src/theme";

import { api } from "@/src/lib/api";
import { useAuth } from "@/src/context/AuthContext";

export default function Subscription() {
  const { user, refresh } = useAuth();

  const [plans, setPlans] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api.plans()
      .then(setPlans)
      .catch((e) => console.warn(e));
  }, []);

  const upgrade = async (planId: string) => {
    setMsg(null);
    setProcessing(planId);

    try {
      const order = await api.createOrder(planId);

      const mockPaymentId = `pay_mock_${Date.now()}`;
      const mockSignature = "mock_signature_pvdesign";

      const res = await api.verifyOrder({
        razorpay_order_id: order.order_id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
        plan_id: planId,
      });

      await refresh();

      setMsg(
        `Success! You're now on the ${planId.toUpperCase()} plan${
          res.mock ? " (test mode)" : ""
        }.`
      );
    } catch (e: any) {
      setMsg(e.message || "Upgrade failed");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <SafeAreaView
      style={styles.root}
      edges={["top"]}
      testID="subscription-screen"
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>
          Choose your plan
        </Text>

        <Text style={styles.subtitle}>
          Upgrade anytime. Cancel anytime.
        </Text>

        <View
          style={styles.currentPill}
          testID="subscription-current-plan"
        >
          <Ionicons
            name="checkmark-circle"
            size={14}
            color={colors.success}
          />

          <Text style={styles.currentTxt}>
            Current plan:{" "}
            <Text
              style={{
                fontWeight: "700",
              }}
            >
              {(user?.plan || "free").toUpperCase()}
            </Text>
          </Text>
        </View>

        {plans.map((p) => {
          const isCurrent =
            user?.plan === p.id;

          const isFree =
            p.price_inr === 0;

          return (
            <View
              key={p.id}
              style={[
                styles.card,
                shadow.card,
                p.id === "pro" &&
                  styles.recommended,
              ]}
              testID={`plan-card-${p.id}`}
            >
              {p.id === "pro" && (
                <View
                  style={styles.recBadge}
                >
                  <Text
                    style={styles.recTxt}
                  >
                    MOST POPULAR
                  </Text>
                </View>
              )}

              <Text style={styles.planName}>
                {p.name}
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.price}>
                  ₹{p.price_inr}
                </Text>

                {p.price_inr > 0 && (
                  <Text style={styles.per}>
                    /month
                  </Text>
                )}
              </View>

              {p.features.map(
                (
                  f: string,
                  i: number
                ) => (
                  <View
                    key={i}
                    style={styles.feat}
                  >
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={
                        colors.brandPrimary
                      }
                    />

                    <Text
                      style={
                        styles.featTxt
                      }
                    >
                      {f}
                    </Text>
                  </View>
                )
              )}

              <Pressable
                testID={`upgrade-${p.id}-btn`}
                disabled={
                  isCurrent ||
                  isFree ||
                  processing !== null
                }
                onPress={() =>
                  upgrade(p.id)
                }
                style={({ pressed }) => [
                  styles.cta,
                  isCurrent && {
                    backgroundColor:
                      colors.surfaceTertiary,
                  },
                  isFree &&
                    !isCurrent && {
                      backgroundColor:
                        colors.surfaceTertiary,
                    },
                  pressed &&
                    !isCurrent &&
                    !isFree && {
                      opacity: 0.9,
                    },
                ]}
              >
                {processing === p.id ? (
                  <ActivityIndicator
                    color="#fff"
                  />
                ) : (
                  <Text
                    style={[
                      styles.ctaTxt,
                      (isCurrent ||
                        isFree) && {
                        color:
                          colors.onSurfaceTertiary,
                      },
                    ]}
                  >
                    {isCurrent
                      ? "Current plan"
                      : isFree
                      ? "Free forever"
                      : `Upgrade to ${p.name}`}
                  </Text>
                )}
              </Pressable>
            </View>
          );
        })}

        {msg && (
          <View
            testID="subscription-msg"
            style={styles.msg}
          >
            <Text style={styles.msgTxt}>
              {msg}
            </Text>
          </View>
        )}

        <Text style={styles.footer}>
          Payments processed securely by
          Razorpay. GST invoice provided.
        </Text>
      </ScrollView>
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
    fontSize: 26,
    fontWeight: "700",
    color: colors.onSurface,
  },

  subtitle: {
    fontSize: 14,
    color:
      colors.onSurfaceTertiary,
    marginTop: 4,
    marginBottom:
      spacing.lg,
  },

  currentPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor:
      colors.brandTertiary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius:
      radius.pill,
    marginBottom:
      spacing.lg,
  },

  currentTxt: {
    fontSize: 12,
    color:
      colors.brandPrimary,
    marginLeft: 6,
  },

  card: {
    backgroundColor:
      colors.surfaceSecondary,
    borderRadius:
      radius.lg,
    padding: spacing.lg,
    marginBottom:
      spacing.md,
    borderWidth: 1,
    borderColor:
      colors.border,
  },

  recommended: {
    borderColor:
      colors.brandSecondary,
    borderWidth: 2,
  },

  recBadge: {
    alignSelf: "flex-start",
    backgroundColor:
      colors.brandSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius:
      radius.sm,
    marginBottom:
      spacing.sm,
  },

  recTxt: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  planName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.onSurface,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
    marginBottom:
      spacing.md,
  },

  price: {
    fontSize: 34,
    fontWeight: "700",
    color:
      colors.brandPrimary,
  },

  per: {
    fontSize: 14,
    color:
      colors.onSurfaceTertiary,
    marginLeft: 4,
  },

  feat: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },

  featTxt: {
    fontSize: 13,
    color: colors.onSurface,
    marginLeft: 8,
  },

  cta: {
    backgroundColor:
      colors.brandPrimary,
    borderRadius:
      radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop:
      spacing.md,
  },

  ctaTxt: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  msg: {
    backgroundColor:
      colors.brandTertiary,
    padding: spacing.md,
    borderRadius:
      radius.md,
    marginTop:
      spacing.md,
  },

  msgTxt: {
    color:
      colors.brandPrimary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  footer: {
    fontSize: 11,
    color: colors.muted,
    marginTop:
      spacing.xl,
    textAlign: "center",
  },
});