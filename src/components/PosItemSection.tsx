import { Button } from '@/components/ui/button.tsx'
import type { Item } from '@/api/item.ts'
import { Label } from '@/components/ui/label.tsx'
import { Input } from '@/components/ui/input.tsx'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.tsx'
import NumPad from '@/components/NumPad.tsx'
import React from 'react'
import { updateOrderPayment, type BaseOrder, type OrderItem } from '@/api/order.ts'
import { DEFAULT_ORDER_ITEM, PAYMENT_METHOD_ICONS, type PaymentMethod } from '@/constants'
import { capitalize, generateUUID, getPriceByType } from '@/lib/utils.ts'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Loading from './Loading'
import { useI18n } from '@/lib/i18n'
import { calculateOrderItemTotal, getUnavailableAddonIds } from '@/lib/posCalculations'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { getCatalogAddonPromotionPrice, getCatalogProductPromotionPrice, type Promotion } from '@/api/promotion'

type Props = {
    isDetail: boolean
    isOrderEditing: boolean
    currentOrder: BaseOrder
    currentOrderNumber: number
    promotions: Promotion[]
    itemsByCategory: Record<string, Item[]>
    selectedCategory: string
    selectedItem: Item | null
    filteredItems: Item[]
    currentOrderItem: OrderItem
    isEditItem: boolean
    setCurrentOrderItem: React.Dispatch<React.SetStateAction<OrderItem>>
    setCurrentOrder: React.Dispatch<React.SetStateAction<BaseOrder>>
    setSelectedCategory: React.Dispatch<React.SetStateAction<string>>
    setSelectedItem: React.Dispatch<React.SetStateAction<Item | null>>
    setIsEditItem: React.Dispatch<React.SetStateAction<boolean>>
    promotionInfoOpen: boolean
    setPromotionInfoOpen: React.Dispatch<React.SetStateAction<boolean>>
}

