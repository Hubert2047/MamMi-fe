'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { getDiscounts, updateStoreDiscount, type Discount } from '@/api/discount'
import { useI18n } from '@/lib/i18n'
import { useStorePricingEmbedded } from './store-pricing-context'

export default function StoreDiscountsPanel() {
  const { locale, t } = useI18n()
  const embedded = useStorePricingEmbedded()
  const client = useQueryClient()
  const listRef = useRef<HTMLDivElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftAmount, setDraftAmount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const { data: discounts = [], isLoading } = useQuery({ queryKey: ['discounts', locale], queryFn: () => getDiscounts() })

  const refresh = () => client.invalidateQueries({ queryKey: ['discounts'] })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount: number; active?: boolean } }) => updateStoreDiscount({ id, data }),
    onSuccess: () => { refresh(); setEditingId(null); toast.success(t('updateDiscountSuccess')) },
    onError: (error) => toast.error(axios.isAxiosError(error) ? error.response?.data?.message || t('discountSaveError') : t('discountSaveError')),
  })

  const totalPages = Math.max(1, Math.ceil(discounts.length / pageSize))
  const paginated = useMemo(() => discounts.slice((page - 1) * pageSize, page * pageSize), [discounts, page, pageSize])
  const displayName = (discount: Discount) => discount.names[locale] || discount.names.vi || discount.names.en || discount.names['zh-TW'] || discount.name
  const formatAmount = (discount: Discount) => discount.type === 'percent' ? `${discount.amount}%` : `${discount.amount.toLocaleString(locale)} ${t('currency')}`.trim()

  useEffect(() => {
    const element = listRef.current
    if (!element) return
    const resize = () => {
      const rows = Array.from(element.querySelectorAll<HTMLElement>('[data-store-row]'))
      const rowHeight = rows.length ? Math.max(...rows.map((row) => row.getBoundingClientRect().height)) : 60
      setPageSize(Math.max(1, Math.floor((element.clientHeight + 12) / (rowHeight + 12))))
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    element.querySelectorAll<HTMLElement>('[data-store-row]').forEach((row) => observer.observe(row))
    return () => observer.disconnect()
  }, [paginated.length, page, locale])

  useEffect(() => setPage((current) => Math.min(current, totalPages)), [totalPages])

  function startEditing(discount: Discount) { setEditingId(discount._id); setDraftAmount(discount.amount) }

  return <div className={`flex h-full min-h-0 flex-col gap-6 overflow-hidden [&>[data-slot=card]]:border [&>[data-slot=card]]:border-border/50 [&>[data-slot=card]]:ring-0 ${embedded ? 'px-1 pb-6' : 'p-6 md:p-8'}`}>
    <Card className="min-h-0 flex-1 flex flex-col"><CardHeader className="shrink-0"><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>{t('discountList')}</CardTitle><div className="flex items-center gap-3"><span className="text-sm text-muted-foreground">{t('total')}: {discounts.length}</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</Button><span className="text-sm text-muted-foreground">{page}/{totalPages}</span><Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>›</Button></div></div></div></CardHeader><CardContent ref={listRef} className="min-h-0 flex-1 overflow-hidden space-y-3">
      {isLoading ? <div className="text-sm text-muted-foreground">{t('loading')}</div> : paginated.length === 0 ? <div className="text-center text-sm text-muted-foreground">{t('emptyDiscounts')}</div> : paginated.map((discount) => {
        const isEditing = editingId === discount._id
        return <div data-store-row="true" className="grid min-h-[60px] gap-x-6 gap-y-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_128px_minmax(110px,auto)_auto] md:items-center" key={discount._id}>
          <div className="min-w-0"><div className="font-medium">{displayName(discount)}</div><div className="text-xs text-muted-foreground">{discount.type === 'percent' ? t('discountPercent') : t('discountValue')}</div></div>
          <div className="flex items-center"><div className="w-32">{isEditing ? <Input className="h-9 w-full" type="number" min="0" value={draftAmount} onChange={(event) => setDraftAmount(Number(event.target.value))} /> : <div className="h-9 rounded-md border px-3 py-2 text-sm">{formatAmount(discount)}</div>}</div></div>
          <label className="flex w-fit items-center gap-2 whitespace-nowrap rounded-md bg-muted/40 px-2 py-1.5 text-sm"><Checkbox checked={discount.active} onCheckedChange={(active) => update.mutate({ id: discount._id, data: { amount: discount.amount, active: active === true } })} />{t('selling')}</label>
          <div className="flex min-h-9 items-center gap-2">{isEditing ? <><Button size="sm" disabled={update.isPending} onClick={() => update.mutate({ id: discount._id, data: { amount: draftAmount } })}>{t('save')}</Button><Button size="sm" variant="outline" onClick={() => setEditingId(null)}>{t('cancel')}</Button></> : <Button size="sm" variant="outline" onClick={() => startEditing(discount)}>{t('edit')}</Button>}</div>
        </div>
      })}
    </CardContent></Card>
  </div>
}
