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
import type { StoreTable } from '@/api/table'

type Props = {

    items: Item[]
    isDetail: boolean
    isOrderEditing: boolean
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
    tables: StoreTable[]
    onCheckoutPendingOrder(): void
}

function PosHeader({
    currentOrder,
    items,
    isPendingOrder,
    isDetail,
    isOrderEditing,
    totalPrice,
    isCheckout,
    setCurrentOrder,
    currentOrderNumber,
    handleOpenCheckout,
    closeDisplayOrderDetail,
    handlePendingOrder,
    openBtns,
    setOpenBtns,
    tables,
    onCheckoutPendingOrder,
}: Props) {
    const { t } = useI18n()
    const isReadOnly = isDetail && !isOrderEditing
    

    return (
        <div className='mb-2 flex items-center justify-start gap-1 rounded border border-[#ccc] p-1'>
            <div className='flex items-center space-x-2 '>
                <Label htmlFor='stt' className='whitespace-nowrap'>
                    {t('orderNumber')}:
                </Label>
                <Input id='stt' className='w-15' value={isDetail ? currentOrder.number : currentOrderNumber} disabled />
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
                    disabled={isReadOnly}
                    className='data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90'>
                    外帶
                </ToggleGroupItem>
                <ToggleGroupItem
                    value='dine_in'
                    disabled={isReadOnly}
                    className='data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90'>
                    內用
                </ToggleGroupItem>
                <ToggleGroupItem
                    value='uber'
                    disabled={isReadOnly}
                    className='data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90'>
                    Uber
                </ToggleGroupItem>
                <ToggleGroupItem
                    value='foodpanda'
                    disabled={isReadOnly}
                    className='data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90'>
                    FoodPanda
                </ToggleGroupItem>
            </ToggleGroup>

            {currentOrder.type === 'dine_in' && <div className='flex items-center gap-2'><Label htmlFor='order-table' className='whitespace-nowrap'>{t('posTable')}:</Label><select id='order-table' disabled={isReadOnly} className='h-9 w-16 rounded-md border bg-background px-2 text-sm' value={currentOrder.table || ''} onChange={(event) => setCurrentOrder((prev) => ({ ...prev, table: event.target.value }))}><option value=''></option>{tables.filter((table) => table.active).map((table) => <option key={table._id} value={table.code}>{table.code}</option>)}</select></div>}

            <div className='flex-1'></div>

            <div className='ml-auto flex shrink-0 items-center space-x-1'>
                        <Label className='whitespace-nowrap text-base font-semibold'>{t('total')}:</Label>
                <Input className='h-10 w-30 !text-xl font-extrabold tabular-nums' value={totalPrice.toLocaleString()} disabled />
            </div>
            <div className='ml-4 flex shrink-0 justify-end'>
                {isDetail ? (
                    isOrderEditing ? (
                        null
                    ) : (
                        <div className='flex gap-1'>
                            {currentOrder.status === 'pending' && <Button className='h-10 bg-green-600 text-white hover:bg-green-700' onClick={onCheckoutPendingOrder}>{t('pay')}</Button>}
                            <Button className='h-10 bg-primary text-primary-foreground hover:bg-primary/90' onClick={closeDisplayOrderDetail}>{t('createNewOrder')}</Button>
                        </div>
                    )
                ) : isCheckout || isPendingOrder ? (
                    <Button
                        className='h-10 w-36'
                        variant='default'
                        onClick={
                            isPendingOrder
                                  ? () => handlePendingOrder(false)
                                  : () => handleOpenCheckout(false)
                        }>
                        {t('backToOrder')}
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
                                if (currentOrder.type === 'dine_in' && !currentOrder.table?.trim()) { toast.error(t('tableRequired')); return }
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
                                if (currentOrder.type === 'dine_in' && !currentOrder.table?.trim()) { toast.error(t('tableRequired')); return }
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
