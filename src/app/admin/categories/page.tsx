'use client'

import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { createCategory, deleteCategory, getCategories, updateCategory, type Category, type CategoryNames } from '@/api/category'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/hooks/auth'

const emptyNames: CategoryNames = { vi: '', en: '', 'zh-TW': '' }

export default function CategoriesPage() {
  const client = useQueryClient(); const { user } = useAuth(); const { t, locale } = useI18n(); const [names, setNames] = useState<CategoryNames>(emptyNames); const [editing, setEditing] = useState<Category | null>(null)
  const { data: categories = [], isLoading } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const save = useMutation({ mutationFn: () => editing ? updateCategory(editing._id, names) : createCategory(names), onSuccess: () => { client.invalidateQueries({ queryKey: ['categories'] }); client.invalidateQueries({ queryKey: ['admin-items'] }); toast.success(editing ? t('updateCategorySuccess') : t('createCategorySuccess')); setNames(emptyNames); setEditing(null) }, onError: () => toast.error(t('categorySaveError')) })
  const remove = useMutation({ mutationFn: deleteCategory, onSuccess: () => { client.invalidateQueries({ queryKey: ['categories'] }); toast.success(t('deleteCategorySuccess')) }, onError: () => toast.error(t('categoryDeleteError')) })

  function submit(event: FormEvent) { event.preventDefault(); if (!names.vi.trim() && !names.en.trim() && !names['zh-TW'].trim()) return toast.error(t('requiredCategoryName')); save.mutate() }
  function startEditing(category: Category) { setEditing(category); setNames(category.names) }
  function cancelEditing() { setNames(emptyNames); setEditing(null) }
  function displayedName(category: Category) { return category.names[locale] || category.names.vi || category.names.en || category.names['zh-TW'] }

  if (user?.role !== 'SuperAdmin') return <div className="p-6 md:p-8"><Card><CardHeader><CardTitle>{t('superAdminOnly')}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{t('catalogSuperAdminHint')}</CardContent></Card></div>

  return <div className="p-6 md:p-8"><div className="mb-6"><h1 className="text-3xl font-bold">{t('categories')}</h1></div><div className="grid gap-6 lg:grid-cols-[340px_1fr]"><Card className="h-fit"><CardHeader><CardTitle>{editing ? t('editCategory') : t('createCategory')}</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="category-name-vi">{t('categoryName')} (VI)</Label><Input id="category-name-vi" placeholder={t('categoryNamePlaceholder')} value={names.vi} onChange={(e) => setNames({ ...names, vi: e.target.value })} /></div><div className="space-y-2"><Label htmlFor="category-name-en">{t('categoryName')} (EN)</Label><Input id="category-name-en" placeholder={t('categoryNamePlaceholder')} value={names.en} onChange={(e) => setNames({ ...names, en: e.target.value })} /></div><div className="space-y-2"><Label htmlFor="category-name-zh">{t('categoryName')} (繁中)</Label><Input id="category-name-zh" placeholder={t('categoryNamePlaceholder')} value={names['zh-TW']} onChange={(e) => setNames({ ...names, 'zh-TW': e.target.value })} /></div><div className="flex gap-2"><Button type="submit" disabled={save.isPending}>{save.isPending ? t('savingCategory') : t('save')}</Button>{editing && <Button type="button" variant="outline" onClick={cancelEditing}>{t('cancel')}</Button>}</div></form></CardContent></Card><Card><CardHeader><CardTitle>{t('categoryList')}</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>{t('name')}</TableHead><TableHead className="text-right">{t('actions')}</TableHead></TableRow></TableHeader><TableBody>{isLoading ? <TableRow><TableCell colSpan={2}>{t('loading')}</TableCell></TableRow> : categories.length === 0 ? <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">{t('emptyCategories')}</TableCell></TableRow> : categories.map((category) => <TableRow key={category._id}><TableCell>{displayedName(category)}</TableCell><TableCell className="space-x-2 text-right"><Button size="sm" variant="outline" onClick={() => startEditing(category)}>{t('edit')}</Button><AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="destructive" disabled={remove.isPending}>{remove.isPending ? t('deletingCategory') : t('delete')}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle><AlertDialogDescription>{t('confirmDeleteCategory')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => remove.mutate(category._id)}>{t('confirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></div></div>
}
