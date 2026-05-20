// ISO 3166-2:JP — 47 都道府県. zoneCode is the Shopify zoneCode value;
// per the user's instruction we use the canonical ISO 3166-2 "JP-XX" form.
// If Shopify rejects this format we can swap to the bare "XX" digits without
// touching the picker UI.
export type Prefecture = {
  zoneCode: string;
  name: string;
};

export const PREFECTURES: Prefecture[] = [
  { zoneCode: "JP-01", name: "北海道" },
  { zoneCode: "JP-02", name: "青森県" },
  { zoneCode: "JP-03", name: "岩手県" },
  { zoneCode: "JP-04", name: "宮城県" },
  { zoneCode: "JP-05", name: "秋田県" },
  { zoneCode: "JP-06", name: "山形県" },
  { zoneCode: "JP-07", name: "福島県" },
  { zoneCode: "JP-08", name: "茨城県" },
  { zoneCode: "JP-09", name: "栃木県" },
  { zoneCode: "JP-10", name: "群馬県" },
  { zoneCode: "JP-11", name: "埼玉県" },
  { zoneCode: "JP-12", name: "千葉県" },
  { zoneCode: "JP-13", name: "東京都" },
  { zoneCode: "JP-14", name: "神奈川県" },
  { zoneCode: "JP-15", name: "新潟県" },
  { zoneCode: "JP-16", name: "富山県" },
  { zoneCode: "JP-17", name: "石川県" },
  { zoneCode: "JP-18", name: "福井県" },
  { zoneCode: "JP-19", name: "山梨県" },
  { zoneCode: "JP-20", name: "長野県" },
  { zoneCode: "JP-21", name: "岐阜県" },
  { zoneCode: "JP-22", name: "静岡県" },
  { zoneCode: "JP-23", name: "愛知県" },
  { zoneCode: "JP-24", name: "三重県" },
  { zoneCode: "JP-25", name: "滋賀県" },
  { zoneCode: "JP-26", name: "京都府" },
  { zoneCode: "JP-27", name: "大阪府" },
  { zoneCode: "JP-28", name: "兵庫県" },
  { zoneCode: "JP-29", name: "奈良県" },
  { zoneCode: "JP-30", name: "和歌山県" },
  { zoneCode: "JP-31", name: "鳥取県" },
  { zoneCode: "JP-32", name: "島根県" },
  { zoneCode: "JP-33", name: "岡山県" },
  { zoneCode: "JP-34", name: "広島県" },
  { zoneCode: "JP-35", name: "山口県" },
  { zoneCode: "JP-36", name: "徳島県" },
  { zoneCode: "JP-37", name: "香川県" },
  { zoneCode: "JP-38", name: "愛媛県" },
  { zoneCode: "JP-39", name: "高知県" },
  { zoneCode: "JP-40", name: "福岡県" },
  { zoneCode: "JP-41", name: "佐賀県" },
  { zoneCode: "JP-42", name: "長崎県" },
  { zoneCode: "JP-43", name: "熊本県" },
  { zoneCode: "JP-44", name: "大分県" },
  { zoneCode: "JP-45", name: "宮崎県" },
  { zoneCode: "JP-46", name: "鹿児島県" },
  { zoneCode: "JP-47", name: "沖縄県" },
];

export const findPrefectureByZoneCode = (zoneCode: string | null): Prefecture | undefined =>
  zoneCode ? PREFECTURES.find((p) => p.zoneCode === zoneCode) : undefined;
