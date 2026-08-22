'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { type Item } from '@/api/item'
import { type BaseOrder, type OrderItem } from '@/api/order.ts'
import ExpenseTableDialog from '@/components/expense/ExpenseTableDialog'
import PosOrderList from '@/components/orders/PosOrderList'
import { DEFAULT_ORDER, DEFAULT_ORDER_ITEM } from '@/constants'
import PosItemSection from '@/components/PosItemSection.tsx'
import PosHeader from '@/components/PosHeader.tsx'
import Loading from '@/components/Loading.tsx'
import Checkout from '@/components/Checkout.tsx'
import { useDiscounts, useItems, useNextOrderNumber, useStoreAddons } from '@/hooks/queries'
import { OrderTable } from '@/components/orders/OrderTable.tsx'
import { FloatingButton } from '@/components/FloatingButton.tsx'
import DailyClosing from '@/components/daily-closing/DailyClosing.tsx'
import OtherRevenue from '@/components/other-revenue/OtherRevenue.tsx'
import ShiftAttendance from '@/components/ShiftAttendance.tsx'
import TemporaryAvailabilityTable from '@/components/TemporaryAvailabilityTable'
import { signOut } from 'next-auth/react'
import { logoutAPI } from '@/api/auth'
import { calculateOrderTotal, findFreshSelectedItem, syncOrderItemsWithCatalog } from '@/lib/posCalculations'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'

