import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx'
import { useState } from 'react'
import DailyClosingStep1 from '@/components/daily-closing/DailyClosingStep1.tsx'
import DailyClosingStep2 from '@/components/daily-closing/DailyClosingStep2.tsx'
import type { SalesByPayment } from '@/api/order.ts'
import type { PaymentMethod } from '@/constants'
import { useClosingOfYesterday, useExpenses, useRevenues, useSalesByPayment } from '@/hooks/queries'
type Props = {
    open: boolean
    onClose: () => void
}

function DailyClosing({ open, onClose }: Props) {
    const [currentStep, setCurrentStep] = useState(1)
    const { data: salesData = {} as Record<PaymentMethod, SalesByPayment>, isLoading: isSalesLoading } = useSalesByPayment()
    const { data: expenses = [], isLoading: isExpenseLoading } = useExpenses()
    const { data: otherRevenues = [] } = useRevenues()
    const { data: closingOfYesterday = { amount: 0 } } = useClosingOfYesterday()
    const totalCashSales = salesData['cash']?.totalSales || 0
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.price, 0)
    const totalOtherRevenues = otherRevenues.reduce((sum, revenue) => sum + revenue.price, 0)
    const systemAmount = closingOfYesterday.amount + totalCashSales + totalOtherRevenues - totalExpenses
    
    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(isOpen) => {
                    if (!isOpen) onClose()
                }}>
                <DialogContent className='min-w-[95vw] w-[95vw] h-[90vh] flex flex-col'>
                    <DialogHeader>
                        <DialogTitle className='text-black! font-bold! text-xl text-center'>
                            Kết Toán Hàng Ngày
                        </DialogTitle>
                    </DialogHeader>
                    {currentStep === 1 && (
                        <DailyClosingStep1
                            expenses={expenses}
                            totalOtherRevenues={totalOtherRevenues}
                            salesData={salesData}
                            isExpenseLoading={isExpenseLoading}
                            isSalesLoading={isSalesLoading}
                            setCurrentStep={setCurrentStep}
                        />
                    )}
                    {currentStep === 2 && <DailyClosingStep2 systemAmount={systemAmount} setCurrentStep={setCurrentStep} onClose={onClose}/>}
                </DialogContent>
            </Dialog>
        </>
    )
}

export default DailyClosing
