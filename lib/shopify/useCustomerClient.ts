import { useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { createCustomerClient } from "./customer";

export const useCustomerClient = () => {
  const { getAccessToken } = useAuth();
  return useMemo(() => createCustomerClient(getAccessToken), [getAccessToken]);
};
