'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getCatalogItems } from '@/api/catalog-item'
import { addStoreItem, getStoreItems, updateStoreItem } from '@/api/store-item'
import { getCategories, type Category } from '@/api/category'
import type { Item, PriceType } from '@/api/item'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/hooks/auth'
import { useStorePricingEmbedded } from '@/app/admin/store-pricing/store-pricing-context'
import { Loader2 } from 'lucide-react'

const emptyPrice: PriceType = { base: 0, uber: 0, foodpanda: 0 }
const priceKeys = ['base', 'uber', 'foodpanda'] as const

export default function StoreMenuPanel() {
  const { locale, t } = useI18n()
  const { user } = useAuth()
  const canChangePermanentAvailability = user?.role === 'Admin' || user?.role === 'SuperAdmin'
  const embedded = useStorePricingEmbedded()
  const queryClient = useQueryClient()
  const [selectedItemId, setSelectedItemId] = useState('')
  const [price, setPrice] = useState<PriceType>(emptyPrice)
  const [editing, setEditing] = useState<Item | null>(null)
  const [draftPrice, setDraftPrice] = useState<PriceType>(emptyPrice)
  const [draftPermanentlyActive, setDraftPermanentlyActive] = useState(true)
  const [draftTemporarilyUnavailable, setDraftTemporarilyUnavailable] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 4
  const [categoryFilter, setCategoryFilter] = useState('all')
  const { data: catalog = [] } = useQuery({ queryKey: ['catalog-items', locale], queryFn: () => getCatalogItems(locale) })
  const { data: menu = [] } = useQuery({ queryKey: ['store-items', locale], queryFn: () => getStoreItems(locale) })
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ['categories'], queryFn: getCategories })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['store-items'] })
  const add = useMutation({
    mutationFn: addStoreItem,
    onSuccess: () => { refresh(); setSelectedItemId(''); setPrice(emptyPrice); toast.success(t('createSuccess')) },
    onError: () => toast.error(t('saveError')),
  })
  const update = useMutation({
    mutationFn: updateStoreItem,
    onSuccess: async () => { await refresh(); setEditing(null); toast.success(t('updateSuccess')) },
    onError: () => toast.error(t('saveError')),
  })
  const matchesCategory = (item: Item) => categoryFilter === 'all' || (typeof item.categoryId === 'string' ? item.categoryId : item.categoryId?._id) === categoryFilter
  const available = catalog.filter((item) => matchesCategory(item) && !menu.some((menuItem) => menuItem._id === item._id))
  const filteredMenu = menu.filter(matchesCategory)
  const totalPages = Math.max(1, Math.ceil(filteredMenu.length / pageSize))
  const paginated = useMemo(() => filteredMenu.slice((page - 1) * pageSize, page * pageSize), [filteredMenu, page, pageSize])
  const startEdit = (item: Item) => {
    setEditing(item)
    setDraftPrice(item.price)
    setDraftPermanentlyActive(item.permanentlyActive)
    setDraftTemporarilyUnavailable(item.permanentlyActive && item.temporarilyUnavailable)
  }

  return <div className={`flex h-full min-h-0 flex-col gap-3 overflow-hidden ${embedded ? 'px-0 pb-0' : 'p-6 md:p-8'}`}>
    {!embedded && <h1 className="text-3xl font-bold">{t('storePricing')}</h1>}
    <Card className="min-h-[104px] border border-slate-300 shadow-sm">
      <CardHeader className="px-4 py-2"><CardTitle>{t('createProduct')}</CardTitle></CardHeader>
      <CardContent className="grid gap-2 px-4 pt-0 pb-1 md:grid-cols-[1fr_repeat(3,96px)_auto] md:items-end">
        <div className="space-y-1"><Label>{t('products')}</Label><Select value={selectedItemId} onValueChange={setSelectedItemId} disabled={!available.length}><SelectTrigger className="h-8"><SelectValue placeholder={available.length ? t('products') : ''} /></SelectTrigger><SelectContent>{available.map((item) => <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
        {priceKeys.map((key) => <div className="space-y-1" key={key}><Label className="capitalize">{key}</Label><Input className="h-7" type="number" value={price[key] ?? 0} onChange={(event) => setPrice({ ...price, [key]: Number(event.target.value) })} /></div>)}
        <Button className="h-8 w-fit" disabled={!selectedItemId || add.isPending} onClick={() => add.mutate({ itemId: selectedItemId, price })}>{t('createProduct')}</Button>
      </CardContent>
    </Card>
    <Card className="min-h-0 flex-1 flex flex-col border border-slate-300 shadow-sm">
      <CardHeader className="shrink-0 px-4 py-0"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><CardTitle>{t('productList')}</CardTitle><div className="w-36"><Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); setPage(1) }}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t('allCategories')}</SelectItem>{categories.map((category) => <SelectItem key={category._id} value={category._id}>{category.names[locale] || category.names.vi || category.names.en || category.names['zh-TW']}</SelectItem>)}</SelectContent></Select></div></div><div className="flex items-center gap-3"><span className="text-sm text-muted-foreground">{t('total')}: {filteredMenu.length}</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</Button><span className="text-sm text-muted-foreground">{page}/{totalPages}</span><Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>›</Button></div></div></div></CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden space-y-2 px-4 pt-0 pb-0">
        {paginated.map((item) => {
          const isEditing = editing?._id === item._id
          const saving = isEditing && update.isPending
          return <div data-store-row="true" className="grid min-h-[70px] gap-2 rounded-lg border border-slate-300 p-2 shadow-sm md:grid-cols-[1fr_repeat(3,96px)_minmax(230px,auto)] md:items-end" key={item._id}>
            <div><div className="font-medium">{item.name}</div><div className="text-xs text-muted-foreground">{item.categoryName}</div></div>
            {priceKeys.map((key) => <div className="space-y-1" key={key}><Label className="capitalize">{key}</Label>{isEditing ? <Input disabled={saving} className="h-7" type="number" value={draftPrice[key] ?? 0} onChange={(event) => setDraftPrice({ ...draftPrice, [key]: Number(event.target.value) })} /> : <div className="h-7 rounded-md border px-2 py-1 text-sm">{(item.price[key] ?? 0).toLocaleString()}</div>}</div>)}
            <div className="flex min-h-8 flex-wrap items-center gap-1">
              {isEditing ? <>
                {canChangePermanentAvailability && <label className="flex shrink-0 items-center gap-2 text-sm"><Checkbox disabled={saving} checked={draftPermanentlyActive} onCheckedChange={(value) => { setDraftPermanentlyActive(value === true); if (value !== true) setDraftTemporarilyUnavailable(false) }} />{t('permanentSelling')}</label>}
                {draftPermanentlyActive && <label className="flex shrink-0 items-center gap-2 text-sm"><Checkbox disabled={saving} checked={draftTemporarilyUnavailable} onCheckedChange={(value) => setDraftTemporarilyUnavailable(value === true)} />{t('temporaryUnavailable')}</label>}
                <Button className="shrink-0" size="sm" disabled={saving} onClick={() => update.mutate({ itemId: item._id, data: { price: draftPrice, ...(canChangePermanentAvailability ? { permanentlyActive: draftPermanentlyActive } : {}), temporarilyUnavailable: draftPermanentlyActive && draftTemporarilyUnavailable } })}>{saving ? <Loader2 className="size-4 animate-spin" aria-label={t('loading')} /> : t('save')}</Button>
                <Button className="shrink-0" size="sm" variant="outline" disabled={saving} onClick={() => setEditing(null)}>{t('cancel')}</Button>
              </> : <>
                <span className="shrink-0 text-sm">{item.permanentlyActive ? t('permanentSelling') : t('permanentHidden')}</span>
                {item.permanentlyActive && <span className="shrink-0 text-sm">{item.temporarilyUnavailable ? t('temporaryUnavailable') : t('temporaryAvailable')}</span>}
                <Button className="shrink-0" size="sm" variant="outline" onClick={() => startEdit(item)}>{t('edit')}</Button>
              </>}
            </div>
          </div>
        })}
      </CardContent>
    </Card>
  </div>
}
