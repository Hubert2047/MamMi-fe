import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label'
import React from 'react'
import { Button } from '@/components/ui/button.tsx'
import { toast } from 'sonner'
import { getPaymentMethodByType, getPriceByType } from '@/lib/utils.ts'
import type { Item } from '@/api/item.ts'
import type { BaseOrder } from '@/api/order'
import { useI18n } from '@/lib/i18n'
import { FloatingButton } from '@/components/FloatingButton'

type Props = {

    items: Item[]
    isDetail: boolean
    isPendingOrder: boolean
    totalPrice: number
    currentOrderNumber: number
    currentOrder: BaseOrder
    isCheckout: boolean
    setCurrentOrder: React.Dispatch<React.SetStateAction<BaseOrder>>
    handleOpenCheckout(checkout: boolean): void
    closeDisplayOrderDetail(): void
    handlePendingOrder(open: boolean): void
    openBtns: boolean
    setOpenBtns: React.Dispatch<React.SetStateAction<boolean>>
}

function PosHeader({
    currentOrder,
    items,
    isPendingOrder,
    isDetail,
    totalPrice,
    isCheckout,
    setCurrentOrder,
    currentOrderNumber,
    handleOpenCheckout,
    closeDisplayOrderDetail,
    handlePendingOrder,
    openBtns,
    setOpenBtns,
}: Props) {
    const { t } = useI18n()
    

    return (
        <div className='mb-2 flex items-center justify-start gap-1 rounded border border-[#ccc] p-1'>
            <div className='flex items-center space-x-2 '>
                <Label htmlFor='stt' className='whitespace-nowrap'>
                    {t('orderNumber')}:
                </Label>
                <Input id='stt' className='w-15' value={currentOrderNumber} disabled />
            </div>

            <ToggleGroup
                size='lg'
                variant='outline'
                type='single'
                value={currentOrder.type}
                onValueChange={(value) => {
                    if (value)
                        setCurrentOrder((prev) => ({
                            ...prev,
                            type: value as 'dine_in' | 'takeaway' | 'uber' | 'foodpanda',
                            paymentMethod: getPaymentMethodByType(
                                value as 'dine_in' | 'takeaway' | 'uber' | 'foodpanda',
                            ),
                            items: prev.items.map((item) => {
                                const originItem = items.find((i) => i._id === item.id)
                                if (originItem)
                                    return {
                                        ...item,
                                        basePrice: getPriceByType(
                                            value as 'dine_in' | 'takeaway' | 'uber' | 'foodpanda',
                                            originItem.price,
                                        ),
                                    }
                                return item
                            }),
                        }))
                }}>
                <ToggleGroupItem
                    value='takeaway'
                    className='data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90'>
                    外帶
                </ToggleGroupItem>
                <ToggleGroupItem
                    value='dine_in'
                    className='data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90'>
                    內用
                </ToggleGroupItem>
                <ToggleGroupItem
                    value='uber'
                    className='data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90'>
                    Uber
                </ToggleGroupItem>
                <ToggleGroupItem
                    value='foodpanda'
                    className='data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90'>
                    FoodPanda
                </ToggleGroupItem>
            </ToggleGroup>

            <div className='flex-1'></div>

            <div className='ml-auto flex shrink-0 items-center space-x-1'>
                        <Label className='whitespace-nowrap text-base font-semibold'>{t('total')}:</Label>
                <Input className='h-10 w-30 !text-xl font-extrabold tabular-nums' value={totalPrice.toLocaleString()} disabled />
            </div>
            <div className='ml-4 flex w-44 shrink-0 justify-end'>
                {isDetail || isCheckout || isPendingOrder ? (
                    <Button
                        className='h-10 w-36'
                        variant='default'
                        onClick={
                            isDetail
                                ? closeDisplayOrderDetail
                                : isPendingOrder
                                  ? () => handlePendingOrder(false)
                                  : () => handleOpenCheckout(false)
                        }>
                        {t('order')}
                    </Button>
                ) : (
                    <div className='flex justify-end gap-1'>
                        <Button
                            className='h-10 min-w-20 px-3 bg-yellow-400 text-black hover:bg-yellow-500'
                            onClick={() => {
                                if (currentOrder.items.length === 0) {
                                    toast.error(t('noProductsToOrder'))
                                    return
                                }
                                handlePendingOrder(true)
                            }}>
                            {t('placeOrder')}
                        </Button>
                        <Button
                            className='h-10 min-w-20 px-3 bg-green-600 text-white hover:bg-green-700'
                            onClick={() => {
                                if (currentOrder.items.length === 0) {
                                    toast.error(t('noProductsToPay'))
                                    return
                                }
                                handleOpenCheckout(true)
                            }}>
                            {t('pay')}
                        </Button>
                    </div>
                )}
            </div>
            {!openBtns && <div className='ml-5'><FloatingButton open={false} setOpenBtns={setOpenBtns} /></div>}
        </div>
    )
}

export default PosHeader
