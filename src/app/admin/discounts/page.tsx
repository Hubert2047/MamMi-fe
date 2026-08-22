'use client'

import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { createDiscount, deleteDiscount, getDiscounts, updateDiscount, type Discount, type DiscountInput } from '@/api/discount'
import { useAuth } from '@/hooks/auth'
import { useI18n } from '@/lib/i18n'

const initial: DiscountInput = { names: { vi: '', en: '', 'zh-TW': '' }, amount: 0, type: 'percent', note: '', active: false }

export default function DiscountsPage() {
  const client = useQueryClient()
  const { user } = useAuth()
  const { t, locale } = useI18n()
  const [form, setForm] = useState<DiscountInput>(initial)
  const [editing, setEditing] = useState<Discount | null>(null)
  const { data: discounts = [], isLoading } = useQuery({ queryKey: ['discounts'], queryFn: () => getDiscounts() })
  const save = useMutation({
    mutationFn: () => editing ? updateDiscount({ id: editing._id, data: form }) : createDiscount(form),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['discounts'] }); toast.success(editing ? t('updateDiscountSuccess') : t('createDiscountSuccess')); setForm(initial); setEditing(null) },
    onError: (error) => toast.error(axios.isAxiosError(error) ? error.response?.data?.message || t('discountSaveError') : t('discountSaveError')),
  })
  const remove = useMutation({ mutationFn: deleteDiscount, onSuccess: () => { client.invalidateQueries({ queryKey: ['discounts'] }); toast.success(t('deleteDiscountSuccess')) }, onError: (error) => toast.error(axios.isAxiosError(error) ? error.response?.data?.message || t('discountDeleteError') : t('discountDeleteError')) })
  const displayName = (discount: Discount) => discount.names[locale] || discount.names.vi || discount.names.en || discount.names['zh-TW'] || discount.name

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!form.names.vi.trim() && !form.names.en.trim() && !form.names['zh-TW'].trim()) return toast.error(t('requiredDiscountName'))
    save.mutate()
  }

  function startEditing(discount: Discount) { setEditing(discount); setForm({ ...initial, names: { ...discount.names }, type: discount.type, note: discount.note }) }
  function cancelEditing() { setForm(initial); setEditing(null) }

  if (user?.role !== 'SuperAdmin') return <div className="p-6 md:p-8"><Card><CardHeader><CardTitle>{t('superAdminOnly')}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{t('catalogSuperAdminHint')}</CardContent></Card></div>

  return <div className="p-6 md:p-8"><div className="mb-6"><h1 className="text-3xl font-bold">{t('discounts')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('discountCatalogHint')}</p></div><div className="grid gap-6 lg:grid-cols-[380px_1fr]"><Card className="h-fit"><CardHeader><CardTitle>{editing ? t('editDiscount') : t('createDiscount')}</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={submit}><div className="space-y-2"><Label htmlFor="discount-name-vi">{t('name')} (VI)</Label><Input id="discount-name-vi" value={form.names.vi} onChange={(event) => setForm({ ...form, names: { ...form.names, vi: event.target.value } })} /></div><div className="space-y-2"><Label htmlFor="discount-name-en">{t('name')} (EN)</Label><Input id="discount-name-en" value={form.names.en} onChange={(event) => setForm({ ...form, names: { ...form.names, en: event.target.value } })} /></div><div className="space-y-2"><Label htmlFor="discount-name-zh">{t('name')} (繁中)</Label><Input id="discount-name-zh" value={form.names['zh-TW']} onChange={(event) => setForm({ ...form, names: { ...form.names, 'zh-TW': event.target.value } })} /></div><div className="space-y-2"><Label>{t('discountType')}</Label><Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as DiscountInput['type'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percent">{t('discountPercent')}</SelectItem><SelectItem value="value">{t('discountValue')}</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="discount-note">{t('discountNote')}</Label><Input id="discount-note" placeholder={t('discountNotePlaceholder')} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></div><div className="flex gap-2"><Button type="submit" disabled={save.isPending}>{save.isPending ? t('savingDiscount') : t('save')}</Button>{editing && <Button type="button" variant="outline" onClick={cancelEditing}>{t('cancel')}</Button>}</div></form></CardContent></Card><Card><CardHeader><CardTitle>{t('discountList')}</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>{t('name')}</TableHead><TableHead>{t('discountType')}</TableHead><TableHead>{t('discountNote')}</TableHead><TableHead className="text-right">{t('actions')}</TableHead></TableRow></TableHeader><TableBody>{isLoading ? <TableRow><TableCell colSpan={4}>{t('loading')}</TableCell></TableRow> : discounts.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t('emptyDiscounts')}</TableCell></TableRow> : discounts.map((discount) => <TableRow key={discount._id}><TableCell>{displayName(discount)}</TableCell><TableCell>{discount.type === 'percent' ? t('discountPercent') : t('discountValue')}</TableCell><TableCell>{discount.note || '—'}</TableCell><TableCell className="space-x-2 text-right"><Button size="sm" variant="outline" onClick={() => startEditing(discount)}>{t('edit')}</Button><AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="destructive" disabled={remove.isPending}>{remove.isPending ? t('deletingDiscount') : t('delete')}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle><AlertDialogDescription>{t('confirmDeleteDiscount')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => remove.mutate(discount._id)}>{t('confirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></div></div>
}
