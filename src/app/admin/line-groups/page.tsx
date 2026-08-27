'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/auth'
import { useI18n } from '@/lib/i18n'
import { useStoreContext } from '@/lib/store-context'
import { getLineGroups, updateLineGroup, type LineGroup, type LineNotificationType } from '@/api/line-group'

const notificationOptions: { value: LineNotificationType; label: string }[] = [
  { value: 'daily_closing', label: 'lineNotificationDailyClosing' },
]

export default function LineGroupsPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { stores } = useStoreContext()
  const client = useQueryClient()
  const [drafts, setDrafts] = useState<Record<string, Partial<LineGroup>>>({})
  const { data: groups = [], isLoading } = useQuery({ queryKey: ['line-groups'], queryFn: getLineGroups })
  const save = useMutation({ mutationFn: updateLineGroup, onSuccess: () => { void client.invalidateQueries({ queryKey: ['line-groups'] }) } })
  const isSuperAdmin = user?.role === 'SuperAdmin'
  const draft = (group: LineGroup) => ({ ...group, ...drafts[group._id] })
  const setDraft = (group: LineGroup, value: Partial<LineGroup>) => setDrafts((current) => ({ ...current, [group._id]: { ...current[group._id], ...value } }))

  return <div className='flex h-full min-h-0 flex-col gap-6 overflow-auto p-4 md:p-6 lg:p-8'>
    <div><h1 className='text-3xl font-bold'>{t('lineGroups')}</h1><p className='mt-1 text-sm text-muted-foreground'>{t('lineGroupsHint')}</p></div>
    <Card><CardHeader><CardTitle>{t('lineGroups')}</CardTitle><CardDescription>{t('lineGroupsAdminHint')}</CardDescription></CardHeader><CardContent className='space-y-3'>
      {isLoading ? <div className='text-sm text-muted-foreground'>{t('loading')}</div> : groups.length === 0 ? <div className='text-sm text-muted-foreground'>{t('lineGroupsEmpty')}</div> : groups.map((group) => {
        const value = draft(group)
        const types = value.notificationTypes || []
        return <div key={group._id} className='space-y-3 rounded-lg border p-4'>
          <div className='grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(180px,.7fr)_auto] lg:items-end'>
            <div><div className='mb-1 text-xs text-muted-foreground'>{t('lineGroupId')}</div><div className='break-all font-mono text-xs'>{group.lineGroupId}</div></div>
            <div><div className='mb-1 text-xs text-muted-foreground'>{t('lineGroupName')}</div><Input value={value.name || ''} onChange={(e) => setDraft(group, { name: e.target.value })} /></div>
            {isSuperAdmin ? <div><div className='mb-1 text-xs text-muted-foreground'>{t('store')}</div><Select value={value.storeId || 'unassigned'} onValueChange={(storeId) => setDraft(group, { storeId: storeId === 'unassigned' ? null : storeId })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='unassigned'>{t('lineGroupUnassigned')}</SelectItem>{stores.map((store) => <SelectItem key={store._id} value={store._id}>{store.name}</SelectItem>)}</SelectContent></Select></div> : null}
          </div>
          <div className='flex flex-wrap gap-4'>
            {notificationOptions.map((option) => <label key={option.value} className='flex items-center gap-2 text-sm'><Checkbox checked={types.includes(option.value)} onCheckedChange={(checked) => setDraft(group, { notificationTypes: checked ? [...types, option.value] : types.filter((type) => type !== option.value) })} />{t(option.label)}</label>)}
            <label className='flex items-center gap-2 text-sm'><Checkbox checked={value.enabled === true} onCheckedChange={(enabled) => setDraft(group, { enabled: enabled === true })} />{t('lineGroupEnabled')}</label>
          </div>
          <div className='flex items-center gap-3'><span className='text-xs text-muted-foreground'>{t(`lineGroupStatus_${value.status || group.status}`)}</span><Button size='sm' disabled={save.isPending} onClick={() => save.mutate({ id: group._id, data: { name: value.name, storeId: value.storeId, enabled: value.enabled, notificationTypes: types } })}>{t('save')}</Button></div>
        </div>
      })}
    </CardContent></Card>
  </div>
}