const POSPage: React.FC = () => {
    const { t } = useI18n()
    const [selectedCategory, setSelectedCategory] = useState<string>('牛肉河粉')
    const [currentOrder, setCurrentOrder] = useState<BaseOrder>(DEFAULT_ORDER)
    const [currentOrderItem, setCurrentOrderItem] = useState<OrderItem>(DEFAULT_ORDER_ITEM)
    const [selectedItem, setSelectedItem] = useState<Item | null>(null)
    const [isFullScreen, setIsFullScreen] = useState<boolean>(() => !!document.fullscreenElement)
    const [openOrderTable, setOpenOrderTable] = useState<boolean>(false)
    const [openExpense, setOpenExpense] = useState<boolean>(false)
    const [isEditItem, setIsEditItem] = useState<boolean>(false)
    const [isCheckout, setIsCheckout] = useState<boolean>(false)
    const [isDetail, setIsDetail] = useState<boolean>(false)
    const [isPendingOrder, setIsPendingOrder] = useState<boolean>(false)
    const [isCheckoutPendingOrder, setIsCheckoutPendingOrder] = useState<boolean>(false)
    const [openBtns, setOpenBtns] = useState(true)
    const openBtnsBeforeCheckout = useRef<boolean | null>(null)
    const [openDailyClosing, setOpenDailyClosing] = useState(false)
    const [openOtherRevenue, setOpenOtherRevenue] = useState(false)
    const [openShiftAttendance, setOpenShiftAttendance] = useState(false)
    const [openTemporaryAvailability, setOpenTemporaryAvailability] = useState(false)
    const { data: items = [], isLoading: isItemsLoading } = useItems()
    const { data: storeAddons = [] } = useStoreAddons()
    const { data: discounts = [], isLoading: isDiscountsLoading } = useDiscounts()
    const { data: nextOrderNumber, isLoading: isOrderNumberLoading } = useNextOrderNumber()
    const [currentOrderNumber, setCurrentOrderNumber] = useState<number>(nextOrderNumber ?? 1)
    // Keep temporarily unavailable products visible but not selectable.
    const sellableItems = useMemo(() => items.filter((item) => item.permanentlyActive !== false), [items])
    const activeDiscounts = useMemo(() => discounts.filter((discount) => discount.active), [discounts])
    const itemsByCategory = useMemo(() => {
        const grouped: Record<string, Item[]> = {}
        sellableItems.forEach((item) => {
            if (!grouped[item.categoryName]) grouped[item.categoryName] = []
            grouped[item.categoryName].push(item)
        })
        return grouped
    }, [sellableItems])

    useEffect(() => {
        const onFSChange = () => {
            setIsFullScreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', onFSChange)
        return () => document.removeEventListener('fullscreenchange', onFSChange)
    }, [])

    useEffect(() => {
        if (!selectedItem) return
        const freshItem = findFreshSelectedItem(selectedItem._id, items)
        if (freshItem && freshItem !== selectedItem) setSelectedItem(freshItem)
    }, [items, selectedItem])

    useEffect(() => {
        setCurrentOrder((current) => {
            const syncedItems = syncOrderItemsWithCatalog(current.items, items)
            const changed = syncedItems.some((item, index) => item !== current.items[index])
            return changed ? { ...current, items: syncedItems } : current
        })
        setCurrentOrderItem((current) => {
            const freshItem = findFreshSelectedItem(current.id, items)
            if (!freshItem) return current
            const synced = syncOrderItemsWithCatalog([current], [freshItem])[0]
            return synced ?? current
        })
    }, [items])

    useEffect(() => {
        if (isDiscountsLoading) return
        setCurrentOrder((current) => {
            if (!current.discount) return current
            const stillActive = activeDiscounts.some((discount) => discount.name === current.discount?.name)
            if (stillActive) return current
            toast.error(t('discountUnavailable'))
            return { ...current, discount: null }
        })
    }, [activeDiscounts, isDiscountsLoading, t])

    const filteredItems = itemsByCategory[selectedCategory] ?? []

    const selectUpdateOrderItem = (orderItem: OrderItem) => {
        setCurrentOrderItem(orderItem)
        const item = items.find((item) => orderItem.id === item._id)
        if (item) setSelectedItem(item)
        setIsEditItem(true)
    }

    const totalPrice = useMemo(() => calculateOrderTotal(currentOrder), [currentOrder])

    function setCheckoutOpen(checkout: boolean) {
        if (checkout && !isCheckout) {
            openBtnsBeforeCheckout.current = openBtns
            setOpenBtns(false)
        } else if (!checkout && isCheckout && openBtnsBeforeCheckout.current !== null) {
            setOpenBtns(openBtnsBeforeCheckout.current)
            openBtnsBeforeCheckout.current = null
        }
        setIsCheckout(checkout)
    }

    function handleOpenCheckout(checkout: boolean) {
        if (isCheckoutPendingOrder) {
            setIsCheckoutPendingOrder(false)
            setCurrentOrder(DEFAULT_ORDER)
        }
        setCheckoutOpen(checkout)
        setSelectedItem(null)
        setCurrentOrderItem(DEFAULT_ORDER_ITEM)
    }

    function handlePendingOrder(open: boolean) {
        setCurrentOrder((prev) => ({ ...prev, customer: open ? { name: '', phone: '' } : null }))
        setSelectedItem(null)
        setCurrentOrderItem(DEFAULT_ORDER_ITEM)
        setIsPendingOrder(open)
    }

    function displayOrderDetail(order: BaseOrder) {
        setCurrentOrder(order)
        setCurrentOrderItem(order.items[0])
        const item = items.find((item) => order.items[0].id === item._id)
        if (item) setSelectedItem(item)
        setOpenOrderTable(false)
        setIsDetail(true)
        setCheckoutOpen(false)
    }

    function closeDisplayOrderDetail() {
        setIsDetail(false)
        setIsEditItem(false)
        setCurrentOrderItem(DEFAULT_ORDER_ITEM)
        setCurrentOrder(DEFAULT_ORDER)
        setSelectedItem(null)
    }

    function checkoutPendingOrder(order: BaseOrder) {
        setCurrentOrder(order)
        setSelectedItem(null)
        setOpenOrderTable(false)
        setCheckoutOpen(true)
        setIsCheckoutPendingOrder(true)
    }
    async function toggleFullScreen() {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen()
            } else {
                await document.exitFullscreen()
            }
        } catch (err) {
            console.error(err)
        }
    }
    async function handleLogout() {
        try {
            await logoutAPI()
        } finally {
            await signOut({ callbackUrl: '/login' })
        }
    }
    if (isItemsLoading || isOrderNumberLoading) return <Loading />

    return (
        <div className={`flex h-screen gap-2 p-2 overflow-hidden ${isFullScreen ? 'fixed inset-0 z-50' : ''}`}>
            <FloatingButton open={openBtns} setOpenBtns={setOpenBtns} />
            <div className='left flex flex-col flex-1 min-w-0 border border-[#ccc] rounded'>
                <PosHeader
                    items={items}
                    isDetail={isDetail}
                    isPendingOrder={isPendingOrder}
                    currentOrder={currentOrder}
                    setCurrentOrder={setCurrentOrder}
                    handleOpenCheckout={handleOpenCheckout}
                    handlePendingOrder={handlePendingOrder}
                    isCheckout={isCheckout}
                    currentOrderNumber={currentOrderNumber}
                    totalPrice={totalPrice}
                    closeDisplayOrderDetail={closeDisplayOrderDetail}
                />
                <div className='flex gap-2 p-2 h-full min-h-0'>
                    <div className='ordered-items rounded p-4 border flex-1 max-w-80 border-[#ccc]'>
                        <PosOrderList
                            items={currentOrder.items}
                            updateItem={selectUpdateOrderItem}
                            currentOrderItem={currentOrderItem}
                        />
                    </div>
                    {isCheckout || isPendingOrder ? (
                        <Checkout
                            totalPrice={totalPrice}
                            isPendingOrder={isPendingOrder}
                            currentOrderNumber={currentOrderNumber}
                            setCurrentOrder={setCurrentOrder}
                            currentOrder={currentOrder}
                            isCheckoutPendingOrder={isCheckoutPendingOrder}
                            setIsCheckoutPendingOrder={setIsCheckoutPendingOrder}
                            discounts={activeDiscounts}
                            handlePendingOrder={handlePendingOrder}
                            handleOpenCheckout={handleOpenCheckout}
                            setCurrentOrderNumber={setCurrentOrderNumber}
                        />
                    ) : (
                        <PosItemSection
                            isDetail={isDetail}
                            currentOrderNumber={currentOrderNumber}
                            itemsByCategory={itemsByCategory}
                            currentOrder={currentOrder}
                            selectedCategory={selectedCategory}
                            selectedItem={selectedItem}
                            filteredItems={filteredItems}
                            currentOrderItem={currentOrderItem}
                            isEditItem={isEditItem}
                            setCurrentOrderItem={setCurrentOrderItem}
                            setCurrentOrder={setCurrentOrder}
                            setSelectedCategory={setSelectedCategory}
                            setSelectedItem={setSelectedItem}
                            setIsEditItem={setIsEditItem}
                        />
                    )}
                </div>
            </div>
            {openBtns && (
                <div className='right flex flex-col justify-end p-2 gap-2 border border-[#ccc] rounded'>
                    <Button variant='outline' onClick={toggleFullScreen}>
                        {isFullScreen ? t('fullscreenOff') : t('fullscreenOn')}
                    </Button>
                    <Button variant='outline' onClick={() => setOpenOrderTable(true)}>
                        {t('orderTableTitle')}
                    </Button>
                    <Button variant='outline' onClick={() => setOpenTemporaryAvailability(true)}>
                        {t('temporaryAvailabilityTitle')}
                    </Button>
                    <Button variant='outline' onClick={() => setOpenOtherRevenue(true)}>
                        {t('otherRevenue')}
                    </Button>
                    <Button variant='outline' onClick={() => setOpenExpense(true)}>
                        {t('expenses')}
                    </Button>
                    <Button variant='outline' onClick={() => setOpenShiftAttendance(true)}>
                        {t('attendance')}
                    </Button>
                    <Button variant='outline' onClick={() => setOpenDailyClosing(true)}>
                        {t('dailyClosing')}
                    </Button>
                    <Button variant='destructive' onClick={handleLogout}>
                        {t('logout')}
                    </Button>
                </div>
            )}
            {openExpense && (
                <ExpenseTableDialog
                    open={openExpense}
                    onClose={() => {
                        setOpenExpense(false)
                    }}
                />
            )}
            {openOrderTable && (
                <OrderTable
                    open={openOrderTable}
                    displayOrderDetail={displayOrderDetail}
                    checkoutPendingOrder={checkoutPendingOrder}
                    onClose={() => {
                        setOpenOrderTable(false)
                    }}
                />
            )}
            {openTemporaryAvailability && <TemporaryAvailabilityTable items={items} addons={storeAddons} open={openTemporaryAvailability} onClose={() => setOpenTemporaryAvailability(false)} />}
            {openDailyClosing && <DailyClosing open={openDailyClosing} onClose={() => setOpenDailyClosing(false)} />}
            {openOtherRevenue && <OtherRevenue open={openOtherRevenue} onClose={() => setOpenOtherRevenue(false)} />}
            {openShiftAttendance && (
                <ShiftAttendance
                    open={openShiftAttendance}
                    onClose={() => {
                        setOpenShiftAttendance(false)
                    }}
                />
            )}
        </div>
    )
}

export default POSPage
