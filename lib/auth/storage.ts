import * as SecureStore from "expo-secure-store";

const KEYS = {
  accessToken: "shopify_access_token",
  refreshToken: "shopify_refresh_token",
  idToken: "shopify_id_token",
  expiresAt: "shopify_expires_at",
  cartId: "shopify_cart_id",
} as const;

export type TokenSet = {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number;
};

export const saveTokens = async (tokens: TokenSet): Promise<void> => {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.accessToken, tokens.accessToken),
    SecureStore.setItemAsync(KEYS.refreshToken, tokens.refreshToken),
    SecureStore.setItemAsync(KEYS.idToken, tokens.idToken),
    SecureStore.setItemAsync(KEYS.expiresAt, String(tokens.expiresAt)),
  ]);
};

export const loadTokens = async (): Promise<TokenSet | null> => {
  const [accessToken, refreshToken, idToken, expiresAtStr] = await Promise.all([
    SecureStore.getItemAsync(KEYS.accessToken),
    SecureStore.getItemAsync(KEYS.refreshToken),
    SecureStore.getItemAsync(KEYS.idToken),
    SecureStore.getItemAsync(KEYS.expiresAt),
  ]);
  if (!accessToken || !refreshToken || !idToken || !expiresAtStr) return null;
  return {
    accessToken,
    refreshToken,
    idToken,
    expiresAt: Number(expiresAtStr),
  };
};

export const clearTokens = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.accessToken),
    SecureStore.deleteItemAsync(KEYS.refreshToken),
    SecureStore.deleteItemAsync(KEYS.idToken),
    SecureStore.deleteItemAsync(KEYS.expiresAt),
  ]);
};

export const saveCartId = (id: string) =>
  SecureStore.setItemAsync(KEYS.cartId, id);
export const loadCartId = () => SecureStore.getItemAsync(KEYS.cartId);
export const clearCartId = () => SecureStore.deleteItemAsync(KEYS.cartId);
