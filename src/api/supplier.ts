import api from "./axios";

export type Supplier = {
  _id: string;
  storeId: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  note?: string;
  lineGroupId?: string;
  active: boolean;
};
export type SupplierInput = Omit<Supplier, "_id" | "storeId">;
export const getSuppliers = async (): Promise<Supplier[]> =>
  (await api.get("suppliers")).data.data;
export const createSupplier = async (data: SupplierInput): Promise<Supplier> =>
  (await api.post("suppliers", data)).data.data;
export const updateSupplier = async ({
  id,
  data,
}: {
  id: string;
  data: SupplierInput;
}): Promise<Supplier> => (await api.put(`suppliers/${id}`, data)).data.data;
export const deleteSupplier = async (id: string): Promise<void> => {
  await api.delete(`suppliers/${id}`);
};
