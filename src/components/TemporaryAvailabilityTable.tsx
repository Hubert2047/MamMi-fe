'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Item } from '@/api/item'
import { updateTemporaryStoreItemAvailability } from '@/api/store-item'
import { useI18n } from '@/lib/i18n'

type Props = {
  open: boolean
  items: Item[]
  onClose: () => void
}

export default function TemporaryAvailabilityTable({ open, items, onClose }: Props) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: updateTemporaryStoreItemAvailability,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
    onSettled: () => setPendingItemId(null),
    onError: () => toast.error(t('temporaryAvailabilityError')),
  })
  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.categoryName).filter(Boolean))).sort(), [items])
  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    return items
      .filter((item) => item.permanentlyActive)
      .filter((item) => category === 'all' || item.categoryName === category)
      .filter((item) => !normalizedSearch || item.name.toLocaleLowerCase().includes(normalizedSearch))
      .sort((left, right) => left.name.localeCompare(right.name))
  }, [category, items, search])

  return <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
    <DialogContent className="flex h-[90vh] min-w-0 w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col overflow-hidden px-3 sm:px-4">
      <DialogHeader><DialogTitle>{t('temporaryAvailabilityTitle')}</DialogTitle></DialogHeader>
      <div className="flex flex-wrap gap-2">
        <Input className="max-w-sm" placeholder={t('temporaryAvailabilitySearch')} value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-52"><SelectValue placeholder={t('temporaryAvailabilityCategory')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('temporaryAvailabilityAllCategories')}</SelectItem>
            {categories.map((itemCategory) => <SelectItem key={itemCategory} value={itemCategory}>{itemCategory}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto rounded-md border [&>[data-slot=table-container]]:overflow-x-hidden">
        <Table className="w-full min-w-0 table-fixed">
          <TableHeader><TableRow><TableHead className="w-[50%] whitespace-normal break-words">{t('name')}</TableHead><TableHead className="w-[35%] whitespace-normal break-words">{t('categories')}</TableHead><TableHead className="w-[15%] whitespace-normal break-words text-center leading-tight">{t('temporaryUnavailable')}</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? <TableRow><TableCell colSpan={3} className="py-10 text-center text-muted-foreground">{t('temporaryAvailabilityEmpty')}</TableCell></TableRow> : filteredItems.map((item) => <TableRow key={item._id}>
              <TableCell className="whitespace-normal break-words font-medium">{item.name}</TableCell>
              <TableCell className="max-w-0 truncate" title={item.categoryName}>{item.categoryName || '—'}</TableCell>
              <TableCell className="text-center"><div className="flex justify-center">{pendingItemId === item._id ? <Loader2 className="size-4 animate-spin text-primary" aria-label={t('loading')} /> : <Checkbox checked={item.temporarilyUnavailable} disabled={mutation.isPending} aria-label={`${t('temporaryUnavailable')} ${item.name}`} onCheckedChange={(checked) => { setPendingItemId(item._id); mutation.mutate({ itemId: item._id, temporarilyUnavailable: checked === true }) }} />}</div></TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  </Dialog>
}
