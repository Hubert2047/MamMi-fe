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
import { createAddon, deleteAddon, getAddons, updateAddon, type Addon, type AddonInput } from '@/api/addon'

const initial: AddonInput = { name: '', priceExtra: 0, active: true }

export default function AddonsPage() {
  const client = useQueryClient(); const [form, setForm] = useState<AddonInput>(initial); const [editing, setEditing] = useState<Addon | null>(null)
  const { data: addons = [], isLoading } = useQuery({ queryKey: ['addons'], queryFn: getAddons })
  const save = useMutation({ mutationFn: () => editing ? updateAddon({ id: editing._id, data: form }) : createAddon(form), onSuccess: () => { client.invalidateQueries({ queryKey: ['addons'] }); toast.success('Đã lưu addon'); setForm(initial); setEditing(null) }, onError: () => toast.error('Không thể lưu addon') })
  const remove = useMutation({ mutationFn: deleteAddon, onSuccess: () => { client.invalidateQueries({ queryKey: ['addons'] }); toast.success('Đã xóa addon') } })
  return <div className="p-6 md:p-8"><div className="mb-6"><h1 className="text-3xl font-bold">Topping / Addon</h1></div><div className="grid gap-6 lg:grid-cols-[340px_1fr]"><Card className="h-fit"><CardHeader><CardTitle>{editing ? 'Sửa addon' : 'Tạo addon'}</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (form.name.trim()) save.mutate() }}><div className="space-y-2"><Label>Tên addon</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div className="space-y-2"><Label>Giá cộng thêm</Label><Input type="number" min="0" value={form.priceExtra} onChange={(e) => setForm({ ...form, priceExtra: Number(e.target.value) })} /></div><label className="flex items-center gap-2 text-sm"><Checkbox checked={form.active} onCheckedChange={(active) => setForm({ ...form, active: active === true })} />Đang bán</label><div className="flex gap-2"><Button type="submit" disabled={save.isPending}>Lưu</Button>{editing && <Button type="button" variant="outline" onClick={() => { setForm(initial); setEditing(null) }}>Hủy</Button>}</div></form></CardContent></Card><Card><CardHeader><CardTitle>Danh sách addon</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Tên</TableHead><TableHead>Giá</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>{isLoading ? <TableRow><TableCell colSpan={4}>Đang tải...</TableCell></TableRow> : addons.map((addon) => <TableRow key={addon._id}><TableCell>{addon.name}</TableCell><TableCell>{addon.priceExtra.toLocaleString('vi-VN')}</TableCell><TableCell>{addon.active ? 'Đang bán' : 'Tạm ẩn'}</TableCell><TableCell className="space-x-2 text-right"><Button size="sm" variant="outline" onClick={() => { setEditing(addon); setForm({ name: addon.name, priceExtra: addon.priceExtra, active: addon.active }) }}>Sửa</Button><Button size="sm" variant="destructive" onClick={() => remove.mutate(addon._id)}>Xóa</Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></div></div>
}
