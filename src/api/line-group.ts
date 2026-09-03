import api from "./axios";

export type LineGroup = {
  _id: string;
  lineGroupId: string;
  storeId?: string | { _id?: string } | null;
  name: string;
  usageStatus: "available" | "assigned";
};

export async function getLineGroups(): Promise<LineGroup[]> {
  return (await api.get("line-groups")).data.data;
}

export async function updateLineGroup({
  id,
  data,
}: {
  id: string;
  data: Partial<
    Pick<LineGroup, "name" | "storeId">
  >;
}): Promise<LineGroup> {
  return (await api.patch(`line-groups/${id}`, data)).data.data;
}

export async function deleteLineGroup(id: string): Promise<void> {
  await api.delete(`line-groups/${id}`);
}

export async function testLineGroup(id: string): Promise<void> {
  await api.post(`line-groups/${id}/test`);
}
