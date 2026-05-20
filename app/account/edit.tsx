import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCustomerClient } from "@/lib/shopify/useCustomerClient";
import { CUSTOMER_QUERY, CUSTOMER_UPDATE_MUTATION } from "@/lib/shopify/queries";
import type { Customer } from "@/lib/shopify/types";
import { colors, fontFamily, fontSize, radius, spacing } from "@/lib/theme";

type CustomerResult = { customer: Customer | null };
type UpdateResult = {
  customerUpdate: {
    customer: Pick<Customer, "id" | "firstName" | "lastName"> | null;
    userErrors: { field: string[]; message: string; code: string }[];
  };
};

export default function AccountEditScreen() {
  const client = useCustomerClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["customer"],
    queryFn: async () => {
      const result = await client.request<CustomerResult>(CUSTOMER_QUERY);
      return result.customer;
    },
  });

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [initialized, setInitialized] = useState(false);

  if (data && !initialized) {
    setFirstName(data.firstName ?? "");
    setLastName(data.lastName ?? "");
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await client.request<UpdateResult>(CUSTOMER_UPDATE_MUTATION, {
        input: { firstName, lastName },
      });
      if (result.customerUpdate.userErrors.length) {
        throw new Error(
          result.customerUpdate.userErrors.map((e) => e.message).join(", ")
        );
      }
      return result.customerUpdate.customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      Alert.alert("保存しました", "プロフィールを更新しました", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err) => {
      Alert.alert("エラー", err instanceof Error ? err.message : String(err));
    },
  });

  if (isLoading) {
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
    <View
      style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}
    >
      <View style={{ marginBottom: spacing.lg }}>
        <Text
          style={{
            fontFamily: fontFamily.medium,
            fontSize: fontSize.sm,
            color: colors.foregroundMuted,
            marginBottom: spacing.xs + 2,
          }}
        >
          姓
        </Text>
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          style={{
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
            backgroundColor: colors.inputBg,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            borderRadius: radius.md,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.md,
            color: colors.inputText,
            minHeight: 44,
          }}
        />
      </View>
      <View style={{ marginBottom: spacing.lg }}>
        <Text
          style={{
            fontFamily: fontFamily.medium,
            fontSize: fontSize.sm,
            color: colors.foregroundMuted,
            marginBottom: spacing.xs + 2,
          }}
        >
          名
        </Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          style={{
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
            backgroundColor: colors.inputBg,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            borderRadius: radius.md,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.md,
            color: colors.inputText,
            minHeight: 44,
          }}
        />
      </View>

      <Pressable
        onPress={() => mutation.mutate()}
        disabled={mutation.isPending}
        style={{
          marginTop: spacing.lg,
          padding: spacing.md + 2,
          borderRadius: radius.sm,
          alignItems: "center",
          backgroundColor: mutation.isPending
            ? colors.disabledBg
            : colors.primaryButtonBg,
        }}
      >
        <Text
          style={{
            fontFamily: fontFamily.medium,
            fontSize: fontSize.md,
            color: mutation.isPending ? colors.disabled : colors.primaryButtonText,
          }}
        >
          {mutation.isPending ? "保存中..." : "保存"}
        </Text>
      </Pressable>
    </View>
  );
}
