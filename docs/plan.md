# Shopify ストア × Expo モバイルアプリ MVP 構築プラン

> このドキュメントは MVP を実装した上で、当初プランからの変更点を反映した「現状版」です。
> 当初プランからの主な逸脱には **[変更]** マークを付けています。

## Context

`dev-nobu-beer-store.myshopify.com` に接続する iOS / Android アプリを React Native / Expo で新規構築する。作業ディレクトリ `/Users/nobu/dev/shopify/mobile/mobile-app-expo`。

**MVP スコープ（完成済み）**:
1. Customer Account API（OAuth 2.0 + PKCE、Public/Mobile クライアント）でログイン
2. ログイン状態（未ログイン / ログイン中）をアプリ全体で表示
3. ログイン顧客は、プロファイル閲覧と、氏名・住所の編集が可能
4. **[変更]** 住所は閲覧・編集に加え、**追加** も可能（47 都道府県ピッカー付き）
5. トップページで全商品の閲覧・キーワード検索・カート追加
6. Storefront Cart API でカート作成・商品追加・変更・削除
7. ログイン後のカート引き継ぎ（buyerIdentity リンク）

**アーキテクチャ（当初予想どおり 2 つのコンポーネント）**:
- **Shopify 側**: Headless チャンネルをインストールし、Storefront API のパブリックトークンと、Customer Account API の Public/Mobile クライアントを設定。
- **Expo アプリ側**: Storefront API（パブリックトークン、商品・カート）と Customer Account API（OAuth トークン、顧客データ）の 2 系統 GraphQL クライアントを使い分ける。

**技術選定（実装後の確定版）**:
- TypeScript / Expo Router / TanStack Query + graphql-request
- **[変更]** スタイリング: NativeWind は採用せず、`lib/theme.ts` の Horizon デザイントークン + RN `style` props で実装（詳細は Phase 3 参照）
- フォント: `@expo-google-fonts/noto-sans-jp`
- 認証: `expo-web-browser` の `openAuthSessionAsync` + 自前 PKCE（`expo-crypto`）+ `expo-secure-store`

---

## Phase 1 — Shopify ストア側のセットアップ（管理画面で実施）

1. **Customer Accounts を有効化**: Settings → Customer accounts → "New customer accounts" を有効化。
2. **Headless チャンネルをインストール**: App Store から Headless チャンネルを追加し、ストアフロントを 1 つ作成。
3. **Storefront API トークン**: Headless → 該当ストアフロント → Storefront API → "Public access token" を発行。
4. **Customer Account API クライアント作成**:
   - クライアントタイプを **Public**（モバイル）に設定。
   - **Callback URI** に `shop.{shop_id}.app://callback`。`shop.{shop_id}.*` 形式は必須。`.app` の部分は自由、`app.json` の `scheme` と完全一致させる。
   - **Javascript Origin** にも同じスキーム値を登録。これがないとトークンエンドポイントが 401 を返す。
   - Scopes: `openid email customer-account-api:full`。`customer-account-api:full` を含めると、OAuth で発行される access_token が **そのまま `shcat_` 形式の Customer Account API トークン** になる（後述 [変更] 参照）。
5. **`shop_id` の取得**: Customer Account API 設定ページに `client_id` と並んで表示。

---

## Phase 2 — Expo プロジェクト初期化

```sh
cd /Users/nobu/dev/shopify/mobile/mobile-app-expo
pnpx create-expo-app@latest . --template default
pnpx expo install --pnpm expo-auth-session expo-crypto expo-web-browser expo-secure-store \
  expo-linking expo-dev-client expo-font expo-splash-screen
pnpm add @tanstack/react-query graphql-request graphql @expo-google-fonts/noto-sans-jp
```

### 設定ファイル

- **`app.json`**
  - `expo.scheme`: `"shop.{shop_id}.app"` ← Customer Account API に登録したスキーム値と完全一致
  - `expo.ios.bundleIdentifier`: `com.devnobu.beerstore`
  - `expo.android.package`: `com.devnobu.beerstore`
  - `expo.plugins`: `["expo-router", "expo-secure-store", ["expo-splash-screen", {...}]]`
- **`.env.local`** (Expo public 変数)
  - `EXPO_PUBLIC_SHOP_DOMAIN=dev-nobu-beer-store.myshopify.com`
  - `EXPO_PUBLIC_SHOP_ID=69800525996`
  - `EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID=...`
  - `EXPO_PUBLIC_STOREFRONT_TOKEN=...`（パブリックトークンなので埋め込み OK）

