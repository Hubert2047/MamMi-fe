import api from "./axios";

export interface Revenue {
  _id: string;
  name: string;
  price: number;
  paymentMethod: "cash" | "bank_transfer" | "other";
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateOtherRevenue {
  name: string;
  price: number;
  note?: string;
  paymentMethod?: "cash" | "bank_transfer" | "other";
}

export interface IUpdateRevenue extends ICreateOtherRevenue {
  _id: string;
}

export type RevenueRange = { from?: string; to?: string };

export const getRevenues = async (
  range: RevenueRange = {},
): Promise<Revenue[]> => {
  const res = await api.get("other-revenues", {
    params: range,
  });
  return res.data.data;
};

export const createRevenue = async (
  data: ICreateOtherRevenue,
): Promise<Revenue> => {
  return api.post("other-revenues", data);
};

export const updateRevenue = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<IUpdateRevenue>;
}): Promise<IUpdateRevenue> => {
  const res = await api.put(`other-revenues/${id}`, data);
  return res.data.data;
};

export const deleteRevenue = async (id: string) => {
  const res = await api.delete(`revenues/${id}`);
  return res.data;
};
