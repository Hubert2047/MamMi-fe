import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '../ui/alert-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx'
import { cancelOrder, type BaseOrder } from '@/api/order.ts'
import { useOrders, queryKeys } from '@/hooks/queries'
import { getOrderTypeString, getPaymentMethodString, getStatusString } from '@/lib/utils.ts'
import Loading from '@/components/Loading.tsx'
import { toast } from 'sonner'
import { useState } from 'react'
import { Input } from '@/components/ui/input.tsx'
import PrintOptions from '../PrintOptions'

type Props = {
    open: boolean
    displayOrderDetail(order: BaseOrder): void
    checkoutPendingOrder(order: BaseOrder): void
    onClose: () => void
}

export function OrderTable({ open, displayOrderDetail, checkoutPendingOrder, onClose }: Props) {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [openPrintOptions, setOpenPrintOptions] = useState(false)
    const [focusOrder, setFocusOrder] = useState<BaseOrder | null>(null)
    const pageSize = 6

    const [days, setDays] = useState<number>(1)
    const { data: orders = [], isLoading: isOrderLoading } = useOrders(days)

    const cancelOrderMutation = useMutation({
        mutationFn: cancelOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders(days) }).then()
            toast.success('Hủy thành công')
        },
        onError: () => {
            toast.error('Hủy thất bại')
        },
    })

    const filteredOrders = orders.filter((o) => {
        if (!search) return true
        return o.number.toString().includes(search.trim())
    })

    const totalPages = Math.ceil(filteredOrders.length / pageSize)
    const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize)

    const handleCancelOrder = (id: string) => {
        cancelOrderMutation.mutate(id)
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
        setPage(1)
    }

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(isOpen) => {
                    if (!isOpen) onClose()
                }}>
                <DialogContent className='min-w-[95vw] w-[95vw] h-[90vh] flex flex-col'>
                    <DialogHeader>
                        <DialogTitle className='text-black! font-bold! text-xl'>Bảng Đơn hàng</DialogTitle>
                    </DialogHeader>
                    <div className='flex items-center gap-2'>
                        {(
                            [
                                { label: 'Hôm nay', value: 1 },
                                { label: '3 ngày', value: 3 },
                                { label: '1 tuần', value: 7 },
                            ] as const
                        ).map((item) => (
                            <Button
                                key={item.value}
                                size='sm'
                                variant={days === item.value ? 'default' : 'outline'}
                                onClick={() => {
                                    setDays(item.value)
                                    setPage(1)
                                }}>
                                {item.label}
                            </Button>
                        ))}
                        <Input
                            placeholder='Tìm theo mã đơn...'
                            value={search}
                            onChange={handleSearchChange}
                            className='w-48 ml-2'
                        />
                        {search && (
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => {
                                    setSearch('')
                                    setPage(1)
                                }}>
                                Xóa
                            </Button>
                        )}
                    </div>
                    <div className='flex flex-col flex-1 overflow-clip'>
                        <Table>
                            <TableHeader className='sticky top-0 bg-white z-10'>
                                <TableRow>
                                    <TableHead>Mã Đơn</TableHead>
                                    <TableHead>Tổng SP</TableHead>
                                    <TableHead>Tổng tiền</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Loại Đơn</TableHead>
                                    <TableHead>Phương thức</TableHead>
                                    <TableHead>Thời gian</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedOrders.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className='text-center text-gray-400 py-8'>
                                            Không tìm thấy đơn hàng
                                        </TableCell>
                                    </TableRow>
                                )}
                                {paginatedOrders.map((order) => {
                                    const isCanceling =
                                        cancelOrderMutation.isPending && cancelOrderMutation.variables === order._id
                                    return (
                                        <TableRow key={order._id}>
                                            <TableCell>{order.number}</TableCell>
                                            <TableCell>{order.items.length}</TableCell>
                                            <TableCell>{order.totalPrice.toLocaleString()}</TableCell>
                                            <TableCell>{getStatusString(order.status)}</TableCell>
                                            <TableCell>{getOrderTypeString(order.type)}</TableCell>
                                            <TableCell>{getPaymentMethodString(order.paymentMethod)}</TableCell>
                                            <TableCell>
                                                {order.createdAt
                                                    ? new Date(order.createdAt).toLocaleString('vi-VN', {
                                                          day: '2-digit',
                                                          month: '2-digit',
                                                          year: '2-digit',
                                                          hour: '2-digit',
                                                          minute: '2-digit',
                                                          hour12: false,
                                                      })
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className='min-w-50'>
                                                <Button
                                                    variant='outline'
                                                    className='border-gray-300 text-gray-700 hover:bg-gray-100'
                                                    onClick={() => displayOrderDetail(order)}>
                                                    Chi tiết
                                                </Button>
                                                {order.status === 'pending' && (
                                                    <Button
                                                        variant='default'
                                                        className='ml-1 bg-green-600 hover:bg-green-700 text-white'
                                                        onClick={() => checkoutPendingOrder(order)}>
                                                        Thanh toán
                                                    </Button>
                                                )}
                                                {
                                                    <Button
                                                        variant='default'
                                                        className='ml-1 bg-blue-500 hover:bg-blue-600 text-white'
                                                        onClick={() => {
                                                            setFocusOrder(order)
                                                            setOpenPrintOptions(true)
                                                        }}>
                                                        In
                                                    </Button>
                                                }
                                                {order.status !== 'cancelled' && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                className='ml-1'
                                                                variant='destructive'
                                                                disabled={isCanceling}>
                                                                Hủy Đơn
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className='max-w-sm p-4'>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className='text-black!'>
                                                                    Bạn có chắc muốn hủy đơn hàng này không?
                                                                </AlertDialogTitle>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleCancelOrder(order._id)}
                                                                    disabled={isCanceling}
                                                                    className='bg-red-600 hover:bg-red-700'>
                                                                    {isCanceling ? 'Đang hủy...' : 'Xác nhận'}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    <div className='flex items-center justify-between pt-2 border-t'>
                        <span className='text-sm text-gray-500'>
                            {filteredOrders.length} đơn hàng • Trang {page}/{totalPages || 1}
                        </span>
                        <div className='flex gap-2'>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => setPage((p) => p - 1)}
                                disabled={page === 1}>
                                Trước
                            </Button>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= totalPages}>
                                Sau
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {focusOrder && openPrintOptions && (
                <PrintOptions order={focusOrder} open={openPrintOptions} onClose={() => setOpenPrintOptions(false)} />
            )}
            {(isOrderLoading || cancelOrderMutation.isPending) && <Loading />}
        </>
    )
}
