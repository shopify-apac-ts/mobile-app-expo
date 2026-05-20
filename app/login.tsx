import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth/AuthContext";
import { AuthCancelledError } from "@/lib/auth/oauth";
import {
  colors,
  fontFamily,
  fontSize,
  lineHeight,
  radius,
  spacing,
} from "@/lib/theme";

export default function LoginScreen() {
  const { isAuthenticated, login, logout } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onLogin = async () => {
    setBusy(true);
    try {
      await login();
      router.replace("/account");
    } catch (e) {
      if (e instanceof AuthCancelledError) {
        return;
      }
      Alert.alert("ログイン失敗", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    setBusy(true);
    try {
      await logout();
    } catch (e) {
      Alert.alert("ログアウト失敗", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const buttonBg = busy
    ? colors.disabledBg
    : isAuthenticated
    ? colors.danger
    : colors.primaryButtonBg;
  const buttonTextColor = busy
    ? colors.disabled
    : isAuthenticated
    ? "#ffffff"
    : colors.primaryButtonText;

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xl,
        backgroundColor: colors.background,
      }}
    >
      <Text
        style={{
          fontFamily: fontFamily.regular,
          fontSize: fontSize.h3,
          color: colors.foregroundHeading,
          marginBottom: spacing.sm,
          lineHeight: Math.round(fontSize.h3 * lineHeight.tight),
        }}
      >
        {isAuthenticated ? "ログイン中" : "ログインしてください"}
      </Text>
      <Text
        style={{
          fontFamily: fontFamily.regular,
          fontSize: fontSize.sm,
          color: colors.foregroundMuted,
          textAlign: "center",
          marginBottom: spacing["2xl"],
          lineHeight: Math.round(fontSize.sm * lineHeight.loose),
        }}
      >
        {isAuthenticated
          ? "アカウント情報の閲覧・編集ができます"
          : "Shopify アカウントでログインすると、注文情報や住所を管理できます"}
      </Text>

      <Pressable
        onPress={isAuthenticated ? onLogout : onLogin}
        disabled={busy}
        style={{
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md + 2,
          borderRadius: radius.sm,
          backgroundColor: buttonBg,
        }}
      >
        <Text
          style={{
            fontFamily: fontFamily.medium,
            fontSize: fontSize.md,
            color: buttonTextColor,
          }}
        >
          {busy
            ? "処理中..."
            : isAuthenticated
            ? "ログアウト"
            : "Shopify でログイン"}
        </Text>
      </Pressable>
    </View>
  );
}
