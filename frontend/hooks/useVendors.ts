import useSWR from "swr";
import { createVendor as apiCreateVendor, deleteVendor as apiDeleteVendor, getVendors } from "@/lib/api";
import { Vendor } from "@/types/vendor";

type NewVendor = Omit<Vendor, "vendorId" | "createdAt">;

export function useVendors() {
  const {
    data: vendors = [],
    error,
    isLoading,
    mutate,
  } = useSWR<Vendor[]>("vendors", getVendors);

  const create = async (payload: NewVendor): Promise<void> => {
    await apiCreateVendor(payload);

    refresh();
  };

  const remove = async (vendorId: string): Promise<void> => {
    const previous = vendors;

    await mutate(
      (current = []) => current.filter((vendor) => vendor.vendorId !== vendorId),
      false,
    );

    try {
      await apiDeleteVendor(vendorId);
    } catch (error) {
      await mutate(previous, false);
      throw error;
    }
  };

  const refresh = async (): Promise<Vendor[]> => {
    return (await mutate()) ?? [];
  };

  return {
    vendors,
    isLoading,
    error,
    create,
    remove,
    refresh,
  };
}
