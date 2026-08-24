'use client'

import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { Copy, Download, Loader2, QrCode } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createStoreTable, getStoreTables, type StoreTable } from '@/api/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n'

const orderWebBaseUrl = (process.env.NEXT_PUBLIC_ORDER_WEB_URL || 'http://localhost:3001').replace(/\/$/, '')
const qrUrlFor = (table: StoreTable) => `${orderWebBaseUrl}/q/${table.qrToken}`

export default function TablesPanel() {
  const { t } = useI18n(); const client = useQueryClient(); const [code, setCode] = useState(''); const [name, setName] = useState(''); const [images, setImages] = useState<Record<string, string>>({})
  const { data: tables = [], isLoading } = useQuery({ queryKey: ['store-tables'], queryFn: getStoreTables })
  const create = useMutation({ mutationFn: createStoreTable, onSuccess: () => { void client.invalidateQueries({ queryKey: ['store-tables'] }); setCode(''); setName(''); toast.success(t('tableCreateSuccess')) }, onError: () => toast.error(t('tableCreateFailure')) })
  const urls = useMemo(() => tables.map((table) => [table._id, qrUrlFor(table)] as const), [tables])
  useEffect(() => { let active = true; void Promise.all(urls.map(async ([id, url]) => [id, await QRCode.toDataURL(url, { width: 360, margin: 1, errorCorrectionLevel: 'M' })] as const)).then((result) => { if (active) setImages(Object.fromEntries(result)) }).catch(() => active && toast.error(t('tableQrFailure'))); return () => { active = false } }, [t, urls])
  const copyUrl = async (table: StoreTable) => { try { await navigator.clipboard.writeText(qrUrlFor(table)); toast.success(t('tableCopySuccess')) } catch { toast.error(t('tableCopyFailure')) } }
  return <div className="flex h-full min-h-0 flex-col gap-6 overflow-auto p-6 md:p-8"><div><h1 className="text-3xl font-bold tracking-tight">{t('tables')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('tablesDescription')}</p></div><Card><CardHeader><CardTitle>{t('tableCreate')}</CardTitle></CardHeader><CardContent><form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); create.mutate({ code, name: name || undefined }) }}><div className="space-y-2"><Label htmlFor="table-code">{t('tableCode')}</Label><Input id="table-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder={t('tableCodePlaceholder')} required /></div><div className="space-y-2"><Label htmlFor="table-name">{t('tableName')}</Label><Input id="table-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={t('tableNamePlaceholder')} /></div><Button type="submit" disabled={create.isPending}>{create.isPending ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}{t('tableCreate')}</Button></form></CardContent></Card><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{isLoading ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" />{t('loading')}</div> : tables.length === 0 ? <Card><CardContent className="p-6 text-sm text-muted-foreground">{t('tableEmpty')}</CardContent></Card> : tables.map((table) => <Card key={table._id} className="overflow-hidden"><CardHeader className="pb-2"><CardTitle className="flex items-center justify-between gap-3"><span>{table.name}</span><span className="rounded bg-muted px-2 py-1 text-sm">{t('tableCode')} {table.code}</span></CardTitle></CardHeader><CardContent className="space-y-3"><div className="mx-auto aspect-square max-w-52 rounded-lg border bg-white p-2">{images[table._id] ? <img src={images[table._id]} alt={`${t('tableQrAlt')} ${table.name}`} className="size-full object-contain" /> : <Loader2 className="m-auto size-full max-w-8 animate-spin text-muted-foreground" />}</div><p className="break-all text-xs text-muted-foreground">{qrUrlFor(table)}</p><div className="flex gap-2"><Button className="flex-1" size="sm" variant="outline" onClick={() => void copyUrl(table)}><Copy className="size-4" />{t('tableCopyLink')}</Button>{images[table._id] && <Button asChild className="flex-1" size="sm"><a href={images[table._id]} download={`mammi-table-${table.code}.png`}><Download className="size-4" />{t('tableDownload')}</a></Button>}</div></CardContent></Card>)}</section></div>
}
