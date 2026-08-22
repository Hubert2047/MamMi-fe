import { Label } from '@/components/ui/label.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Button } from '@/components/ui/button.tsx'
import React from 'react'
import type { BaseOrder } from '@/api/order'
import { Checkbox } from '@/components/ui/checkbox'
import { useI18n } from '@/lib/i18n'
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
                <Label htmlFor='name' className='whitespace-nowrap text-start w-24'>
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
                <Label htmlFor='phone' className='whitespace-nowrap text-start w-24'>
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
            {/* print option */}
            <div className='flex justify-start items-center gap-4 pt-5 pl-2'>
                <Checkbox id='print-confirm' checked={isPrint} onCheckedChange={(checked) => setIsPrint(!!checked)} />
                <Label htmlFor='print-confirm'>{t('printOnConfirm')}</Label>
            </div>
            <div className='flex justify-end ml-8'>
                <Button
                    className='bg-yellow-400 hover:bg-yellow-500 text-black'
                    variant='default'
                    size='lg'
                    onClick={() => handleCreateOrder('pending')}>
                    {t('placeOrder')}
                </Button>
            </div>
        </div>
    )
}

export default PendingOrder
