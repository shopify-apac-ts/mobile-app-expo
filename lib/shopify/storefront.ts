import { GraphQLClient } from "graphql-request";
import { config, storefrontEndpoint } from "./config";

export const storefrontClient = new GraphQLClient(storefrontEndpoint(), {
  headers: {
    "X-Shopify-Storefront-Access-Token": config.storefrontToken,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
