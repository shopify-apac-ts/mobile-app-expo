import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { config, callbackUri } from "../shopify/config";
import { getOidcDiscovery } from "../shopify/discovery";
import type { TokenSet } from "./storage";

// With the `customer-account-api:full` scope and a shop-id-scoped token endpoint,
// the OAuth access_token is already a Customer Account API `shcat_` token —
// no RFC 8693 token-exchange step is required (and this store's discovery does
// not advertise the token-exchange grant in `grant_types_supported` anyway).
const SCOPES = "openid email customer-account-api:full";

export class AuthCancelledError extends Error {
  constructor() {
    super("Authorization cancelled by user");
    this.name = "AuthCancelledError";
  }
}

const base64urlEncode = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return (
    (typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64"))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  );
};

const generateCodeVerifier = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return base64urlEncode(randomBytes);
};

const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const digestHex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
  const bytes = new Uint8Array(digestHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(digestHex.substring(i * 2, i * 2 + 2), 16);
  }
  return base64urlEncode(bytes);
};

const generateState = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  return base64urlEncode(randomBytes);
};

// `fallbackIdToken` keeps the previous id_token when Shopify omits it from
// a refresh_token grant response (OIDC providers typically only return
// id_token on the initial authorization_code exchange).
const buildTokenSet = (
  oauth: {
    access_token: string;
    refresh_token: string;
    id_token?: string;
    expires_in: number;
  },
  fallbackIdToken?: string
): TokenSet => {
  const idToken = oauth.id_token ?? fallbackIdToken;
  if (!idToken) {
    throw new Error("Missing id_token in token response");
  }
  return {
    accessToken: oauth.access_token,
    refreshToken: oauth.refresh_token,
    idToken,
    expiresAt: Date.now() + oauth.expires_in * 1000 - 60_000,
  };
};

export const startAuthorize = async (): Promise<TokenSet> => {
  const discovery = await getOidcDiscovery();
  const codeVerifier = await generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = await generateState();
  const nonce = await generateState();

  const authUrl = new URL(discovery.authorization_endpoint);
  authUrl.searchParams.set("client_id", config.customerAccountClientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", callbackUri());
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("nonce", nonce);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  const result = await WebBrowser.openAuthSessionAsync(
    authUrl.toString(),
    callbackUri()
  );

  if (result.type === "cancel" || result.type === "dismiss") {
    throw new AuthCancelledError();
  }
  if (result.type !== "success" || !result.url) {
    throw new Error(`Authorization failed: ${result.type}`);
  }

  const returnUrl = new URL(result.url);
  const returnedState = returnUrl.searchParams.get("state");
  const code = returnUrl.searchParams.get("code");
  const errorParam = returnUrl.searchParams.get("error");
  if (errorParam) {
    throw new Error(`OAuth error: ${errorParam}`);
  }
  if (!code) throw new Error("Missing authorization code");
  if (returnedState !== state) throw new Error("State mismatch");

  const tokenRes = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Origin: `https://shop.${config.shopId}.app`,
      "User-Agent": `DevNobuBeerStore/1.0 (Mobile)`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.customerAccountClientId,
      redirect_uri: callbackUri(),
      code,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Token exchange failed: ${tokenRes.status} ${text}`);
  }
  const data = await tokenRes.json();
  return buildTokenSet(data);
};

export const refreshAccessToken = async (
  refreshToken: string,
  currentIdToken: string
): Promise<TokenSet> => {
  const discovery = await getOidcDiscovery();
  const tokenRes = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Origin: `https://shop.${config.shopId}.app`,
      "User-Agent": `DevNobuBeerStore/1.0 (Mobile)`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: config.customerAccountClientId,
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Token refresh failed: ${tokenRes.status} ${text}`);
  }
  const data = await tokenRes.json();
  return buildTokenSet(data, currentIdToken);
};

export const logout = async (idToken: string): Promise<void> => {
  const discovery = await getOidcDiscovery();
  const logoutUrl = new URL(discovery.end_session_endpoint);
  logoutUrl.searchParams.set("id_token_hint", idToken);
  logoutUrl.searchParams.set("post_logout_redirect_uri", callbackUri());

  try {
    await WebBrowser.openAuthSessionAsync(logoutUrl.toString(), callbackUri());
  } catch {
    // Best-effort. Silent failure is OK because we'll clear local tokens regardless.
  }
};
