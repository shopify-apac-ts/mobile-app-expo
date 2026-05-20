import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/lib/auth/AuthContext";
import { colors, fontFamily, fontSize } from "@/lib/theme";

export default function AccountLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.foregroundHeading} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foregroundHeading,
        headerTitleStyle: {
          fontFamily: fontFamily.regular,
          fontSize: fontSize.lg,
          color: colors.foregroundHeading,
        },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "アカウント" }} />
      <Stack.Screen name="edit" options={{ title: "プロフィール編集" }} />
      <Stack.Screen name="addresses/[id]" options={{ title: "住所編集" }} />
    </Stack>
  );
}
