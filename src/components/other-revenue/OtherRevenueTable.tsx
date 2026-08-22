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

type Props = {
    revenues: Revenue[]
    showOnly?: boolean
}

export function OtherRevenueTable({revenues, showOnly = false}: Props) {
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
            toast.success('Xóa thành công')
        },
        onError: () => {
            toast.error('Xóa thất bại')
        },
    })
    const handleDeleteRevenue = (id: string) => {
        deleteMutation.mutate(id)
    }
    return (
        <div className="flex flex-col flex-1 overflow-clip">
            <div className="flex gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <span className='font-bold text-md'>Tổng thu nhập khác</span>
                    <Input
                        value={totalPrice.toLocaleString()}
                        disabled
                        className=" w-48 ml-2"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Tìm theo tên thu nhập..."
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
                <Button className='bg-primary text-primary-foreground hover:bg-primary/90' onClick={()=>{
                    setAddRevenue(true)
                }}>Thêm thu nhập</Button>
            </div>

            <Table>
                <TableHeader className="sticky top-0 z-10">
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
                                Không tìm thấy thu nhập khác
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
                                                    onClick={() => handleDeleteRevenue(exp._id)}
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
                            {filteredOrders.length} thu nhập • Trang {page}/{totalPages || 1}
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
                <EditOtherRevenue editData={editData} setEditData={setEditData} open={openEdit} onClose={() => {
                    setOpenEdit(false)
                }}/>}
            {addRevenue && <AddOtherRevenue open={addRevenue} onClose={() => setAddRevenue(false)}/>}
        </div>

    )
}
