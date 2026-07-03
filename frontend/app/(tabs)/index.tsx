import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { useAuth } from "@/src/context/AuthContext";

function inr(n: number) {
  return (
    "₹" +
    Math.round(n).toLocaleString("en-IN")
  );
}