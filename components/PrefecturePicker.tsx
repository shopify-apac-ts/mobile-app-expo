import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import {
  PREFECTURES,
  findPrefectureByZoneCode,
  type Prefecture,
} from "@/lib/constants/prefectures";
import { colors, fontFamily, fontSize, radius, spacing } from "@/lib/theme";

type Props = {
  label: string;
  value: string | null;
  onChange: (zoneCode: string) => void;
};

export const PrefecturePicker: React.FC<Props> = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const selected = findPrefectureByZoneCode(value);

  return (
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
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          backgroundColor: colors.inputBg,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          borderRadius: radius.md,
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontFamily: fontFamily.regular,
            fontSize: fontSize.md,
            color: selected ? colors.inputText : colors.foregroundMuted,
          }}
        >
          {selected ? selected.name : "選択してください"}
        </Text>
        <Text
          style={{
            fontFamily: fontFamily.regular,
            fontSize: fontSize.md,
            color: colors.foregroundMuted,
          }}
        >
          ▾
        </Text>
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily.medium,
                fontSize: fontSize.md,
                color: colors.foregroundHeading,
              }}
            >
              都道府県を選択
            </Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={12}>
              <Text
                style={{
                  fontFamily: fontFamily.medium,
                  fontSize: fontSize.md,
                  color: colors.primaryButtonBg,
                }}
              >
                閉じる
              </Text>
            </Pressable>
          </View>
          <FlatList
            data={PREFECTURES}
            keyExtractor={(item) => item.zoneCode}
            renderItem={({ item }: { item: Prefecture }) => {
              const isSelected = item.zoneCode === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.zoneCode);
                    setOpen(false);
                  }}
                  style={{
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: isSelected
                      ? colors.disabledBg
                      : colors.background,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fontFamily.regular,
                      fontSize: fontSize.md,
                      color: colors.foregroundHeading,
                    }}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fontFamily.regular,
                      fontSize: fontSize.xs,
                      color: colors.foregroundMuted,
                    }}
                  >
                    {item.zoneCode}
                  </Text>
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};
