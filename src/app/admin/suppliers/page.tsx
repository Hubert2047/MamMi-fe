'use client'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
    createSupplier,
    deleteSupplier,
    getSuppliers,
    updateSupplier,
    type Supplier,
    type SupplierInput,
} from '@/api/supplier'
import { getLineGroups, type LineGroup } from '@/api/line-group'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useI18n } from '@/lib/i18n'
import { useStoreContext } from '@/lib/store-context'
import { useTablePageSize } from '@/hooks/use-table-page-size'

const empty = (): SupplierInput => ({
    name: '',
    contactPerson: '',
    phone: '',
    address: '',
    note: '',
    lineGroupId: '',
    active: true,
})
export default function SuppliersPage() {
    const { t } = useI18n()
    const { activeStore } = useStoreContext()
    const client = useQueryClient()
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<Supplier | null>(null)
    const [form, setForm] = useState<SupplierInput>(empty())
    const [page, setPage] = useState(1)
    const { containerRef, pageSize } = useTablePageSize()
    const suppliers = useQuery({
        queryKey: ['suppliers', activeStore?._id],
        queryFn: getSuppliers,
        enabled: Boolean(activeStore?._id),
    })
    const lineGroups = useQuery({
        queryKey: ['line-groups', activeStore?._id],
        queryFn: getLineGroups,
        enabled: Boolean(activeStore?._id),
    })
    const selectableLineGroups = (lineGroups.data ?? []).filter(
        (group: LineGroup) => group.usageStatus === 'available' || group._id === form.lineGroupId,
    )
    const totalPages = Math.max(1, Math.ceil((suppliers.data?.length ?? 0) / pageSize))
    const currentPage = Math.min(page, totalPages)
    const visibleSuppliers = (suppliers.data ?? []).slice((currentPage - 1) * pageSize, currentPage * pageSize)
    useEffect(() => {
        setPage((current) => Math.min(current, totalPages))
    }, [totalPages])
    const save = useMutation({
        mutationFn: () => (editing ? updateSupplier({ id: editing._id, data: form }) : createSupplier(form)),
        onSuccess: () => {
            void client.invalidateQueries({ queryKey: ['suppliers'] })
            setOpen(false)
            toast.success(t(editing ? 'supplierUpdated' : 'supplierCreated'))
        },
        onError: () => toast.error(t('supplierSaveError')),
    })
    const remove = useMutation({
        mutationFn: deleteSupplier,
        onSuccess: () => {
            void client.invalidateQueries({ queryKey: ['suppliers'] })
            toast.success(t('supplierDeleted'))
        },
        onError: () => toast.error(t('supplierDeleteError')),
    })
    const edit = (supplier: Supplier) => {
        setEditing(supplier)
        setForm({
            name: supplier.name,
            contactPerson: supplier.contactPerson || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            note: supplier.note || '',
            lineGroupId: supplier.lineGroupId || '',
            active: supplier.active,
        })
        setOpen(true)
    }
    return (
        <div className='h-full overflow-hidden p-6 md:p-8'>
            <div className='mb-6 flex items-center justify-between gap-3'>
                <h1 className='text-3xl font-bold'>{t('suppliers')}</h1>
                <Button
                    onClick={() => {
                        setEditing(null)
                        setForm(empty())
                        setOpen(true)
                    }}
                    disabled={!activeStore}>
                    <Plus className='size-4' />
                    {t('supplierAdd')}
                </Button>
            </div>
            <Card
                ref={containerRef}
                className='flex h-[calc(100svh-180px)] min-h-0 flex-col overflow-hidden [&>div:last-child]:flex-1 [&>div:last-child]:min-h-0 [&>div:last-child]:overflow-hidden [&>div:last-child>div]:h-full [&>div:last-child>div]:!max-h-none'>
                <CardHeader className='shrink-0'>
                    <div className='flex items-center justify-end gap-2'>
                        <span className='mr-2 text-xs text-muted-foreground'>
                            {t('supplierTotal')}: {suppliers.data?.length ?? 0}
                        </span>
                        <span className='text-xs text-muted-foreground'>
                            {currentPage}/{totalPages}
                        </span>
                        <Button
                            size='sm'
                            variant='outline'
                            disabled={currentPage === 1}
                            onClick={() => setPage((current) => current - 1)}>
                            ‹
                        </Button>
                        <Button
                            size='sm'
                            variant='outline'
                            disabled={currentPage === totalPages}
                            onClick={() => setPage((current) => current + 1)}>
                            ›
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className='min-h-0'>
                    <div className='overflow-hidden'>
                        {suppliers.isLoading ? (
                            <p className='text-sm text-muted-foreground'>{t('loading')}</p>
                        ) : suppliers.data?.length ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className='h-8 whitespace-nowrap px-2 py-1 text-xs'>
                                            {t('supplierName')}
                                        </TableHead>
                                        <TableHead className='h-8 whitespace-nowrap px-2 py-1 text-xs'>
                                            {t('supplierContact')}
                                        </TableHead>
                                        <TableHead className='h-8 whitespace-nowrap px-2 py-1 text-xs'>
                                            {t('supplierPhone')}
                                        </TableHead>
                                        <TableHead className='h-8 whitespace-nowrap px-2 py-1 text-xs'>
                                            {t('supplierAddress')}
                                        </TableHead>
                                        <TableHead className='h-8 whitespace-nowrap px-2 py-1 text-right text-xs'>
                                            {t('actions')}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visibleSuppliers.map((supplier) => (
                                        <TableRow key={supplier._id}>
                                            <TableCell className='whitespace-nowrap px-2 py-2 font-medium'>
                                                {supplier.name}
                                            </TableCell>
                                            <TableCell className='px-2 py-2'>{supplier.contactPerson || '—'}</TableCell>
                                            <TableCell className='whitespace-nowrap px-2 py-2'>
                                                {supplier.phone || '—'}
                                            </TableCell>
                                            <TableCell className='px-2 py-2'>{supplier.address || '—'}</TableCell>
                                            <TableCell className='px-2 py-2'>
                                                <div className='flex justify-end gap-2 whitespace-nowrap'>
                                                    <Button size='sm' variant='outline' onClick={() => edit(supplier)}>
                                                        <Pencil className='size-4' />
                                                        {t('edit')}
                                                    </Button>
                                                    <Button
                                                        size='sm'
                                                        variant='destructive'
                                                        onClick={() => remove.mutate(supplier._id)}>
                                                        <Trash2 className='size-4' />
                                                        {t('delete')}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className='text-sm text-muted-foreground'>{t('supplierEmpty')}</p>
                        )}
                    </div>
                </CardContent>
            </Card>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t(editing ? 'supplierEdit' : 'supplierAdd')}</DialogTitle>
                    </DialogHeader>
                    <div className='space-y-3'>
                        <div className='space-y-1.5'>
                            <Label>{t('supplierName')}</Label>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className='space-y-1.5'>
                            <Label>{t('supplierContact')}</Label>
                            <Input
                                value={form.contactPerson}
                                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                            />
                        </div>
                        <div className='space-y-1.5'>
                            <Label>{t('supplierPhone')}</Label>
                            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div className='space-y-1.5'>
                            <Label>{t('supplierAddress')}</Label>
                            <Input
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                            />
                        </div>
                        <div className='space-y-1.5'>
                            <Label>{t('supplierNote')}</Label>
                            <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                        </div>
                        <div className='space-y-1.5'>
                            <Label>{t('supplierLineGroup')}</Label>
                            <select
                                className='flex h-9 w-full items-center rounded-md border bg-background px-3 py-2 text-sm'
                                value={form.lineGroupId || ''}
                                onChange={(e) => setForm({ ...form, lineGroupId: e.target.value })}
                                disabled={lineGroups.isLoading}>
                                <option value=''>{t('supplierLineGroupNone')}</option>
                                {selectableLineGroups.map((group) => (
                                    <option key={group._id} value={group._id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setOpen(false)}>
                            {t('cancel')}
                        </Button>
                        <Button disabled={!form.name.trim() || save.isPending} onClick={() => save.mutate()}>
                            {t('save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
