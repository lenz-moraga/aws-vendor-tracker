import { fetchAuthSession } from "aws-amplify/auth";
import { Vendor } from "@/types/vendor";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const getAuthToken = async (): Promise<string> => {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) {
    throw new Error("No active session found. Please log in.");
  }
  return token;
};

export const getVendors = async (): Promise<Vendor[]> => {
  const token = await getAuthToken();
  const response = await fetch(`${BASE_URL}/vendors`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok)
    throw new Error(`Error fetching vendors: ${response.statusText}`);

  return response.json();
};

export const createVendor = async (
  vendor: Omit<Vendor, "vendorId" | "createdAt">,
): Promise<void> => {
  const token = await getAuthToken();
  const response = await fetch(`${BASE_URL}/vendors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(vendor),
  });

  if (!response.ok)
    throw new Error(`Error creating vendor: ${response.statusText}`);
  
};

export const deleteVendor = async (vendorId: string): Promise<void> => {
  const token = await getAuthToken();
  const response = await fetch(`${BASE_URL}/vendors`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ vendorId }),
  });

  if (!response.ok)
    throw new Error(`Error deleting vendor: ${response.statusText}`);
};
