'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createCategory, deleteCategory, getCategories, updateCategory, type Category } from '@/api/category'
import { useI18n } from '@/lib/i18n'

export default function CategoriesPage() {
  const client = useQueryClient(); const { t } = useI18n(); const [name, setName] = useState(''); const [editing, setEditing] = useState<Category | null>(null)
  const { data: categories = [], isLoading } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const save = useMutation({ mutationFn: () => editing ? updateCategory(editing._id, name) : createCategory(name), onSuccess: () => { client.invalidateQueries({ queryKey: ['categories'] }); client.invalidateQueries({ queryKey: ['admin-items'] }); toast.success(editing ? t('updateCategorySuccess') : t('createCategorySuccess')); setName(''); setEditing(null) }, onError: () => toast.error(t('categorySaveError')) })
  const remove = useMutation({ mutationFn: deleteCategory, onSuccess: () => { client.invalidateQueries({ queryKey: ['categories'] }); toast.success(t('deleteCategorySuccess')) }, onError: () => toast.error(t('categoryDeleteError')) })
  return <div className="p-6 md:p-8"><div className="mb-6"><h1 className="text-3xl font-bold">{t('categories')}</h1></div><div className="grid gap-6 lg:grid-cols-[340px_1fr]"><Card className="h-fit"><CardHeader><CardTitle>{editing ? t('editCategory') : t('createCategory')}</CardTitle></CardHeader><CardContent><form onSubmit={(e) => { e.preventDefault(); if (name.trim()) save.mutate() }} className="space-y-4"><div className="space-y-2"><Label>{t('categoryName')}</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div><div className="flex gap-2"><Button type="submit" disabled={save.isPending}>{t('save')}</Button>{editing && <Button type="button" variant="outline" onClick={() => { setName(''); setEditing(null) }}>{t('cancel')}</Button>}</div></form></CardContent></Card><Card><CardHeader><CardTitle>{t('categoryList')}</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>{t('name')}</TableHead><TableHead className="text-right">{t('actions')}</TableHead></TableRow></TableHeader><TableBody>{isLoading ? <TableRow><TableCell colSpan={2}>{t('loading')}</TableCell></TableRow> : categories.map((category) => <TableRow key={category._id}><TableCell>{category.name}</TableCell><TableCell className="space-x-2 text-right"><Button size="sm" variant="outline" onClick={() => { setEditing(category); setName(category.name) }}>{t('edit')}</Button><Button size="sm" variant="destructive" onClick={() => remove.mutate(category._id)}>{t('delete')}</Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></div></div>
}
