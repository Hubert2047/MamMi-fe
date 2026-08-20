import { Button } from '@/components/ui/button.tsx'
import type { Item } from '@/api/item.ts'
import { Label } from '@/components/ui/label.tsx'
import { Input } from '@/components/ui/input.tsx'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import NumPad from '@/components/NumPad.tsx'
import React from 'react'
import { updateOrderPayment, type BaseOrder, type OrderItem } from '@/api/order.ts'
import { DEFAULT_ORDER_ITEM, PAYMENT_METHOD_ICONS, type PaymentMethod } from '@/constants'
import { capitalize, generateUUID, getPriceByType } from '@/lib/utils.ts'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Loading from './Loading'

type Props = {
    isDetail: boolean
    currentOrder: BaseOrder
    currentOrderNumber: number
    itemsByCategory: Record<string, Item[]>
    selectedCategory: string
    selectedItem: Item | null
    filteredItems: Item[]
    currentOrderItem: OrderItem
    isEditItem: boolean
    setCurrentOrderItem: React.Dispatch<React.SetStateAction<OrderItem>>
    setCurrentOrder: React.Dispatch<React.SetStateAction<BaseOrder>>
    setSelectedCategory: React.Dispatch<React.SetStateAction<string>>
    setSelectedItem: React.Dispatch<React.SetStateAction<Item | null>>
    setIsEditItem: React.Dispatch<React.SetStateAction<boolean>>
}

