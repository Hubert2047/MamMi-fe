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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx'
import { cancelOrder, type BaseOrder, type IOrder, type OrderRange, updateOrderCustomer, updateOrderPayment } from '@/api/order.ts'
import { useDailyClosingSummary, useOrders, queryKeys } from '@/hooks/queries'
import Loading from '@/components/Loading.tsx'
import { toast } from 'sonner'
import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx'
import PrintOptions from '../PrintOptions'
import { useI18n } from '@/lib/i18n'
import type { AxiosError } from 'axios'
import { RefreshCw, Volume2, VolumeX } from 'lucide-react'
import { stopOrderAlert } from '@/components/RealtimeProvider'
import OrderDetailDialog from './OrderDetailDialog'

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

const orderSourceMessageKeys = {
    pos: 'orderSourcePos',
    qr: 'orderSourceQr',
    online: 'orderSourceOnline',
    uber: 'uber',
    foodpanda: 'foodpanda',
} as const
const ORDER_STATUS_FILTER_STORAGE_KEY = 'mammi-pos-order-status-filter'
const taipeiInputValue = (date: Date) => new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16)

export function OrderTable({ open, displayOrderDetail, checkoutPendingOrder, onClose }: Props) {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | BaseOrder['status']>(() => {
        if (typeof window === 'undefined') return 'pending'
        const saved = window.localStorage.getItem(ORDER_STATUS_FILTER_STORAGE_KEY)
        return saved === 'all' || saved === 'paid' || saved === 'pending' || saved === 'cancelled' ? saved : 'pending'
    })
    const [openPrintOptions, setOpenPrintOptions] = useState(false)
    const [focusOrder, setFocusOrder] = useState<BaseOrder | null>(null)
    const [customerOrder, setCustomerOrder] = useState<BaseOrder | null>(null)
    const [detailOrder, setDetailOrder] = useState<IOrder | null>(null)
    const [paymentOrder, setPaymentOrder] = useState<BaseOrder | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'linepay'>('cash')
    const [customerDraft, setCustomerDraft] = useState({ name: '', phone: '' })
    const [pickupDraft, setPickupDraft] = useState('')
    const [pageSize, setPageSize] = useState(8)
    const [currentTime] = useState(() => new Date().toISOString())
    const tableRef = useRef<HTMLDivElement>(null)
    const detailClosingRef = useRef(false)
    const fromInputRef = useRef<HTMLInputElement>(null)
    const toInputRef = useRef<HTMLInputElement>(null)
    const [selectedRange, setSelectedRange] = useState<OrderRange | null>(null)
    const [orderAlertEnabled, setOrderAlertEnabled] = useState(() => typeof window === 'undefined' || window.localStorage.getItem('order-alert-enabled') !== 'false')
    const { t, locale } = useI18n()
    const { data: summary } = useDailyClosingSummary()
    const range = selectedRange ?? (summary ? { from: summary.periodStart } : undefined)
    const { data: orders = [], isLoading: isOrderLoading } = useOrders(range)

    const cancelOrderMutation = useMutation({
        mutationFn: cancelOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.orders(range) }).then()
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
    const updateCustomerMutation = useMutation({
        mutationFn: updateOrderCustomer,
        onSuccess: () => {
            setCustomerOrder(null)
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            toast.success(t('updateSuccess'))
        },
        onError: () => toast.error(t('updateFailure')),
    })
    const updatePaymentMutation = useMutation({
        mutationFn: updateOrderPayment,
        onSuccess: () => {
            setPaymentOrder(null)
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            toast.success(t('updateSuccess'))
        },
        onError: () => toast.error(t('updateFailure')),
    })

    const openCustomerEditor = (order: BaseOrder) => {
        if (!order.customer) return
        setCustomerDraft({ name: order.customer.name || '', phone: order.customer.phone || '' })
        setPickupDraft(order.pickupAt ? taipeiInputValue(new Date(order.pickupAt)) : taipeiInputValue(new Date(Date.now() + 60 * 60 * 1000)))
        setCustomerOrder(order)
    }

    const saveCustomer = () => {
        if (!customerOrder?.customer) return
        updateCustomerMutation.mutate({ id: customerOrder._id, customer: customerDraft, pickupAt: pickupDraft ? new Date(`${pickupDraft}:00+08:00`).toISOString() : undefined })
    }

    const openPaymentEditor = (order: BaseOrder) => {
        if (order.status !== 'paid' || !['dine_in', 'takeaway'].includes(order.type) || order.source === 'uber' || order.source === 'foodpanda') return
        if (!['cash', 'bank', 'linepay'].includes(order.paymentMethod)) return
        setPaymentMethod(order.paymentMethod as 'cash' | 'bank' | 'linepay')
        setPaymentOrder(order)
    }

    const savePaymentMethod = () => {
        if (!paymentOrder) return
        updatePaymentMutation.mutate({ id: paymentOrder._id, data: { paymentMethod, version: paymentOrder.version } })
    }

    const filteredOrders = orders.filter((o) => {
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter
        const matchesSearch = !search || o.number.toString().includes(search.trim())
        return matchesStatus && matchesSearch
    })

    const dateInputValue = (value?: string) => { const date = new Date(value || currentTime); const pad = (part: number) => String(part).padStart(2, '0'); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}` }
    const dateInputToIso = (value: string) => value ? new Date(value).toISOString() : undefined
    const formatDateTime = (value?: string) => new Intl.DateTimeFormat(locale === 'zh-TW' ? 'zh-TW' : locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value || currentTime))
    useEffect(() => {
        window.localStorage.setItem(ORDER_STATUS_FILTER_STORAGE_KEY, statusFilter)
    }, [statusFilter])
    useEffect(() => {
        const element = tableRef.current
        if (!element) return
        const resize = () => {
            const toolbarHeight = element.querySelector<HTMLElement>('[data-order-toolbar]')?.getBoundingClientRect().height ?? 148
            const headerHeight = element.querySelector<HTMLElement>('thead')?.getBoundingClientRect().height ?? 48
            const rows = Array.from(element.querySelectorAll<HTMLElement>('tbody tr'))
            const rowHeight = rows.length ? Math.max(...rows.map((row) => row.getBoundingClientRect().height)) : 52
            setPageSize(Math.min(16, Math.max(8, Math.floor((element.clientHeight - toolbarHeight - headerHeight - 8) / Math.max(rowHeight, 52)))))
        }
        resize()
        const resizeTimer = window.setTimeout(resize, 80)
        const observer = new ResizeObserver(resize)
        observer.observe(element)
        element.querySelectorAll<HTMLElement>('tbody tr').forEach((row) => observer.observe(row))
        return () => {
            window.clearTimeout(resizeTimer)
            observer.disconnect()
        }
    }, [open, orders.length, page, pageSize, search, statusFilter])
    const totalPages = Math.ceil(filteredOrders.length / pageSize)
    const currentPage = Math.min(page, Math.max(1, totalPages))
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
                    if (isOpen) {
                        setPage(1)
                    } else if (detailOrder || detailClosingRef.current) {
                        detailClosingRef.current = false
                        setDetailOrder(null)
                    } else onClose()
                }}>
                <DialogContent key={locale} className='left-0 top-0 flex h-dvh min-h-0 max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col rounded-none p-3 pb-[env(safe-area-inset-bottom)] sm:max-w-none'>
                    <DialogHeader>
                        <DialogTitle className='text-center capitalize text-black! font-bold! text-xl'>{t('orderTableTitle')}</DialogTitle>
                    </DialogHeader>
                    <div ref={tableRef} className='flex min-h-0 flex-1 flex-col overflow-hidden'>
                    <div data-order-toolbar className='mb-2 flex flex-col gap-2'>
                        <div className='flex flex-wrap items-center gap-2'>
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
                        <span className='whitespace-nowrap text-xs text-muted-foreground'>{locale === 'en' ? 'Period:' : locale === 'zh-TW' ? '期間：' : 'Kỳ:'} {formatDateTime(range?.from)} → {formatDateTime(range?.to)}</span>
                        <Input
                            placeholder={t('searchOrder')}
                            value={search}
                            onChange={handleSearchChange}
                            className='w-48'
                        />
                        <Button
                            variant='outline'
                            size='icon'
                            aria-label={t('refreshOrders')}
                            title={t('refreshOrders')}
                            onClick={() => void queryClient.invalidateQueries({ queryKey: queryKeys.orders(range) })}>
                            <RefreshCw className='size-4' />
                        </Button>
                        <Button
                            variant='outline'
                            size='icon'
                            aria-label={orderAlertEnabled ? t('orderAlertOff') : t('orderAlertOn')}
                            title={orderAlertEnabled ? t('orderAlertOff') : t('orderAlertOn')}
                            onClick={() => setOrderAlertEnabled((enabled) => {
                                const next = !enabled
                                window.localStorage.setItem('order-alert-enabled', String(next))
                                if (!next) stopOrderAlert()
                                return next
                            })}>
                            {orderAlertEnabled ? <Volume2 className='size-4' /> : <VolumeX className='size-4' />}
                        </Button>
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
                        <div className='flex flex-wrap items-center gap-2'>
                            <span className='text-xs text-muted-foreground'>{locale === 'en' ? 'From' : locale === 'zh-TW' ? '從' : 'Từ'}</span>
                            <Input ref={fromInputRef} type='datetime-local' className='h-8 w-48 px-2 text-xs' defaultValue={dateInputValue(range?.from)} key={`from-${range?.from}`} />
                            <span className='text-xs text-muted-foreground'>{locale === 'en' ? 'to' : locale === 'zh-TW' ? '至' : 'đến'}</span>
                            <Input ref={toInputRef} type='datetime-local' className='h-8 w-48 px-2 text-xs' defaultValue={dateInputValue(range?.to || currentTime)} key={`to-${range?.to || 'current'}`} />
                            <Button size='sm' onClick={() => setSelectedRange({ from: dateInputToIso(fromInputRef.current?.value || ''), to: dateInputToIso(toInputRef.current?.value || '') })}>{locale === 'en' ? 'Search' : locale === 'zh-TW' ? '搜尋' : 'Tìm'}</Button>
                            <div className='ml-auto flex items-center gap-2'>
                                <span className='whitespace-nowrap text-sm text-gray-500'>{filteredOrders.length} {t('ordersCount')} • {t('page')} {currentPage}/{totalPages || 1}</span>
                                <Button variant='outline' size='sm' onClick={() => setPage((p) => p - 1)} disabled={currentPage === 1}>{t('previous')}</Button>
                                <Button variant='outline' size='sm' onClick={() => setPage((p) => p + 1)} disabled={currentPage >= totalPages}>{t('next')}</Button>
                            </div>
                        </div>
                    </div>
                    <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
                        <Table>
                            <TableHeader className='sticky top-0 bg-white z-10'>
                                <TableRow>
                                    <TableHead>{t('orderNumberHeader')}</TableHead>
                                    <TableHead>{t('totalItems')}</TableHead>
                                    <TableHead>{t('totalAmount')}</TableHead>
                                    <TableHead>{t('status')}</TableHead>
                                    <TableHead>{t('orderSource')}</TableHead>
                                    <TableHead>{t('orderType')}</TableHead>
                                    <TableHead>{t('paymentMethod')}</TableHead>
                                    <TableHead>{t('time')}</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedOrders.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} className='text-center text-gray-400 py-8'>
                                            {t('noOrdersFound')}
                                        </TableCell>
                                    </TableRow>
                                )}
                                {paginatedOrders.map((order) => {
                                    const isCanceling =
                                        cancelOrderMutation.isPending && cancelOrderMutation.variables?.id === order._id
                                    return (
                                        <TableRow key={order._id} className='h-14'>
                                            <TableCell>{order.number}</TableCell>
                                            <TableCell>{order.items.length}</TableCell>
                                            <TableCell>{order.totalPrice.toLocaleString()}</TableCell>
                                            <TableCell>{t(orderStatusMessageKeys[order.status])}</TableCell>
                                            <TableCell>{t(orderSourceMessageKeys[order.source || 'pos'])}</TableCell>
                                            <TableCell>{t(orderTypeMessageKeys[order.type])}</TableCell>
                                            <TableCell>{order.status === 'pending' ? t('pendingPayment') : t(paymentMethodMessageKeys[order.paymentMethod])}</TableCell>
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
                                                    className='h-10 border-gray-300 px-3 text-base text-gray-700 hover:bg-gray-100'
                                                    onClick={() => order.status === 'pending' ? displayOrderDetail(order) : setDetailOrder(order)}>
                                                    {order.status === 'pending' ? t('edit') : t('detail')}
                                                </Button>
                                                {order.status === 'paid' && ['dine_in', 'takeaway'].includes(order.type) && order.source !== 'uber' && order.source !== 'foodpanda' && ['cash', 'bank', 'linepay'].includes(order.paymentMethod) && <Button variant='outline' className='ml-1 h-10 px-3 text-base' onClick={() => openPaymentEditor(order)}>{t('paymentShort')}</Button>}
                                                {order.status === 'pending' && (
                                                    <Button
                                                        variant='default'
                                                        className='ml-1 h-10 px-3 text-base bg-green-600 hover:bg-green-700 text-white'
                                                        onClick={() => checkoutPendingOrder(order)}>
                                                        {t('pay')}
                                                    </Button>
                                                )}
                                                {
                                                    <Button
                                                        variant='default'
                                                        className='ml-1 h-10 px-3 text-base bg-blue-500 hover:bg-blue-600 text-white'
                                                        onClick={() => {
                                                            setFocusOrder(order)
                                                            setOpenPrintOptions(true)
                                                        }}>
                                                        {t('print')}
                                                    </Button>
                                                }
                                                {order.customer && <Button variant='outline' className='ml-1 h-10 px-3 text-base' onClick={() => openCustomerEditor(order)}>{t('contact')}</Button>}
                                                {order.status !== 'cancelled' && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                className='ml-1 h-10 px-3 text-base'
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
                    </div>
                    {focusOrder && openPrintOptions && (
                        <PrintOptions order={focusOrder} open={openPrintOptions} onClose={() => setOpenPrintOptions(false)} />
                    )}
                    <Dialog open={Boolean(customerOrder)} onOpenChange={(isOpen) => { if (!isOpen) setCustomerOrder(null) }}>
                        <DialogContent className='top-4 translate-y-0 sm:max-w-md'>
                            <DialogHeader><DialogTitle>{t('contact')}</DialogTitle></DialogHeader>
                            <div className='grid gap-3'>
                                <div className='grid gap-1'><Label htmlFor='order-customer-name'>{t('customer')}</Label><Input id='order-customer-name' value={customerDraft.name} maxLength={120} onChange={(event) => setCustomerDraft((current) => ({ ...current, name: event.target.value }))} /></div>
                                <div className='grid gap-1'><Label htmlFor='order-customer-phone'>{t('phone')}</Label><Input id='order-customer-phone' value={customerDraft.phone} maxLength={40} onChange={(event) => setCustomerDraft((current) => ({ ...current, phone: event.target.value }))} /></div>
                                <div className='grid gap-1'><Label htmlFor='order-pickup-at'>{t('pickupTime')}</Label><Input id='order-pickup-at' type='datetime-local' min={taipeiInputValue(new Date())} value={pickupDraft} onChange={(event) => setPickupDraft(event.target.value)} /></div>
                            </div>
                            <DialogFooter><Button className='min-h-11 px-5 text-base' variant='outline' onClick={() => setCustomerOrder(null)}>{t('cancel')}</Button><Button className='min-h-11 px-5 text-base' onClick={saveCustomer} disabled={updateCustomerMutation.isPending}>{t('confirm')}</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </DialogContent>
            </Dialog>
            <Dialog open={Boolean(paymentOrder)} onOpenChange={(isOpen) => { if (!isOpen) setPaymentOrder(null) }}>
                <DialogContent className='top-4 translate-y-0 sm:max-w-md'>
                    <DialogHeader><DialogTitle>{t('paymentMethodTitle')}</DialogTitle></DialogHeader>
                    <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'cash' | 'bank' | 'linepay')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value='cash'>{t('cash')}</SelectItem>
                            <SelectItem value='bank'>{t('bank')}</SelectItem>
                            <SelectItem value='linepay'>{t('linepay')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <DialogFooter><Button className='min-h-11 px-5 text-base' variant='outline' onClick={() => setPaymentOrder(null)}>{t('cancel')}</Button><Button className='min-h-11 px-5 text-base' onClick={savePaymentMethod} disabled={updatePaymentMutation.isPending}>{t('save')}</Button></DialogFooter>
                </DialogContent>
            </Dialog>
            {(isOrderLoading || cancelOrderMutation.isPending || updatePaymentMutation.isPending) && <Loading />}
            <OrderDetailDialog order={detailOrder} onClose={() => { detailClosingRef.current = true; setDetailOrder(null); window.setTimeout(() => { detailClosingRef.current = false }, 100) }} />
        </>
    )
}
