import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.tsx'
import { DEFAULT_ORDER, PAYMENT_METHOD_ICONS, type PaymentMethod } from '@/constants'
import { type BaseOrder, createOrder } from '@/api/order.ts'
import React, { useMemo, useState } from 'react'
import { capitalize, generateKitchenReceiptHTML, generateReceiptHTML, printReceipt } from '@/lib/utils.ts'
import type { Discount } from '@/api/discount.ts'
import { Label } from '@/components/ui/label.tsx'
import { Input } from '@/components/ui/input.tsx'
import NumPad from '@/components/NumPad.tsx'
import { Button } from '@/components/ui/button.tsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Loading from '@/components/Loading.tsx'
import PendingOrder from '@/components/PendingOrder.tsx'
import { Checkbox } from '@/components/ui/checkbox'
import { useI18n } from '@/lib/i18n'
import CashDenominationInput from '@/components/CashDenominationInput'
import { calculateCashChange, calculateCashFromDenominations, setCashCount, type CashCounts, type CashDenomination } from '@/lib/cashDenominations'
import { isAxiosError } from 'axios'

type Props = {
    isPendingOrder: boolean
    isCheckoutPendingOrder: boolean
    currentOrderNumber: number
    totalPrice: number
    discounts: Discount[]
    currentOrder: BaseOrder
    setCurrentOrder: React.Dispatch<React.SetStateAction<BaseOrder>>
    setCurrentOrderNumber: React.Dispatch<React.SetStateAction<number>>
    handleOpenCheckout(checkout: boolean): void
    handlePendingOrder(open: boolean): void
    setIsCheckoutPendingOrder: React.Dispatch<React.SetStateAction<boolean>>
}