function PosItemSection({
    isDetail,
    currentOrder,
    itemsByCategory,
    selectedCategory,
    selectedItem,
    setSelectedCategory,
    filteredItems,
    isEditItem,
    currentOrderItem,
    setCurrentOrderItem,
    setCurrentOrder,
    setSelectedItem,
    setIsEditItem,
    currentOrderNumber,
}: Props) {
    const queryClient = useQueryClient()
    const updateOrderMutation = useMutation({
        mutationFn: updateOrderPayment,
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) => query.queryKey[0] === 'sale-by-payment' || query.queryKey[0] === 'orders',
            })
        },
        onError: () => {
            toast.error('Cập nhật không thành công')
        },
    })
    const selectItem = (item: Item) => {
        let variant = ''
        if (item.variants.length > 0) {
            variant = item.variants[0]
        }
        setCurrentOrderItem((prev) => ({
            ...prev,
            id: item._id,
            itemId: generateUUID(),
            number: currentOrderNumber,
            name: item.name,
            variant,
            basePrice: getPriceByType(currentOrder.type, item.price),
        }))
        setSelectedItem(item)
    }
    const addItem = () => {
        setCurrentOrder((prev) => ({ ...prev, items: [...prev.items, currentOrderItem] }))
        setCurrentOrderItem(DEFAULT_ORDER_ITEM)
        setSelectedItem(null)
    }
    const cancelAddItem = () => {
        setCurrentOrderItem(DEFAULT_ORDER_ITEM)
        setSelectedItem(null)
        setIsEditItem(false)
    }
    const updateItem = () => {
        setCurrentOrder((prev) => {
            const items = prev.items.map((i) => {
                if (i.id === currentOrderItem.id) return currentOrderItem
                return i
            })
            return { ...prev, items }
        })
        setCurrentOrderItem(DEFAULT_ORDER_ITEM)
        setSelectedItem(null)
        setIsEditItem(false)
    }
    const deleteItem = () => {
        setCurrentOrder((prev) => {
            const items = prev.items.filter((i) => {
                return i.id !== currentOrderItem.id
            })
            return { ...prev, items }
        })
        setCurrentOrderItem(DEFAULT_ORDER_ITEM)
        setSelectedItem(null)
        setIsEditItem(false)
    }

    const handleUpdateOrder = async () => {
        await updateOrderMutation.mutateAsync({
            id: currentOrder._id,
            data: { paymentMethod: currentOrder.paymentMethod },
        })
        toast.success('Cập nhật đơn hàng thành công')
    }
    return (
        <>
            {updateOrderMutation.isPending && <Loading />}
            <div className='categories w-22 flex flex-col gap-2 rounded border p-1 border-[#ccc]'>
                {!isDetail &&
                    Object.keys(itemsByCategory).map((categoryName) => {
                        return (
                            <Button
                                key={categoryName}
                                className='h-10'
                                variant={categoryName === selectedCategory ? 'default' : 'outline'}
                                onClick={() => {
                                    if (selectedItem) return
                                    setSelectedCategory(categoryName)
                                }}>
                                {categoryName}
                            </Button>
                        )
                    })}
            </div>
            <div className='select-items flex w-50 flex-wrap items-start justify-start rounded border border-[#ccc] flex-1 p-2 h-full gap-2'>
                {selectedItem === null ? (
                    <div className='w-full grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2'>
                        {filteredItems.map((item) => (
                            <Button
                                key={item._id}
                                className='h-12 w-full'
                                variant='default'
                                onClick={() => selectItem(item)}>
                                    <div className='flex justify-center items-center flex-col ga-2'>
                                        <span>{item.name}</span>
                                        <span>{getPriceByType(currentOrder.type,item.price)}</span>
                                    </div>
                            </Button>
                        ))}
                    </div>
                ) : (
                    <div className='flex flex-col flex-1 justify-start gap-3'>
                        <p className='text-xl'>{currentOrderItem.name}</p>
                        <div className='variant flex justify-start items-center gap-4'>
                            <Label className='block w-27 font-semibold text-start'>Số lượng:</Label>
                            <Input
                                id='amount'
                                disabled={isDetail}
                                value={currentOrderItem.quantity}
                                onChange={(e) => {
                                    setCurrentOrderItem((prev) => ({
                                        ...prev,
                                        quantity: Number(e.target.value),
                                    }))
                                }}
                            />
                        </div>
                        {/* variants */}
                        {selectedItem.variants.length > 0 && (
                            <div className='variants flex justify-start items-center gap-4'>
                                <Label className='block w-27 font-semibold text-start'>Loại:</Label>
                                <RadioGroup
                                    value={currentOrderItem.variant}
                                    onValueChange={(value) => {
                                        if (isDetail) return
                                        setCurrentOrderItem((prev) => ({ ...prev, variant: value }))
                                    }}
                                    className='flex gap-4'>
                                    {selectedItem.variants?.map((variant) => (
                                        <div key={variant} className='flex items-center space-x-2'>
                                            <RadioGroupItem value={variant} id={variant} />
                                            <Label htmlFor={variant}>{variant}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        )}
                        {/* note options */}
                        {selectedItem.noteOptions.length > 0 && (
                            <div className='note-options flex justify-start items-center gap-4'>
                                <Label className='block w-22 font-semibold text-start'>Không thêm: </Label>
                                <ToggleGroup
                                    size='lg'
                                    variant='outline'
                                    type='multiple'
                                    value={currentOrderItem.noteOptions}
                                    onValueChange={(value) => {
                                        if (isDetail) return
                                        setCurrentOrderItem((prev) => ({ ...prev, noteOptions: value }))
                                    }}>
                                    {selectedItem.noteOptions.map((note) => (
                                        <ToggleGroupItem key={note} className='md:w-15' value={note}>
                                            {note}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </div>
                        )}
                        {/* add-on */}
                        {selectedItem.addons.length > 0 && (
                            <div className='add-on flex justify-start items-center mt-6 gap-4'>
                                <Label className='block font-semibold text-start'>Thêm: </Label>
                                <ToggleGroup
                                    size='lg'
                                    variant='outline'
                                    type='multiple'
                                    value={currentOrderItem.addons.map((a) => a.id)}
                                    onValueChange={(values) => {
                                        if (isDetail) return
                                        setCurrentOrderItem((prev) => ({
                                            ...prev,
                                            addons: values.map((id) => {
                                                const existing = prev.addons.find((a) => a.id === id)
                                                if (existing) return existing
                                                const addon = selectedItem.addons.find((a) => a._id === id)!
                                                return { ...addon, amount: 1, id: addon._id }
                                            }),
                                        }))
                                    }}>
                                    {selectedItem.addons.map((addon) => (
                                        <ToggleGroupItem
                                            key={addon._id}
                                            value={addon._id}
                                            className='relative flex md:w-15 flex-col items-center justify-center p-2'>
                                            <span className='text-center'>{addon.name}</span>
                                            <Badge className='absolute -top-6'>{addon.priceExtra}</Badge>
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </div>
                        )}
                        <div className='note flex justify-start items-center gap-4'>
                            <Label className='w-22 block font-semibold text-start'>Ghi chú: </Label>
                            <Input
                                id='note'
                                disabled={isDetail}
                                value={currentOrderItem.note}
                                onChange={(e) => {
                                    setCurrentOrderItem((prev) => ({ ...prev, note: e.target.value }))
                                }}
                            />
                        </div>
                        {/* customer */}
                        {isDetail && currentOrder.customer && (
                            <>
                                <div className='flex justify-start items-center gap-4'>
                                    <Label className='w-22 block font-semibold text-start'>Tên khách: </Label>
                                    <Input id='name' value={currentOrder.customer.name} disabled />
                                </div>
                                <div className='flex justify-start items-center gap-4'>
                                    <Label className='w-22 block font-semibold text-start'>Điện thoại: </Label>
                                    <Input id='name' value={currentOrder.customer.phone} disabled />
                                </div>
                            </>
                        )}
                        {/* edit paymentmedthod */}
                        {isDetail &&
                            ['dine_in', 'takeaway'].includes(currentOrder.type) &&
                            ['cash', 'linepay', 'bank'].includes(currentOrder.paymentMethod) && (
                                <div className='flex gap-2 items-center'>
                                    <p className='font-semibold block w-25 text-start text-md'>Hình thức thanh toán</p>
                                    <div className='flex justify-start items-center gap-4'>
                                        <ToggleGroup
                                            size='lg'
                                            variant='outline'
                                            type='single'
                                            className='w-max'
                                            value={currentOrder.paymentMethod}
                                            onValueChange={(value: PaymentMethod) =>
                                                setCurrentOrder((prev) => ({ ...prev, paymentMethod: value }))
                                            }>
                                            {['cash', 'linepay', 'bank'].map((method) => (
                                                <ToggleGroupItem
                                                    key={method}
                                                    className='flex items-center justify-center w-max'
                                                    value={method}>
                                                    <span>
                                                        {
                                                            PAYMENT_METHOD_ICONS[
                                                                method as
                                                                    | 'cash'
                                                                    | 'uber'
                                                                    | 'linepay'
                                                                    | 'bank'
                                                                    | 'foodpanda'
                                                            ]
                                                        }
                                                    </span>
                                                    <span className='w-max'>{capitalize(method)}</span>
                                                </ToggleGroupItem>
                                            ))}
                                        </ToggleGroup>
                                    </div>
                                    <Button
                                        className='ml-2 bg-green-500 hover:bg-green-600'
                                        size='lg'
                                        onClick={handleUpdateOrder}>
                                        Cập nhật
                                    </Button>
                                </div>
                            )}

                        {!isDetail && (
                            <div className='flex justify-start pt-2 gap-3'>
                                <NumPad
                                    currentValue={currentOrderItem.quantity.toString()}
                                    onChange={(value) => {
                                        setCurrentOrderItem((prev) => ({ ...prev, quantity: Number(value) }))
                                    }}
                                />
                                <div className='flex-1'></div>
                                <>
                                    {isEditItem ? (
                                        <>
                                            <Button variant='default' size='lg' onClick={updateItem}>
                                                Sửa
                                            </Button>
                                            <Button variant='destructive' size='lg' onClick={deleteItem}>
                                                Xóa
                                            </Button>
                                        </>
                                    ) : (
                                        <Button variant='default' size='lg' onClick={addItem}>
                                            Xác nhận
                                        </Button>
                                    )}
                                    <Button variant='outline' size='lg' onClick={cancelAddItem}>
                                        Hủy
                                    </Button>
                                </>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}

export default PosItemSection
