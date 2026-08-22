import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {ExpenseTable} from './ExpenseTable'
import { useExpenses } from '@/hooks/queries'
import Loading from "@/components/Loading.tsx";
import {useI18n} from '@/lib/i18n'

type Props = {
    open: boolean
    onClose: () => void
}
export default function ExpenseTableDialog({open, onClose}: Props) {
    const {t} = useI18n()
    const {data: expenses = [], isLoading} = useExpenses()
    if (isLoading) {
        return <Loading/>
    }
    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) onClose()
            }}>
            <DialogContent className="min-w-[90vw] w-[90vw] h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className='text-black! font-bold! text-xl'>{t('expenseTableTitle')}</DialogTitle>
                </DialogHeader>
                <ExpenseTable expenses={expenses} />
            </DialogContent>
        </Dialog>
    )
}
