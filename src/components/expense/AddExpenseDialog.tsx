import { createExpense, getExpenseUnits, type ExpenseUnit } from '@/api/expense'
import { createInventoryReceipt, getInventoryItems } from '@/api/inventory'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { useI18n } from '@/lib/i18n'
import { X } from 'lucide-react'

type Props = {
    open: boolean
    onClose: () => void
    initialEntryType?: 'other' | 'inventory_purchase'
}

export function AddExpenseDialog({ open, onClose, initialEntryType = 'other' }: Props) {
    const { t, locale } = useI18n()
    const queryClient = useQueryClient()
    const { data: units = [] } = useQuery<ExpenseUnit[]>({ queryKey: ['expense-units'], queryFn: () => getExpenseUnits(), staleTime: 5 * 60 * 1000 })
    const { data: inventoryItems = [] } = useQuery({ queryKey: ['inventory-items'], queryFn: getInventoryItems })
    const [entryType, setEntryType] = useState<'other' | 'inventory_purchase'>(initialEntryType)
    const [inventorySearch, setInventorySearch] = useState('')
    const [inventoryPickerOpen, setInventoryPickerOpen] = useState(false)
    const [unitSearch, setUnitSearch] = useState('')
    const [unitPickerOpen, setUnitPickerOpen] = useState(false)
    const nameInputRef = useRef<HTMLInputElement>(null)
    const inventorySearchRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) {
            requestAnimationFrame(() => (entryType === 'other' ? nameInputRef.current : inventorySearchRef.current)?.focus())
        }
    }, [entryType, open])

    const [formData, setFormData] = useState({
        name: '',
        quantity: '1',
        unit: '',
        unitPrice: '',
        price: '',
        note: '',
        category: 'other',
    })

    const createMutation = useMutation({
        mutationFn: createExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] })
            toast.success(t('createSuccess'), {
                closeButton: true,
                duration: 1500,
            })
            onClose()
            setFormData({ name: '', quantity: '1', unit: '', unitPrice: '', price: '', note: '', category: 'other' })
            setInventorySearch('')
            setUnitSearch('')
        },
        onError: () => {
            toast.error(t('createFailure'))
        },
    })
    const receiptMutation = useMutation({
        mutationFn: createInventoryReceipt,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); queryClient.invalidateQueries({ queryKey: ['inventory-stock'] }); toast.success(t('createSuccess')); onClose() },
        onError: () => toast.error(t('createFailure')),
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const adjustQuantity = (amount: number) => {
        setFormData((prev) => ({
            ...prev,
            quantity: String(Math.max(0.001, Number(prev.quantity || 0) + amount)),
        }))
    }

    const filteredInventoryItems = inventoryItems.filter((item) => item.name.toLocaleLowerCase().includes(inventorySearch.toLocaleLowerCase().trim()))
    const unitLabel = (unit: ExpenseUnit) => unit.names[locale] || unit.names.vi || unit.code
    const selectedInventoryItem = inventoryItems.find((item) => item._id === formData.name)
    const allowedUnitCodes = entryType === 'inventory_purchase' && selectedInventoryItem
        ? new Set(selectedInventoryItem.purchaseUnits.map((unit) => unit.unitCode))
        : null
    const filteredUnits = units.filter((unit) => (!allowedUnitCodes || allowedUnitCodes.has(unit.code)) && unitLabel(unit).toLocaleLowerCase().includes(unitSearch.toLocaleLowerCase().trim()))

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (entryType === 'inventory_purchase') {
            if (!formData.name) { toast.warning(t('requiredName')); return }
            receiptMutation.mutate({ lines: [{ inventoryItemId: formData.name, quantity: Number(formData.quantity), unitCode: formData.unit, unitPrice: Number(formData.unitPrice) }] })
            return
        }
        if (!formData.name) {
            toast.warning(t('requiredName'))
            return
        }

        if (!formData.unitPrice) {
            toast.warning(t('requiredPrice'))
            return
        }

        createMutation.mutate({
            name: formData.name,
            quantity: Number(formData.quantity),
            unit: formData.unit,
            unitPrice: Number(formData.unitPrice),
            price: Number(formData.quantity) * Number(formData.unitPrice),
            note: formData.note,
            category: formData.category,
        })
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) onClose()
            }}>
            <DialogContent onOpenAutoFocus={(event) => { event.preventDefault(); (entryType === 'other' ? nameInputRef.current : inventorySearchRef.current)?.focus() }} className='top-1 max-h-[calc(100dvh-1rem)] translate-y-0 overflow-y-auto sm:max-w-2xl'>
                <form onSubmit={handleSubmit}>
                    <div className='mb-3 flex flex-wrap items-center justify-start gap-3'>
                        <DialogHeader className='shrink-0 self-center'>
                            <DialogTitle className='text-black! font-bold! text-xl'>{t('expenseAddTitle')}</DialogTitle>
                        </DialogHeader>
                        <div className='flex shrink-0 items-center gap-2 self-center'><Button type='button' size='default' className='h-8 px-3' variant={entryType === 'other' ? 'default' : 'outline'} onClick={() => setEntryType('other')}>Chi phí khác</Button><Button type='button' size='default' className='h-8 px-3' variant={entryType === 'inventory_purchase' ? 'default' : 'outline'} onClick={() => setEntryType('inventory_purchase')}>Nhập nguyên liệu</Button></div>
                    </div>

                    <FieldGroup className='sm:grid sm:grid-cols-3 sm:gap-x-4 sm:gap-y-3'>
                        <Field className={entryType === 'other' ? 'sm:col-span-2' : 'sm:col-span-3'}>
                            <Label htmlFor='name-1'>{t('expenseName')}</Label>
                            {entryType === 'inventory_purchase' ? <div className='relative'>
                                <Input className='pr-9' ref={inventorySearchRef} value={inventorySearch} placeholder={locale === 'en' ? 'Search ingredients...' : locale === 'zh-TW' ? '搜尋原料...' : 'Tìm nguyên liệu...'} onFocus={() => setInventoryPickerOpen(true)} onBlur={() => window.setTimeout(() => setInventoryPickerOpen(false), 120)} onChange={(event) => { setInventorySearch(event.target.value); setInventoryPickerOpen(true); setFormData((prev) => ({ ...prev, name: '', unit: '' })) }} />
                                {inventorySearch && <button type='button' aria-label={locale === 'en' ? 'Clear ingredient search' : locale === 'zh-TW' ? '清除原料搜尋' : 'Xóa tìm nguyên liệu'} className='absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground' onMouseDown={(event) => event.preventDefault()} onClick={() => { setInventorySearch(''); setFormData((prev) => ({ ...prev, name: '', unit: '' })); setInventoryPickerOpen(true); inventorySearchRef.current?.focus() }}><X className='size-4' /></button>}
                                {inventoryPickerOpen && <div className='absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md'>
                                    {filteredInventoryItems.length ? filteredInventoryItems.map((item) => <button className='block w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent' key={item._id} type='button' onMouseDown={(event) => event.preventDefault()} onClick={() => { const selectedUnit = units.find((unit) => unit.code === item.stockUnitCode); setInventorySearch(item.name); setUnitSearch(selectedUnit ? unitLabel(selectedUnit) : item.stockUnitCode); setFormData((prev) => ({ ...prev, name: item._id, unit: item.stockUnitCode })); setInventoryPickerOpen(false) }}>{item.name}</button>) : <div className='px-3 py-2 text-sm text-muted-foreground'>{locale === 'en' ? 'No ingredients found' : locale === 'zh-TW' ? '找不到原料' : 'Không tìm thấy nguyên liệu'}</div>}
                                </div>}
                            </div> : <Input ref={nameInputRef} id='name-1' name='name' autoFocus value={formData.name} onChange={handleChange} />}
                        </Field>

                        {entryType === 'other' && <Field className='sm:col-span-1'>
                            <Label>Nhóm chi phí</Label>
                            <select className='h-9 w-full rounded-md border bg-background px-3 text-sm' value={formData.category} onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}>
                                <option value='other'>Khác</option><option value='utilities'>Điện nước</option><option value='rent'>Thuê mặt bằng</option><option value='transport'>Vận chuyển</option><option value='maintenance'>Sửa chữa</option><option value='salary'>Nhân sự</option>
                            </select>
                        </Field>}

                        <Field>
                            <Label htmlFor='quantity-1'>{t('expenseQuantity')}</Label>
                            <div className='flex items-center gap-1'>
                                <Button type='button' variant='outline' size='icon' aria-label='Giảm số lượng' onClick={() => adjustQuantity(-1)}>−</Button>
                                <Input className='min-w-0 text-center' id='quantity-1' name='quantity' type='number' min='0.001' step='any' value={formData.quantity} onChange={handleChange} />
                                <Button type='button' variant='outline' size='icon' aria-label='Tăng số lượng' onClick={() => adjustQuantity(1)}>+</Button>
                            </div>
                        </Field>

                        <Field>
                            <Label htmlFor='unit-1'>{t('expenseUnit')}</Label>
                            <div className='relative'>
                                <Input className='pr-9' value={unitSearch} placeholder={t('expenseUnit')} onFocus={() => setUnitPickerOpen(true)} onBlur={() => window.setTimeout(() => setUnitPickerOpen(false), 120)} onChange={(event) => { setUnitSearch(event.target.value); setUnitPickerOpen(true); setFormData((prev) => ({ ...prev, unit: '' })) }} />
                                {unitSearch && <button type='button' aria-label={locale === 'en' ? 'Clear unit search' : locale === 'zh-TW' ? '清除單位搜尋' : 'Xóa tìm đơn vị'} className='absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground' onMouseDown={(event) => event.preventDefault()} onClick={() => { setUnitSearch(''); setFormData((prev) => ({ ...prev, unit: '' })); setUnitPickerOpen(true) }}><X className='size-4' /></button>}
                                {unitPickerOpen && <div className='absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md'>
                                    {filteredUnits.length ? filteredUnits.map((unit) => <button className='block w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent' key={unit.code} type='button' onMouseDown={(event) => event.preventDefault()} onClick={() => { setUnitSearch(unitLabel(unit)); setFormData((prev) => ({ ...prev, unit: unit.code })); setUnitPickerOpen(false) }}>{unitLabel(unit)}</button>) : <div className='px-3 py-2 text-sm text-muted-foreground'>{locale === 'en' ? 'No units found' : locale === 'zh-TW' ? '找不到單位' : 'Không tìm thấy đơn vị'}</div>}
                                </div>}
                            </div>
                        </Field>

                        <Field>
                            <Label htmlFor='unit-price-1'>{t('expenseUnitPrice')}</Label>
                            <Input id='unit-price-1' name='unitPrice' type='number' min='0' value={formData.unitPrice} onChange={handleChange} />
                        </Field>

                        <Field className='sm:col-span-3'>
                            <Label htmlFor='note-1'>{t('expenseNote')}</Label>
                            <Input id='note-1' name='note' value={formData.note} onChange={handleChange} />
                        </Field>
                    </FieldGroup>

                    <DialogFooter className='mt-4 pb-4'>
                        <DialogClose asChild>
                            <Button className='h-10 min-w-24 px-4' variant='outline'>{t('cancel')}</Button>
                        </DialogClose>

                        <Button className='h-10 min-w-24 px-4' type='submit' disabled={createMutation.isPending}>
                            {createMutation.isPending ? t('saving') : t('save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
