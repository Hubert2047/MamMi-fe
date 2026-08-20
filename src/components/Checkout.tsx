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
    const [isPrint, setIsPrint] = useState(!isCheckoutPendingOrder)
    const queryClient = useQueryClient()
    const [cash, setCash] = useState<number>(totalPrice)
    const createOrderMutation = useMutation({
        mutationFn: createOrder,
        onSuccess: () => {
            queryClient
                .invalidateQueries({
                    predicate: (query) => query.queryKey[0] === 'sale-by-payment' || query.queryKey[0] === 'orders',
                })
                .then()
        },
        onError: () => {
            toast.error('Tạo đơn không thành công')
        },
    })
    const handleCreateOrder = async (status: 'paid' | 'pending') => {
        if (cash < totalPrice) {
            toast.error('Tiền khách đưa chưa đủ')
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
        setCurrentOrderNumber(nextOrder)
        setIsCheckoutPendingOrder(false)
        toast.success(status === 'paid' ? 'Thanh toán thành công' : 'Đặt hàng thành công')
    }

    const cashBack = cash - totalPrice < 0 ? 0 : cash - totalPrice

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
        <div className='border flex gap-2 flex-1 border-[#ccc] rounded p-2'>
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
                        <p className='text-xl'>Giảm giá</p>
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
                                        className='flex items-center gap-1 px-3 py-1 w-max rounded-md hover:bg-gray-100 data-[state=on]:bg-blue-500 data-[state=on]:text-white transition-colors'>
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
                    <div className='payment-method flex-1 border border-[#ccc] rounded p-2'>
                        <p className='text-xl'>Phương thức thanh toán</p>
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
                                        className='flex items-center justify-center w-max'
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

                        <div className='variant flex justify-start items-center gap-4 pt-4 pl-2'>
                            <Label className='block w-max font-semibold'>Số tiền khách đưa:</Label>
                            <Input
                                id='amount'
                                value={cash.toLocaleString()}
                                className='w-30'
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/,/g, '')
                                    setCash(Number(rawValue))
                                }}
                            />
                        </div>
                        <div className='variant flex justify-start items-center gap-4 pt-4 pl-2'>
                            <Label className='block w-max font-semibold'>Số tiền trả lại khách:</Label>
                            <Input id='amount' value={cashBack} className='w-30' disabled />
                        </div>
                        {/* print option */}
                        <div className='flex justify-start items-center gap-4 pt-5 pl-2'>
                            <Checkbox
                                id='print-confirm'
                                checked={isPrint}
                                onCheckedChange={(checked) => setIsPrint(!!checked)}
                            />
                            <Label htmlFor='print-confirm'>In khi xác nhận</Label>
                        </div>
                        <div className='flex justify-start pt-8 gap-3'>
                            <NumPad
                                currentValue={cash.toString()}
                                onChange={(num) => {
                                    setCash(Number(num))
                                }}
                            />
                            <div className='flex-1'></div>
                            <Button
                                variant='default'
                                size='lg'
                                className='bg-green-500 hover:bg-green-600'
                                onClick={() => handleCreateOrder('paid')}>
                                Thanh toán
                            </Button>
                            <Button variant='outline' size='lg' onClick={() => handleOpenCheckout(false)}>
                                Hủy
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
