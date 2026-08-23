import type {OrderItem} from '@/api/order.ts'
import {Button} from '@/components/ui/button'

type Props = {

    items: OrderItem[]
    currentOrderItem: OrderItem
    updateItem(
        item: OrderItem,
    ): void
}
export default function PosOrderList({items, currentOrderItem, updateItem}: Props) {
    return (
        <div className='flex h-full flex-col space-y-2 overflow-y-auto pr-2 [scrollbar-gutter:stable]'>
            {items.map((item, index) => (
                <Button
                    key={item.id + '-' + index}
                    variant={currentOrderItem.itemId === item.itemId ? "default" : 'outline'}
                    className='flex justify-between w-full'
                    onClick={() => updateItem(item)}>
                    <span className='flex-1 text-left'>{item.name}</span>
                    <span className='w-20 text-center'>x{item.quantity}</span>
                    <span className='w-24 text-right'>
                        {item.quantity * item.basePrice +
                            item.addons.reduce((acc, i) => acc + i.amount * i.priceExtra, 0)}
                    </span>
                </Button>
            ))}
        </div>
    )
}
