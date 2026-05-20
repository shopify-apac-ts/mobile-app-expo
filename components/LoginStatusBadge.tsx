import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth/AuthContext";
import { AuthCancelledError } from "@/lib/auth/oauth";
import { colors, fontFamily, fontSize, radius, spacing } from "@/lib/theme";

export const LoginStatusBadge: React.FC = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    if (busy || isLoading) return;
    if (isAuthenticated) {
      router.push("/account");
      return;
    }
    setBusy(true);
    try {
      await login();
    } catch (e) {
      if (e instanceof AuthCancelledError) return;
      Alert.alert("ログイン失敗", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || busy) {
    return (
      <View
        style={{
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs + 2,
          borderRadius: radius.pill,
          backgroundColor: colors.disabledBg,
        }}
      >
        <Text
          style={{
            fontFamily: fontFamily.regular,
            fontSize: fontSize.xs,
            color: colors.foregroundMuted,
          }}
        >
          ...
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: radius.pill,
        backgroundColor: isAuthenticated
          ? colors.successSoft
          : colors.secondaryButtonBg,
        borderWidth: 1,
        borderColor: isAuthenticated ? colors.success : colors.border,
      }}
    >
      <Text
        style={{
          fontFamily: fontFamily.medium,
          fontSize: fontSize.xs,
          color: isAuthenticated ? colors.success : colors.foreground,
        }}
      >
        {isAuthenticated ? "ログイン中" : "未ログイン"}
      </Text>
    </Pressable>
  );
};