### **[変更]** ビルドは EAS ではなく Xcode 直ビルド

当初プランでは `eas build --profile development` で配布する想定だったが、実際は EAS を使わず以下のフローで運用:

```sh
pnpm prebuild:ios                         # ios/ ディレクトリを生成
pnpm open:ios                             # Xcode で開く
```

Xcode で:
1. 開発用 Apple ID で署名（Personal Team でも可）
2. iPhone を Lightning/USB-C で Mac に接続
3. Run ボタン（▶︎）でデバイスへ直接インストール
4. Release ビルドを試す場合は Scheme → Edit Scheme → Run → Build Configuration を **Release** に切り替えてから Run

メリット:
- EAS のクラウドビルド待ちが不要（数十秒で配布可能）
- ネイティブ依存（フォント、`expo-secure-store`、Web Browser）の挙動をローカルで即確認できる
- Metro 開発サーバーは原則使わない（Release ビルドで動かして検証）

### **[変更]** Expo Go は使えない（変更なし）

カスタムスキームと SecureStore を使うため Expo Go では動かない。Xcode 直ビルドの開発ビルドで動かす。

---

## Phase 3 — ディレクトリ構造と実装（現状版）

```
app/
  _layout.tsx                  QueryClientProvider, AuthProvider, CartProvider, フォントロード, SplashScreen 制御
  index.tsx                    商品一覧 + 検索バー
  product/[handle].tsx         商品詳細 + 数量選択 + Add to cart
  cart.tsx                     カート閲覧、数量変更、削除、checkout URL 起動
  login.tsx                    ログイン誘導画面
  account/
    _layout.tsx                未ログインなら /login にリダイレクトするガード
    index.tsx                  プロファイル + 住所一覧 + 「住所を追加」/ ログアウト
    edit.tsx                   firstName / lastName 編集
    addresses/
      new.tsx                  [追加] 住所新規作成（1 件目は自動で defaultAddress）
      [id].tsx                 住所編集フォーム
lib/
  theme.ts                     [変更] Horizon 3.1.0 デザイントークン（colors / fontFamily / fontSize / spacing / radius / shadow / text presets）
  constants/
    prefectures.ts             [追加] ISO 3166-2:JP の 47 都道府県（zoneCode + 漢字名）
  shopify/
    config.ts                  env からの設定値を 1 か所に集約
    storefront.ts              graphql-request クライアント（Storefront、X-Shopify-Storefront-Access-Token）
    customer.ts                graphql-request クライアント（Customer Account 用）。ヘッダ要件と 401 リトライ
    useCustomerClient.ts       AuthContext と customer.ts を繋ぐ React フック
    discovery.ts               /.well-known/openid-configuration と /.well-known/customer-account-api をキャッシュ
    queries.ts                 GraphQL 定義
    types.ts                   TS 型定義（Product / Cart / Customer / CustomerAddress 等）
  auth/
    oauth.ts                   PKCE + 認可フロー + リフレッシュ + ログアウト
    AuthContext.tsx            tokens 状態管理 / login / logout / getAccessToken / 自動リフレッシュ
    storage.ts                 expo-secure-store ラッパー（tokens + cartId）
  cart/
    CartContext.tsx            cart_id を SecureStore 永続化、ログイン時に cartBuyerIdentityUpdate でマージ
components/
  ProductCard.tsx
  SearchBar.tsx
  CartLineItem.tsx
  AddressForm.tsx              [変更] 都道府県ピッカー対応 + KeyboardAvoidingView + ScrollView
  PrefecturePicker.tsx         [追加] Modal + FlatList で 47 都道府県を選択
  LoginStatusBadge.tsx         ログイン状態に応じてラベルを切り替えるバッジ
```

### **[変更]** スタイリング: NativeWind は採用せず

当初は NativeWind v4 + Tailwind を想定したが、実装途中で以下の理由から **RN `style` props + `lib/theme.ts` のデザイントークン** に切り替えた:

- Shopify Horizon テーマ（`color-scheme-1` 等）の色・余白・フォントを 1:1 で写し取りたかった → トークン化して `colors.primaryButtonBg` のように参照する方が直感的
- Noto Sans Japanese を `expo-google-fonts` で読み込み、`fontFamily.regular` のように指定する仕組みが必要
- NativeWind v4 の `className` 経由だとカスタムフォントの指定で消耗するため、`style={{ fontFamily: fontFamily.regular, ... }}` の方が確実

