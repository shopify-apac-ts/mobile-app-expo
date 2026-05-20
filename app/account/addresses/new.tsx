import React from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCustomerClient } from "@/lib/shopify/useCustomerClient";
import {
  CUSTOMER_ADDRESS_CREATE_MUTATION,
  CUSTOMER_QUERY,
} from "@/lib/shopify/queries";
import type { Customer, CustomerAddress } from "@/lib/shopify/types";
import { AddressForm } from "@/components/AddressForm";
import { colors } from "@/lib/theme";

type CustomerResult = { customer: Customer | null };
type AddressCreateResult = {
  customerAddressCreate: {
    customerAddress: CustomerAddress | null;
    userErrors: { field: string[]; message: string; code: string }[];
  };
};

export default function AddressNewScreen() {
  const client = useCustomerClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Reads from the TanStack Query cache populated by the account screen.
  // Falls back to a fetch if visited via a direct deep link.
  const { data: customer } = useQuery({
    queryKey: ["customer"],
    queryFn: async () => {
      const result = await client.request<CustomerResult>(CUSTOMER_QUERY);
      return result.customer;
    },
  });

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
      // First-ever address auto-becomes the default — otherwise the customer
      // would have no default address and downstream defaults (cart, checkout)
      // would have nothing to prefill.
      const isFirstAddress = (customer?.addresses.edges.length ?? 0) === 0;
      const result = await client.request<AddressCreateResult>(
        CUSTOMER_ADDRESS_CREATE_MUTATION,
        {
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
          defaultAddress: isFirstAddress ? true : null,
        }
      );
      if (result.customerAddressCreate.userErrors.length) {
        throw new Error(
          result.customerAddressCreate.userErrors
            .map((e) => e.message)
            .join(", ")
        );
      }
      return result.customerAddressCreate.customerAddress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      Alert.alert("保存しました", "住所を追加しました", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err) => {
      Alert.alert("エラー", err instanceof Error ? err.message : String(err));
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AddressForm
        submitting={mutation.isPending}
        onSubmit={async (input) => {
          await mutation.mutateAsync(input);
        }}
      />
    </View>
  );
}
