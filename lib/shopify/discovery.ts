import { config } from "./config";

export type OidcDiscovery = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint: string;
  jwks_uri: string;
};

export type CustomerApiDiscovery = {
  graphql_api: string;
};

let oidcCache: OidcDiscovery | null = null;
let customerApiCache: CustomerApiDiscovery | null = null;

export const getOidcDiscovery = async (): Promise<OidcDiscovery> => {
  if (oidcCache) return oidcCache;
  const res = await fetch(
    `https://${config.shopDomain}/.well-known/openid-configuration`
  );
  if (!res.ok) {
    throw new Error(`OIDC discovery failed: ${res.status}`);
  }
  oidcCache = await res.json();
  return oidcCache!;
};

export const getCustomerApiDiscovery = async (): Promise<CustomerApiDiscovery> => {
  if (customerApiCache) return customerApiCache;
  const res = await fetch(
    `https://${config.shopDomain}/.well-known/customer-account-api`
  );
  if (!res.ok) {
    throw new Error(`Customer API discovery failed: ${res.status}`);
  }
  customerApiCache = await res.json();
  return customerApiCache!;
};
