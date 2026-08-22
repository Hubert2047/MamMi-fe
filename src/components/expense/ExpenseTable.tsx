import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Button} from '@/components/ui/button'
import {deleteExpense, type Expense, type IUpdateExpense} from '@/api/expense'
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
import {EditExpenses} from "@/components/expense/EditExpenses.tsx";
import {toast} from "sonner";
import {AddExpenseDialog} from "@/components/expense/AddExpenseDialog.tsx";

type Props = {
    expenses: Expense[]
    showOnly?: boolean
}

export function ExpenseTable({expenses, showOnly = false}: Props) {
    const queryClient = useQueryClient()
    const [openEdit, setOpenEdit] = useState<boolean>(false)
    const [addExpense, setAddExpense] = useState<boolean>(false)
    const [editData, setEditData] = useState<IUpdateExpense | null>(null)
    const [page, setPage] = useState(1)
    const pageSize = 6
    const [search, setSearch] = useState('')
    const filteredOrders = expenses.filter((o) => {
        if (!search) return true
        return o.name.toString().includes(search.trim())
    })
    const totalPrice = expenses.reduce((acc, i) => acc + i.price, 0)
    const totalPages = Math.ceil(filteredOrders.length / pageSize)
    const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize)
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
        setPage(1)
    }

    function handleEditData(data: IUpdateExpense) {
        setEditData(data)
        setOpenEdit(true)
    }

    const deleteMutation = useMutation({
        mutationFn: deleteExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['expenses']}).then()
            toast.success('Xóa thành công')
        },
        onError: () => {
            toast.error('Xóa thất bại')
        },
    })
    const handleDelete = (id: string) => {
        deleteMutation.mutate(id)
    }
    return (
        <div className="flex flex-col flex-1 overflow-clip">
            <div className="flex gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <span className='font-bold text-lg'>Tổng chi</span>
                    <Input
                        value={totalPrice.toLocaleString()}
                        disabled
                        className=" w-48 ml-2"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Tìm theo tên chi phí..."
                        value={search}
                        onChange={handleSearchChange}
                        className="w-48 ml-2"
                    />
                    {search && (
                        <Button variant="ghost" size="sm" onClick={() => {
                            setSearch('');
                            setPage(1)
                        }}>
                            Xóa
                        </Button>
                    )}
                </div>
                {!showOnly && <Button className='bg-primary text-primary-foreground hover:bg-primary/90' onClick={() => {
                    setAddExpense(true)
                }}>Thêm chi phí</Button>}
            </div>
            <Table>
                <TableHeader className="sticky top-0  z-10">
                    <TableRow>
                        <TableHead>Tên</TableHead>
                        <TableHead>Giá</TableHead>
                        <TableHead>Chú thích</TableHead>
                        {!showOnly && <TableHead>Hành động</TableHead>}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {paginatedOrders.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                                Không tìm thấy chi phí
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
                                            onClick={() => handleEditData(exp)}>Sửa</Button>

                                    {/* Confirm Delete */}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button className='ml-2 w-20' variant='destructive'
                                                    disabled={isDeleting}>
                                                Xóa
                                            </Button>
                                        </AlertDialogTrigger>

                                        <AlertDialogContent className='max-w-sm p-4'>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className='text-black!'>
                                                    Bạn có chắc muốn xóa?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Hành động này không thể hoàn tác.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>

                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Huỷ</AlertDialogCancel>

                                                <AlertDialogAction
                                                    onClick={() => handleDelete(exp._id)}
                                                    disabled={isDeleting}
                                                    className='bg-red-600 hover:bg-red-700'>
                                                    {isDeleting ? 'Đang xoá...' : 'Xóa'}
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
                            {filteredOrders.length} chi phí • Trang {page}/{totalPages || 1}
                        </span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)}
                            disabled={page === 1}>
                        Trước
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}
                            disabled={page >= totalPages}>
                        Sau
                    </Button>
                </div>
            </div>
            {openEdit && editData &&
                <EditExpenses editData={editData} setEditData={setEditData} open={openEdit} onClose={() => {
                    setOpenEdit(false)
                }}/>}
            {addExpense && <AddExpenseDialog open={addExpense} onClose={() => setAddExpense(false)}/>}
        </div>

    )
}
