import {type IUpdateExpense, updateExpense} from '@/api/expense'
import {Button} from '@/components/ui/button'
import {Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Field, FieldGroup} from '@/components/ui/field'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import React from 'react'
import {toast} from 'sonner'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {useI18n} from '@/lib/i18n'

type Props = {
    editData: IUpdateExpense
    open: boolean
    setEditData: React.Dispatch<React.SetStateAction<IUpdateExpense | null>>
    onClose: () => void
}

export function EditExpenses({editData, setEditData, open, onClose}: Props) {
    const {t} = useI18n()
    const queryClient = useQueryClient()
    const editMutation = useMutation({
        mutationFn: updateExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['expenses']}).then()
            toast.success(t('updateSuccess'), {
                closeButton: true,
                duration: 1500,
            })
            onClose()
        },
        onError: () => {
            toast.error(t('updateFailure'))
        },
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target
        setEditData((prev) => {
            if (!prev) return prev
            return {
                ...prev,
                [name]: name === 'price' ? Number(value) : value,
            }
        })
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
            if (!editData?.name) {
            toast.warning(t('requiredName'))
            return
        }
        if (!editData?.price) {
            toast.warning(t('requiredPrice'))
            return
        }
        editMutation.mutate({
            id: editData._id!,
            data: {
                ...editData,
                price: Number(editData.price),
            },
        })
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) onClose()
            }}>
            <DialogContent className='sm:max-w-sm'>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className='text-black! font-bold! text-xl'>{t('expenseEditTitle')}</DialogTitle>
                    </DialogHeader>

                    <FieldGroup>
                        <Field>
                            <Label htmlFor='name-1'>{t('expenseName')}</Label>
                            <Input id='name-1' name='name' value={editData.name} onChange={handleChange}/>
                        </Field>

                        <Field>
                            <Label htmlFor='price-1'>{t('expensePrice')}</Label>
                            <Input
                                id='price-1'
                                name='price'
                                type='number'
                                value={editData.price}
                                onChange={handleChange}
                            />
                        </Field>

                        <Field>
                            <Label htmlFor='note-1'>{t('expenseNote')}</Label>
                            <Input id='note-1' name='note' value={editData.note} onChange={handleChange}/>
                        </Field>
                    </FieldGroup>

                    <DialogFooter className='mt-4'>
                        <DialogClose asChild>
                            <Button variant='outline' size='lg' className='w-20'>{t('cancel')}</Button>
                        </DialogClose>
                        <Button type='submit' disabled={editMutation.isPending} size='lg' className='w-20'>
                            {editMutation.isPending ? t('saving') : t('save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
