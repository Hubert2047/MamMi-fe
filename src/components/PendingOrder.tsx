import { Label } from '@/components/ui/label.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Button } from '@/components/ui/button.tsx'
import React from 'react'
import type { BaseOrder } from '@/api/order'
import { Checkbox } from '@/components/ui/checkbox'
import { useI18n } from '@/lib/i18n'
const taipeiInputValue = (date: Date) => new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16)
type Props = {
    isPrint: boolean
    currentOrder: BaseOrder
    setCurrentOrder: React.Dispatch<React.SetStateAction<BaseOrder>>
    setIsPrint: React.Dispatch<React.SetStateAction<boolean>>
    handleCreateOrder(status: 'paid' | 'pending'): Promise<void>
}

function PendingOrder({ currentOrder, isPrint, setIsPrint, setCurrentOrder, handleCreateOrder }: Props) {
    const { t } = useI18n()
    return (
        <div className='flex flex-col pt-2 px-4 pb-4 flex-1 gap-3'>
            <p className='text-xl'>{t('pendingOrderInfo')}</p>
            <div className='flex items-center space-x-2 pt-6'>
                <Label htmlFor='name' className='w-32 shrink-0 whitespace-nowrap text-start'>
                    {t('customerName')}
                </Label>
                <Input
                    id='name'
                    className='w-50'
                    value={currentOrder.customer?.name}
                    onChange={(e) => {
                        setCurrentOrder((prev) => {
                            if (prev.customer) return { ...prev, customer: { ...prev.customer, name: e.target.value } }
                            return prev
                        })
                    }}
                />
            </div>
            <div className='flex items-center space-x-2 '>
                <Label htmlFor='phone' className='w-32 shrink-0 whitespace-nowrap text-start'>
                    {t('phone')}
                </Label>
                <Input
                    id='phone'
                    className='w-50'
                    value={currentOrder.customer?.phone}
                    onChange={(e) => {
                        setCurrentOrder((prev) => {
                            if (prev.customer) return { ...prev, customer: { ...prev.customer, phone: e.target.value } }
                            return prev
                        })
                    }}
                />
            </div>
            <div className='flex items-center space-x-2'>
                <Label htmlFor='pickup-at-pending' className='w-32 shrink-0 whitespace-nowrap text-start'>{t('pickupTime')}</Label>
                <Input id='pickup-at-pending' type='datetime-local' className='w-50' value={currentOrder.pickupAt ? taipeiInputValue(new Date(currentOrder.pickupAt)) : ''} min={taipeiInputValue(new Date())} onChange={(event) => setCurrentOrder((prev) => ({ ...prev, pickupAt: event.target.value ? new Date(`${event.target.value}:00+08:00`).toISOString() : undefined }))} />
            </div>
            {/* print option */}
            <div className='mt-3 flex items-center gap-4 border-t pt-4 pl-2'>
                <div className='flex items-center gap-4'>
                    <Checkbox id='print-confirm' checked={isPrint} onCheckedChange={(checked) => setIsPrint(!!checked)} />
                    <Label htmlFor='print-confirm'>{t('printOnConfirm')}</Label>
                </div>
                <div className='ml-auto'>
                <Button
                    className='h-12 min-w-32 bg-yellow-400 px-6 text-base text-black hover:bg-yellow-500'
                    variant='default'
                    size='lg'
                    onClick={() => handleCreateOrder('pending')}>
                    {t('placeOrder')}
                </Button>
                </div>
            </div>
        </div>
    )
}

export default PendingOrder
