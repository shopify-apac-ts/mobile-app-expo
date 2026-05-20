import React, { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { storefrontClient } from "@/lib/shopify/storefront";
import { PRODUCTS_QUERY } from "@/lib/shopify/queries";
import type { Product } from "@/lib/shopify/types";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { LoginStatusBadge } from "@/components/LoginStatusBadge";
import { useCart } from "@/lib/cart/CartContext";
import { colors, fontFamily, fontSize, radius, spacing } from "@/lib/theme";

type ProductsResult = {
  products: { edges: { node: Product }[] };
};

export default function HomeScreen() {
  const [search, setSearch] = useState("");
  const { cart } = useCart();
  const totalQuantity = cart?.totalQuantity ?? 0;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", search],
    queryFn: async () => {
      const result = await storefrontClient.request<ProductsResult>(
        PRODUCTS_QUERY,
        { first: 50, query: search || null }
      );
      return result.products.edges.map((edge) => edge.node);
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <LoginStatusBadge />
        <Link href="/cart" asChild>
          <Pressable
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs + 2,
              backgroundColor: colors.secondaryButtonBg,
              borderRadius: radius.pill,
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily.medium,
                fontSize: fontSize.sm,
                color: colors.foreground,
              }}
            >
              カート ({totalQuantity})
            </Text>
          </Pressable>
        </Link>
      </View>

      <SearchBar value={search} onChange={setSearch} />

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.foregroundHeading} />
        </View>
      ) : isError ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: spacing.lg,
          }}
        >
          <Text
            style={{
              fontFamily: fontFamily.regular,
              fontSize: fontSize.md,
              color: colors.danger,
              marginBottom: spacing.sm,
            }}
          >
            商品の取得に失敗しました
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={{
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm + 2,
              backgroundColor: colors.primaryButtonBg,
              borderRadius: radius.md,
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily.medium,
                fontSize: fontSize.md,
                color: colors.primaryButtonText,
              }}
            >
              再試行
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: spacing.sm }}
          renderItem={({ item }) => <ProductCard product={item} />}
          ListEmptyComponent={
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                padding: spacing["2xl"],
              }}
            >
              <Text
                style={{
                  fontFamily: fontFamily.regular,
                  fontSize: fontSize.md,
                  color: colors.foregroundMuted,
                }}
              >
                商品が見つかりません
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
