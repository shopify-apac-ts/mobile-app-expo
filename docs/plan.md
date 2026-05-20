# Shopify ストア × Expo モバイルアプリ MVP 構築プラン

## Context

`dev-nobu-beer-store.myshopify.com` に接続する iOS / Android アプリを React Native / Expo で新規構築する。作業ディレクトリ `/Users/nobu/dev/shopify/mobile/mobile-app-expo` は現状空。

**MVP スコープ**:
1. Customer Account API（OAuth 2.0 + PKCE、Public/Mobile クライアント）でログイン
2. ログイン状態（未ログイン / ログイン中）をアプリ全体で表示
3. ログイン顧客は、プロファイル閲覧と、氏名・住所の編集が可能
4. トップページで全商品の閲覧・キーワード検索・カート追加
5. Storefront Cart API でカート作成・商品追加・変更・削除

**アーキテクチャ（ユーザー予想どおり 2 つのコンポーネント）**:
- **Shopify 側**: Headless チャンネルをインストールし、Storefront API のパブリックトークンと、Customer Account API の Public/Mobile クライアントを設定。
- **Expo アプリ側**: Storefront API（パブリックトークン、商品・カート）と Customer Account API（OAuth トークン、顧客データ）の 2 系統 GraphQL クライアントを使い分ける。

**確定した技術選定**: TypeScript / Expo Router / TanStack Query + graphql-request / NativeWind / expo-auth-session + expo-secure-store。

---

## Phase 1 — Shopify ストア側のセットアップ（管理画面で実施）

実装前に手作業で完了させる。後続フェーズはここで取得した値（`shop_id`、`client_id`、Storefront パブリックトークン）に依存する。

1. **Customer Accounts を有効化**: Settings → Customer accounts → "New customer accounts" を有効化。
2. **Headless チャンネルをインストール**: App Store から Headless チャンネルを追加し、ストアフロントを 1 つ作成（例: "mobile-app"）。
3. **Storefront API トークン**: Headless → 該当ストアフロント → Storefront API → "Public access token" を発行。商品閲覧と Cart 操作に必要な scopes を有効化（`unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory`, `unauthenticated_write_checkouts`, `unauthenticated_read_checkouts` など）。
4. **Customer Account API クライアント作成**:
   - クライアントタイプを **Public**（モバイル）に設定。
   - **Callback URI** にカスタムスキームを登録: `shop.{shop_id}.app://callback`（`shop.{shop_id}.*` 形式は Shopify 必須。`.app` の部分は自由命名で、`app.json` の scheme と完全一致させる）。
   - **Javascript Origin** にも同じスキーム値（または任意のオリジン値）を登録。これがないとトークンエンドポイントが `invalid_token` で 401 を返す。
   - Scopes: `openid email customer-account-api:full`。
5. **`shop_id` の取得**: Customer Account API の設定ページに client_id と並んで表示される（discovery エンドポイントには含まれない）。控えておく。

---

## Phase 2 — Expo プロジェクト初期化

```
cd /Users/nobu/dev/shopify/mobile/mobile-app-expo
npx create-expo-app@latest . --template default        # TypeScript + expo-router 構成
npx expo install expo-auth-session expo-crypto expo-web-browser expo-secure-store expo-linking expo-dev-client
npm i @tanstack/react-query graphql-request graphql
npm i -D nativewind tailwindcss@^3.4 @types/react
npx tailwindcss init
```

### 設定ファイル

- **`app.json`** (重要キーのみ)
  - `expo.scheme`: `"shop.{shop_id}.app"` ← Customer Account API に登録したスキーム値と完全一致
  - `expo.ios.bundleIdentifier`, `expo.android.package`: 任意の reverse-DNS
  - `expo.plugins`: `["expo-router", "expo-secure-store"]`
- **`.env.local`** (Expo public 変数。バイナリに埋め込まれてよい値のみ)
  - `EXPO_PUBLIC_SHOP_DOMAIN=dev-nobu-beer-store.myshopify.com`
  - `EXPO_PUBLIC_SHOP_ID=...`
  - `EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID=...`
  - `EXPO_PUBLIC_STOREFRONT_TOKEN=...`（パブリックトークンなので埋め込み OK）
