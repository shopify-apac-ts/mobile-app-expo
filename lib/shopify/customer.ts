import { GraphQLClient } from "graphql-request";
import { config } from "./config";
import { getCustomerApiDiscovery } from "./discovery";

export type GetAccessToken = () => Promise<string | null>;

export const createCustomerClient = (getAccessToken: GetAccessToken) => {
  return {
    request: async <T = unknown>(
      document: string,
      variables?: Record<string, unknown>
    ): Promise<T> => {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Not authenticated");
      }
      const discovery = await getCustomerApiDiscovery();
      // discovery.graphql_api already includes the API version + /graphql suffix.
      const endpoint = discovery.graphql_api;

      const client = new GraphQLClient(endpoint, {
        headers: {
          // Customer Account API expects the raw shcat_ token (no "Bearer " prefix).
          // https://github.com/Shopify/hydrogen/blob/main/packages/hydrogen/src/customer/customer.ts
          Authorization: accessToken,
          "Content-Type": "application/json",
          Accept: "application/json",
          Origin: `https://shop.${config.shopId}.app`,
          "User-Agent": `DevNobuBeerStore/1.0 (Mobile)`,
        },
      });

      try {
        return await client.request<T>(document, variables);
      } catch (e: unknown) {
        const err = e as {
          message?: string;
          response?: { status?: number; errors?: unknown };
        };
        const status = err?.response?.status;
        const gqlErrors = err?.response?.errors;
        const parts: string[] = [];
        if (status !== undefined) parts.push(`HTTP ${status}`);
        if (gqlErrors) parts.push(`gql=${JSON.stringify(gqlErrors)}`);
        if (err?.message) parts.push(err.message);
        throw new Error(parts.join(" | ") || "Customer API request failed");
      }
    },
  };
};

export type CustomerClient = ReturnType<typeof createCustomerClient>;
