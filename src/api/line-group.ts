import api from './axios'

export type LineNotificationType = 'daily_closing'
export type LineGroup = { _id: string; lineGroupId: string; storeId?: string | null; name: string; status: 'pending' | 'active' | 'disabled'; enabled: boolean; notificationTypes: LineNotificationType[] }

export async function getLineGroups(): Promise<LineGroup[]> {
  return (await api.get('line-groups')).data.data
}

export async function updateLineGroup({ id, data }: { id: string; data: Partial<Pick<LineGroup, 'name' | 'storeId' | 'enabled' | 'notificationTypes'>> }): Promise<LineGroup> {
  return (await api.patch(`line-groups/${id}`, data)).data.data
}
