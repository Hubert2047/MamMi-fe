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
import { createAddon, deleteAddon, getAddons, updateAddon, type Addon, type AddonInput } from '@/api/addon'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/hooks/auth'

const initial: AddonInput = { names: { vi: '', en: '', 'zh-TW': '' }, priceExtra: 0, active: true }

export default function AddonsPage() {
  const client = useQueryClient(); const { user } = useAuth(); const isSuperAdmin = user?.role === 'SuperAdmin'; const { t, locale } = useI18n(); const [form, setForm] = useState<AddonInput>(initial); const [editing, setEditing] = useState<Addon | null>(null)
  const { data: addons = [], isLoading } = useQuery({ queryKey: ['addons', locale], queryFn: () => getAddons(locale) })
  const save = useMutation({ mutationFn: () => editing ? updateAddon({ id: editing._id, data: { names: form.names } }) : createAddon({ names: form.names, priceExtra: 0, active: true }), onSuccess: () => { client.invalidateQueries({ queryKey: ['addons'] }); toast.success(editing ? t('updateAddonSuccess') : t('createAddonSuccess')); setForm(initial); setEditing(null) }, onError: () => toast.error(t('addonSaveError')) })
  const remove = useMutation({ mutationFn: deleteAddon, onSuccess: () => { client.invalidateQueries({ queryKey: ['addons'] }); toast.success(t('deleteAddonSuccess')) }, onError: () => toast.error(t('addonDeleteError')) })
  const name = (addon: Addon) => addon.names[locale] || addon.names.vi || addon.names.en || addon.names['zh-TW'] || addon.name
  const submit = (event: FormEvent) => { event.preventDefault(); if (!form.names.vi.trim() && !form.names.en.trim() && !form.names['zh-TW'].trim()) return toast.error(t('requiredAddonName')); save.mutate() }
  const edit = (addon: Addon) => { setEditing(addon); setForm({ ...initial, names: addon.names }) }

  if (!isSuperAdmin) return <div className="p-6 md:p-8"><Card><CardHeader><CardTitle>{t('superAdminOnly')}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{t('catalogSuperAdminHint')}</CardContent></Card></div>

  return <div className="p-6 md:p-8"><div className="mb-6"><h1 className="text-3xl font-bold">{t('addons')}</h1></div><div className="grid gap-6 lg:grid-cols-[380px_1fr]"><Card className="h-fit"><CardHeader><CardTitle>{editing ? t('editAddon') : t('createAddon')}</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={submit}>{(['vi', 'en', 'zh-TW'] as const).map((language) => <div className="space-y-2" key={language}><Label>{t('addonName')} ({language === 'zh-TW' ? '繁中' : language.toUpperCase()})</Label><Input value={form.names[language]} onChange={(event) => setForm({ ...form, names: { ...form.names, [language]: event.target.value } })} /></div>)}<div className="flex gap-2"><Button type="submit" disabled={save.isPending}>{t('save')}</Button>{editing && <Button type="button" variant="outline" onClick={() => { setForm(initial); setEditing(null) }}>{t('cancel')}</Button>}</div></form></CardContent></Card><Card><CardHeader><CardTitle>{t('addonList')}</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>{t('name')}</TableHead><TableHead className="text-right">{t('actions')}</TableHead></TableRow></TableHeader><TableBody>{isLoading ? <TableRow><TableCell colSpan={2}>{t('loading')}</TableCell></TableRow> : addons.map((addon) => <TableRow key={addon._id}><TableCell>{name(addon)}</TableCell><TableCell className="space-x-2 text-right"><Button size="sm" variant="outline" onClick={() => edit(addon)}>{t('edit')}</Button><AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="destructive">{t('delete')}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle><AlertDialogDescription>{t('confirmDeleteAddon')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => remove.mutate(addon._id)}>{t('confirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></div></div>
}
