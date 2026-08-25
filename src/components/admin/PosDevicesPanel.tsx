'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, MonitorSmartphone, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { createPosDevice, createPosDeviceEnrollment, deletePosDevice, deletePosDeviceEnrollment, getPosDevices, reenrollPosDevice, updatePosDevice, type PosDeviceEnrollment } from '@/api/pos-device'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/lib/i18n'

const labels = {
  vi: { title: 'Thiết bị POS', name: 'Tên thiết bị', add: 'Tạo thiết bị', reload: 'Tải lại', role: 'Quyền', connected: 'Đang kết nối', enrolled: 'Đã đăng ký', notEnrolled: 'Chưa đăng ký', code: 'Mã đăng ký', generate: 'Tạo mã mới', removeCode: 'Xóa mã tạm', reenroll: 'Đăng ký lại', revoke: 'Thu hồi', restore: 'Cho phép đăng ký lại', copy: 'Sao chép', copied: 'Đã sao chép mã', expires: 'Hết hạn', empty: 'Chưa có thiết bị POS nào', edit: 'Sửa tên', cancel: 'Hủy', save: 'Lưu' },
  en: { title: 'POS devices', name: 'Device name', add: 'Create device', reload: 'Reload', role: 'Role', connected: 'Connected', enrolled: 'Enrolled', notEnrolled: 'Not enrolled', code: 'Enrollment code', generate: 'Generate new code', removeCode: 'Delete temporary code', reenroll: 'Re-enroll', revoke: 'Revoke', restore: 'Allow re-enrollment', copy: 'Copy', copied: 'Code copied', expires: 'Expires', empty: 'No POS devices yet', edit: 'Rename', cancel: 'Cancel', save: 'Save' },
  'zh-TW': { title: 'POS 裝置', name: '裝置名稱', add: '建立裝置', reload: '重新載入', role: '權限', connected: '已連線', enrolled: '已註冊', notEnrolled: '尚未註冊', code: '註冊代碼', generate: '產生新代碼', removeCode: '刪除暫存代碼', reenroll: '重新註冊', revoke: '撤銷', restore: '允許重新註冊', copy: '複製', copied: '已複製代碼', expires: '到期', empty: '尚無 POS 裝置', edit: '重新命名', cancel: '取消', save: '儲存' },
} as const

