export type Money = {
  amount: string;
  currencyCode: string;
};

export type Image = {
  url: string;
  altText: string | null;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  featuredImage: Image | null;
  priceRange: {
    minVariantPrice: Money;
  };
};

export type ProductDetail = Product & {
  images: { edges: { node: Image }[] };
  variants: {
    edges: {
      node: {
        id: string;
        title: string;
        availableForSale: boolean;
        price: Money;
      };
    }[];
  };
};

export type CartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: Money;
    image: Image | null;
    product: {
      id: string;
      handle: string;
      title: string;
    };
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
  };
  buyerIdentity: {
    email: string | null;
    customer: { id: string } | null;
  };
  lines: {
    edges: { node: CartLine }[];
  };
};

export type CustomerAddress = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  zoneCode: string | null;
  zip: string | null;
  territoryCode: string | null;
  phoneNumber: string | null;
  company: string | null;
};

export type Customer = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  emailAddress: { emailAddress: string } | null;
  phoneNumber: { phoneNumber: string } | null;
  defaultAddress: { id: string } | null;
  addresses: {
    edges: { node: CustomerAddress }[];
  };
};
