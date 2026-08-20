import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx'
import {Input} from '@/components/ui/input.tsx'
import {useState} from 'react'
import {Button} from '@/components/ui/button.tsx'
import {checkIn, checkOut} from '@/api/shift-attendance'
import {toast} from 'sonner'
import NumPad from './NumPad'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import Loading from "@/components/Loading.tsx";
import axios from 'axios'

type Props = {
    open: boolean
    onClose: () => void
}

function ShiftAttendance({open, onClose}: Props) {
    const [numberId, setNumberId] = useState('')
    const queryClient = useQueryClient()
    const checkInMutation = useMutation({
        mutationFn: checkIn,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['shift-attendances']}).then()
        },
        onError: (error: unknown) => {
            const message = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined
            if (message === "Already checked in today") {
                toast.error('Bạn đã chấm công vào làm rồi')
            } else if (message === "Employee not found") {
                toast.error('Không tồn tại mã số nhân viên')
            } else {
                toast.error('Chấm công không thành công')
            }
        },
    })
    const checkOutMutation = useMutation({
        mutationFn: checkOut,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['shift-attendances']}).then()
        },
        onError: (error: unknown) => {
            const message = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined
            if (message === "No check-in found for today") {
                toast.error('Bạn chưa chấm công vào làm')
            } else {
                toast.error('Chấm công không thành công')
            }
        },
    })
    const handleCheckIn = async () => {
        await checkInMutation.mutateAsync(numberId)
        toast.success('Chấm công vào làm thành công')
        onClose()
    }
    const handleCheckOut = async () => {
        await checkOutMutation.mutateAsync(numberId)
        toast.success('Chấm công tan làm thành công')
        onClose()
    }
    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) onClose()
            }}>
            <DialogContent className=' min-h-[50vh] flex flex-col'>
                <DialogHeader>
                    <DialogTitle className='text-black! font-bold! text-xl text-center'>Chấm công</DialogTitle>
                </DialogHeader>
                <div className='flex items-center gap-2 px-2'>
                    <span className='font-bold text-md'>Mã nhân viên</span>
                    <Input value={numberId} className=' w-48 ml-2' onChange={(e) => setNumberId(e.target.value)}/>
                </div>
                <div className='flex items-center justify-between mt-4 gap-2 px-2'>
                    <NumPad currentValue={numberId} onChange={(value) => setNumberId(value)}/>
                    <Button
                        className='bg-green-500 hover:bg-green-600 text-white'
                        onClick={handleCheckIn}>
                        Vào làm
                    </Button>
                    <Button
                        className='bg-red-500 hover:bg-red-600 text-white'
                        onClick={handleCheckOut}>
                        Tan làm
                    </Button>
                </div>
                {(checkOutMutation.isPending || checkInMutation.isPending)&&<Loading/>}
            </DialogContent>
        </Dialog>
    )
}

export default ShiftAttendance
