import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import { colors, spacing } from "@/src/theme";

type LoaderProps = {
  text?: string;
};

export function Loader({
  text,
}: LoaderProps) {
  return (
    <View
      style={styles.wrap}
      testID="loader-view"
    >
      <ActivityIndicator
        size="large"
        color={colors.brandPrimary}
      />

      {text ? (
        <Text style={styles.txt}>
          {text}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  txt: {
    marginTop: spacing.md,
    color: colors.onSurfaceTertiary,
    fontSize: 14,
  },
});