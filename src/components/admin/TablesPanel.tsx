'use client'

import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { Copy, Download, Loader2, QrCode, RefreshCw } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createStoreTable, getStoreTables, regenerateAllStoreTableQr, regenerateStoreTableQr, type StoreTable } from '@/api/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n'

const orderWebBaseUrl = (process.env.NEXT_PUBLIC_ORDER_WEB_URL || 'http://localhost:3001').replace(/\/$/, '')
const qrUrlFor = (table: StoreTable) => `${orderWebBaseUrl}/q/${table.qrToken}`
export default function TablesPanel() {
  const { t } = useI18n()
  const client = useQueryClient()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [images, setImages] = useState<Record<string, string>>({})
  const [onlineQrImage, setOnlineQrImage] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(1)
  const { data: tables = [], isLoading } = useQuery({ queryKey: ['store-tables'], queryFn: getStoreTables })
  const refresh = () => client.invalidateQueries({ queryKey: ['store-tables'] })
  const create = useMutation({ mutationFn: createStoreTable, onSuccess: () => { void refresh(); setCode(''); setName(''); toast.success(t('tableCreateSuccess')) }, onError: () => toast.error(t('tableCreateFailure')) })
  const regenerate = useMutation({ mutationFn: regenerateStoreTableQr, onSuccess: () => { void refresh(); toast.success(t('tableQrRegenerateSuccess')) }, onError: () => toast.error(t('tableQrRegenerateFailure')) })
  const regenerateAll = useMutation({ mutationFn: regenerateAllStoreTableQr, onSuccess: (result) => { void refresh(); toast.success(`${t('tableQrRegenerateSuccess')} (${result.count})`) }, onError: () => toast.error(t('tableQrRegenerateFailure')) })
  const sortedTables = useMemo(() => [...tables].sort((a, b) => {
    const aNumber = Number(a.code)
    const bNumber = Number(b.code)
    if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber
    return a.code.localeCompare(b.code, undefined, { numeric: true })
  }), [tables])
  const urls = useMemo(() => tables.map((table) => [table._id, qrUrlFor(table)] as const), [tables])
  useEffect(() => {
    const updatePageSize = () => setPageSize(window.innerWidth >= 1536 ? 4 : window.innerWidth >= 1280 ? 3 : window.innerWidth >= 768 ? 2 : 1)
    updatePageSize()
    window.addEventListener('resize', updatePageSize)
    return () => window.removeEventListener('resize', updatePageSize)
  }, [])
  const totalPages = Math.max(1, Math.ceil(sortedTables.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleTables = useMemo(() => sortedTables.slice((currentPage - 1) * pageSize, currentPage * pageSize), [currentPage, pageSize, sortedTables])
  useEffect(() => { let active = true; void Promise.all(urls.map(async ([id, url]) => [id, await QRCode.toDataURL(url, { width: 360, margin: 1, errorCorrectionLevel: 'M' })] as const)).then((result) => { if (active) setImages(Object.fromEntries(result)) }).catch(() => active && toast.error(t('tableQrFailure'))); return () => { active = false } }, [t, urls])
  useEffect(() => { let active = true; void QRCode.toDataURL(orderWebBaseUrl, { width: 360, margin: 1, errorCorrectionLevel: 'M' }).then((result) => { if (active) setOnlineQrImage(result) }).catch(() => active && toast.error(t('tableQrFailure'))); return () => { active = false } }, [t])
  const copyUrl = async (table: StoreTable) => { try { await navigator.clipboard.writeText(qrUrlFor(table)); toast.success(t('tableCopySuccess')) } catch { toast.error(t('tableCopyFailure')) } }
  const copyOnlineUrl = async () => { try { await navigator.clipboard.writeText(orderWebBaseUrl); toast.success(t('onlineQrCopySuccess')) } catch { toast.error(t('tableCopyFailure')) } }

  return <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4 md:p-6">
    <div className="shrink-0"><h1 className="text-3xl font-bold tracking-tight">{t('tables')}</h1></div>
    <div className="grid shrink-0 gap-3 lg:grid-cols-2"> <Card className="shrink-0"><CardHeader><CardTitle>{t('onlineQrTitle')}</CardTitle><p className="text-sm text-muted-foreground">{t('onlineQrDescription')}</p></CardHeader><CardContent className="flex flex-wrap items-center gap-3"><div className="mx-auto w-fit rounded-md border-2 border-slate-400 bg-white p-2">{onlineQrImage ? <img src={onlineQrImage} alt={t('onlineQrAlt')} className="size-16" /> : <div className="size-16" />}</div><div className="min-w-64 flex-1 space-y-2"><p className="break-all text-sm text-muted-foreground">{orderWebBaseUrl}</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => void copyOnlineUrl()}><Copy className="size-4" />{t('onlineQrCopyLink')}</Button>{onlineQrImage && <Button asChild size="sm"><a href={onlineQrImage} download="mammi-online-order.png"><Download className="size-4" />{t('onlineQrDownload')}</a></Button>}</div></div></CardContent></Card>
    <Card className="shrink-0"><CardHeader className="flex flex-row items-center justify-between gap-3"><CardTitle>{t('tableCreate')}</CardTitle><AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="sm" disabled={regenerateAll.isPending}><RefreshCw className="size-4" />{t('tableQrRegenerateAll')}</Button></AlertDialogTrigger><AlertDialogContent className="max-w-sm p-4"><AlertDialogHeader><AlertDialogTitle>{t('tableQrRegenerateAll')}</AlertDialogTitle><AlertDialogDescription>{t('tableQrRegenerateAllConfirm')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => regenerateAll.mutate()} disabled={regenerateAll.isPending}>{t('confirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></CardHeader><CardContent><form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); create.mutate({ code, name: name || undefined }) }}><div className="space-y-2"><Label htmlFor="table-code">{t('tableCode')}</Label><Input id="table-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder={t('tableCodePlaceholder')} required /></div><div className="space-y-2"><Label htmlFor="table-name">{t('tableName')}</Label><Input id="table-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={t('tableNamePlaceholder')} /></div><Button type="submit" disabled={create.isPending}>{create.isPending ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}{t('tableCreate')}</Button></form></CardContent></Card></div>
    <Card className="min-h-0 flex-1 overflow-hidden"><CardHeader className="shrink-0"><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>{t('tables')}</CardTitle><div className="flex items-center gap-3"><span className="text-sm text-muted-foreground">{t('total')}: {tables.length}</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>{t('previous')}</Button><span className="text-sm text-muted-foreground">{t('page')} {currentPage}/{totalPages}</span><Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>{t('next')}</Button></div></div></div></CardHeader><CardContent className="grid min-h-0 flex-1 w-full grid-cols-1 content-start gap-4 overflow-y-auto md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{isLoading ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" />{t('loading')}</div> : tables.length === 0 ? <div className="text-sm text-muted-foreground">{t('tableEmpty')}</div> : visibleTables.map((table) => <Card key={table._id} className="h-fit min-w-0 gap-2 overflow-hidden border-2 border-slate-400 py-2 shadow-sm"><CardHeader className="px-3 pb-1 pt-2"><CardTitle className="flex items-center justify-between gap-3"><span>{table.name}</span><span className="rounded bg-muted px-2 py-1 text-sm">{t('tableCode')} {table.code}</span></CardTitle></CardHeader><CardContent className="space-y-2 px-3 pb-2"><div className="mx-auto w-fit rounded-md border-2 border-slate-400 bg-white p-1">{images[table._id] ? <img src={images[table._id]} alt={`${t('tableQrAlt')} ${table.name}`} className="size-16" /> : <div className="size-20" />}</div><div className="grid grid-cols-2 gap-2"><Button className="h-8 w-full" size="sm" variant="outline" onClick={() => void copyUrl(table)}><Copy className="size-4" />{t('tableQrCopyShort')}</Button><AlertDialog><AlertDialogTrigger asChild><Button className="h-8 w-full" size="sm" variant="outline"><RefreshCw className="size-4" />{t('tableQrRegenerateShort')}</Button></AlertDialogTrigger><AlertDialogContent className="max-w-sm p-4"><AlertDialogHeader><AlertDialogTitle>{t('tableQrRegenerate')}</AlertDialogTitle><AlertDialogDescription>{t('tableQrRegenerateConfirm')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => regenerate.mutate(table._id)} disabled={regenerate.isPending}>{t('confirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>{images[table._id] && <Button asChild className="h-8 w-full" size="sm"><a href={images[table._id]} download={`mammi-table-${table.code}.png`}><Download className="size-4" />{t('tableDownload')}</a></Button>}</CardContent></Card>)}</CardContent></Card>
  </div>
}
