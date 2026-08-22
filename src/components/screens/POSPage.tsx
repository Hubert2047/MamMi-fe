'use client'

import React, { useEffect, useMemo, useState } from 'react'
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
import { useDiscounts, useItems, useNextOrderNumber } from '@/hooks/queries'
import { OrderTable } from '@/components/orders/OrderTable.tsx'
import { FloatingButton } from '@/components/FloatingButton.tsx'
import DailyClosing from '@/components/daily-closing/DailyClosing.tsx'
import OtherRevenue from '@/components/other-revenue/OtherRevenue.tsx'
import ShiftAttendance from '@/components/ShiftAttendance.tsx'
import { signOut } from 'next-auth/react'
import { logoutAPI } from '@/api/auth'
import { calculateOrderTotal } from '@/lib/posCalculations'

const POSPage: React.FC = () => {
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
    const [openDailyClosing, setOpenDailyClosing] = useState(false)
    const [openOtherRevenue, setOpenOtherRevenue] = useState(false)
    const [openShiftAttendance, setOpenShiftAttendance] = useState(false)
    const { data: items = [], isLoading: isItemsLoading } = useItems(true)
    const { data: discounts = [] } = useDiscounts()
    const { data: nextOrderNumber, isLoading: isOrderNumberLoading } = useNextOrderNumber()
    const [currentOrderNumber, setCurrentOrderNumber] = useState<number>(nextOrderNumber ?? 1)
    const itemsByCategory = useMemo(() => {
        const grouped: Record<string, Item[]> = {}
        items.forEach((item) => {
            if (!grouped[item.categoryName]) grouped[item.categoryName] = []
            grouped[item.categoryName].push(item)
        })
        return grouped
    }, [items])

    useEffect(() => {
        const onFSChange = () => {
            setIsFullScreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', onFSChange)
        return () => document.removeEventListener('fullscreenchange', onFSChange)
    }, [])
    const filteredItems = itemsByCategory[selectedCategory] ?? []

    const selectUpdateOrderItem = (orderItem: OrderItem) => {
        setCurrentOrderItem(orderItem)
        const item = items.find((item) => orderItem.id === item._id)
        if (item) setSelectedItem(item)
        setIsEditItem(true)
    }

    const totalPrice = useMemo(() => calculateOrderTotal(currentOrder), [currentOrder])

    function handleOpenCheckout(checkout: boolean) {
        if (isCheckoutPendingOrder) {
            setIsCheckoutPendingOrder(false)
            setCurrentOrder(DEFAULT_ORDER)
        }
        setIsCheckout(checkout)
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
        setIsCheckout(false)
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
        setIsCheckout(true)
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
                            discounts={discounts}
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
                        {isFullScreen ? 'Tắt toàn màn hình' : 'Mở toàn màn hình'}
                    </Button>
                    <Button variant='outline' onClick={() => setOpenOrderTable(true)}>
                        Bảng đơn hàng
                    </Button>
                    <Button variant='outline' onClick={() => setOpenOtherRevenue(true)}>
                        Thu nhập khác
                    </Button>
                    <Button variant='outline' onClick={() => setOpenExpense(true)}>
                        Bảng chi phí
                    </Button>
                    <Button variant='outline' onClick={() => setOpenShiftAttendance(true)}>
                        Chấm công
                    </Button>
                    <Button variant='outline' onClick={() => setOpenDailyClosing(true)}>
                        Kết sổ
                    </Button>
                    <Button variant='destructive' onClick={handleLogout}>
                        Đăng xuất
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
