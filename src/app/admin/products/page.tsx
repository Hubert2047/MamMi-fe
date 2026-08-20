'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createItem, deleteItem, getItems, updateItem, type Item, type ItemInput } from '@/api/item'
import { getCategories, type Category } from '@/api/category'
import { getAddons, type Addon } from '@/api/addon'
import { useI18n } from '@/lib/i18n'

const emptyForm: ItemInput = { names: { vi: '', en: '', 'zh-TW': '' }, variants: [], price: { base: 0, uber: 0, foodpanda: 0 }, categoryId: '', addons: [], noteOptions: [], active: true }

export default function ProductsPage() {
  const queryClient = useQueryClient(); const { t } = useI18n()
  const [form, setForm] = useState<ItemInput>(emptyForm); const [editing, setEditing] = useState<Item | null>(null); const [variants, setVariants] = useState(''); const [noteOptions, setNoteOptions] = useState('')
  const { data: items = [], isLoading } = useQuery({ queryKey: ['admin-items'], queryFn: () => getItems() })
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ['categories'], queryFn: getCategories })
  const { data: addons = [] } = useQuery<Addon[]>({ queryKey: ['addons'], queryFn: getAddons })
  const save = useMutation({ mutationFn: (data: ItemInput) => editing ? updateItem({ id: editing._id, data }) : createItem(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-items'] }); toast.success(editing ? t('updateSuccess') : t('createSuccess')); reset() }, onError: () => toast.error(t('saveError')) })
  const remove = useMutation({ mutationFn: deleteItem, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-items'] }); toast.success(t('deleteSuccess')) }, onError: () => toast.error(t('deleteError')) })

  function reset() { setForm(emptyForm); setEditing(null); setVariants(''); setNoteOptions('') }
  function edit(item: Item) { const categoryId = typeof item.categoryId === 'string' ? item.categoryId : item.categoryId?._id || ''; setEditing(item); setForm({ names: item.names, categoryId, addons: item.addons.map((a) => a._id), variants: item.variants || [], noteOptions: item.noteOptions || [], price: item.price, active: item.active }); setVariants((item.variants || []).join(', ')); setNoteOptions((item.noteOptions || []).join(', ')) }
  function submit(event: React.FormEvent) { event.preventDefault(); if (!form.names.vi.trim() || !form.names.en.trim() || !form.names['zh-TW'].trim() || !form.categoryId) return toast.error(t('validationProduct')); save.mutate({ ...form, variants: variants.split(',').map((v) => v.trim()).filter(Boolean), noteOptions: noteOptions.split(',').map((v) => v.trim()).filter(Boolean) }) }

  return <div className="p-6 md:p-8"><div className="mb-6"><h1 className="text-3xl font-bold tracking-tight">{t('products')}</h1></div><div className="grid gap-6 xl:grid-cols-[380px_1fr]">
    <Card className="h-fit"><CardHeader><CardTitle>{editing ? t('editProduct') : t('createProduct')}</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="space-y-4">
      <div className="space-y-2"><Label>{t('productName')} (VI)</Label><Input value={form.names.vi} onChange={(e) => setForm({ ...form, names: { ...form.names, vi: e.target.value } })} /></div>
      <div className="space-y-2"><Label>{t('productName')} (EN)</Label><Input value={form.names.en} onChange={(e) => setForm({ ...form, names: { ...form.names, en: e.target.value } })} /></div>
      <div className="space-y-2"><Label>{t('productName')} (繁中)</Label><Input value={form.names['zh-TW']} onChange={(e) => setForm({ ...form, names: { ...form.names, 'zh-TW': e.target.value } })} /></div>
      <div className="space-y-2"><Label>{t('categories')}</Label><select className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">{t('chooseCategory')}</option>{categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
      <div className="grid grid-cols-3 gap-2">{(['base', 'uber', 'foodpanda'] as const).map((type) => <div key={type} className="space-y-2"><Label className="capitalize">{type}</Label><Input type="number" value={form.price[type] ?? 0} onChange={(e) => setForm({ ...form, price: { ...form.price, [type]: Number(e.target.value) } })} /></div>)}</div>
      <div className="space-y-2"><Label>{t('variants')} <span className="font-normal text-muted-foreground">{t('commaSeparated')}</span></Label><Input value={variants} onChange={(e) => setVariants(e.target.value)} placeholder={t('variantPlaceholder')} /></div>
      <div className="space-y-2"><Label>{t('notes')} <span className="font-normal text-muted-foreground">{t('commaSeparated')}</span></Label><Input value={noteOptions} onChange={(e) => setNoteOptions(e.target.value)} placeholder={t('notePlaceholder')} /></div>
      <div className="space-y-2"><Label>{t('addons')}</Label><div className="space-y-2 rounded-lg border p-3">{addons.map((addon) => <label key={addon._id} className="flex items-center gap-2 text-sm"><Checkbox checked={form.addons.includes(addon._id)} onCheckedChange={(checked) => setForm({ ...form, addons: checked ? [...form.addons, addon._id] : form.addons.filter((id) => id !== addon._id) })} />{addon.name} (+{addon.priceExtra.toLocaleString()})</label>)}</div></div>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: checked === true })} />{t('selling')}</label>
      <div className="flex gap-2"><Button type="submit" disabled={save.isPending}>{save.isPending ? t('saving') : editing ? t('update') : t('createProduct')}</Button>{editing && <Button type="button" variant="outline" onClick={reset}>{t('cancel')}</Button>}</div>
    </form></CardContent></Card>
    <Card><CardHeader><CardTitle>{t('productList')}</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t('name')}</TableHead><TableHead>{t('categories')}</TableHead><TableHead>{t('price')}</TableHead><TableHead>{t('status')}</TableHead><TableHead className="text-right">{t('actions')}</TableHead></TableRow></TableHeader><TableBody>{isLoading ? <TableRow><TableCell colSpan={5}>{t('loading')}</TableCell></TableRow> : items.map((item) => <TableRow key={item._id}><TableCell className="font-medium">{item.name}</TableCell><TableCell>{item.categoryName || '—'}</TableCell><TableCell>{(item.price.base || 0).toLocaleString()}</TableCell><TableCell>{item.active ? t('selling') : t('hidden')}</TableCell><TableCell className="space-x-2 text-right"><Button size="sm" variant="outline" onClick={() => edit(item)}>{t('edit')}</Button><Button size="sm" variant="destructive" onClick={() => remove.mutate(item._id)}>{t('delete')}</Button></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
  </div></div>
}
