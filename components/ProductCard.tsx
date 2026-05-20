import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import type { Product } from "@/lib/shopify/types";
import { colors, fontFamily, fontSize, radius, spacing } from "@/lib/theme";

type Props = {
  product: Product;
};

export const ProductCard: React.FC<Props> = ({ product }) => {
  const price = product.priceRange.minVariantPrice;
  return (
    <Link href={`/product/${product.handle}` as any} asChild>
      <Pressable
        style={{
          flex: 1,
          margin: spacing.sm,
          backgroundColor: colors.background,
          borderRadius: radius.md,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {product.featuredImage ? (
          <Image
            source={{ uri: product.featuredImage.url }}
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
                fontSize: fontSize.xs,
                color: colors.foregroundMuted,
              }}
            >
              画像なし
            </Text>
          </View>
        )}
        <View style={{ padding: spacing.md }}>
          <Text
            numberOfLines={2}
            style={{
              fontFamily: fontFamily.medium,
              fontSize: fontSize.md,
              color: colors.foregroundHeading,
            }}
          >
            {product.title}
          </Text>
          <Text
            style={{
              marginTop: spacing.xs,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.md,
              color: colors.foreground,
            }}
          >
            {price.currencyCode} {Number(price.amount).toLocaleString()}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
};
