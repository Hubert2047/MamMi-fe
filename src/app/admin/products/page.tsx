'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { createItem, deleteItem, getItems, updateItem, type Item, type ItemInput, type LocalizedOption } from '@/api/item'
import { getCategories, type Category } from '@/api/category'
import { getAddons, type Addon } from '@/api/addon'
import { useI18n } from '@/lib/i18n'

const emptyForm: ItemInput = {
  names: { vi: '', en: '', 'zh-TW': '' },
  description: { vi: '', en: '', 'zh-TW': '' },
  variants: [],
  price: { base: 0, uber: 0, foodpanda: 0 },
  categoryId: '',
  addons: [],
  noteOptions: [],
  active: true,
}

type OptionInputs = { vi: string; en: string; 'zh-TW': string }
const emptyOptionInputs: OptionInputs = { vi: '', en: '', 'zh-TW': '' }
const splitOptions = (value: string) => value.split(',').map((item) => item.trim())
const buildOptions = (inputs: OptionInputs, prefix: string): LocalizedOption[] => {
  const values = { vi: splitOptions(inputs.vi), en: splitOptions(inputs.en), 'zh-TW': splitOptions(inputs['zh-TW']) }
  const count = Math.max(values.vi.length, values.en.length, values['zh-TW'].length)
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    names: { vi: values.vi[index] || '', en: values.en[index] || '', 'zh-TW': values['zh-TW'][index] || '' },
  })).filter((option) => option.names.vi || option.names.en || option.names['zh-TW'])
}
const optionInputsFrom = (options: LocalizedOption[]): OptionInputs => ({
  vi: options.map((option) => option.names.vi).join(', '),
  en: options.map((option) => option.names.en).join(', '),
  'zh-TW': options.map((option) => option.names['zh-TW']).join(', '),
})

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const { t, locale } = useI18n()
  const [form, setForm] = useState<ItemInput>(emptyForm)
  const [editing, setEditing] = useState<Item | null>(null)
  const [confirmAction, setConfirmAction] = useState<'create' | 'update' | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [variantInputs, setVariantInputs] = useState<OptionInputs>(emptyOptionInputs)
  const [noteOptionInputs, setNoteOptionInputs] = useState<OptionInputs>(emptyOptionInputs)
  const { data: allItems = [], isLoading } = useQuery({ queryKey: ['admin-items', locale], queryFn: () => getItems(undefined, locale) })
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ['categories'], queryFn: getCategories })
  const { data: addons = [] } = useQuery<Addon[]>({ queryKey: ['addons', locale], queryFn: () => getAddons(locale) })
  const filteredItems = categoryFilter ? allItems.filter((item) => typeof item.categoryId === 'string' ? item.categoryId === categoryFilter : item.categoryId?._id === categoryFilter) : allItems
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const items = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    const updatePageSize = () => setPageSize(Math.max(5, Math.floor((window.innerHeight - 300) / 38)))
    updatePageSize()
    window.addEventListener('resize', updatePageSize)
    return () => window.removeEventListener('resize', updatePageSize)
  }, [])

  const save = useMutation({
    mutationFn: (data: ItemInput) => editing ? updateItem({ id: editing._id, data }) : createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-items'] })
      toast.success(editing ? t('updateSuccess') : t('createSuccess'))
      reset()
    },
    onError: () => toast.error(t('saveError')),
  })
  const remove = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-items'] })
      toast.success(t('deleteSuccess'))
    },
    onError: () => toast.error(t('deleteError')),
  })

  function reset() {
    setForm(emptyForm)
    setEditing(null)
    setConfirmAction(null)
    setVariantInputs(emptyOptionInputs)
    setNoteOptionInputs(emptyOptionInputs)
  }

  function itemForm(item: Item): ItemInput {
    const categoryId = typeof item.categoryId === 'string' ? item.categoryId : item.categoryId?._id || ''
    return {
      names: item.names,
      description: item.description || { vi: '', en: '', 'zh-TW': '' },
      categoryId,
      addons: item.addons.map((addon) => addon._id),
      variants: item.variants || [],
      noteOptions: item.noteOptions || [],
      price: item.price,
      active: item.active,
    }
  }

  function edit(item: Item) {
    setEditing(item)
    setForm(itemForm(item))
    setVariantInputs(optionInputsFrom(item.variants || []))
    setNoteOptionInputs(optionInputsFrom(item.noteOptions || []))
  }

  function copy(item: Item) {
    setEditing(null)
    setForm(itemForm(item))
    setVariantInputs(optionInputsFrom(item.variants || []))
    setNoteOptionInputs(optionInputsFrom(item.noteOptions || []))
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if ((!form.names.vi.trim() && !form.names.en.trim() && !form.names['zh-TW'].trim()) || !form.categoryId) {
      return toast.error(t('validationProduct'))
    }
    setConfirmAction(editing ? 'update' : 'create')
  }

  function confirmSave() {
    save.mutate({ ...form, variants: buildOptions(variantInputs, 'variant'), noteOptions: buildOptions(noteOptionInputs, 'note') })
    setConfirmAction(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-6 md:p-8">
      <div className="mb-6 shrink-0"><h1 className="text-3xl font-bold tracking-tight">{t('products')}</h1></div>
      <div className="grid min-h-0 flex-1 grid-rows-2 gap-6 xl:grid-cols-[380px_1fr] xl:grid-rows-1">
        <Card className="min-h-0 overflow-hidden">
          <CardHeader className="sticky top-0 z-10 shrink-0 border-b bg-card py-3"><div className="flex items-center justify-between gap-3"><CardTitle>{editing ? t('editProduct') : t('createProduct')}</CardTitle><div className="flex shrink-0 gap-2"><Button className="min-w-24" type="submit" form="product-form" size="sm" disabled={save.isPending}>{save.isPending ? t('saving') : editing ? t('update') : t('createProduct')}</Button>{editing && <Button className="min-w-20" type="button" variant="outline" size="sm" onClick={reset}>{t('cancel')}</Button>}</div></div></CardHeader>
          <CardContent className="min-h-0 overflow-y-auto">
            <form id="product-form" onSubmit={submit} className="space-y-4">
              <div className="space-y-2"><Label>{t('productName')} (VI)</Label><Input value={form.names.vi} onChange={(event) => setForm({ ...form, names: { ...form.names, vi: event.target.value } })} /></div>
              <div className="space-y-2"><Label>{t('productName')} (EN)</Label><Input value={form.names.en} onChange={(event) => setForm({ ...form, names: { ...form.names, en: event.target.value } })} /></div>
              <div className="space-y-2"><Label>{t('productName')} (繁中)</Label><Input value={form.names['zh-TW']} onChange={(event) => setForm({ ...form, names: { ...form.names, 'zh-TW': event.target.value } })} /></div>
              <div className="space-y-2"><Label>{t('categories')}</Label><select className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">{t('chooseCategory')}</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.names[locale] || category.names.vi || category.names.en || category.names['zh-TW']}</option>)}</select></div>
              <div className="grid grid-cols-3 gap-2">{(['base', 'uber', 'foodpanda'] as const).map((type) => <div key={type} className="space-y-2"><Label className="capitalize">{type}</Label><Input type="number" value={form.price[type] ?? 0} onChange={(event) => setForm({ ...form, price: { ...form.price, [type]: Number(event.target.value) } })} /></div>)}</div>
              <div className="space-y-2"><Label>{t('variants')} <span className="font-normal text-muted-foreground">{t('commaSeparated')}</span></Label><Input value={variantInputs.vi} onChange={(event) => setVariantInputs({ ...variantInputs, vi: event.target.value })} placeholder={`${t('variantPlaceholder')} (VI)`} /><Input value={variantInputs.en} onChange={(event) => setVariantInputs({ ...variantInputs, en: event.target.value })} placeholder={`${t('variantPlaceholder')} (EN)`} /><Input value={variantInputs['zh-TW']} onChange={(event) => setVariantInputs({ ...variantInputs, 'zh-TW': event.target.value })} placeholder={`${t('variantPlaceholder')} (繁中)`} /></div>
              <div className="space-y-2"><Label>{t('notes')} <span className="font-normal text-muted-foreground">{t('commaSeparated')}</span></Label><Input value={noteOptionInputs.vi} onChange={(event) => setNoteOptionInputs({ ...noteOptionInputs, vi: event.target.value })} placeholder={`${t('notePlaceholder')} (VI)`} /><Input value={noteOptionInputs.en} onChange={(event) => setNoteOptionInputs({ ...noteOptionInputs, en: event.target.value })} placeholder={`${t('notePlaceholder')} (EN)`} /><Input value={noteOptionInputs['zh-TW']} onChange={(event) => setNoteOptionInputs({ ...noteOptionInputs, 'zh-TW': event.target.value })} placeholder={`${t('notePlaceholder')} (繁中)`} /></div>
              <div className="space-y-2"><Label>{t('addons')}</Label><div className="grid grid-cols-2 gap-2 rounded-lg border p-3">{addons.map((addon) => <label key={addon._id} className="flex min-w-0 items-center gap-2 text-sm"><Checkbox checked={form.addons.includes(addon._id)} onCheckedChange={(checked) => setForm({ ...form, addons: checked ? [...form.addons, addon._id] : form.addons.filter((id) => id !== addon._id) })} /><span className="truncate">{addon.names[locale] || addon.names.vi || addon.names.en || addon.names['zh-TW']} (+{addon.priceExtra.toLocaleString(locale)})</span></label>)}</div></div>
              <div className="space-y-2"><Label>{t('description')} (VI)</Label><Textarea className="min-h-12 resize-none" placeholder={t('descriptionPlaceholder')} value={form.description.vi} onChange={(event) => setForm({ ...form, description: { ...form.description, vi: event.target.value } })} /></div>
              <div className="space-y-2"><Label>{t('description')} (EN)</Label><Textarea className="min-h-12 resize-none" placeholder={t('descriptionPlaceholder')} value={form.description.en} onChange={(event) => setForm({ ...form, description: { ...form.description, en: event.target.value } })} /></div>
              <div className="space-y-2"><Label>{t('description')} (繁中)</Label><Textarea className="min-h-12 resize-none" placeholder={t('descriptionPlaceholder')} value={form.description['zh-TW']} onChange={(event) => setForm({ ...form, description: { ...form.description, 'zh-TW': event.target.value } })} /></div>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: checked === true })} />{t('selling')}</label>
            </form>
          </CardContent>
        </Card>
        <Card className="flex min-h-0 flex-col overflow-hidden [&>div:last-child]:flex-1 [&>div:last-child]:min-h-0 [&>div:last-child]:overflow-hidden [&>div:last-child>div]:h-full [&>div:last-child>div]:!max-h-none">
          <CardHeader className="shrink-0"><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>{t('productList')}</CardTitle><div className="flex flex-wrap items-center justify-end gap-1"><span className="mr-2 text-xs text-muted-foreground">{t('productTotal')}: {filteredItems.length}</span><select aria-label={t('categories')} className="h-8 max-w-40 rounded-md border bg-background px-2 text-xs" value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(1) }}><option value="">{t('allCategories')}</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.names[locale] || category.names.vi || category.names.en || category.names['zh-TW']}</option>)}</select><span className="ml-1 text-xs text-muted-foreground">{currentPage}/{totalPages}</span><Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage((current) => current - 1)}>‹</Button><Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setPage((current) => current + 1)}>›</Button></div></div></CardHeader>
          <CardContent className="min-h-0"><div className="max-h-[calc(100svh-220px)] overflow-auto"><Table><TableHeader><TableRow><TableHead className="h-8 px-2 py-1 text-xs">{t('name')}</TableHead><TableHead className="h-8 px-2 py-1 text-xs">{t('categories')}</TableHead><TableHead className="h-8 px-2 py-1 text-xs">{t('price')}</TableHead><TableHead className="h-8 px-2 py-1 text-xs">{t('status')}</TableHead><TableHead className="h-8 px-2 py-1 text-right text-xs">{t('actions')}</TableHead></TableRow></TableHeader><TableBody>{isLoading ? <TableRow><TableCell className="px-2 py-1 text-xs" colSpan={5}>{t('loading')}</TableCell></TableRow> : items.map((item) => <TableRow key={item._id}><TableCell className="px-2 py-1 text-xs font-medium">{item.name}</TableCell><TableCell className="px-2 py-1 text-xs">{item.categoryName || '—'}</TableCell><TableCell className="px-2 py-1 text-xs">{(item.price.base || 0).toLocaleString()}</TableCell><TableCell className="px-2 py-1 text-xs">{item.active ? t('selling') : t('hidden')}</TableCell><TableCell className="space-x-1 px-2 py-1 text-right"><Button className="min-w-20" size="sm" variant="outline" onClick={() => edit(item)}>{t('edit')}</Button><Button className="min-w-20" size="sm" variant="outline" onClick={() => copy(item)}>{t('copy')}</Button><AlertDialog><AlertDialogTrigger asChild><Button className="min-w-20" size="sm" variant="destructive">{t('delete')}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle><AlertDialogDescription>{t('confirmDeleteProduct')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="min-w-20">{t('cancel')}</AlertDialogCancel><AlertDialogAction className="min-w-20" variant="destructive" onClick={() => remove.mutate(item._id)}>{t('confirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell></TableRow>)}</TableBody></Table></div></CardContent>
        </Card>
      </div>
      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t(confirmAction === 'update' ? 'confirmUpdateProduct' : 'confirmCreateProduct')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-w-20">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="min-w-20" onClick={confirmSave}>{t('confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
