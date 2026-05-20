import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import type { CartLine } from "@/lib/shopify/types";
import { colors, fontFamily, fontSize, radius, spacing } from "@/lib/theme";

type Props = {
  line: CartLine;
  onChangeQuantity: (quantity: number) => void;
  onRemove: () => void;
};

export const CartLineItem: React.FC<Props> = ({
  line,
  onChangeQuantity,
  onRemove,
}) => {
  const { merchandise, quantity } = line;
  return (
    <View
      style={{
        flexDirection: "row",
        padding: spacing.md,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {merchandise.image ? (
        <Image
          source={{ uri: merchandise.image.url }}
          style={{ width: 80, height: 80, borderRadius: radius.md }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: 80,
            height: 80,
            backgroundColor: colors.disabledBg,
            borderRadius: radius.md,
          }}
        />
      )}
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text
          numberOfLines={2}
          style={{
            fontFamily: fontFamily.medium,
            fontSize: fontSize.md,
            color: colors.foregroundHeading,
          }}
        >
          {merchandise.product.title}
        </Text>
        {merchandise.title !== "Default Title" && (
          <Text
            style={{
              marginTop: 2,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.xs,
              color: colors.foregroundMuted,
            }}
          >
            {merchandise.title}
          </Text>
        )}
        <Text
          style={{
            marginTop: spacing.xs,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.md,
            color: colors.foreground,
          }}
        >
          {merchandise.price.currencyCode}{" "}
          {Number(merchandise.price.amount).toLocaleString()}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: spacing.sm,
          }}
        >
          <Pressable
            onPress={() => onChangeQuantity(Math.max(1, quantity - 1))}
            style={{
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.secondaryButtonBg,
              borderRadius: radius.sm,
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily.regular,
                fontSize: fontSize.lg,
                color: colors.foregroundHeading,
              }}
            >
              -
            </Text>
          </Pressable>
          <Text
            style={{
              marginHorizontal: spacing.md,
              fontFamily: fontFamily.medium,
              fontSize: fontSize.md,
              color: colors.foregroundHeading,
            }}
          >
            {quantity}
          </Text>
          <Pressable
            onPress={() => onChangeQuantity(quantity + 1)}
            style={{
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.secondaryButtonBg,
              borderRadius: radius.sm,
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily.regular,
                fontSize: fontSize.lg,
                color: colors.foregroundHeading,
              }}
            >
              +
            </Text>
          </Pressable>
          <Pressable
            onPress={onRemove}
            style={{
              marginLeft: "auto",
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily.regular,
                fontSize: fontSize.sm,
                color: colors.danger,
              }}
            >
              削除
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
