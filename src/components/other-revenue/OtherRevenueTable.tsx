import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Button} from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '../ui/alert-dialog'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import React, {useState} from "react";
import {Input} from "@/components/ui/input.tsx";
import {toast} from "sonner";
import {deleteRevenue, type IUpdateRevenue, type Revenue} from "@/api/other-revenue.ts";
import {EditOtherRevenue} from "@/components/other-revenue/EditOtherRevenue.tsx";
import {AddOtherRevenue} from "@/components/other-revenue/AddOtherRevenue.tsx";
import {useI18n} from '@/lib/i18n'

type Props = {
    revenues: Revenue[]
    showOnly?: boolean
}

export function OtherRevenueTable({revenues, showOnly = false}: Props) {
    const {t} = useI18n()
    const queryClient = useQueryClient()
    const [openEdit, setOpenEdit] = useState<boolean>(false)
    const [addRevenue, setAddRevenue] = useState<boolean>(false)
    const [editData, setEditData] = useState<IUpdateRevenue | null>(null)
    const [page, setPage] = useState(1)
    const pageSize = 6
    const [search, setSearch] = useState('')
    const filteredOrders = revenues.filter((o) => {
        if (!search) return true
        return o.name.toString().includes(search.trim())
    })
    const totalPrice = revenues.reduce((acc, i) => acc + i.price, 0)
    const totalPages = Math.ceil(filteredOrders.length / pageSize)
    const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize)
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
        setPage(1)
    }

    function handleEditData(data: IUpdateRevenue) {
        setEditData(data)
        setOpenEdit(true)
    }

    const deleteMutation = useMutation({
        mutationFn: deleteRevenue,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['revenues']}).then()
            toast.success(t('deleteSuccess'))
        },
        onError: () => {
            toast.error(t('deleteFailure'))
        },
    })
    const handleDeleteRevenue = (id: string) => {
        deleteMutation.mutate(id)
    }
    return (
        <div className="flex flex-col flex-1 overflow-clip">
            <div className="flex gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <span className='font-bold text-md'>{t('totalOtherRevenue')}</span>
                    <Input
                        value={totalPrice.toLocaleString()}
                        disabled
                        className=" w-48 ml-2"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder={t('searchRevenue')}
                        value={search}
                        onChange={handleSearchChange}
                        className="w-48 ml-2"
                    />
                    {search && (
                        <Button variant="ghost" size="sm" onClick={() => {
                            setSearch('');
                            setPage(1)
                        }}>
                            {t('delete')}
                        </Button>
                    )}
                </div>
                <Button className='bg-primary text-primary-foreground hover:bg-primary/90' onClick={()=>{
                    setAddRevenue(true)
                }}>{t('addRevenue')}</Button>
            </div>

            <Table>
                <TableHeader className="sticky top-0 z-10">
                    <TableRow>
                        <TableHead>{t('revenueName')}</TableHead>
                        <TableHead>{t('price')}</TableHead>
                        <TableHead>{t('note')}</TableHead>
                        {!showOnly && <TableHead>{t('actions')}</TableHead>}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {paginatedOrders.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                                {t('noRevenueFound')}
                            </TableCell>
                        </TableRow>
                    )}
                    {paginatedOrders.map((exp) => {
                        const isDeleting = deleteMutation.isPending && deleteMutation.variables === exp._id
                        return (
                            <TableRow key={exp._id}>
                                <TableCell>{exp.name}</TableCell>
                                <TableCell>{exp.price.toLocaleString()}</TableCell>
                                <TableCell>{exp.note}</TableCell>
                                {!showOnly && <TableCell>
                                    <Button variant='default' className='w-20'
                                            onClick={() => handleEditData(exp)}>{t('edit')}</Button>

                                    {/* Confirm Delete */}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button className='ml-2 w-20' variant='destructive'
                                                    disabled={isDeleting}>
                                                {t('delete')}
                                            </Button>
                                        </AlertDialogTrigger>

                                        <AlertDialogContent className='max-w-sm p-4'>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className='text-black!'>
                                                    {t('confirmDelete')}
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t('deleteDescription')}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>

                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>

                                                <AlertDialogAction
                                                    onClick={() => handleDeleteRevenue(exp._id)}
                                                    disabled={isDeleting}
                                                    className='bg-red-600 hover:bg-red-700'>
                                                    {isDeleting ? t('deleting') : t('delete')}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>}

                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
            <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-gray-500">
                            {filteredOrders.length} {t('revenueCount')} • {t('page')} {page}/{totalPages || 1}
                        </span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)}
                            disabled={page === 1}>
                        {t('previous')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}
                            disabled={page >= totalPages}>
                        {t('next')}
                    </Button>
                </div>
            </div>
            {openEdit && editData &&
                <EditOtherRevenue editData={editData} setEditData={setEditData} open={openEdit} onClose={() => {
                    setOpenEdit(false)
                }}/>}
            {addRevenue && <AddOtherRevenue open={addRevenue} onClose={() => setAddRevenue(false)}/>}
        </div>

    )
}
