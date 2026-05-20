const required = (name: string, value: string | undefined): string => {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
};

export const config = {
  shopDomain: required("EXPO_PUBLIC_SHOP_DOMAIN", process.env.EXPO_PUBLIC_SHOP_DOMAIN),
  shopId: required("EXPO_PUBLIC_SHOP_ID", process.env.EXPO_PUBLIC_SHOP_ID),
  customerAccountClientId: required(
    "EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID",
    process.env.EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID
  ),
  storefrontToken: required(
    "EXPO_PUBLIC_STOREFRONT_TOKEN",
    process.env.EXPO_PUBLIC_STOREFRONT_TOKEN
  ),
  storefrontApiVersion: process.env.EXPO_PUBLIC_STOREFRONT_API_VERSION ?? "2025-01",
};

export const storefrontEndpoint = () =>
  `https://${config.shopDomain}/api/${config.storefrontApiVersion}/graphql.json`;

export const callbackUri = () => `shop.${config.shopId}.app://callback`;
