'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import type { Item } from '@/api/item'
import type { Addon } from '@/api/addon'
import { updateTemporaryStoreItemAvailability } from '@/api/store-item'
import { updateTemporaryStoreAddonAvailability } from '@/api/store-addon'
import { useI18n } from '@/lib/i18n'

type Props = { open: boolean; items: Item[]; addons: Addon[]; onClose: () => void }
type AvailabilityRow = { _id: string; name: string; categoryName?: string; permanentlyActive?: boolean; temporarilyUnavailable?: boolean }
export default function TemporaryAvailabilityTable({ open, items, addons, onClose }: Props) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [tab, setTab] = useState('products')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(13)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const productsListRef = useRef<HTMLDivElement>(null)
  const addonsListRef = useRef<HTMLDivElement>(null)
  const itemMutation = useMutation({ mutationFn: updateTemporaryStoreItemAvailability, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }), onSettled: () => setPendingId(null), onError: () => toast.error(t('temporaryAvailabilityError')) })
  const addonMutation = useMutation({ mutationFn: updateTemporaryStoreAddonAvailability, onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['items'] }); void queryClient.invalidateQueries({ queryKey: ['store-addons'] }) }, onSettled: () => setPendingId(null), onError: () => toast.error(t('temporaryAvailabilityError')) })
  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.categoryName).filter(Boolean))).sort(), [items])
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const filteredItems = useMemo(() => items.filter((item) => category === 'all' || item.categoryName === category).filter((item) => !normalizedSearch || item.name.toLocaleLowerCase().includes(normalizedSearch)).sort((a, b) => a.name.localeCompare(b.name)), [category, items, normalizedSearch])
  const filteredAddons = useMemo(() => addons.filter((addon) => !normalizedSearch || addon.name.toLocaleLowerCase().includes(normalizedSearch)).sort((a, b) => a.name.localeCompare(b.name)), [addons, normalizedSearch])
  const activeItems = tab === 'products' ? filteredItems : filteredAddons
  const totalPages = Math.max(1, Math.ceil(activeItems.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedItems = activeItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const saving = itemMutation.isPending || addonMutation.isPending

  useEffect(() => {
    const element = (tab === 'products' ? productsListRef : addonsListRef).current
    if (!element) return
    const resize = () => {
      const headerHeight = element.querySelector<HTMLElement>('thead')?.getBoundingClientRect().height ?? 44
      const rows = Array.from(element.querySelectorAll<HTMLElement>('tbody tr'))
      const rowHeight = rows.length ? Math.max(...rows.map((row) => row.getBoundingClientRect().height)) : 52
      const availableHeight = element.getBoundingClientRect().height
      if (availableHeight <= 0) return
      const nextPageSize = Math.max(1, Math.floor((availableHeight - headerHeight - 16) / Math.max(rowHeight, 44)) + 3)
      setPageSize((current) => current === nextPageSize ? current : nextPageSize)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [activeItems.length, category, search, tab])

  const resetPage = () => setPage(1)
  const availabilityCell = (id: string, permanentlyActive: boolean, unavailable: boolean, kind: 'item' | 'addon', name: string) => <TableCell className='text-center'><div className='flex justify-center'>{pendingId === id ? <Loader2 className='size-4 animate-spin text-primary' aria-label={t('loading')} /> : <Checkbox className='size-5 border-2 border-foreground/60 bg-background data-checked:border-primary data-checked:bg-primary' checked={unavailable} disabled={!permanentlyActive || saving} aria-label={`${t('temporaryUnavailable')} ${name}`} onCheckedChange={(checked) => { setPendingId(id); if (kind === 'item') itemMutation.mutate({ itemId: id, temporarilyUnavailable: checked === true }); else addonMutation.mutate({ addonId: id, temporarilyUnavailable: checked === true }) }} />}</div></TableCell>
  const pagination = <div className='ml-auto flex shrink-0 items-center gap-2 text-sm'><span className='whitespace-nowrap text-muted-foreground'>{t('page')} {currentPage}/{totalPages}</span><Button size='sm' variant='outline' disabled={currentPage === 1} onClick={() => setPage((current) => current - 1)}>{t('previous')}</Button><Button size='sm' variant='outline' disabled={currentPage >= totalPages} onClick={() => setPage((current) => current + 1)}>{t('next')}</Button></div>

  return <Dialog open={open} onOpenChange={(value) => !value && onClose()}><DialogContent onOpenAutoFocus={(event) => event.preventDefault()} className='left-0 top-0 flex h-dvh min-h-0 max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none p-3 pb-[env(safe-area-inset-bottom)] sm:max-w-none sm:px-4'><DialogHeader className='shrink-0 gap-0 pb-1'><DialogTitle className='text-center text-lg capitalize'>{t('temporaryAvailabilityTitle')}</DialogTitle></DialogHeader><Tabs value={tab} onValueChange={(value) => { setTab(value); setSearch(''); setCategory('all'); resetPage() }} className='flex min-h-0 flex-1 flex-col gap-0'><TabsList className='w-fit shrink-0'><TabsTrigger value='products'>{t('products')}</TabsTrigger><TabsTrigger value='addons'>{t('addons')}</TabsTrigger></TabsList><div className='flex flex-wrap items-center gap-2 py-1'><Input className='max-w-sm' placeholder={t('temporaryAvailabilitySearch')} value={search} onChange={(event) => { setSearch(event.target.value); resetPage() }} />{tab === 'products' && <Select value={category} onValueChange={(value) => { setCategory(value); resetPage() }}><SelectTrigger className='w-52'><SelectValue placeholder={t('temporaryAvailabilityCategory')} /></SelectTrigger><SelectContent><SelectItem value='all'>{t('temporaryAvailabilityAllCategories')}</SelectItem>{categories.map((itemCategory) => <SelectItem key={itemCategory} value={itemCategory}>{itemCategory}</SelectItem>)}</SelectContent></Select>}{pagination}</div><TabsContent value='products' className='flex min-h-0 flex-1 flex-col overflow-hidden'><div ref={productsListRef} className='min-h-0 flex-1'><AvailabilityTable items={paginatedItems} empty={t('temporaryAvailabilityEmpty')} nameHeader={t('name')} categoryHeader={t('categories')} statusHeader={t('temporaryUnavailable')} showCategory renderStatus={(item) => availabilityCell(item._id, item.permanentlyActive !== false, item.temporarilyUnavailable === true, 'item', item.name)} /></div></TabsContent><TabsContent value='addons' className='flex min-h-0 flex-1 flex-col overflow-hidden'><div ref={addonsListRef} className='min-h-0 flex-1'><AvailabilityTable items={paginatedItems} empty={t('temporaryAvailabilityEmpty')} nameHeader={t('name')} categoryHeader={t('addons')} statusHeader={t('temporaryUnavailable')} renderStatus={(addon) => availabilityCell(addon._id, addon.permanentlyActive !== false, addon.temporarilyUnavailable === true, 'addon', addon.name)} /></div></TabsContent></Tabs></DialogContent></Dialog>
}

function AvailabilityTable({ items, empty, nameHeader, categoryHeader, statusHeader, showCategory = false, renderStatus }: { items: AvailabilityRow[]; empty: string; nameHeader: string; categoryHeader: string; statusHeader: string; showCategory?: boolean; renderStatus: (item: AvailabilityRow) => ReactNode }) {
  return <div className='min-h-0 flex-1 min-w-0 overflow-x-hidden rounded-md border [&>[data-slot=table-container]]:overflow-x-hidden'><Table className='w-full min-w-0 table-fixed'><TableHeader><TableRow><TableHead className={showCategory ? 'w-[50%] whitespace-normal break-words' : 'w-[70%] whitespace-normal break-words'}>{nameHeader}</TableHead>{showCategory && <TableHead className='w-[35%] whitespace-normal break-words'>{categoryHeader}</TableHead>}<TableHead className={showCategory ? 'w-[15%] whitespace-normal break-words text-center leading-tight' : 'w-[30%] whitespace-normal break-words text-center leading-tight'}>{statusHeader}</TableHead></TableRow></TableHeader><TableBody>{items.length === 0 ? <TableRow><TableCell colSpan={showCategory ? 3 : 2} className='py-10 text-center text-muted-foreground'>{empty}</TableCell></TableRow> : items.map((item) => <TableRow key={item._id} className={item.permanentlyActive === false ? 'opacity-60' : undefined}><TableCell className='whitespace-normal break-words font-medium'>{item.name}</TableCell>{showCategory && <TableCell className='max-w-0 truncate' title={item.categoryName}>{item.categoryName || '—'}</TableCell>}{renderStatus(item)}</TableRow>)}</TableBody></Table></div>
}