`lib/theme.ts` は以下を公開:
- `colors`: Horizon 由来の色（背景、ボーダー、ボタン、入力、ステータス）
- `fontFamily`: Noto Sans JP の Regular / Medium / Bold
- `fontSize`, `fontWeight`, `lineHeight`, `radius`, `spacing`, `shadow`
- `text` プリセット（`h1`〜`h4`, `body`, `label`, `caption`, `price`）

NativeWind / `global.css` / `tailwind.config.js` 自体は依存に残しているが、新規コードでは使っていない（クリーンアップは将来課題）。

### **[変更]** Customer Account API の認証ヘッダ

当初プラン:
- `Authorization: Bearer <access_token>`
- RFC 8693 トークン交換で `shcat_` 形式の Customer Account API トークンを取得してから Customer Account GraphQL を叩く

実装:
- スコープに `customer-account-api:full` を含め、shop-id-scoped なトークンエンドポイントを使うと、OAuth の access_token が **そのまま `shcat_` 形式** で返ってくる
- このストアの discovery には `grant_types_supported` にトークン交換が含まれていない（= サポートされていない）
- 結果として **RFC 8693 のトークン交換ステップは不要**、OAuth で得たトークンをそのまま使う
- ヘッダは Hydrogen の実装に合わせて **`Authorization: <raw shcat_token>`**（`Bearer ` プレフィックスなし）
- 加えて `Origin: https://shop.{shop_id}.app` と `User-Agent` ヘッダが必須（欠けると 401/403）
- `AuthContext` は SecureStore に残った旧トークン（`shcat_` で始まらないもの）を起動時に破棄し、再ログインを促す

### 実装上の重要ポイント

1. **Discovery を 2 つ叩く**: OAuth 関連は `https://{shop_domain}/.well-known/openid-configuration`、Customer Account GraphQL エンドポイントは `https://{shop_domain}/.well-known/customer-account-api`。`discovery.graphql_api` には既に `/{version}/graphql` が含まれているので、こちらでバージョンを別途付ける必要はない。
2. **必須ヘッダ**: 上記のとおり `Authorization: <raw shcat_>` + `Origin` + `User-Agent`。
3. **PKCE 実装**:
   - `code_verifier`: `expo-crypto.getRandomBytesAsync(32)` → base64url。
   - `code_challenge`: SHA-256 → base64url（末尾 `=` 除去・`+`→`-`・`/`→`_`）。
   - `expo-auth-session` の `useAuthRequest` は使わず、`expo-web-browser.openAuthSessionAsync` で開いて自前で URL 構築 + トークン交換 fetch。ヘッダ要件があるため自前の方が確実。
4. **リフレッシュトークンはローテーション**: トークンエンドポイントは毎回新しい `refresh_token` を返す。SecureStore に上書き保存。古いものを再利用すると `invalid_grant`。
5. **id_token は初回しか返らない**: リフレッシュ時に `id_token` が省略されるため、`buildTokenSet` で前回値を保持する `fallbackIdToken` を渡す。
6. **アクセストークン期限管理**: `expiresAt = Date.now() + expires_in*1000 - 60_000`（60 秒の安全マージン）。`AuthContext.refreshIfNeeded` で並行リクエストを Promise でキューイング。
7. **ログアウト**: `end_session_endpoint` に `id_token_hint` と `post_logout_redirect_uri` を付けて WebBrowser で起動 → SecureStore をクリア。WebBrowser のセッションが何らかの理由で失敗してもローカルのトークンは消える設計。
8. **カートとログインの連携**: `customer-account-api:full` スコープで得た `shcat_` access_token を **そのまま** `cartBuyerIdentityUpdate({ buyerIdentity: { customerAccessToken } })` に渡せる（当初プランで懸念したトークン交換は不要だった）。
9. **カートマージ**: `CartContext` の `useEffect` がログイン状態と `cart.buyerIdentity.customer` の欠如を検知して、自動で `cartBuyerIdentityUpdate` を発行。
10. **エラー正規化**: `customer.ts` の `request` ラッパーで `HTTP {status} | gql=... | message` の形式に整形してから throw。

### **[追加]** 住所まわりの実装メモ

