import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { storefrontClient } from "../shopify/storefront";
import {
  CART_QUERY,
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_BUYER_IDENTITY_UPDATE_MUTATION,
} from "../shopify/queries";
import type { Cart } from "../shopify/types";
import { saveCartId, loadCartId, clearCartId } from "../auth/storage";
import { useAuth } from "../auth/AuthContext";

type CartContextValue = {
  cart: Cart | null;
  isLoading: boolean;
  addLine: (merchandiseId: string, quantity: number) => Promise<void>;
  updateLine: (lineId: string, quantity: number) => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
  reload: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

type CartResult = { cart: Cart | null };
type CartMutationResult = {
  cart: Cart | null;
  userErrors: { field: string[]; message: string }[];
};

const throwIfErrors = (result: CartMutationResult, label: string): Cart => {
  if (result.userErrors.length) {
    throw new Error(`${label}: ${result.userErrors.map((e) => e.message).join(", ")}`);
  }
  if (!result.cart) throw new Error(`${label}: missing cart`);
  return result.cart;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tokens } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const ensureCart = useCallback(async (): Promise<Cart> => {
    if (cart) return cart;
    const existingId = await loadCartId();
    if (existingId) {
      const res = await storefrontClient.request<CartResult>(CART_QUERY, {
        cartId: existingId,
      });
      if (res.cart) {
        setCart(res.cart);
        return res.cart;
      }
      await clearCartId();
    }
    const res = await storefrontClient.request<{ cartCreate: CartMutationResult }>(
      CART_CREATE_MUTATION,
      { input: {} }
    );
    const newCart = throwIfErrors(res.cartCreate, "cartCreate");
    await saveCartId(newCart.id);
    setCart(newCart);
    return newCart;
  }, [cart]);

  useEffect(() => {
    (async () => {
      try {
        const existingId = await loadCartId();
        if (existingId) {
          const res = await storefrontClient.request<CartResult>(CART_QUERY, {
            cartId: existingId,
          });
          if (res.cart) {
            setCart(res.cart);
          } else {
            await clearCartId();
          }
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!cart || !tokens?.accessToken) return;
    if (cart.buyerIdentity?.customer) return;
    (async () => {
      try {
        const res = await storefrontClient.request<{
          cartBuyerIdentityUpdate: CartMutationResult;
        }>(CART_BUYER_IDENTITY_UPDATE_MUTATION, {
          cartId: cart.id,
          buyerIdentity: {
            customerAccessToken: tokens.accessToken,
          },
        });
        const updated = throwIfErrors(
          res.cartBuyerIdentityUpdate,
          "cartBuyerIdentityUpdate"
        );
        setCart(updated);
      } catch (e) {
        console.warn("Failed to link buyer identity:", e);
      }
    })();
  }, [cart, tokens?.accessToken]);

  const addLine = useCallback(
    async (merchandiseId: string, quantity: number) => {
      const current = await ensureCart();
      const res = await storefrontClient.request<{ cartLinesAdd: CartMutationResult }>(
        CART_LINES_ADD_MUTATION,
        {
          cartId: current.id,
          lines: [{ merchandiseId, quantity }],
        }
      );
      setCart(throwIfErrors(res.cartLinesAdd, "cartLinesAdd"));
    },
    [ensureCart]
  );

  const updateLine = useCallback(
    async (lineId: string, quantity: number) => {
      if (!cart) throw new Error("Cart not initialized");
      const res = await storefrontClient.request<{ cartLinesUpdate: CartMutationResult }>(
        CART_LINES_UPDATE_MUTATION,
        {
          cartId: cart.id,
          lines: [{ id: lineId, quantity }],
        }
      );
      setCart(throwIfErrors(res.cartLinesUpdate, "cartLinesUpdate"));
    },
    [cart]
  );

  const removeLine = useCallback(
    async (lineId: string) => {
      if (!cart) throw new Error("Cart not initialized");
      const res = await storefrontClient.request<{ cartLinesRemove: CartMutationResult }>(
        CART_LINES_REMOVE_MUTATION,
        {
          cartId: cart.id,
          lineIds: [lineId],
        }
      );
      setCart(throwIfErrors(res.cartLinesRemove, "cartLinesRemove"));
    },
    [cart]
  );

  const reload = useCallback(async () => {
    if (!cart) return;
    const res = await storefrontClient.request<CartResult>(CART_QUERY, {
      cartId: cart.id,
    });
    if (res.cart) setCart(res.cart);
  }, [cart]);

  const value = useMemo(
    () => ({ cart, isLoading, addLine, updateLine, removeLine, reload }),
    [cart, isLoading, addLine, updateLine, removeLine, reload]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