- **`tailwind.config.js` / `babel.config.js`**: NativeWind v4 公式手順どおりに configure（`babel-preset-expo`、`nativewind/babel`、`metro.config.js` でのトランスフォーマー指定）。
- **`global.d.ts`**: `import "nativewind/types"` で `className` の型を有効化。

### 重要: Expo Go では動作しない

`shop.{shop_id}.*` カスタムスキームは `app.json` 経由でネイティブビルドに組み込む必要があるため、Expo Go は使えない。最初から `expo-dev-client` で開発ビルドを作る。

```
eas build --profile development --platform ios    # 初回のみ
eas build --profile development --platform android
```

---

## Phase 3 — ディレクトリ構造と実装

```
app/
  _layout.tsx              QueryClientProvider, AuthProvider, CartProvider, Linking handler
  index.tsx                商品一覧 + 検索バー（top page）
  product/[handle].tsx     商品詳細 + 数量選択 + Add to cart
  cart.tsx                 カート閲覧、数量変更、削除、checkout URL 起動
  login.tsx                ログイン誘導画面 + ログアウトボタン
  account/
    _layout.tsx            未ログインなら /login にリダイレクトするガード
    index.tsx              プロファイル表示（名前・メール・住所一覧）
    edit.tsx               firstName / lastName 編集
    addresses/[id].tsx     住所編集フォーム
lib/
  shopify/
    storefront.ts          graphql-request クライアント（Storefront、X-Shopify-Storefront-Access-Token）
    customer.ts            graphql-request クライアント（Customer Account、Bearer + Origin + User-Agent ヘッダ、401 retry インターセプタ）
    discovery.ts           /.well-known/openid-configuration と /.well-known/customer-account-api を起動時に取得・キャッシュ
    queries.ts             GraphQL 定義（products, search, cart*, customer, customerUpdate, customerAddressUpdate, cartBuyerIdentityUpdate）
    types.ts               (codegen で生成しても良い)
  auth/
    oauth.ts               PKCE 実装: code_verifier / code_challenge 生成（expo-crypto.getRandomBytesAsync + SHA-256 + base64url）、authorize URL 構築、exchangeCodeAsync、refreshAsync
    AuthContext.tsx        accessToken / refreshToken / idToken / expiresAt 状態管理。login(), logout(), refreshIfNeeded() を公開
    storage.ts             expo-secure-store ラッパー
  cart/
    CartContext.tsx        cart_id を SecureStore 永続化、useCart() フック公開、ログイン時に cartBuyerIdentityUpdate でマージ
components/
  ProductCard.tsx, ProductList.tsx, SearchBar.tsx, CartLineItem.tsx, AddressForm.tsx, ProfileForm.tsx, LoginStatusBadge.tsx
```

### 実装上の重要ポイント（Plan エージェント検証の反映）

1. **Discovery を 2 つ叩く**: OAuth 関連は `https://{shop_domain}/.well-known/openid-configuration`、Customer Account GraphQL エンドポイントは `https://{shop_domain}/.well-known/customer-account-api`（別ドキュメント）。起動時に両方を取得してメモリにキャッシュ。
2. **必須ヘッダ**: Customer Account API へのリクエストには `Authorization: Bearer <access_token>`、`Origin: <Javascript Origin に登録した値>`、`User-Agent: <任意の識別子>` をすべて付与する。欠けると 401/403。
3. **PKCE 実装**:
   - `code_verifier`: `expo-crypto.getRandomBytesAsync(32)` → base64url（`Math.random` は使わない）。
   - `code_challenge`: SHA-256 を base64url、末尾 `=` 除去・`+`→`-`・`/`→`_`。
   - `expo-auth-session` の `useAuthRequest({ usePKCE: true, ... })` を使えば内部で処理されるが、ヘッダ要件があるためトークン交換は手書きで `fetch` する方が確実。
