import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx'
import { useState } from 'react'
import DailyClosingStep1 from '@/components/daily-closing/DailyClosingStep1.tsx'
import DailyClosingStep2 from '@/components/daily-closing/DailyClosingStep2.tsx'
import type { PaymentMethod } from '@/constants'
import type { SalesByPayment } from '@/api/order.ts'
import { useDailyClosingSummary, useExpenses } from '@/hooks/queries'
type Props = {
    open: boolean
    onClose: () => void
}

function DailyClosing({ open, onClose }: Props) {
    const [currentStep, setCurrentStep] = useState(1)
    const { data: summary, isLoading: isSummaryLoading } = useDailyClosingSummary()
    const { data: expenses = [], isLoading: isExpenseLoading } = useExpenses()
    const salesData = summary?.salesByPayment ?? {} as Record<PaymentMethod, SalesByPayment>
    const totalOtherRevenues = summary?.otherRevenueTotal ?? 0
    const systemAmount = summary?.systemAmount ?? 0
    
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
                            isSalesLoading={isSummaryLoading}
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