function Checkout({
    currentOrder,
    isPendingOrder,
    currentOrderNumber,
    isCheckoutPendingOrder,
    setCurrentOrder,
    discounts,
    totalPrice,
    handleOpenCheckout,
    setCurrentOrderNumber,
    handlePendingOrder,
    setIsCheckoutPendingOrder,
}: Props) {
    const { t } = useI18n()
    const [isPrint, setIsPrint] = useState(!isCheckoutPendingOrder)
    const queryClient = useQueryClient()
    const [cash, setCash] = useState<number>(totalPrice)
    const [cashDenominations, setCashDenominations] = useState<CashCounts>({})
    const [selectedDenomination, setSelectedDenomination] = useState<CashDenomination>(100)
    const createOrderMutation = useMutation({
        mutationFn: createOrder,
        onSuccess: () => {
            queryClient
                .invalidateQueries({
                    predicate: (query) => query.queryKey[0] === 'sale-by-payment' || query.queryKey[0] === 'orders',
                })
                .then()
        },
        onError: (error) => {
            const code = isAxiosError(error) ? error.response?.data?.code : undefined
            toast.error(code === 'ITEM_NOT_AVAILABLE' ? t('itemNotAvailable') : code === 'ADDON_NOT_AVAILABLE' ? t('addonNotAvailable') : t('createOrderFailure'))
        },
    })
    const handleCreateOrder = async (status: 'paid' | 'pending') => {
        if (cash < totalPrice) {
            toast.error(t('insufficientCash'))
            return
        }
        const newOrder: BaseOrder = {
            ...currentOrder,
            number: currentOrderNumber,
            status: status,
            checkoutPending: isCheckoutPendingOrder,
        }
        const nextOrder = await createOrderMutation.mutateAsync(newOrder)
        printReceipt(generateReceiptHTML(newOrder),'customer')
        newOrder.items.forEach((item, index) => {
            printReceipt(generateKitchenReceiptHTML(newOrder, item, index),'kitchen')
        })
        handleOpenCheckout(false)
        handlePendingOrder(false)
        setCurrentOrder(DEFAULT_ORDER)
        setCashDenominations({})
        setCurrentOrderNumber(nextOrder)
        setIsCheckoutPendingOrder(false)
        toast.success(status === 'paid' ? t('paidSuccess') : t('pendingSuccess'))
    }

    const cashBack = calculateCashChange(cash, totalPrice)

    function onDiscountChange(value: string) {
        if (!value) {
            setCurrentOrder((prev) => ({ ...prev, discount: null }))
            return
        }
        const discount = discounts.find((d) => d.name === value)
        if (discount) {
            setCurrentOrder((prev) => ({ ...prev, discount }))
        }
    }

    const paymentMethods = useMemo(() => {
        if (currentOrder.type === 'dine_in' || currentOrder.type === 'takeaway') return ['cash', 'bank', 'linepay']
        if (currentOrder.type === 'uber') return ['uber']
        if (currentOrder.type === 'foodpanda') return ['foodpanda']
        return []
    }, [currentOrder.type])

    return (
        <div className='min-h-0 flex flex-1 gap-2 overflow-hidden'>
            {isPendingOrder ? (
                <PendingOrder
                    isPrint={isPrint}
                    setIsPrint={setIsPrint}
                    currentOrder={currentOrder}
                    setCurrentOrder={setCurrentOrder}
                    handleCreateOrder={handleCreateOrder}
                />
            ) : (
                <>
                    <div className='discounts md:w-30 border border-[#ccc] rounded p-2'>
                        <p className='text-xl'>{t('discount')}</p>
                        <div className='flex justify-center pt-6'>
                            <ToggleGroup
                                type='single'
                                size='lg'
                                variant='outline'
                                className='flex flex-col gap-2'
                                value={currentOrder.discount?.name ?? ''}
                                onValueChange={(value: string) => onDiscountChange(value)}>
                                {discounts.map((discount) => (
                                    <ToggleGroupItem
                                        key={discount.name}
                                        value={discount.name}
                                        className='flex min-w-24 max-w-full items-center justify-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-primary/10 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'>
                                        <div className='flex flex-col'>
                                            <span>
                                                {' '}
                                                {discount.type === 'percent' ? `${discount.amount}%` : discount.amount}
                                            </span>
                                            <span className='text-[10px]'>{discount.name}</span>
                                        </div>
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </div>
                    </div>
                    <div className='payment-method min-h-0 flex-1 overflow-y-auto rounded border border-[#ccc] p-1.5'>
                        <p className='text-xl'>{t('paymentMethodTitle')}</p>
                        <div className='flex justify-start items-center gap-4 pt-6 pl-2'>
                            <ToggleGroup
                                size='lg'
                                variant='outline'
                                type='single'
                                className='w-max'
                                value={currentOrder.paymentMethod}
                                onValueChange={(value: PaymentMethod) =>
                                    setCurrentOrder((prev) => ({ ...prev, paymentMethod: value }))
                                }>
                                {paymentMethods.map((method) => (
                                    <ToggleGroupItem
                                        key={method}
                                        className='flex w-max items-center justify-center rounded-md border-primary/40 transition-colors hover:bg-primary/10 data-[state=on]:!border-primary data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground'
                                        value={method}>
                                        <span>
                                            {
                                                PAYMENT_METHOD_ICONS[
                                                    method as 'cash' | 'uber' | 'linepay' | 'bank' | 'foodpanda'
                                                ]
                                            }
                                        </span>
                                        <span className='w-max'>{capitalize(method)}</span>
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </div>

                        <div className='variant flex items-center gap-3 pt-2 pl-2'>
                            <Label className='block w-max font-semibold'>{t('cashGiven')}:</Label>
                            <Input
                                id='amount'
                                value={cash.toLocaleString()}
                                className='w-30'
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/,/g, '')
                                    setCash(Number(rawValue))
                                    setCashDenominations({})
                                }}
                            />
                        </div>
                        {currentOrder.paymentMethod === 'cash' && <div className='flex items-start gap-1 pt-1'><div className='min-w-0 flex-1'><CashDenominationInput counts={cashDenominations} selectedDenomination={selectedDenomination} onSelect={setSelectedDenomination} onChange={(counts) => { setCashDenominations(counts); setCash(calculateCashFromDenominations(counts)) }} onClear={() => { setCashDenominations({}); setCash(0) }} /></div><NumPad currentValue={(cashDenominations[selectedDenomination] ?? 0).toString()} resetKey={selectedDenomination} onChange={(num) => { const counts = setCashCount(cashDenominations, selectedDenomination, Number(num)); setCashDenominations(counts); setCash(calculateCashFromDenominations(counts)) }} /></div>}
                        <div className='variant flex items-center gap-3 pt-2 pl-2'>
                            <Label className='block w-max font-semibold'>{t('cashBack')}:</Label>
                            <Input id='amount' value={cashBack} className='w-30' disabled />
                        </div>
                        {/* print option */}
                        <div className='flex items-center gap-3 pt-3 pl-2'>
                            <Checkbox
                                id='print-confirm'
                                checked={isPrint}
                                onCheckedChange={(checked) => setIsPrint(!!checked)}
                            />
                            <Label htmlFor='print-confirm'>{t('printOnConfirm')}</Label>
                        </div>
                        <div className='flex justify-start gap-3 pt-3'>
                            <div className='flex-1'></div>
                            <Button
                                variant='default'
                                size='lg'
                                className='bg-green-500 hover:bg-green-600'
                                onClick={() => handleCreateOrder('paid')}>
                                {t('pay')}
                            </Button>
                            <Button variant='outline' size='lg' onClick={() => handleOpenCheckout(false)}>
                                {t('cancel')}
                            </Button>
                        </div>
                    </div>
                </>
            )}
            {createOrderMutation.isPending && <Loading />}
        </div>
    )
}

export default Checkout
