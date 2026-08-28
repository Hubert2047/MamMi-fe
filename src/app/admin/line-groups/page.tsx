'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { RefreshCw, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/auth'
import { useI18n } from '@/lib/i18n'
import { useStoreContext } from '@/lib/store-context'
import { deleteLineGroup, getLineGroups, testLineGroup, updateLineGroup, type LineGroup, type LineNotificationType } from '@/api/line-group'

const notificationOptions: { value: LineNotificationType; label: string }[] = [{ value: 'daily_closing', label: 'lineNotificationDailyClosing' }]

export default function LineGroupsPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { stores } = useStoreContext()
  const client = useQueryClient()
  const [drafts, setDrafts] = useState<Record<string, Partial<LineGroup>>>({})
  const { data: groups = [], isLoading, isFetching, refetch } = useQuery({ queryKey: ['line-groups'], queryFn: getLineGroups })
  const save = useMutation({ mutationFn: updateLineGroup, onSuccess: () => { void client.invalidateQueries({ queryKey: ['line-groups'] }) } })
  const remove = useMutation({ mutationFn: deleteLineGroup, onSuccess: () => { void client.invalidateQueries({ queryKey: ['line-groups'] }) } })
  const test = useMutation({ mutationFn: testLineGroup, onSuccess: () => toast.success(t('lineGroupTestSuccess')), onError: () => toast.error(t('lineGroupTestError')) })
  const isSuperAdmin = user?.role === 'SuperAdmin'
  const draft = (group: LineGroup) => ({ ...group, ...drafts[group._id] })
  const setDraft = (group: LineGroup, value: Partial<LineGroup>) => setDrafts((current) => ({ ...current, [group._id]: { ...current[group._id], ...value } }))

  return <div className='flex h-full min-h-0 flex-col gap-6 overflow-auto p-4 md:p-6 lg:p-8'>
    <div className='flex items-center justify-between gap-3'><h1 className='text-3xl font-bold'>{t('lineGroups')}</h1><Button size='sm' variant='outline' disabled={isFetching} onClick={() => void refetch()}><RefreshCw className={isFetching ? 'size-4 animate-spin' : 'size-4'} />{t('lineGroupsRefresh')}</Button></div>
    <div className='space-y-3'>
      {isLoading ? <div className='text-sm text-muted-foreground'>{t('loading')}</div> : groups.length === 0 ? <div className='text-sm text-muted-foreground'>{t('lineGroupsEmpty')}</div> : groups.map((group) => {
        const value = draft(group)
        const types = value.notificationTypes || []
        return <div key={group._id} className='relative rounded-lg border p-3 pt-9'>
          <span className='absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground'>{t(`lineGroupStatus_${value.status || group.status}`)}</span>
          <div className='space-y-2'>
            <div className='grid min-w-0 gap-2 sm:grid-cols-2'>
              <div className='min-w-0'><div className='mb-1 text-[11px] text-muted-foreground'>{t('lineGroupId')}</div><div className='truncate font-mono text-xs' title={group.lineGroupId}>{group.lineGroupId}</div></div>
              <div><div className='mb-1 text-[11px] text-muted-foreground'>{t('lineGroupName')}</div><Input className='h-9' value={value.name || ''} onChange={(e) => setDraft(group, { name: e.target.value })} /></div>
            </div>
            <div className='grid gap-2 sm:grid-cols-2'>
              {isSuperAdmin ? <div><div className='mb-1 text-[11px] text-muted-foreground'>{t('store')}</div><Select value={value.storeId || 'unassigned'} onValueChange={(storeId) => setDraft(group, { storeId: storeId === 'unassigned' ? null : storeId })}><SelectTrigger className='h-9'><SelectValue /></SelectTrigger><SelectContent><SelectItem value='unassigned'>{t('lineGroupUnassigned')}</SelectItem>{stores.map((store) => <SelectItem key={store._id} value={store._id}>{store.name}</SelectItem>)}</SelectContent></Select></div> : null}
              <div><div className='mb-1 text-[11px] text-muted-foreground'>{t('lineGroupNotificationType')}</div><Select value={types[0] || 'none'} onValueChange={(type) => setDraft(group, { notificationTypes: type === 'none' ? [] : [type as LineNotificationType] })}><SelectTrigger className='h-9'><SelectValue /></SelectTrigger><SelectContent><SelectItem value='none'>{t('lineGroupNoNotification')}</SelectItem>{notificationOptions.map((option) => <SelectItem key={option.value} value={option.value}>{t(option.label)}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
          <div className='mt-2 flex flex-wrap items-center justify-end gap-2'>
            <div className='flex items-center gap-2'>
              <label className='flex items-center gap-2 whitespace-nowrap text-xs'><Checkbox checked={value.enabled === true} onCheckedChange={(enabled) => setDraft(group, { enabled: enabled === true })} />{t('lineGroupEnabled')}</label>
              <AlertDialog><AlertDialogTrigger asChild><Button size='sm' className='h-9' disabled={test.isPending}>{t('lineGroupTest')}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('lineGroupTestConfirmTitle')}</AlertDialogTitle><AlertDialogDescription>{t('lineGroupTestConfirmDescription')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction disabled={test.isPending} onClick={() => test.mutate(group._id)}>{t('confirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><AlertDialog><AlertDialogTrigger asChild><Button size='sm' className='h-9' disabled={save.isPending}>{t('save')}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('lineGroupSaveConfirmTitle')}</AlertDialogTitle><AlertDialogDescription>{t('lineGroupSaveConfirmDescription')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction disabled={save.isPending} onClick={() => save.mutate({ id: group._id, data: { name: value.name, storeId: value.storeId, enabled: value.enabled, notificationTypes: types } })}>{t('confirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><AlertDialog><AlertDialogTrigger asChild><Button size='sm' className='h-9' variant='destructive' disabled={remove.isPending}><Trash2 className='mr-1 size-4' />{t('delete')}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle><AlertDialogDescription>{t('confirmDeleteLineGroup')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction variant='destructive' onClick={() => remove.mutate(group._id)}>{t('confirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
            </div>
          </div>
        </div>
      })}
    </div>
  </div>
}