export default function PosDevicesPanel() {
  const { locale, t: translate } = useI18n()
  const t = labels[locale]
  const client = useQueryClient()
  const [name, setName] = useState('')
  const [codes, setCodes] = useState<Record<string, PosDeviceEnrollment>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(timer) }, [])
  const refresh = () => { setNow(Date.now()); void client.invalidateQueries({ queryKey: ['pos-devices'] }) }
  const create = useMutation({ mutationFn: createPosDevice, onSuccess: ({ device, enrollment }) => { setCodes((current) => ({ ...current, [device._id]: enrollment })); setName(''); refresh() } })
  const generate = useMutation({ mutationFn: createPosDeviceEnrollment, onSuccess: (enrollment, id) => { setCodes((current) => ({ ...current, [id]: enrollment })); refresh() } })
  const removeCode = useMutation({ mutationFn: deletePosDeviceEnrollment, onSuccess: (_, id) => { setCodes((current) => { const next = { ...current }; delete next[id]; return next }); refresh() } })
  const reenroll = useMutation({ mutationFn: reenrollPosDevice, onSuccess: (enrollment, id) => { setCodes((current) => ({ ...current, [id]: enrollment })); refresh() } })
  const update = useMutation({ mutationFn: updatePosDevice, onSuccess: () => { setEditingId(null); refresh() } })
  const remove = useMutation({ mutationFn: deletePosDevice, onSuccess: (_, id) => { setCodes((current) => { const next = { ...current }; delete next[id]; return next }); refresh() } })
  const { data: devices = [], refetch, isFetching } = useQuery({ queryKey: ['pos-devices'], queryFn: getPosDevices })
  const copy = async (code: string) => { await navigator.clipboard.writeText(code); toast.success(t.copied) }
  const format = (value?: string) => value ? new Intl.DateTimeFormat(locale === 'zh-TW' ? 'zh-TW' : locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '—'

  return <div className='space-y-6'>
    <div className='flex items-center justify-between gap-3'><h1 className='text-3xl font-bold'>{t.title}</h1><Button size='sm' variant='outline' onClick={() => void refetch()} disabled={isFetching}><RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />{t.reload}</Button></div>
    <Card><CardContent className='flex flex-wrap gap-3 p-4'><Input className='max-w-sm' value={name} placeholder={t.name} onChange={(event) => setName(event.target.value)} /><Button disabled={!name.trim() || create.isPending} onClick={() => create.mutate(name)}>{t.add}</Button></CardContent></Card>
    <div className='flex flex-wrap gap-4'>
      {devices.map((device) => {
        const enrollment = device.enrolledAt ? undefined : codes[device._id]
        const editing = editingId === device._id
        const connected = Boolean(device.lastSeenAt && now - new Date(device.lastSeenAt).getTime() <= 2 * 60 * 1000)
        return <Card key={device._id} className='w-fit max-w-full'>
          <CardHeader><CardTitle className='flex items-center gap-2 text-lg'><MonitorSmartphone className='size-5' />{editing ? <Input className='h-8' value={editingName} onChange={(event) => setEditingName(event.target.value)} /> : device.name}</CardTitle></CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <div>{t.role}: {device.role}</div>
            <div>{device.active ? (connected ? t.connected : device.enrolledAt ? `${t.enrolled}: ${format(device.enrolledAt)}` : t.notEnrolled) : t.revoke}</div>
            {enrollment && <div className='rounded border bg-muted p-3'><div className='mb-1 text-xs text-muted-foreground'>{t.code} · {t.expires}: {format(enrollment.expiresAt)}</div><div className='flex items-center justify-between gap-2 font-mono text-base'><span className='break-all'>{enrollment.code}</span><Button size='icon-sm' variant='outline' onClick={() => void copy(enrollment.code)} aria-label={t.copy}><Copy className='size-4' /></Button></div></div>}
            <div className='flex flex-wrap gap-2'>
              {editing ? <><Button size='sm' disabled={!editingName.trim() || update.isPending} onClick={() => update.mutate({ id: device._id, data: { name: editingName } })}>{t.save}</Button><Button size='sm' variant='outline' onClick={() => setEditingId(null)}>{t.cancel}</Button></> : <Button size='sm' variant='outline' onClick={() => { setEditingId(device._id); setEditingName(device.name) }}>{t.edit}</Button>}
              {device.active && <>{!device.enrolledAt ? <Button size='sm' variant='outline' onClick={() => generate.mutate(device._id)}>{t.generate}</Button> : <Button size='sm' variant='outline' onClick={() => reenroll.mutate(device._id)}>{t.reenroll}</Button>}{(device.hasPendingEnrollment || enrollment) && <Button size='sm' variant='outline' onClick={() => removeCode.mutate(device._id)}>{t.removeCode}</Button>}<Button size='sm' variant='destructive' onClick={() => update.mutate({ id: device._id, data: { active: false } })}>{t.revoke}</Button></>}
              {!device.active && <Button size='sm' onClick={() => update.mutate({ id: device._id, data: { active: true } })}>{t.restore}</Button>}
              <AlertDialog><AlertDialogTrigger asChild><Button size='sm' variant='destructive' disabled={remove.isPending}>{translate('posDeviceDelete')}</Button></AlertDialogTrigger><AlertDialogContent className='max-w-sm p-4'><AlertDialogHeader><AlertDialogTitle>{translate('posDeviceDeleteTitle')}</AlertDialogTitle><AlertDialogDescription>{translate('posDeviceDeleteConfirm')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t.cancel}</AlertDialogCancel><AlertDialogAction variant='destructive' onClick={() => remove.mutate(device._id)} disabled={remove.isPending}>{translate('posDeviceDelete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
            </div>
          </CardContent>
        </Card>
      })}
    </div>
    {!devices.length && <p className='text-sm text-muted-foreground'>{t.empty}</p>}
  </div>
}
