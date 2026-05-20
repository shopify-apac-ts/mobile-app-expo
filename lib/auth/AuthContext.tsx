import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { loadTokens, saveTokens, clearTokens, type TokenSet } from "./storage";
import { startAuthorize, refreshAccessToken, logout as oauthLogout } from "./oauth";

type AuthState = {
  tokens: TokenSet | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type AuthContextValue = AuthState & {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokens, setTokens] = useState<TokenSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshPromise = useRef<Promise<TokenSet> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await loadTokens();
        // Discard legacy tokens from before the shcat_ token-exchange step
        // existed; they would 401 on every Customer Account API call.
        if (stored && !stored.accessToken.startsWith("shcat_")) {
          await clearTokens();
          setTokens(null);
        } else {
          setTokens(stored);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const refreshIfNeeded = useCallback(async (current: TokenSet): Promise<TokenSet> => {
    if (Date.now() < current.expiresAt) return current;
    if (refreshPromise.current) return refreshPromise.current;
    refreshPromise.current = (async () => {
      try {
        const fresh = await refreshAccessToken(current.refreshToken, current.idToken);
        await saveTokens(fresh);
        setTokens(fresh);
        return fresh;
      } catch (e) {
        // Refresh token revoked / expired. Force logout so UI flips back to /login.
        await clearTokens();
        setTokens(null);
        throw e;
      } finally {
        refreshPromise.current = null;
      }
    })();
    return refreshPromise.current;
  }, []);

  const login = useCallback(async () => {
    const fresh = await startAuthorize();
    await saveTokens(fresh);
    setTokens(fresh);
  }, []);

  const logout = useCallback(async () => {
    const idToken = tokens?.idToken;
    setTokens(null);
    await clearTokens();
    if (idToken) {
      await oauthLogout(idToken);
    }
  }, [tokens]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!tokens) return null;
    const fresh = await refreshIfNeeded(tokens);
    return fresh.accessToken;
  }, [tokens, refreshIfNeeded]);

  const value = useMemo<AuthContextValue>(
    () => ({
      tokens,
      isLoading,
      isAuthenticated: !!tokens,
      login,
      logout,
      getAccessToken,
    }),
    [tokens, isLoading, login, logout, getAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
