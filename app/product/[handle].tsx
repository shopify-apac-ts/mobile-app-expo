import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { storefrontClient } from "@/lib/shopify/storefront";
import { PRODUCT_BY_HANDLE_QUERY } from "@/lib/shopify/queries";
import type { ProductDetail } from "@/lib/shopify/types";
import { useCart } from "@/lib/cart/CartContext";
import {
  colors,
  fontFamily,
  fontSize,
  lineHeight,
  radius,
  spacing,
} from "@/lib/theme";

type ProductByHandleResult = {
  productByHandle: ProductDetail | null;
};

export default function ProductDetailScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const { addLine } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", handle],
    queryFn: async () => {
      const result = await storefrontClient.request<ProductByHandleResult>(
        PRODUCT_BY_HANDLE_QUERY,
        { handle }
      );
      return result.productByHandle;
    },
    enabled: !!handle,
  });

  const variants = useMemo(
    () => data?.variants.edges.map((e) => e.node) ?? [],
    [data]
  );

  const currentVariant = useMemo(() => {
    if (selectedVariantId) {
      return variants.find((v) => v.id === selectedVariantId) ?? variants[0];
    }
    return variants[0];
  }, [variants, selectedVariantId]);

  const addToCart = useMutation({
    mutationFn: async () => {
      if (!currentVariant) throw new Error("Variant not selected");
      await addLine(currentVariant.id, quantity);
    },
    onSuccess: () => {
      Alert.alert("追加しました", `${data?.title} をカートに追加しました`, [
        { text: "続けて見る", style: "cancel" },
        { text: "カートを見る", onPress: () => router.push("/cart") },
      ]);
    },
    onError: (err) => {
      Alert.alert("エラー", err instanceof Error ? err.message : "失敗しました");
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

  if (isError || !data) {
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
          商品が見つかりません
        </Text>
      </View>
    );
  }

  const price = currentVariant?.price ?? data.priceRange.minVariantPrice;
  const isUnavailable = !currentVariant?.availableForSale;
  const isAddDisabled = addToCart.isPending || isUnavailable;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {data.featuredImage ? (
        <Image
          source={{ uri: data.featuredImage.url }}
          style={{ width: "100%", aspectRatio: 1 }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: "100%",
            aspectRatio: 1,
            backgroundColor: colors.disabledBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: fontFamily.regular,
              fontSize: fontSize.md,
              color: colors.foregroundMuted,
            }}
          >
            画像なし
          </Text>
        </View>
      )}

      <View style={{ padding: spacing.lg }}>
        <Text
          style={{
            fontFamily: fontFamily.regular,
            fontSize: fontSize.h2,
            color: colors.foregroundHeading,
            lineHeight: Math.round(fontSize.h2 * lineHeight.tight),
          }}
        >
          {data.title}
        </Text>
        <Text
          style={{
            marginTop: spacing.sm,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.xl,
            color: colors.foregroundHeading,
          }}
        >
          {price.currencyCode} {Number(price.amount).toLocaleString()}
        </Text>

        {data.description ? (
          <Text
            style={{
              marginTop: spacing.md,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.body,
              color: colors.foreground,
              lineHeight: Math.round(fontSize.body * lineHeight.loose),
            }}
          >
            {data.description}
          </Text>
        ) : null}

        {variants.length > 1 && (
          <View style={{ marginTop: spacing.xl }}>
            <Text
              style={{
                fontFamily: fontFamily.medium,
                fontSize: fontSize.sm,
                color: colors.foregroundMuted,
                marginBottom: spacing.sm + 2,
              }}
            >
              バリアント
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing.sm,
              }}
            >
              {variants.map((v) => {
                const selected = currentVariant?.id === v.id;
                const available = v.availableForSale;
                const bgColor = !available
                  ? colors.disabledBg
                  : selected
                  ? colors.selectedVariantBg
                  : colors.variantBg;
                const textColor = !available
                  ? colors.disabled
                  : selected
                  ? colors.selectedVariantText
                  : colors.variantText;
                const borderColor = !available
                  ? colors.border
                  : selected
                  ? colors.selectedVariantBorder
                  : colors.variantBorder;
                return (
                  <Pressable
                    key={v.id}
                    onPress={() => setSelectedVariantId(v.id)}
                    disabled={!available}
                    style={{
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm + 2,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      borderColor,
                      backgroundColor: bgColor,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fontFamily.regular,
                        fontSize: fontSize.md,
                        color: textColor,
                      }}
                    >
                      {v.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View
          style={{
            marginTop: spacing.xl,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: fontFamily.medium,
              fontSize: fontSize.sm,
              color: colors.foregroundMuted,
              marginRight: spacing.md,
            }}
          >
            数量
          </Text>
          <Pressable
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.secondaryButtonBg,
              borderRadius: radius.sm,
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily.regular,
                fontSize: fontSize.xl,
                color: colors.foregroundHeading,
              }}
            >
              −
            </Text>
          </Pressable>
          <Text
            style={{
              marginHorizontal: spacing.lg,
              fontFamily: fontFamily.medium,
              fontSize: fontSize.lg,
              color: colors.foregroundHeading,
              minWidth: 24,
              textAlign: "center",
            }}
          >
            {quantity}
          </Text>
          <Pressable
            onPress={() => setQuantity((q) => q + 1)}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.secondaryButtonBg,
              borderRadius: radius.sm,
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily.regular,
                fontSize: fontSize.xl,
                color: colors.foregroundHeading,
              }}
            >
              ＋
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => addToCart.mutate()}
          disabled={isAddDisabled}
          style={{
            marginTop: spacing.xl,
            paddingVertical: spacing.md + 4,
            borderRadius: radius.sm,
            alignItems: "center",
            backgroundColor: isAddDisabled
              ? colors.disabledBg
              : colors.primaryButtonBg,
            borderWidth: 1,
            borderColor: isAddDisabled
              ? colors.border
              : colors.primaryButtonBorder,
          }}
        >
          <Text
            style={{
              fontFamily: fontFamily.medium,
              fontSize: fontSize.md,
              color: isAddDisabled
                ? colors.disabled
                : colors.primaryButtonText,
            }}
          >
            {addToCart.isPending
              ? "追加中..."
              : isUnavailable
              ? "在庫切れ"
              : "カートに追加"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
