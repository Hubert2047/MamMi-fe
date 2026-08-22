import { createExpense } from '@/api/expense'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '@/lib/i18n'

type Props = {
    open: boolean
    onClose: () => void
}

export function AddExpenseDialog({ open, onClose }: Props) {
    const { t } = useI18n()
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        note: '',
    })

    const createMutation = useMutation({
        mutationFn: createExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] })
            toast.success(t('createSuccess'), {
                closeButton: true,
                duration: 1500,
            })
            onClose()
            setFormData({ name: '', price: '', note: '' })
        },
        onError: () => {
            toast.error(t('createFailure'))
        },
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!formData.name) {
            toast.warning(t('requiredName'))
            return
        }

        if (!formData.price) {
            toast.warning(t('requiredPrice'))
            return
        }

        createMutation.mutate({
            ...formData,
            price: Number(formData.price),
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
                        <DialogTitle className='text-black! font-bold! text-xl'>{t('expenseAddTitle')}</DialogTitle>
                    </DialogHeader>

                    <FieldGroup>
                        <Field>
                            <Label htmlFor='name-1'>{t('expenseName')}</Label>
                            <Input id='name-1' name='name' value={formData.name} onChange={handleChange} />
                        </Field>

                        <Field>
                            <Label htmlFor='price-1'>{t('expensePrice')}</Label>
                            <Input
                                id='price-1'
                                name='price'
                                type='number'
                                value={formData.price}
                                onChange={handleChange}
                            />
                        </Field>

                        <Field>
                            <Label htmlFor='note-1'>{t('expenseNote')}</Label>
                            <Input id='note-1' name='note' value={formData.note} onChange={handleChange} />
                        </Field>
                    </FieldGroup>

                    <DialogFooter className='mt-4'>
                        <DialogClose asChild>
                            <Button variant='outline'>{t('cancel')}</Button>
                        </DialogClose>

                        <Button type='submit' disabled={createMutation.isPending}>
                            {createMutation.isPending ? t('saving') : t('save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
