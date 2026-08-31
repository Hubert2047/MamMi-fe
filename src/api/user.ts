import api from "./axios";

export type ManagedUserRole = "Admin" | "Employee" | "SuperAdmin";
export type ManagedUser = {
  _id: string;
  account: string;
  role: ManagedUserRole;
  active: boolean;
  storeIds: Array<{ _id: string; name: string; code: string } | string>;
  defaultStoreId?: string;
};

export type CreateManagedUserInput = {
  account: string;
  password: string;
  role: ManagedUserRole;
  storeId: string;
};

export const getManagedUsers = async (): Promise<ManagedUser[]> =>
  (await api.get("users")).data.data;
export const createManagedUser = async (data: CreateManagedUserInput) =>
  (await api.post("users", data)).data.data;
export const updateManagedUser = async (
  id: string,
  data: Partial<{
    password: string;
    role: ManagedUserRole;
    storeId: string;
    active: boolean;
  }>,
) => (await api.patch(`users/${id}`, data)).data.data;
