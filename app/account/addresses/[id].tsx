import React from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCustomerClient } from "@/lib/shopify/useCustomerClient";
import {
  CUSTOMER_QUERY,
  CUSTOMER_ADDRESS_UPDATE_MUTATION,
} from "@/lib/shopify/queries";
import type { Customer, CustomerAddress } from "@/lib/shopify/types";
import { AddressForm } from "@/components/AddressForm";
import { colors, fontFamily, fontSize, spacing } from "@/lib/theme";

type CustomerResult = { customer: Customer | null };
type AddressUpdateResult = {
  customerAddressUpdate: {
    customerAddress: CustomerAddress | null;
    userErrors: { field: string[]; message: string; code: string }[];
  };
};

export default function AddressEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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

  const address = data?.addresses.edges
    .map((e) => e.node)
    .find((a) => a.id === id);

  const mutation = useMutation({
    mutationFn: async (input: {
      firstName: string;
      lastName: string;
      address1: string;
      address2: string;
      city: string;
      zip: string;
      zoneCode: string;
      territoryCode: string;
      phoneNumber: string;
    }) => {
      if (!id) throw new Error("Address ID missing");
      const result = await client.request<AddressUpdateResult>(
        CUSTOMER_ADDRESS_UPDATE_MUTATION,
        {
          addressId: id,
          address: {
            firstName: input.firstName || null,
            lastName: input.lastName || null,
            address1: input.address1 || null,
            address2: input.address2 || null,
            city: input.city || null,
            zip: input.zip || null,
            zoneCode: input.zoneCode || null,
            territoryCode: input.territoryCode || null,
            phoneNumber: input.phoneNumber || null,
          },
          defaultAddress: null,
        }
      );
      if (result.customerAddressUpdate.userErrors.length) {
        throw new Error(
          result.customerAddressUpdate.userErrors
            .map((e) => e.message)
            .join(", ")
        );
      }
      return result.customerAddressUpdate.customerAddress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      Alert.alert("保存しました", "住所を更新しました", [
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

  if (!address) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.lg,
          backgroundColor: colors.background,
        }}
      >
        <Text
          style={{
            fontFamily: fontFamily.regular,
            fontSize: fontSize.md,
            color: colors.danger,
          }}
        >
          住所が見つかりません
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AddressForm
        initial={address}
        submitting={mutation.isPending}
        onSubmit={async (input) => {
          await mutation.mutateAsync(input);
        }}
      />
    </View>
  );
}
