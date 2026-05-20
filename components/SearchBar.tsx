import React from "react";
import { TextInput, View } from "react-native";
import { colors, fontFamily, fontSize, radius, spacing } from "@/lib/theme";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export const SearchBar: React.FC<Props> = ({ value, onChange, placeholder }) => {
  return (
    <View
      style={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? "商品を検索..."}
        placeholderTextColor={colors.foregroundMuted}
        style={{
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          borderRadius: radius.md,
          backgroundColor: colors.secondaryButtonBg,
          fontFamily: fontFamily.regular,
          fontSize: fontSize.md,
          color: colors.inputText,
          minHeight: 44,
        }}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
};
