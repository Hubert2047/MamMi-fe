import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { BaseOrder, OrderItem } from '@/api/order'
import { useI18n } from '@/lib/i18n'
import { useItems } from '@/hooks/queries'

type Props = { order: BaseOrder | null; onClose: () => void }
const money = (value: number) => value.toLocaleString()
const sourceKey = (source: BaseOrder['source']) => source === 'online' ? 'orderSourceOnline' : source === 'qr' ? 'orderSourceQr' : source === 'uber' ? 'uber' : source === 'foodpanda' ? 'foodpanda' : 'orderSourcePos'
const typeKey = (type: BaseOrder['type']) => type === 'dine_in' ? 'dineIn' : type === 'takeaway' ? 'takeaway' : type
const targetKey = (target: 'order' | 'product' | 'addon' | 'line') => ({ order: 'targetOrder', product: 'targetProduct', addon: 'targetAddon', line: 'targetLine' }[target])

export default function OrderDetailDialog({ order, onClose }: Props) {
    const { t, locale } = useI18n()
    const { data: catalogItems = [] } = useItems()
    if (!order) return null
    const itemGross = (item: OrderItem) => item.basePrice * item.quantity + item.addons.reduce((sum, addon) => sum + addon.priceExtra * addon.amount * item.quantity, 0)
    const allocationFor = (promotion: NonNullable<BaseOrder['appliedPromotions']>[number], item: OrderItem) => promotion.allocations.find((allocation) => String(allocation.itemId) === String(item.id))
    const subtotal = order.items.reduce((sum, item) => sum + itemGross(item), 0)
    const totalDiscount = (order.appliedPromotions || []).reduce((sum, promotion) => sum + promotion.discountAmount, 0)
    return <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
        <DialogContent className='left-0 top-0 flex h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-none'>
            <DialogHeader className='shrink-0 border-b px-6 py-4 pr-14'><DialogTitle className='text-xl'>{t('orderDetailTitle')} #{order.number}</DialogTitle><p className='text-sm text-muted-foreground'>{t(order.status === 'paid' ? 'orderStatusPaid' : 'orderStatusCancelled')} · {t(sourceKey(order.source))} · {t(typeKey(order.type))}</p>{order.pickupAt && <p className='text-sm text-muted-foreground'>{t('pickupTime')}: {new Date(order.pickupAt).toLocaleString(locale, { timeZone: 'Asia/Taipei' })}</p>}</DialogHeader>
            <div className='min-h-0 flex-1 overflow-y-auto p-6'><div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]'>
                <section className='space-y-3'>{order.items.map((item, index) => {
                    const gross = itemGross(item)
                    const discount = (order.appliedPromotions || []).reduce((sum, promotion) => { const allocation = allocationFor(promotion, item); return sum + (allocation?.productDiscountAmount || 0) + (allocation?.addonDiscounts || []).reduce((addonSum, entry) => addonSum + entry.discountAmount, 0) }, 0)
                    const catalogItem = catalogItems.find((candidate) => candidate._id === item.id)
                    const localizedName = catalogItem?.name || item.name
                    const localizedAddonName = (addon: OrderItem['addons'][number]) => catalogItem?.addons.find((candidate) => candidate._id === addon.id)?.name || addon.name
                    const findLocalizedOption = (options: typeof catalogItem extends undefined ? never[] : NonNullable<typeof catalogItem>['variants'], value: string) => options.find((option) => option.id === value || Object.values(option.names || {}).some((name) => name === value))?.names?.[locale] || value
                    const localizedVariant = item.variant ? findLocalizedOption(catalogItem?.variants || [], item.variant) : ''
                    const localizedOptionName = (selection: NonNullable<OrderItem['optionSelections']>[number]) => findLocalizedOption(catalogItem?.optionGroups.flatMap((group) => group.options) || [], selection.optionId || selection.name || '')
                    const localizedNoteName = (note: string) => findLocalizedOption(catalogItem?.noteOptions || [], note)
                    return <div key={`${item.id}-${index}`} className='rounded-lg border p-4 font-normal'><div className='flex items-start justify-between gap-3'><div><div className='font-semibold'>{localizedName}</div>{localizedVariant && <div className='text-sm text-muted-foreground'>{t('variant')}: {localizedVariant}</div>}<div className='text-sm text-muted-foreground'>{t('quantity')}: {item.quantity} × {money(item.basePrice)}</div></div><div className='text-right font-normal'>{money(Math.max(0, gross - discount))}</div></div>{item.addons.length > 0 && <div className='mt-2 text-sm text-muted-foreground !font-light' style={{ fontWeight: 300 }}>{t('addons')}: {item.addons.map((addon) => `${localizedAddonName(addon)} (${money(addon.priceExtra)})`).join(', ')}</div>}{item.optionSelections?.length ? <div className='mt-1 text-sm !font-light'><span>{t('optionsSelected')}:</span> {item.optionSelections.map(localizedOptionName).join(', ')}</div> : null}{item.noteOptions.length > 0 && <div className='mt-1 text-sm text-muted-foreground !font-light'><span>{t('noAddons')}:</span> {item.noteOptions.map(localizedNoteName).join(', ')}</div>}{item.note && <div className='mt-1 text-sm text-muted-foreground'>{t('note')}: {item.note}</div>}{discount > 0 && <div className='mt-2 text-sm text-primary'>{t('discount')}: -{money(discount)}</div>}</div>
                })}</section>
                <aside className='space-y-5'><section className='rounded-lg border p-4'><h3 className='mb-3 font-semibold'>{t('promotionDetails')}</h3>{order.appliedPromotions?.length ? <div className='space-y-3'>{order.appliedPromotions.map((promotion) => <details key={`${promotion.promotionId}-${promotion.promotionVersion}`} className='rounded border p-3' open><summary className='cursor-pointer font-medium'>{promotion.name}<span className='float-right text-primary'>-{money(promotion.discountAmount)}</span></summary><div className='mt-2 space-y-1 text-sm text-muted-foreground'><div>{t(promotion.mode)} · {promotion.targets?.length ? `${t('target')}: ${promotion.targets.map((target) => t(targetKey(target))).join(', ')}` : ''}</div>{order.items.map((item) => { const allocation = allocationFor(promotion, item); if (!allocation) return null; const amount = allocation.productDiscountAmount + allocation.addonDiscounts.reduce((sum, entry) => sum + entry.discountAmount, 0); return amount > 0 ? <div key={String(item.id)}>{item.name}: -{money(amount)}</div> : null })}</div></details>)}</div> : <p className='text-sm text-muted-foreground'>{t('noPromotion')}</p>}</section><section className='rounded-lg border p-4 text-sm'><div className='flex justify-between'><span>{t('subtotal')}</span><span>{money(subtotal)}</span></div><div className='mt-2 flex justify-between'><span>{t('totalDiscount')}</span><span className='text-primary'>-{money(totalDiscount)}</span></div><div className='mt-2 flex justify-between text-lg font-bold'><span>{t('total')}</span><span className='text-primary'>{money(order.totalPrice)}</span></div><div className='mt-3 border-t pt-3 text-muted-foreground'>{t('paymentMethod')}: {t(order.paymentMethod)}</div>{order.customer && <div className='mt-1 text-muted-foreground'>{t('customer')}: {order.customer.name || '-'} · {order.customer.phone || '-'}</div>}</section></aside>
            </div></div><div className='shrink-0 border-t bg-muted/30 p-4 text-right'><Button className='min-h-11 px-6 text-base' onClick={onClose}>{t('close')}</Button></div>
        </DialogContent>
    </Dialog>
}
