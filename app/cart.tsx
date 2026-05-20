import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  Text,
  View,
} from "react-native";
import { CartLineItem } from "@/components/CartLineItem";
import { useCart } from "@/lib/cart/CartContext";
import { colors, fontFamily, fontSize, radius, spacing } from "@/lib/theme";

export default function CartScreen() {
  const { cart, isLoading, updateLine, removeLine } = useCart();

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

  const lines = cart?.lines.edges.map((e) => e.node) ?? [];
  const isEmpty = lines.length === 0;

  const onCheckout = async () => {
    if (!cart?.checkoutUrl) return;
    const supported = await Linking.canOpenURL(cart.checkoutUrl);
    if (!supported) {
      Alert.alert("エラー", "チェックアウト URL を開けません");
      return;
    }
    await Linking.openURL(cart.checkoutUrl);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {isEmpty ? (
        <View
          style={{
            flex: 1,
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
            カートは空です
          </Text>
        </View>
      ) : (
        <FlatList
          data={lines}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CartLineItem
              line={item}
              onChangeQuantity={(q) =>
                updateLine(item.id, q).catch((err) =>
                  Alert.alert("エラー", err.message)
                )
              }
              onRemove={() =>
                removeLine(item.id).catch((err) =>
                  Alert.alert("エラー", err.message)
                )
              }
            />
          )}
        />
      )}

      {!isEmpty && cart && (
        <View
          style={{
            padding: spacing.lg,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily.regular,
                fontSize: fontSize.md,
                color: colors.foreground,
              }}
            >
              小計
            </Text>
            <Text
              style={{
                fontFamily: fontFamily.medium,
                fontSize: fontSize.lg,
                color: colors.foregroundHeading,
              }}
            >
              {cart.cost.subtotalAmount.currencyCode}{" "}
              {Number(cart.cost.subtotalAmount.amount).toLocaleString()}
            </Text>
          </View>
          <Pressable
            onPress={onCheckout}
            style={{
              padding: spacing.md + 4,
              backgroundColor: colors.primaryButtonBg,
              borderRadius: radius.sm,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily.medium,
                fontSize: fontSize.md,
                color: colors.primaryButtonText,
              }}
            >
              チェックアウトへ進む
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
