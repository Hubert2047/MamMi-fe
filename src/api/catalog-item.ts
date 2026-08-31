import api from "./axios";
import type { Item, ItemInput } from "./item";

export const getCatalogItems = async (lang?: string): Promise<Item[]> =>
  (await api.get("catalog-items", { params: lang ? { lang } : {} })).data.data;
export const createCatalogItem = async (data: ItemInput): Promise<Item> =>
  (await api.post("catalog-items", data)).data.data;
export const updateCatalogItem = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<ItemInput>;
}): Promise<Item> => (await api.put(`catalog-items/${id}`, data)).data.data;
export const deleteCatalogItem = async (id: string) =>
  (await api.delete(`catalog-items/${id}`)).data.data;
