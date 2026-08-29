import type {AppliedPromotion, OrderItem} from '@/api/order.ts'
import {Button} from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'

type Props = {

    items: OrderItem[]
    appliedPromotions?: AppliedPromotion[]
    currentOrderItem: OrderItem
    updateItem(
        item: OrderItem,
    ): void
    disabled?: boolean
    canEdit?: boolean
    isOrderEditing?: boolean
    onStartOrderEdit?: () => void
    onStartAddItem?: () => void
    onCancelOrderEdit?: () => void
    onSaveOrderEdit?: () => void
}
export default function PosOrderList({ items, appliedPromotions = [], currentOrderItem, updateItem, disabled = false, canEdit = false, isOrderEditing = false, onStartOrderEdit, onStartAddItem, onCancelOrderEdit, onSaveOrderEdit }: Props) {
    const { t } = useI18n()
    const itemCount = items.reduce((total, item) => total + item.quantity, 0)
    return (
        <div className='flex h-full min-h-0 flex-col'>
            <div className='mb-2 flex min-h-8 shrink-0 items-center justify-between gap-2 border-b px-1 py-0.5 text-sm font-semibold'>
                <span className='tabular-nums text-muted-foreground'>{t('totalItems')}: {itemCount}</span>
            </div>
            <div className='flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto pr-2 [scrollbar-gutter:stable]'>
            {items.map((item, index) => {
                const discount = appliedPromotions.filter((promotion) => !promotion.targets?.includes('order')).flatMap((promotion) => promotion.allocations).filter((allocation) => allocation.itemId === item.id).reduce((total, allocation) => total + allocation.productDiscountAmount + allocation.addonDiscounts.reduce((addonTotal, addon) => addonTotal + addon.discountAmount, 0), 0)
                const original = item.quantity * item.basePrice + item.addons.reduce((acc, addon) => acc + addon.amount * addon.priceExtra * item.quantity, 0)
                return (
                <Button
                    key={item.id + '-' + index}
                    variant={currentOrderItem.itemId === item.itemId ? "default" : 'outline'}
                    className='flex min-h-9 w-full justify-between px-2 py-1 text-sm'
                    disabled={disabled}
                    onClick={() => updateItem(item)}>
                    <span className='flex-1 text-left'>{item.name}</span>
                    <span className='w-20 text-center'>x{item.quantity}</span>
                    <span className='w-24 text-right'>{discount ? <><span className='mr-1 text-xs text-muted-foreground line-through'>{original}</span>{original - discount}</> : original}</span>
                </Button>
            )})}
            </div>
        </div>
    )
}
