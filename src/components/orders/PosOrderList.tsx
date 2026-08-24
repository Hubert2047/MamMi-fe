import type {OrderItem} from '@/api/order.ts'
import {Button} from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

type Props = {

    items: OrderItem[]
    currentOrderItem: OrderItem
    updateItem(
        item: OrderItem,
    ): void
    disabled?: boolean
    canEdit?: boolean
    isOrderEditing?: boolean
    onStartOrderEdit?: () => void
    onStartAddItem?: () => void
    onCancelOrderEdit?: () => void
    onSaveOrderEdit?: () => void
}
export default function PosOrderList({ items, currentOrderItem, updateItem, disabled = false, canEdit = false, isOrderEditing = false, onStartOrderEdit, onStartAddItem, onCancelOrderEdit, onSaveOrderEdit }: Props) {
    const { t } = useI18n()
    const itemCount = items.reduce((total, item) => total + item.quantity, 0)
    return (
        <div className='flex h-full min-h-0 flex-col'>
            <div className='mb-2 flex min-h-12 shrink-0 items-center justify-between gap-2 border-b px-1 py-2 text-sm font-semibold'>
                <span className='tabular-nums text-muted-foreground'>{t('totalItems')}: {itemCount}</span>
                {canEdit && (isOrderEditing ? (
                    <div className='flex gap-1'>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button className='h-9 px-3' variant='outline'>{t('cancel')}</Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('cancel')}</AlertDialogTitle>
                                    <AlertDialogDescription>{t('confirmDiscardOrderChanges')}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction className='bg-destructive text-destructive-foreground hover:bg-destructive/90' onClick={onCancelOrderEdit}>{t('confirm')}</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button className='h-9 px-3'>{t('save')}</Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('save')}</AlertDialogTitle>
                                    <AlertDialogDescription>{t('confirmSaveOrderChanges')}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={onSaveOrderEdit}>{t('confirm')}</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button className='h-9 px-3' variant='outline' onClick={onStartAddItem}>{t('addOrderItem')}</Button>
                    </div>
                ) : (
                    <Button className='h-9 px-3' variant='outline' onClick={onStartOrderEdit}>{t('edit')}</Button>
                ))}
            </div>
            <div className='flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto pr-2 [scrollbar-gutter:stable]'>
            {items.map((item, index) => (
                <Button
                    key={item.id + '-' + index}
                    variant={currentOrderItem.itemId === item.itemId ? "default" : 'outline'}
                    className='flex min-h-9 w-full justify-between px-2 py-1 text-sm'
                    disabled={disabled}
                    onClick={() => updateItem(item)}>
                    <span className='flex-1 text-left'>{item.name}</span>
                    <span className='w-20 text-center'>x{item.quantity}</span>
                    <span className='w-24 text-right'>
                        {item.quantity * item.basePrice +
                            item.addons.reduce((acc, i) => acc + i.amount * i.priceExtra, 0)}
                    </span>
                </Button>
            ))}
            </div>
        </div>
    )
}
