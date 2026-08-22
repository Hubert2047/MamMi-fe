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
import Loading from '@/components/Loading.tsx'
import { toast } from 'sonner'
import { useState } from 'react'
import { Input } from '@/components/ui/input.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx'
import PrintOptions from '../PrintOptions'
import { useI18n } from '@/lib/i18n'
import type { AxiosError } from 'axios'

type Props = {
    open: boolean
    displayOrderDetail(order: BaseOrder): void
    checkoutPendingOrder(order: BaseOrder): void
    onClose: () => void
}

const orderStatusMessageKeys = {
    pending: 'orderStatusPending',
    paid: 'orderStatusPaid',
    cancelled: 'orderStatusCancelled',
} as const

const orderTypeMessageKeys = {
    dine_in: 'dineIn',
    takeaway: 'takeaway',
    uber: 'uber',
    foodpanda: 'foodpanda',
} as const

const paymentMethodMessageKeys = {
    cash: 'cash',
    bank: 'bank',
    linepay: 'linepay',
    uber: 'uber',
    foodpanda: 'foodpanda',
} as const

export function OrderTable({ open, displayOrderDetail, checkoutPendingOrder, onClose }: Props) {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | BaseOrder['status']>('all')
    const [openPrintOptions, setOpenPrintOptions] = useState(false)
    const [focusOrder, setFocusOrder] = useState<BaseOrder | null>(null)
    const pageSize = 6

    const [days, setDays] = useState<number>(1)
    const { t, locale } = useI18n()
    const { data: orders = [], isLoading: isOrderLoading } = useOrders(days)

    const cancelOrderMutation = useMutation({
        mutationFn: cancelOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders(days) }).then()
            toast.success(t('cancelSuccess'))
        },
        onError: (error: unknown) => {
            const responseData = (error as AxiosError<{ code?: string; message?: string }>).response?.data
            const message = responseData?.code === 'FINANCIAL_PERIOD_CLOSED'
                ? t('cancelClosedPeriod')
                : responseData?.code === 'ORDER_ALREADY_CANCELLED'
                    ? t('cancelAlreadyCancelled')
                    : responseData?.code === 'ORDER_NOT_FOUND'
                        ? t('cancelNotFound')
                        : responseData?.message || t('cancelFailure')
            toast.error(message)
        },
    })

    const filteredOrders = orders.filter((o) => {
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter
        const matchesSearch = !search || o.number.toString().includes(search.trim())
        return matchesStatus && matchesSearch
    })

    const totalPages = Math.ceil(filteredOrders.length / pageSize)
    const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize)

    const handleCancelOrder = (id: string) => {
        const order = orders.find((candidate) => candidate._id === id)
        if (order?.version === undefined) return toast.error(t('updateFailure'))
        cancelOrderMutation.mutate({ id, version: order.version })
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
                <DialogContent key={locale} className='min-w-[95vw] w-[95vw] h-[90vh] flex flex-col'>
                    <DialogHeader>
                        <DialogTitle className='text-black! font-bold! text-xl'>{t('orderTableTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className='flex items-center gap-2'>
                        <label className='flex items-center gap-2 text-sm'>
                            <span className='sr-only'>{t('orderStatusFilter')}</span>
                            <Select
                                value={statusFilter}
                                onValueChange={(value) => {
                                    setStatusFilter(value as 'all' | BaseOrder['status'])
                                    setPage(1)
                                }}>
                                <SelectTrigger aria-label={t('orderStatusFilter')} className='w-44'>
                                    <SelectValue placeholder={t('orderStatusFilter')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='all'>{t('allOrders')}</SelectItem>
                                    <SelectItem value='paid'>{t('paidOrders')}</SelectItem>
                                    <SelectItem value='pending'>{t('pendingPayment')}</SelectItem>
                                    <SelectItem value='cancelled'>{t('cancelledOrders')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </label>
                        {(
                            [
                                { label: t('today'), value: 1 },
                                { label: t('days'), value: 3 },
                                { label: t('week'), value: 7 },
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
                            placeholder={t('searchOrder')}
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
                                {t('clear')}
                            </Button>
                        )}
                    </div>
                    <div className='flex flex-col flex-1 overflow-clip'>
                        <Table>
                            <TableHeader className='sticky top-0 bg-white z-10'>
                                <TableRow>
                                    <TableHead>{t('orderNumberHeader')}</TableHead>
                                    <TableHead>{t('totalItems')}</TableHead>
                                    <TableHead>{t('totalAmount')}</TableHead>
                                    <TableHead>{t('status')}</TableHead>
                                    <TableHead>{t('orderType')}</TableHead>
                                    <TableHead>{t('paymentMethod')}</TableHead>
                                    <TableHead>{t('time')}</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedOrders.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className='text-center text-gray-400 py-8'>
                                            {t('noOrdersFound')}
                                        </TableCell>
                                    </TableRow>
                                )}
                                {paginatedOrders.map((order) => {
                                    const isCanceling =
                                        cancelOrderMutation.isPending && cancelOrderMutation.variables?.id === order._id
                                    return (
                                        <TableRow key={order._id}>
                                            <TableCell>{order.number}</TableCell>
                                            <TableCell>{order.items.length}</TableCell>
                                            <TableCell>{order.totalPrice.toLocaleString()}</TableCell>
                                            <TableCell>{t(orderStatusMessageKeys[order.status])}</TableCell>
                                            <TableCell>{t(orderTypeMessageKeys[order.type])}</TableCell>
                                            <TableCell>{t(paymentMethodMessageKeys[order.paymentMethod])}</TableCell>
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
                                                    {t('detail')}
                                                </Button>
                                                {order.status === 'pending' && (
                                                    <Button
                                                        variant='default'
                                                        className='ml-1 bg-green-600 hover:bg-green-700 text-white'
                                                        onClick={() => checkoutPendingOrder(order)}>
                                                        {t('pay')}
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
                                                        {t('print')}
                                                    </Button>
                                                }
                                                {order.status !== 'cancelled' && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                className='ml-1'
                                                                variant='destructive'
                                                                disabled={isCanceling}>
                                                                {t('cancelOrder')}
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className='max-w-sm p-4'>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className='text-black!'>
                                                                    {t('confirmCancelOrder')}
                                                                </AlertDialogTitle>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleCancelOrder(order._id)}
                                                                    disabled={isCanceling}
                                                                    className='bg-red-600 hover:bg-red-700'>
                                                                    {isCanceling ? t('cancelling') : t('confirm')}
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
                            {filteredOrders.length} {t('ordersCount')} • {t('page')} {page}/{totalPages || 1}
                        </span>
                        <div className='flex gap-2'>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => setPage((p) => p - 1)}
                                disabled={page === 1}>
                                {t('previous')}
                            </Button>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= totalPages}>
                                {t('next')}
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
