import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group.tsx'
import React, {useState} from 'react'
import {Button} from '@/components/ui/button.tsx'
import {ArrowRight} from 'lucide-react'
import {PAYMENT_METHODS, type PaymentMethod} from '@/constants'
import {getPaymentMethodString} from '@/lib/utils.ts'
import {Label} from '@/components/ui/label.tsx'
import {Input} from '@/components/ui/input.tsx'
import {ExpenseTable} from '@/components/expense/ExpenseTable.tsx'
import Loading from '@/components/Loading.tsx'
import type {SalesByPayment} from '@/api/order'
import type {Expense} from '@/api/expense'

type Props = {
    totalOtherRevenues: number
    expenses: Expense[]
    salesData: Record<PaymentMethod, SalesByPayment>
    isSalesLoading: boolean
    isExpenseLoading: boolean
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>
}

function DailyClosingStep1({
                               expenses,
                               totalOtherRevenues,
                               salesData,
                               isSalesLoading,
                               isExpenseLoading,
                               setCurrentStep
                           }: Props) {
    const [type, setType] = useState<'income' | 'expense'>('income')

    function getPaymentMethodValue(type: PaymentMethod) {
        const value = salesData[type]
        if (!value) return {count: 0, totalSales: 0}
        return value
    }

    const totalSales = Object.values(salesData).reduce((sum, item) => {
        return sum + (item?.totalSales ?? 0)
    }, 0)
    return (
        <>
            <div className='flex justify-between'>
                <ToggleGroup
                    size='lg'
                    variant='outline'
                    type='single'
                    value={type}
                    onValueChange={(value) => {
                        if (value) setType(value as 'income' | 'expense')
                    }}>
                    <ToggleGroupItem className='w-20' value='income'>
                        Thu nhập
                    </ToggleGroupItem>
                    <ToggleGroupItem className='w-20' value='expense'>
                        Chi ra
                    </ToggleGroupItem>
                </ToggleGroup>
                <Button
                    className='flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white'
                    onClick={() => setCurrentStep(2)}>
                    Tiếp theo
                    <ArrowRight className='w-4 h-4'/>
                </Button>
            </div>

            {type === 'income' ? (
                <div className='flex border border-[#ccc] py-4 rounded px-6 flex-col gap-1 justify-center'>
                    {!isSalesLoading &&
                        PAYMENT_METHODS.map((method) => {
                            let totalSales = getPaymentMethodValue(method).totalSales
                            if (method === 'cash') totalSales += totalOtherRevenues
                            return (
                                <div key={method} className='variant flex justify-start items-center gap-4 pt-2'>
                                    <Label className='block w-28 font-semibold'>{getPaymentMethodString(method)}</Label>
                                    <Input
                                        id={`amount-${method}`}
                                        value={totalSales.toLocaleString()}
                                        className='w-40 text-center'
                                        disabled
                                    />
                                </div>
                            )
                        })}
                    <div className='variant flex justify-start items-center gap-4 pt-6 border-t mt-4'>
                        <Label className='block w-28 font-semibold'>Tổng</Label>
                        <Input id='amount' value={totalSales.toLocaleString()} className='w-40 text-center' disabled/>
                    </div>
                </div>
            ) : (
                <div className='flex border border-[#ccc] px-6 py-4 rounded'>
                    {!isExpenseLoading && <ExpenseTable showOnly expenses={expenses}/>}
                </div>
            )}
            {isSalesLoading && <Loading/>}
        </>
    )
}

export default DailyClosingStep1
