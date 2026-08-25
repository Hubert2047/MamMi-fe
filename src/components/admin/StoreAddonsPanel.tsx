'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getAddons, type Addon } from '@/api/addon'
import { addStoreAddon, getStoreAddons, updateStoreAddon } from '@/api/store-addon'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/hooks/auth'
import { useStorePricingEmbedded } from '@/app/admin/store-pricing/store-pricing-context'

export default function StoreAddonsPanel() {
  const { locale, t } = useI18n(); const { user } = useAuth(); const embedded = useStorePricingEmbedded(); const client = useQueryClient(); const listRef = useRef<HTMLDivElement>(null)
  const canChangePermanent = user?.role === 'Admin' || user?.role === 'SuperAdmin'
  const [addonId, setAddonId] = useState(''); const [priceExtra, setPriceExtra] = useState(0); const [editingId, setEditingId] = useState<string | null>(null); const [draftPrice, setDraftPrice] = useState(0); const [draftPermanent, setDraftPermanent] = useState(true); const [draftTemporary, setDraftTemporary] = useState(false); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(12)
  const { data: addons = [] } = useQuery({ queryKey: ['addons', locale], queryFn: () => getAddons(locale) }); const { data: storeAddons = [] } = useQuery({ queryKey: ['store-addons', locale], queryFn: () => getStoreAddons(locale) }); const refresh = () => client.invalidateQueries({ queryKey: ['store-addons'] }); const add = useMutation({ mutationFn: addStoreAddon, onSuccess: () => { refresh(); setAddonId(''); setPriceExtra(0) } }); const update = useMutation({ mutationFn: updateStoreAddon, onSuccess: () => { refresh(); setEditingId(null) } }); const available = addons.filter((addon) => !storeAddons.some((current) => current._id === addon._id)); const name = (addon: Addon) => addon.names[locale] || addon.names.vi || addon.name; const totalPages = Math.max(1, Math.ceil(storeAddons.length / pageSize)); const paginated = useMemo(() => storeAddons.slice((page - 1) * pageSize, page * pageSize), [storeAddons, page, pageSize])
  useEffect(() => {
    const element = listRef.current
    if (!element) return
    const resize = () => {
      const columns = window.innerWidth >= 1280 ? 3 : window.innerWidth >= 768 ? 2 : 1
      const rows = Math.max(1, Math.floor((element.clientHeight + 8) / 52))
      setPageSize(columns * rows)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    window.addEventListener('resize', resize)
    return () => { observer.disconnect(); window.removeEventListener('resize', resize) }
  }, [])
  useEffect(() => setPage((current) => Math.min(current, totalPages)), [totalPages])
  return <div className={`flex h-full min-h-0 flex-col gap-3 overflow-hidden ${embedded ? 'px-1 pb-0' : 'p-6 md:p-8'}`}>
    <Card className="shrink-0 min-h-[159px] border border-slate-300 shadow-sm"><CardHeader className="px-4 py-2"><CardTitle>{t('createAddon')}</CardTitle></CardHeader><CardContent className="flex flex-wrap items-end gap-3"><div className="min-w-64 space-y-2"><Label>{t('addons')}</Label><Select value={addonId} onValueChange={setAddonId} disabled={!available.length}><SelectTrigger><SelectValue placeholder={available.length ? t('addons') : ''} /></SelectTrigger><SelectContent>{available.map((addon) => <SelectItem key={addon._id} value={addon._id}>{name(addon)}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>{t('extraPrice')}</Label><Input className="w-32" type="number" value={priceExtra} onChange={(event) => setPriceExtra(Number(event.target.value))} /></div><Button disabled={!addonId || add.isPending} onClick={() => add.mutate({ addonId, priceExtra, permanentlyActive: true })}>{add.isPending ? <Loader2 className="size-4 animate-spin" /> : t('createAddon')}</Button></CardContent></Card>
    <Card className="min-h-0 flex-1 flex flex-col border border-slate-300 shadow-sm"><CardHeader className="shrink-0 px-4 py-2"><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>{t('addonList')}</CardTitle><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{t('total')}: {storeAddons.length}</span><Button size="sm" variant="outline" className="h-7 w-7 px-0" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</Button><span className="text-xs text-muted-foreground">{page}/{totalPages}</span><Button size="sm" variant="outline" className="h-7 w-7 px-0" disabled={page === totalPages} onClick={() => setPage(page + 1)}>›</Button></div></div></CardHeader><CardContent ref={listRef} className="min-h-0 flex-1 overflow-auto px-4 pt-0 pb-2"><div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">{paginated.map((addon) => { const isEditing = editingId === addon._id; return <div key={addon._id} className="flex min-h-[48px] min-w-0 items-center justify-between gap-2 rounded-lg border border-slate-300 p-2 shadow-sm"><span className="min-w-0 flex-1 truncate font-medium">{name(addon)}</span>{isEditing ? <><Input className="h-7 w-24" type="number" value={draftPrice} onChange={(event) => setDraftPrice(Number(event.target.value))} /><Button size="sm" className="h-7" onClick={() => update.mutate({ addonId: addon._id, data: { priceExtra: draftPrice } })}>{t('save')}</Button><Button size="sm" className="h-7" variant="outline" onClick={() => setEditingId(null)}>{t('cancel')}</Button></> : <><span className="shrink-0 text-sm">{addon.priceExtra.toLocaleString()}</span><Button size="sm" className="h-7" variant="outline" onClick={() => { setEditingId(addon._id); setDraftPrice(addon.priceExtra) }}>{t('edit')}</Button></>}</div> })}</div></CardContent></Card>
  </div>
}
