'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createDiscount, deleteDiscount, getDiscounts, updateDiscount, type Discount, type DiscountInput } from '@/api/discount'

const initial: DiscountInput = { name: '', amount: 0, type: 'percent', note: '', active: true }

export default function DiscountsPage() {
  const client = useQueryClient(); const [form, setForm] = useState<DiscountInput>(initial); const [editing, setEditing] = useState<Discount | null>(null)
  const { data: discounts = [], isLoading } = useQuery({ queryKey: ['discounts'], queryFn: getDiscounts })
  const save = useMutation({ mutationFn: () => editing ? updateDiscount({ id: editing._id, data: form }) : createDiscount(form), onSuccess: () => { client.invalidateQueries({ queryKey: ['discounts'] }); toast.success('Đã lưu khuyến mãi'); setForm(initial); setEditing(null) }, onError: () => toast.error('Không thể lưu khuyến mãi') })
  const remove = useMutation({ mutationFn: deleteDiscount, onSuccess: () => { client.invalidateQueries({ queryKey: ['discounts'] }); toast.success('Đã xóa khuyến mãi') } })
  return <div className="p-6 md:p-8"><div className="mb-6"><h1 className="text-3xl font-bold">Khuyến mãi</h1></div><div className="grid gap-6 lg:grid-cols-[340px_1fr]"><Card className="h-fit"><CardHeader><CardTitle>{editing ? 'Sửa khuyến mãi' : 'Tạo khuyến mãi'}</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (form.name.trim()) save.mutate() }}><div className="space-y-2"><Label>Tên</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div className="grid grid-cols-2 gap-2"><div className="space-y-2"><Label>Loại</Label><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DiscountInput['type'] })}><option value="percent">Phần trăm</option><option value="value">Số tiền</option></select></div><div className="space-y-2"><Label>Giá trị</Label><Input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div></div><div className="space-y-2"><Label>Ghi chú</Label><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div><label className="flex items-center gap-2 text-sm"><Checkbox checked={form.active} onCheckedChange={(active) => setForm({ ...form, active: active === true })} />Đang áp dụng</label><div className="flex gap-2"><Button type="submit" disabled={save.isPending}>Lưu</Button>{editing && <Button type="button" variant="outline" onClick={() => { setForm(initial); setEditing(null) }}>Hủy</Button>}</div></form></CardContent></Card><Card><CardHeader><CardTitle>Danh sách khuyến mãi</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Tên</TableHead><TableHead>Giá trị</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>{isLoading ? <TableRow><TableCell colSpan={4}>Đang tải...</TableCell></TableRow> : discounts.map((discount) => <TableRow key={discount._id}><TableCell>{discount.name}</TableCell><TableCell>{discount.amount}{discount.type === 'percent' ? '%' : ' đ'}</TableCell><TableCell>{discount.active ? 'Đang áp dụng' : 'Tạm ẩn'}</TableCell><TableCell className="space-x-2 text-right"><Button size="sm" variant="outline" onClick={() => { setEditing(discount); setForm({ name: discount.name, amount: discount.amount, type: discount.type, note: discount.note, active: discount.active }) }}>Sửa</Button><Button size="sm" variant="destructive" onClick={() => remove.mutate(discount._id)}>Xóa</Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></div></div>
}
