import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group.tsx'
import React, {useState} from 'react'
import {Button} from '@/components/ui/button.tsx'
import {ArrowRight} from 'lucide-react'
import {PAYMENT_METHODS, type PaymentMethod} from '@/constants'
import {Label} from '@/components/ui/label.tsx'
import {Input} from '@/components/ui/input.tsx'
import {ExpenseTable} from '@/components/expense/ExpenseTable.tsx'
import Loading from '@/components/Loading.tsx'
import type {SalesByPayment} from '@/api/order'
import type {Expense} from '@/api/expense'
import type {ExpenseRange} from '@/api/expense'
import {calculateIncomeTotal} from '@/lib/dailyClosingCalculations'
import {useI18n} from '@/lib/i18n'

type Props = {
    totalOtherRevenues: number
    expenses: Expense[]
    periodRange?: ExpenseRange
    salesData: Record<PaymentMethod, SalesByPayment>
    isSalesLoading: boolean
    isExpenseLoading: boolean
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>
}

function DailyClosingStep1({
                               expenses,
                               periodRange,
                               totalOtherRevenues,
                               salesData,
                               isSalesLoading,
                               isExpenseLoading,
                               setCurrentStep
}: Props) {
    const {t} = useI18n()
    const [type, setType] = useState<'income' | 'expense'>('income')

    function getPaymentMethodValue(type: PaymentMethod) {
        const value = salesData[type]
        if (!value) return {count: 0, totalSales: 0}
        return value
    }

    const totalIncome = calculateIncomeTotal(salesData, totalOtherRevenues)
    return (
        <>
            <div className='flex justify-between'>
                <ToggleGroup
                    size='lg'
                    variant='outline'
                    type='single'
                    spacing={2}
                    className='flex-wrap gap-2'
                    value={type}
                    onValueChange={(value) => {
                        if (value) setType(value as 'income' | 'expense')
                    }}>
                    <ToggleGroupItem className='w-20 rounded-lg border-primary/40 data-[state=on]:!border-primary data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground' value='income'>
                        {t('income')}
                    </ToggleGroupItem>
                    <ToggleGroupItem className='w-20 rounded-lg border-primary/40 data-[state=on]:!border-primary data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground' value='expense'>
                        {t('expense')}
                    </ToggleGroupItem>
                </ToggleGroup>
                <Button
                    className='h-10 px-4 text-sm flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90'
                    onClick={() => setCurrentStep(2)}>
                    {t('next')}
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
                                    <Label className='block w-28 font-semibold'>{t(method === 'cash' ? 'paymentCash' : method === 'bank' ? 'paymentBank' : 'paymentLinepay')}</Label>
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
                        <Label className='block w-28 font-semibold'>{t('total')}</Label>
                        <Input id='amount' value={totalIncome.toLocaleString()} className='w-40 text-center' disabled/>
                    </div>
                </div>
            ) : (
                <div className='flex border border-[#ccc] px-6 py-4 rounded'>
                    {!isExpenseLoading && <ExpenseTable showOnly expenses={expenses} range={periodRange}/>}
                </div>
            )}
            {isSalesLoading && <Loading/>}
        </>
    )
}

export default DailyClosingStep1