実装した順序と背景:
1. `customerAddressCreate` mutation を queries.ts に追加。
2. `AddressForm` の `initial` prop をオプショナル化（新規作成モード対応）。
3. `app/account/addresses/new.tsx` を作成。Expo Router の優先順位（静的 > 動的）により `[id].tsx` と共存可能。
4. **複数住所への対応**: 1 件目は自動で `defaultAddress: true`、2 件目以降は `null` を送る。
   ```ts
   const isFirstAddress = (customer?.addresses.edges.length ?? 0) === 0;
   ```
   （Shopify は customer に少なくとも 1 つの default address が無いと、カート/チェックアウトの prefill が空になる）
5. **キーボード対応**: 当初は普通の `View` に並べていたが、市区町村以降がキーボードで隠れた。`KeyboardAvoidingView` (`behavior="padding"`, `keyboardVerticalOffset={96}`) + `ScrollView` (`keyboardShouldPersistTaps="handled"`, `paddingBottom: 96`) でスクロール可能に。
6. **`zoneCode`（都道府県）**: Shopify が必須項目として要求。`ISO 3166-2:JP` の `JP-01`〜`JP-47` を `lib/constants/prefectures.ts` で定義し、`PrefecturePicker` (Modal + FlatList、純 JS) で選択 UI を提供。`territoryCode` は `"JP"` でハードコード（日本専売のため）。
7. 編集画面 `[id].tsx` も同じ `AddressForm` を流用し、`zoneCode` を mutation に流す。

### Critical files（実装で必ず触った）

- [app.json](../app.json)
- [lib/auth/oauth.ts](../lib/auth/oauth.ts)
- [lib/auth/AuthContext.tsx](../lib/auth/AuthContext.tsx)
- [lib/shopify/customer.ts](../lib/shopify/customer.ts)
- [lib/shopify/storefront.ts](../lib/shopify/storefront.ts)
- [lib/cart/CartContext.tsx](../lib/cart/CartContext.tsx)
- [lib/theme.ts](../lib/theme.ts) — [追加]
- [components/PrefecturePicker.tsx](../components/PrefecturePicker.tsx) — [追加]
- [components/AddressForm.tsx](../components/AddressForm.tsx)
- [app/account/addresses/new.tsx](../app/account/addresses/new.tsx) — [追加]

---

## Phase 4 — 動作検証（実施結果）

| # | 機能 | 結果 |
|---|------|------|
| 1 | Xcode → iPhone 直接ビルドで起動 | ✅ |
| 2 | 商品一覧表示・検索ボックスでの絞り込み | ✅ |
| 3 | 商品詳細 → カート追加 → カート画面で表示・数量変更・削除 | ✅ |
| 4 | OAuth ログイン（`shop.{shop_id}.app://callback`）→ `/account` でプロファイル表示 | ✅ |
| 5 | プロファイル編集（firstName / lastName） | ✅ |
| 6 | 住所編集（既存 1 件目の更新） | ✅ |
| 7 | **住所新規追加（[追加]）** — ピッカーで都道府県選択 → 保存 → 一覧に反映 | ✅ |
| 8 | トークン自動リフレッシュ（並行リクエスト含む） | ✅ |
| 9 | ログイン後のカート引き継ぎ（`buyerIdentity.customer` リンク） | ✅ |
| 10 | ログアウト後の SecureStore クリア + `/login` ガード | ✅ |

---

## 残課題 / 将来作業

- NativeWind / Tailwind の依存を `package.json` から削除（現状未使用）
- 国際化対応（現状は日本専売前提で `territoryCode = "JP"` 固定、`zoneCode` も日本のみ）
- 住所削除 UI（`customerAddressDelete` mutation の追加）
- デフォルト住所の切り替え UI（現状は 1 件目だけ自動 default）
- Android Studio での Android ネイティブビルド検証（現状は iPhone のみ確認）
- `zoneCode` のフォーマット検証（`JP-13` で動いているが、Shopify 側の仕様変更で `"13"` を要求するケースがあれば対応）

---

参考ドキュメント:
- [Customer Account API リファレンス](https://shopify.dev/docs/api/customer/latest)
- [Customer Account API 認証フロー](https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api/authenticate-customers)
- [Storefront API リファレンス](https://shopify.dev/docs/api/storefront/latest)
- [Hydrogen の Customer Account クライアント実装](https://github.com/Shopify/hydrogen/blob/main/packages/hydrogen/src/customer/customer.ts) — `Authorization` ヘッダの Bearer なし扱いの根拠
- [ISO 3166-2:JP](https://ja.wikipedia.org/wiki/ISO_3166-2:JP)
- [Expo SDK 54 — Documentation](https://docs.expo.dev/versions/v54.0.0/)
