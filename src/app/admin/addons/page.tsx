'use client'

import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { createAddon, deleteAddon, getAddons, updateAddon, type Addon, type AddonInput } from '@/api/addon'
import { useI18n } from '@/lib/i18n'

const initial: AddonInput = { names: { vi: '', en: '', 'zh-TW': '' }, priceExtra: 0, active: true }

export default function AddonsPage() {
  const client = useQueryClient(); const { t, locale } = useI18n(); const [form, setForm] = useState<AddonInput>(initial); const [editing, setEditing] = useState<Addon | null>(null)
  const { data: addons = [], isLoading } = useQuery({ queryKey: ['addons', locale], queryFn: () => getAddons(locale) })
  const save = useMutation({ mutationFn: () => editing ? updateAddon({ id: editing._id, data: form }) : createAddon(form), onSuccess: () => { client.invalidateQueries({ queryKey: ['addons'] }); toast.success(editing ? t('updateAddonSuccess') : t('createAddonSuccess')); setForm(initial); setEditing(null) }, onError: () => toast.error(t('addonSaveError')) })
  const remove = useMutation({ mutationFn: deleteAddon, onSuccess: () => { client.invalidateQueries({ queryKey: ['addons'] }); toast.success(t('deleteAddonSuccess')) }, onError: () => toast.error(t('addonDeleteError')) })

  function submit(event: FormEvent) { event.preventDefault(); if (!form.names.vi.trim() && !form.names.en.trim() && !form.names['zh-TW'].trim()) return toast.error(t('requiredAddonName')); save.mutate() }
  function startEditing(addon: Addon) { setEditing(addon); setForm({ names: addon.names, priceExtra: addon.priceExtra, active: addon.active }) }
  function cancelEditing() { setForm(initial); setEditing(null) }
  function displayedName(addon: Addon) { return addon.names[locale] || addon.names.vi || addon.names.en || addon.names['zh-TW'] || addon.name }

  return <div className="p-6 md:p-8"><div className="mb-6"><h1 className="text-3xl font-bold">{t('addons')}</h1></div><div className="grid gap-6 lg:grid-cols-[380px_1fr]"><Card className="h-fit"><CardHeader><CardTitle>{editing ? t('editAddon') : t('createAddon')}</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={submit}><div className="space-y-2"><Label htmlFor="addon-name-vi">{t('addonName')} (VI)</Label><Input id="addon-name-vi" placeholder={t('addonNamePlaceholder')} value={form.names.vi} onChange={(e) => setForm({ ...form, names: { ...form.names, vi: e.target.value } })} /></div><div className="space-y-2"><Label htmlFor="addon-name-en">{t('addonName')} (EN)</Label><Input id="addon-name-en" placeholder={t('addonNamePlaceholder')} value={form.names.en} onChange={(e) => setForm({ ...form, names: { ...form.names, en: e.target.value } })} /></div><div className="space-y-2"><Label htmlFor="addon-name-zh">{t('addonName')} (繁中)</Label><Input id="addon-name-zh" placeholder={t('addonNamePlaceholder')} value={form.names['zh-TW']} onChange={(e) => setForm({ ...form, names: { ...form.names, 'zh-TW': e.target.value } })} /></div><div className="space-y-2"><Label htmlFor="addon-price">{t('extraPrice')}</Label><Input id="addon-price" type="number" min="0" value={form.priceExtra} onChange={(e) => setForm({ ...form, priceExtra: Number(e.target.value) })} /></div><label className="flex items-center gap-2 text-sm"><Checkbox checked={form.active} onCheckedChange={(active) => setForm({ ...form, active: active === true })} />{t('selling')}</label><div className="flex gap-2"><Button type="submit" disabled={save.isPending}>{save.isPending ? t('savingAddon') : t('save')}</Button>{editing && <Button type="button" variant="outline" onClick={cancelEditing}>{t('cancel')}</Button>}</div></form></CardContent></Card><Card><CardHeader><CardTitle>{t('addonList')}</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>{t('name')}</TableHead><TableHead>{t('price')}</TableHead><TableHead>{t('status')}</TableHead><TableHead className="text-right">{t('actions')}</TableHead></TableRow></TableHeader><TableBody>{isLoading ? <TableRow><TableCell colSpan={4}>{t('loading')}</TableCell></TableRow> : addons.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t('emptyAddons')}</TableCell></TableRow> : addons.map((addon) => <TableRow key={addon._id}><TableCell>{displayedName(addon)}</TableCell><TableCell>{addon.priceExtra.toLocaleString(locale)}</TableCell><TableCell>{addon.active ? t('selling') : t('hidden')}</TableCell><TableCell className="space-x-2 text-right"><Button size="sm" variant="outline" onClick={() => startEditing(addon)}>{t('edit')}</Button><AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="destructive" disabled={remove.isPending}>{remove.isPending ? t('deletingAddon') : t('delete')}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle><AlertDialogDescription>{t('confirmDeleteAddon')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => remove.mutate(addon._id)}>{t('confirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></div></div>
}
