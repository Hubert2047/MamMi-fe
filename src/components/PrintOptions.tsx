import type { BaseOrder } from '@/api/order'
import { queueKitchenPrint } from '@/api/order'
import { Button } from './ui/button'
import { useState } from 'react'

type Props = {
    order: BaseOrder
    open: boolean
    onClose: () => void
}

export default function PrintOptions({ order, open, onClose }: Props) {
    const [isPrinting, setIsPrinting] = useState(false)
    if (!open) return null

    async function handlePrint() {
        setIsPrinting(true)
        try {
            await queueKitchenPrint(order._id)
            onClose()
        } finally {
            setIsPrinting(false)
        }
    }

    return (
        <div className='absolute inset-0 z-20 flex items-start justify-center bg-black/35 p-4 pt-10' role='dialog' aria-modal='true' aria-labelledby='print-options-title' onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
            <div className='w-full max-w-sm rounded-xl border bg-background p-5 shadow-2xl'>
                <div className='mb-5 flex items-start justify-between gap-4'>
                    <div>
                        <h2 id='print-options-title' className='text-lg font-semibold'>In Bếp</h2>
                        <p className='mt-1 text-sm text-muted-foreground'>In từng sản phẩm cho khu vực bếp.</p>
                    </div>
                    <Button type='button' variant='ghost' size='icon' aria-label='Đóng' onClick={onClose}>×</Button>
                </div>
                <div className='flex justify-end gap-2'>
                    <Button type='button' size='lg' variant='outline' onClick={onClose}>Hủy</Button>
                    <Button type='button' size='lg' disabled={isPrinting} onClick={handlePrint}>{isPrinting ? 'Đang gửi...' : 'Bắt đầu in'}</Button>
                </div>
            </div>
        </div>
    )
}