4. **リフレッシュトークンはローテーション**: トークンエンドポイントは毎回新しい `refresh_token` を返す。SecureStore に上書き保存。古いものを再利用すると `invalid_grant`。
5. **アクセストークン期限管理**: `expiresAt = Date.now() + expires_in*1000 - 60_000`（60 秒の安全マージン）。`customer.ts` クライアントの request 前にチェックして自動 refresh。並行リクエスト対策として進行中の refresh を Promise でキューイング。
6. **401 リトライインターセプタ**: refresh 後に元リクエストを 1 回だけリトライ。
7. **ログアウト**: `end_session_endpoint` に `id_token_hint`（保存済み）と `post_logout_redirect_uri` を付けて WebBrowser で起動し、完了後に SecureStore をクリア。モバイル Public クライアントの場合は 200 OK の API 呼び出しでも可。
8. **カートとログインの連携**: Customer Account API の `access_token` を直接 Storefront Cart の `buyerIdentity` に渡すことはできない。**トークン交換**で Storefront 互換の `customerAccessToken` を取得してから `cartBuyerIdentityUpdate({ customerAccessToken })` を呼ぶ。
9. **カートマージ**: ログイン時、匿名 `cart_id` が既にあれば再作成せず `cartBuyerIdentityUpdate` を発行して引き継ぐ。
10. **GraphQL バージョン固定**: 両 API ともリクエスト URL にバージョン（例 `2025-01`）を明示してピンする。
11. **エラー正規化**: Storefront は `userErrors` を、Customer Account は `errors`（throttling / cost）+ `userErrors` の両方を返す。共通ハンドラを 1 か所に。

### Critical files（実装で必ず触る）

- [/Users/nobu/dev/shopify/mobile/mobile-app-expo/app.json](mobile-app-expo/app.json)
- [/Users/nobu/dev/shopify/mobile/mobile-app-expo/lib/auth/oauth.ts](mobile-app-expo/lib/auth/oauth.ts)
- [/Users/nobu/dev/shopify/mobile/mobile-app-expo/lib/auth/AuthContext.tsx](mobile-app-expo/lib/auth/AuthContext.tsx)
- [/Users/nobu/dev/shopify/mobile/mobile-app-expo/lib/shopify/customer.ts](mobile-app-expo/lib/shopify/customer.ts)
- [/Users/nobu/dev/shopify/mobile/mobile-app-expo/lib/shopify/storefront.ts](mobile-app-expo/lib/shopify/storefront.ts)
- [/Users/nobu/dev/shopify/mobile/mobile-app-expo/lib/cart/CartContext.tsx](mobile-app-expo/lib/cart/CartContext.tsx)

---

## Phase 4 — 動作検証

各機能を以下の順で確認する。

1. **ビルド起動**: `eas build --profile development` で iOS / Android のいずれかをインストール → `npx expo start --dev-client` で接続。
2. **商品閲覧と検索**: `app/index.tsx` を開く → 商品が一覧表示される。検索ボックスに文字入力 → 該当商品のみ表示される。
3. **カート操作**: 商品詳細から「Add to cart」→ `/cart` で表示される。数量変更・削除・カート合計の再計算を確認。
4. **OAuth ログイン**: `/login` から「Login」→ Shopify ホスト型ログイン画面がブラウザで開く → 認証完了後にアプリへ戻り、`/account` でプロファイル表示。SecureStore に `accessToken`, `refreshToken`, `idToken` が保存されていることを確認。
5. **プロファイル編集**: `/account/edit` で firstName / lastName を変更 → mutation 成功 → 再取得で反映確認。
6. **住所編集**: `/account/addresses/[id]` で住所更新 → 反映確認。
7. **トークンリフレッシュ**: `expiresAt` を強制的に過去にして再リクエスト → 自動 refresh → 元リクエスト成功を確認。`refreshToken` が SecureStore で更新されていることも確認。
8. **ログイン後カート引き継ぎ**: 未ログインでカートに 1 件追加 → ログイン → `cart.buyerIdentity.customer` が紐づくことを確認。
9. **ログアウト**: ログアウト後 SecureStore がクリアされ、`/account` がガードで `/login` に飛ばされることを確認。

参考ドキュメント:
- [Customer Account API リファレンス](https://shopify.dev/docs/api/customer/latest)
- [Customer Account API 認証フロー](https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api/authenticate-customers)
- [Storefront API リファレンス](https://shopify.dev/docs/api/storefront/latest)
- [cartLinesRemove ほか Cart mutations](https://shopify.dev/docs/api/storefront/latest/mutations/cartLinesRemove)
- [Expo AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/)