function PosItemSection({
    isDetail,
    isOrderEditing,
    currentOrder,
    itemsByCategory,
    selectedCategory,
    selectedItem,
    setSelectedCategory,
    filteredItems,
    isEditItem,
    currentOrderItem,
    setCurrentOrderItem,
    setCurrentOrder,
    setSelectedItem,
    setIsEditItem,
    promotionInfoOpen,
    setPromotionInfoOpen,
    currentOrderNumber,
    promotions,
}: Props) {
    const queryClient = useQueryClient()
    const { locale, t } = useI18n()
    const optionName = (option: { names: { vi: string; en: string; 'zh-TW': string } }) => option.names[locale] || option.names.vi || option.names.en || option.names['zh-TW']
    const catalogItems = Object.values(itemsByCategory).flat()
    const catalogAddons = catalogItems.flatMap((item) => item.addons)
    const visiblePromotions = promotions.filter((promotion) => {
        const now = new Date()
        return promotion.mode === 'automatic' && (!promotion.startsAt || new Date(promotion.startsAt) <= now) && (!promotion.endsAt || new Date(promotion.endsAt) >= now)
    })
    const labelsFor = (ids: string[] | undefined, entries: Array<{ _id: string; name: string }>, allLabel: string) => !ids?.length ? allLabel : ids.map((id) => entries.find((entry) => entry._id === id)?.name || id).join(', ')
    const targetLabel = (target: Promotion['rules'][number]['target']) => target === 'order' ? t('targetOrder') : target === 'product' ? t('targetProduct') : target === 'addon' ? t('targetAddon') : t('targetLine')
    const formatPromotionDate = (value?: string | null) => value ? new Intl.DateTimeFormat(locale === 'zh-TW' ? 'zh-TW' : locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
    const selectedItemPrice = calculateOrderItemTotal(currentOrderItem)
    const selectedItemOriginalPrice = selectedItem ? getPriceByType(currentOrder.type, selectedItem.price) : 0
    const selectedItemPromotionPrice = selectedItem
        ? getCatalogProductPromotionPrice({ productId: selectedItem._id, price: selectedItemOriginalPrice, promotions, includeConditional: true })
        : 0
    const selectedItemAddonPromotionTotal = selectedItem
        ? currentOrderItem.addons.reduce((total, addon) => total + addon.amount * getCatalogAddonPromotionPrice({ productId: selectedItem._id, addonId: addon.id, price: addon.priceExtra, promotions }) * currentOrderItem.quantity, 0)
        : 0
    const selectedItemPromotionTotal = selectedItem
        ? selectedItemPromotionPrice * currentOrderItem.quantity + selectedItemAddonPromotionTotal
        : 0
    const unavailableAddonIds = selectedItem ? getUnavailableAddonIds(selectedItem, currentOrderItem.addons.map((addon) => addon.id)) : []
    const selectionUnavailable = selectedItem?.temporarilyUnavailable === true || unavailableAddonIds.length > 0
    const isReadOnly = isDetail && !isOrderEditing
    const displayItemName = (item: Item) => {
        const name = item.name.trim()
        const category = item.categoryName.trim()
        if (!category || name.localeCompare(category, undefined, { sensitivity: 'accent' }) === 0) return name
        const prefix = new RegExp(`^${category.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}(?:\\s*[-:|–—]\\s*|\\s+)`, 'i')
        return name.replace(prefix, '').trim() || name
    }
    const updateOrderMutation = useMutation({
        mutationFn: updateOrderPayment,
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) => query.queryKey[0] === 'sale-by-payment' || query.queryKey[0] === 'orders',
            })
        },
        onError: () => {
            toast.error(t('updateFailure'))
        },
    })
    const selectItem = (item: Item) => {
        let variant = ''
        if (item.variants.length > 0) {
            variant = item.variants[0]?.id || ''
        }
        setCurrentOrderItem((prev) => ({
            ...prev,
            id: item._id,
            itemId: generateUUID(),
            number: currentOrderNumber,
            name: item.name,
            variant,
            basePrice: getPriceByType(currentOrder.type, item.price),
            addons: item.type === 'combo' ? [] : prev.addons,
            componentSelections: item.type === 'combo' ? (item.components || []).flatMap((component, index) => { const componentItem = catalogItems.find((candidate) => candidate._id === component.itemId); return Array.from({ length: component.quantity }, (_, instance) => ({ componentId: `${component.itemId}-${index}-${instance}`, itemId: component.itemId, noteOptions: [], note: '', name: componentItem?.name || component.itemId })) }) : [],
        }))
        setSelectedItem(item)
    }
    const addItem = () => {
        if (selectionUnavailable) {
            toast.error(t('selectionUnavailable'))
            return
        }
        setCurrentOrder((prev) => ({ ...prev, items: [...prev.items, currentOrderItem] }))
        if (isDetail && isOrderEditing) {
            setIsEditItem(true)
            return
        }
        setCurrentOrderItem(DEFAULT_ORDER_ITEM)
        setSelectedItem(null)
    }
    const cancelAddItem = () => {
        if (isDetail && isEditItem) {
            const originalItem = currentOrder.items.find((item) => item.itemId === currentOrderItem.itemId)
            if (originalItem) {
                setCurrentOrderItem(originalItem)
                return
            }
        }
        setCurrentOrderItem(DEFAULT_ORDER_ITEM)
        setSelectedItem(null)
        setIsEditItem(false)
    }
    const updateItem = () => {
        if (selectionUnavailable) {
            toast.error(t('selectionUnavailable'))
            return
        }
        setCurrentOrder((prev) => {
            const items = prev.items.map((i) => {
                if (i.itemId === currentOrderItem.itemId) return currentOrderItem
                return i
            })
            return { ...prev, items }
        })
        setIsEditItem(true)
    }
    const deleteItem = () => {
        setCurrentOrder((prev) => {
            const items = prev.items.filter((i) => {
                return i.itemId !== currentOrderItem.itemId
            })
            return { ...prev, items }
        })
        setCurrentOrderItem(DEFAULT_ORDER_ITEM)
        setSelectedItem(null)
        setIsEditItem(false)
    }

    const handleUpdateOrder = async () => {
        await updateOrderMutation.mutateAsync({
            id: currentOrder._id,
            data: { paymentMethod: currentOrder.paymentMethod, version: currentOrder.version },
        })
        toast.success(t('updateSuccess'))
    }
    return (
        <>
            {updateOrderMutation.isPending && <Loading />}
            <Dialog open={promotionInfoOpen} onOpenChange={setPromotionInfoOpen}>
                <DialogContent className='top-[8%] max-h-[88dvh] w-[min(94vw,40rem)] max-w-none translate-y-0 overflow-y-auto sm:max-w-none'>
                    <div className='space-y-4'>
                        <DialogTitle className='text-xl'>{t('promotions')}</DialogTitle>
                        {visiblePromotions.length === 0 ? <p className='text-sm text-muted-foreground'>{t('emptyPromotions')}</p> : visiblePromotions.map((promotion) => <div className='rounded-lg border p-3' key={promotion._id}>
                            <div className='flex flex-wrap items-start justify-between gap-2'>
                                <div>
                                    <p className='text-lg font-semibold'>{promotion.names[locale] || promotion.name}</p>
                                    {promotion.minSubtotal !== undefined && promotion.minSubtotal > 0 ? <p className='mt-1 text-sm font-semibold text-foreground'>{t('minSubtotal')}: {promotion.minSubtotal.toLocaleString(locale)}</p> : null}
                                </div>
                                <div className='text-right text-xs text-muted-foreground'>
                                    <p>{t('startsAt')}: {formatPromotionDate(promotion.startsAt)}<br />{t('endsAt')}: {formatPromotionDate(promotion.endsAt)}</p>
                                </div>
                            </div>
                            <div className='mt-3 space-y-2'>
                                {promotion.rules.map((rule, index) => <div className='rounded-md bg-muted/50 px-2.5 py-2 text-sm' key={index}>
                                    <div className='flex flex-wrap items-center justify-between gap-2'><span className='font-medium'>{targetLabel(rule.target)}</span><span className='font-semibold text-primary'>-{rule.reward.type === 'percent' ? `${rule.reward.amount}%` : rule.reward.amount}</span></div>
                                    <p className='mt-1 text-xs text-muted-foreground'>{rule.target === 'order' ? t('promotionPreviewOrderScope') : rule.target === 'addon' ? labelsFor(rule.addonIds, catalogAddons, t('promotionPreviewAllAddons')) : labelsFor(rule.productIds, catalogItems, t('promotionPreviewAllProducts'))}</p>
                                </div>)}
                            </div>
                        </div>)}
                    </div>
                </DialogContent>
            </Dialog>
            <div className='categories flex w-26 flex-col gap-2 rounded border border-[#ccc] p-1'>
                {!isReadOnly &&
                    Object.keys(itemsByCategory).map((categoryName) => {
                        return (
                            <Button
                                key={categoryName}
                                className='h-10'
                                variant={categoryName === selectedCategory ? 'default' : 'outline'}
                                onClick={() => {
                                    if (selectedItem) {
                                        toast.error(t('cancelPosItemBeforeCategory'))
                                        return
                                    }
                                    setSelectedCategory(categoryName)
                                }}>
                                {categoryName}
                            </Button>
                        )
                    })}
            </div>
            <div className='select-items flex h-full w-50 flex-1 flex-wrap items-start justify-start gap-2 rounded border border-[#ccc] p-1'>
                {selectedItem === null ? (
                    <div className='w-full'>
                        <div className='grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2'>
                        {filteredItems.map((item) => (
                            <Button
                                key={item._id}
                                className='h-auto min-h-18 w-full px-2 py-1.5'
                                variant='default'
                                disabled={item.temporarilyUnavailable === true}
                                onClick={() => selectItem(item)}>
                                    <div className='flex min-w-0 w-full justify-center items-center flex-col gap-1'>
                                        <span className='w-full truncate text-sm' title={item.name}>{displayItemName(item)}</span>
                                        {item.temporarilyUnavailable ? <span>{t('temporaryUnavailableShort')}</span> : (() => {
                                            const originalPrice = getPriceByType(currentOrder.type, item.price)
                                            const promotionPrice = getCatalogProductPromotionPrice({ productId: item._id, price: originalPrice, promotions, includeConditional: true })
                                            return promotionPrice < originalPrice ? <div className='flex flex-col items-center leading-tight'><span className='text-[11px] text-primary-foreground/70'>{t('originalPrice')}: <span className='line-through'>{originalPrice.toLocaleString(locale)}</span></span><span className='mt-0.5 text-base font-bold text-primary-foreground'>{t('price')}: {promotionPrice.toLocaleString(locale)}</span></div> : <span>{t('price')}: {originalPrice.toLocaleString(locale)}</span>
                                        })()}
                                    </div>
                            </Button>
                        ))}
                        </div>
                    </div>
                ) : (
                    <div className='flex h-full min-h-0 min-w-0 flex-1 flex-col'>
                        <div className='min-h-0 flex-1 space-y-3 overflow-y-auto pr-2'>
                        <div className='border-b pb-2'><div className='text-xs font-semibold uppercase tracking-wide text-primary'>{t(isEditItem ? 'posEditItem' : 'posAddItem')}</div><div className='mt-1 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1'><p className='min-w-0 flex-1 truncate text-xl' title={currentOrderItem.name}>{currentOrderItem.name}</p><div className='shrink-0 text-right text-sm'>{selectedItemPromotionTotal < selectedItemPrice ? <div className='flex flex-col'><span className='text-xs text-muted-foreground'>{t('originalPrice')}: <span className='line-through'>{selectedItemPrice.toLocaleString(locale)}</span></span><span className='text-lg font-bold text-primary'>{t('price')}: {selectedItemPromotionTotal.toLocaleString(locale)}</span></div> : <span className='text-lg font-bold text-primary'>{t('price')}: {selectedItemPrice.toLocaleString(locale)}</span>}</div></div></div>
                        {selectionUnavailable && <div className='rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive'>{t('selectionUnavailable')}</div>}
                        <div className='variant flex justify-start items-center gap-4'>
                            <Label className='block w-27 font-semibold text-start'>{t('quantity')}:</Label>
                            <Input
                                id='amount'
                                disabled={isReadOnly}
                                value={currentOrderItem.quantity}
                                onChange={(e) => {
                                    setCurrentOrderItem((prev) => ({
                                        ...prev,
                                        quantity: Number(e.target.value),
                                    }))
                                }}
                            />
                        </div>
                        {/* variants */}
                        {selectedItem.variants.length > 0 && (
                            <div className='variants flex justify-start items-center gap-4'>
                                <Label className='block w-27 font-semibold text-start'>{t('variant')}:</Label>
                                <RadioGroup
                                    value={selectedItem.variants.find((option) => option.id === currentOrderItem.variant || optionName(option) === currentOrderItem.variant)?.id || currentOrderItem.variant}
                                    onValueChange={(value) => {
                                        if (isReadOnly) return
                                        setCurrentOrderItem((prev) => ({ ...prev, variant: value }))
                                    }}
                                    className='flex gap-4'>
                                    {selectedItem.variants?.map((variant) => (
                                        <div key={variant.id} className='flex items-center space-x-2'>
                                            <RadioGroupItem value={variant.id} id={variant.id} />
                                            <Label htmlFor={variant.id}>{optionName(variant)}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        )}
                        {/* note options */}
                        {selectedItem.noteOptions.length > 0 && (
                            <div className='note-options flex justify-start items-center gap-4'>
                                <Label className='block w-22 font-semibold text-start'>{t('noAddons')}: </Label>
                                <ToggleGroup
                                    size='lg'
                                    variant='outline'
                                    type='multiple'
                                    spacing={2}
                                    className='w-full flex-wrap gap-2'
                                    value={currentOrderItem.noteOptions.map((value) => selectedItem.noteOptions.find((option) => option.id === value || optionName(option) === value)?.id || value)}
                                    onValueChange={(value) => {
                                        if (isReadOnly) return
                                        setCurrentOrderItem((prev) => ({ ...prev, noteOptions: value }))
                                    }}>
                                    {selectedItem.noteOptions.map((note) => (
                                            <ToggleGroupItem key={note.id} className='h-auto min-h-8 min-w-16 max-w-28 rounded-lg whitespace-normal break-words border-primary/40 px-1.5 py-1 text-sm text-center leading-tight data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-primary/10' value={note.id}>
                                            {optionName(note)}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </div>
                        )}
                        {selectedItem.type === 'combo' && (currentOrderItem.componentSelections || []).length > 0 && (
                            <div className='space-y-2 rounded border p-3'>
                                <Label className='font-semibold'>{t('comboComponents')}</Label>
                                <div className='max-h-64 space-y-2 overflow-y-auto'>
                                    {(currentOrderItem.componentSelections || []).map((component, index) => { const componentItem = catalogItems.find((candidate) => candidate._id === component.itemId); if (!componentItem) return null; return <details key={component.componentId} className='rounded border px-3 py-2' open={index === 0}><summary className='cursor-pointer text-sm font-medium'>{component.name || componentItem.name}{(currentOrderItem.componentSelections || []).filter((entry) => entry.itemId === component.itemId).length > 1 ? ` ${index + 1}` : ''}<span className='ml-2 text-xs text-muted-foreground'>{component.noteOptions.length ? component.noteOptions.map((id) => optionName(componentItem.noteOptions.find((option) => option.id === id) || { names: { vi: id, en: id, 'zh-TW': id } })).join(', ') : t('noNoteSelected')}</span></summary><div className='mt-2 space-y-2'>{componentItem.noteOptions.length > 0 && <ToggleGroup type='multiple' variant='outline' className='flex-wrap gap-2' value={component.noteOptions} onValueChange={(value) => setCurrentOrderItem((prev) => ({ ...prev, componentSelections: (prev.componentSelections || []).map((entry) => entry.componentId === component.componentId ? { ...entry, noteOptions: value } : entry) }))}>{componentItem.noteOptions.map((option) => <ToggleGroupItem key={option.id} value={option.id} className='h-auto min-h-8 whitespace-normal px-2 py-1 text-sm'>{optionName(option)}</ToggleGroupItem>)}</ToggleGroup>}{<Input value={component.note} placeholder={t('note')} onChange={(event) => setCurrentOrderItem((prev) => ({ ...prev, componentSelections: (prev.componentSelections || []).map((entry) => entry.componentId === component.componentId ? { ...entry, note: event.target.value } : entry) }))} />}</div></details> })}
                                </div>
                            </div>
                        )}
                        {/* add-on */}
                        {selectedItem.addons.length > 0 && (
                            <div className='add-on flex justify-start items-center mt-6 gap-4'>
                                <Label className='block font-semibold text-start'>{t('addons')}: </Label>
                                <ToggleGroup
                                    size='lg'
                                    variant='outline'
                                    type='multiple'
                                    spacing={2}
                                    className='flex-wrap gap-2'
                                    value={currentOrderItem.addons.map((a) => a.id)}
                                    onValueChange={(values) => {
                                        if (isReadOnly) return
                                        setCurrentOrderItem((prev) => ({
                                            ...prev,
                                            addons: values.map((id) => {
                                                const existing = prev.addons.find((a) => a.id === id)
                                                if (existing) return existing
                                                const addon = selectedItem.addons.find((a) => a._id === id)!
                                                return { ...addon, amount: 1, id: addon._id }
                                            }),
                                        }))
                                    }}>
                                    {selectedItem.addons.map((addon) => (
                                        <ToggleGroupItem
                                            key={addon._id}
                                            value={addon._id}
                                            disabled={addon.temporarilyUnavailable === true && !currentOrderItem.addons.some((selectedAddon) => selectedAddon.id === addon._id)}
                                            className='flex h-auto min-h-8 min-w-16 max-w-28 flex-col items-center justify-center rounded-lg whitespace-normal break-words border-primary/40 px-1.5 py-1 text-sm text-center leading-tight data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-primary/10'>
                                            <span className='line-clamp-2'>{addon.name}</span>
                                            {(() => {
                                                const promotionPrice = getCatalogAddonPromotionPrice({ productId: selectedItem._id, addonId: addon._id, price: addon.priceExtra, promotions })
                                                return promotionPrice < addon.priceExtra ? <span className='text-[11px] opacity-80'><span className='mr-1 line-through'>+{addon.priceExtra.toLocaleString(locale)}</span>+{promotionPrice.toLocaleString(locale)}</span> : <span className='text-[11px] opacity-80'>+{addon.priceExtra.toLocaleString(locale)}</span>
                                            })()}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </div>
                        )}
                        <div className='note flex justify-start items-center gap-4'>
                            <Label className='w-22 block font-semibold text-start'>{t('note')}: </Label>
                            <Input
                                id='note'
                                disabled={isReadOnly}
                                value={currentOrderItem.note}
                                onChange={(e) => {
                                    setCurrentOrderItem((prev) => ({ ...prev, note: e.target.value }))
                                }}
                            />
                        </div>
                        {/* customer */}
                        {isDetail && currentOrder.customer && (
                            <>
                                <div className='flex justify-start items-center gap-4'>
                                    <Label className='w-22 block font-semibold text-start'>{t('customer')}: </Label>
                                    <Input id='name' value={currentOrder.customer.name} disabled />
                                </div>
                                <div className='flex justify-start items-center gap-4'>
                                    <Label className='w-22 block font-semibold text-start'>{t('phone')}: </Label>
                                    <Input id='name' value={currentOrder.customer.phone} disabled />
                                </div>
                            </>
                        )}
                        {/* edit paymentmedthod */}
                        {isDetail && currentOrder.status === 'paid' &&
                            ['dine_in', 'takeaway'].includes(currentOrder.type) &&
                            ['cash', 'linepay', 'bank'].includes(currentOrder.paymentMethod) && (
                                <div className='flex flex-wrap items-center gap-2'>
                                    <p className='font-semibold block w-25 text-start text-md'>{t('payment')}</p>
                                    <div className='flex justify-start items-center gap-4'>
                                        <ToggleGroup
                                            size='lg'
                                            variant='outline'
                                            type='single'
                                            className='w-max'
                                            value={currentOrder.paymentMethod}
                                            onValueChange={(value: PaymentMethod) =>
                                                setCurrentOrder((prev) => ({ ...prev, paymentMethod: value }))
                                            }>
                                            {['cash', 'linepay', 'bank'].map((method) => (
                                                <ToggleGroupItem
                                                    key={method}
                                                    className='flex items-center justify-center w-max'
                                                    value={method}>
                                                    <span>
                                                        {
                                                            PAYMENT_METHOD_ICONS[
                                                                method as
                                                                    | 'cash'
                                                                    | 'uber'
                                                                    | 'linepay'
                                                                    | 'bank'
                                                                    | 'foodpanda'
                                                            ]
                                                        }
                                                    </span>
                                                    <span className='w-max'>{capitalize(method)}</span>
                                                </ToggleGroupItem>
                                            ))}
                                        </ToggleGroup>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                className='mt-2 basis-full bg-primary text-primary-foreground hover:bg-primary/90'
                                                size='lg'>
                                                {t('update')}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{t('update')}</AlertDialogTitle>
                                                <AlertDialogDescription>{t('confirmUpdateProduct')}</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => void handleUpdateOrder()}>{t('confirm')}</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}

                        </div>
                        {!isReadOnly && (
                            <div className='shrink-0 border-t pb-5 pt-3'>
                            <div className='flex items-end justify-start gap-3'>
                                <NumPad
                                    currentValue={currentOrderItem.quantity.toString()}
                                    large
                                    columns={4}
                                    onChange={(value) => {
                                        setCurrentOrderItem((prev) => ({ ...prev, quantity: Number(value) }))
                                    }}
                                />
                                <div className='flex-1'></div>
                                <div className='flex shrink-0 flex-col gap-3 self-start'>
                                    {isEditItem ? (
                                        <>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button className='h-12 min-w-24 text-lg' variant='default' size='lg' disabled={selectionUnavailable}>
                                                        Sửa
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>{t('update')}</AlertDialogTitle>
                                                        <AlertDialogDescription>{t('confirmUpdateProduct')}</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                        <AlertDialogAction onClick={updateItem}>{t('confirm')}</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button className='h-12 min-w-24 text-lg' variant='destructive' size='lg'>
                                                        Xóa
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
                                                        <AlertDialogDescription>{t('confirmDeleteProduct')}</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                        <AlertDialogAction onClick={deleteItem}>{t('confirm')}</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </>
                                    ) : (
                                        <Button className='h-12 min-w-24 text-lg' variant='default' size='lg' disabled={selectionUnavailable} onClick={addItem}>
                                            Xác nhận
                                        </Button>
                                    )}
                                    <Button className='h-12 min-w-24 text-lg' variant='outline' size='lg' onClick={cancelAddItem}>
                                        Hủy
                                    </Button>
                                </div>
                            </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}

export default PosItemSection
