import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { CustomerAddress } from "@/lib/shopify/types";
import { PrefecturePicker } from "@/components/PrefecturePicker";
import { colors, fontFamily, fontSize, radius, spacing } from "@/lib/theme";

type AddressInput = {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  zip: string;
  zoneCode: string;
  territoryCode: string;
  phoneNumber: string;
};

type Props = {
  initial?: CustomerAddress;
  onSubmit: (input: AddressInput) => Promise<void>;
  submitting: boolean;
};

export const AddressForm: React.FC<Props> = ({ initial, onSubmit, submitting }) => {
  const [form, setForm] = useState<AddressInput>({
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    address1: initial?.address1 ?? "",
    address2: initial?.address2 ?? "",
    city: initial?.city ?? "",
    zip: initial?.zip ?? "",
    zoneCode: initial?.zoneCode ?? "",
    territoryCode: initial?.territoryCode ?? "JP",
    phoneNumber: initial?.phoneNumber ?? "",
  });

  const set = (key: keyof AddressInput) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 96 : 0}
    >
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          gap: spacing.md,
          paddingBottom: 96,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Field label="姓" value={form.lastName} onChange={set("lastName")} />
        <Field label="名" value={form.firstName} onChange={set("firstName")} />
        <Field label="郵便番号" value={form.zip} onChange={set("zip")} />
        <PrefecturePicker
          label="都道府県"
          value={form.zoneCode || null}
          onChange={set("zoneCode")}
        />
        <Field label="市区町村" value={form.city} onChange={set("city")} />
        <Field label="住所 1" value={form.address1} onChange={set("address1")} />
        <Field label="住所 2" value={form.address2} onChange={set("address2")} />
        <Field
          label="電話番号"
          value={form.phoneNumber}
          onChange={set("phoneNumber")}
          keyboardType="phone-pad"
        />

        <Pressable
          onPress={() => onSubmit(form)}
          disabled={submitting}
          style={{
            marginTop: spacing.lg,
            padding: spacing.md + 2,
            borderRadius: radius.md,
            alignItems: "center",
            backgroundColor: submitting
              ? colors.disabledBg
              : colors.primaryButtonBg,
          }}
        >
          <Text
            style={{
              fontFamily: fontFamily.medium,
              fontSize: fontSize.md,
              color: submitting ? colors.disabled : colors.primaryButtonText,
            }}
          >
            {submitting ? "保存中..." : "保存"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: "default" | "phone-pad";
}> = ({ label, value, onChange, keyboardType }) => (
  <View>
    <Text
      style={{
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.foregroundMuted,
        marginBottom: spacing.xs + 2,
      }}
    >
      {label}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      keyboardType={keyboardType}
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
);
