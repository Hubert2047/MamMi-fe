import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label'
import React from 'react'
import { Button } from '@/components/ui/button.tsx'
import { toast } from 'sonner'
import { getPaymentMethodByType, getPriceByType } from '@/lib/utils.ts'
import type { Item } from '@/api/item.ts'
import type { BaseOrder } from '@/api/order'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useI18n } from '@/lib/i18n'

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
}: Props) {
    const { t } = useI18n()
    

    return (
        <div className='flex items-center p-2 justify-start gap-2 border-b pb-2 border-[#ccc]'>
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

            <LanguageSwitcher />

            <div className='flex items-center space-x-2'>
                        <Label className='whitespace-nowrap'>{t('total')}:</Label>
                <Input className='w-30 font-bold text-red-600' value={totalPrice.toLocaleString()} disabled />
            </div>
            <div className='w-48'>
                {isDetail || isCheckout || isPendingOrder ? (
                    <Button
                        className='w-full'
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
                    <div className='flex gap-2'>
                        <Button
                            className='bg-yellow-400 hover:bg-yellow-500 text-black'
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
                            className='bg-green-600 hover:bg-green-700 text-white'
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
        </div>
    )
}

export default PosHeader
