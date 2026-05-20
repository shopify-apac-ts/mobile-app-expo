import React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useCustomerClient } from "@/lib/shopify/useCustomerClient";
import { CUSTOMER_QUERY } from "@/lib/shopify/queries";
import type { Customer } from "@/lib/shopify/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { colors, fontFamily, fontSize, radius, spacing } from "@/lib/theme";

type CustomerResult = { customer: Customer | null };

export default function AccountIndexScreen() {
  const client = useCustomerClient();
  const { logout } = useAuth();
  const router = useRouter();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["customer"],
    queryFn: async () => {
      const result = await client.request<CustomerResult>(CUSTOMER_QUERY);
      return result.customer;
    },
  });

  const onLogout = async () => {
    try {
      await logout();
      router.replace("/");
    } catch (e) {
      Alert.alert("ログアウト失敗", e instanceof Error ? e.message : String(e));
    }
  };

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
            marginBottom: spacing.sm,
          }}
        >
          プロフィールの取得に失敗しました
        </Text>
        <Text
          selectable
          style={{
            fontFamily: fontFamily.regular,
            fontSize: fontSize.xs,
            color: colors.foregroundMuted,
            marginBottom: spacing.md,
            textAlign: "center",
          }}
        >
          {error instanceof Error
            ? error.message
            : error
            ? String(error)
            : "(no error message)"}
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
    );
  }

  const addresses = data.addresses.edges.map((e) => e.node);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }}>
      <View
        style={{
          padding: spacing.lg,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text
          style={{
            fontFamily: fontFamily.medium,
            fontSize: fontSize.sm,
            color: colors.foregroundMuted,
            marginBottom: spacing.xs,
          }}
        >
          お名前
        </Text>
        <Text
          style={{
            fontFamily: fontFamily.regular,
            fontSize: fontSize.md,
            color: colors.foregroundHeading,
            marginBottom: spacing.md,
          }}
        >
          {data.lastName ?? ""} {data.firstName ?? ""}
        </Text>
        <Text
          style={{
            fontFamily: fontFamily.medium,
            fontSize: fontSize.sm,
            color: colors.foregroundMuted,
            marginBottom: spacing.xs,
          }}
        >
          メールアドレス
        </Text>
        <Text
          style={{
            fontFamily: fontFamily.regular,
            fontSize: fontSize.md,
            color: colors.foregroundHeading,
            marginBottom: spacing.md,
          }}
        >
          {data.emailAddress?.emailAddress ?? "—"}
        </Text>
        {data.phoneNumber?.phoneNumber && (
          <>
            <Text
              style={{
                fontFamily: fontFamily.medium,
                fontSize: fontSize.sm,
                color: colors.foregroundMuted,
                marginBottom: spacing.xs,
              }}
            >
              電話番号
            </Text>
            <Text
              style={{
                fontFamily: fontFamily.regular,
                fontSize: fontSize.md,
                color: colors.foregroundHeading,
                marginBottom: spacing.md,
              }}
            >
              {data.phoneNumber.phoneNumber}
            </Text>
          </>
        )}
        <Link href="/account/edit" asChild>
          <Pressable
            style={{
              marginTop: spacing.sm,
              paddingVertical: spacing.sm + 2,
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
              プロフィールを編集
            </Text>
          </Pressable>
        </Link>
      </View>

      <View
        style={{
          marginTop: spacing.lg,
          padding: spacing.lg,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            fontFamily: fontFamily.medium,
            fontSize: fontSize.md,
            color: colors.foregroundHeading,
            marginBottom: spacing.md,
          }}
        >
          住所
        </Text>
        {addresses.length === 0 ? (
          <Text
            style={{
              fontFamily: fontFamily.regular,
              fontSize: fontSize.sm,
              color: colors.foregroundMuted,
              marginBottom: spacing.md,
            }}
          >
            住所が登録されていません
          </Text>
        ) : (
          addresses.map((addr) => (
            <Link
              key={addr.id}
              href={`/account/addresses/${encodeURIComponent(addr.id)}` as any}
              asChild
            >
              <Pressable
                style={{
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1, paddingRight: spacing.md }}>
                  <Text
                    style={{
                      fontFamily: fontFamily.medium,
                      fontSize: fontSize.md,
                      color: colors.foregroundHeading,
                    }}
                  >
                    {addr.lastName ?? ""} {addr.firstName ?? ""}
                  </Text>
                  <Text
                    style={{
                      marginTop: spacing.xs,
                      fontFamily: fontFamily.regular,
                      fontSize: fontSize.sm,
                      color: colors.foreground,
                    }}
                  >
                    {[addr.zip, addr.city, addr.address1, addr.address2]
                      .filter(Boolean)
                      .join(" ")}
                  </Text>
                  {addr.phoneNumber && (
                    <Text
                      style={{
                        marginTop: spacing.xs,
                        fontFamily: fontFamily.regular,
                        fontSize: fontSize.xs,
                        color: colors.foregroundMuted,
                      }}
                    >
                      {addr.phoneNumber}
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    fontFamily: fontFamily.medium,
                    fontSize: fontSize.sm,
                    color: colors.primaryButtonBg,
                  }}
                >
                  編集 ›
                </Text>
              </Pressable>
            </Link>
          ))
        )}
        <Link href={"/account/addresses/new" as any} asChild>
          <Pressable
            style={{
              marginTop: spacing.md,
              paddingVertical: spacing.sm + 2,
              borderWidth: 1,
              borderColor: colors.primaryButtonBg,
              borderRadius: radius.sm,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily.medium,
                fontSize: fontSize.md,
                color: colors.primaryButtonBg,
              }}
            >
              ＋ 住所を追加
            </Text>
          </Pressable>
        </Link>
      </View>

      <View style={{ padding: spacing.lg }}>
        <Pressable
          onPress={onLogout}
          style={{
            padding: spacing.md + 2,
            backgroundColor: colors.danger,
            borderRadius: radius.sm,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: fontFamily.medium,
              fontSize: fontSize.md,
              color: "#ffffff",
            }}
          >
            ログアウト
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
