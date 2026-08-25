'use client'

import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { createPrintAgent, createPrinter, getPrintAgents, rotatePrintAgentToken, testPrinter, updatePrintAgent, updatePrinter, updatePrintRouting, type PrintAgent, type PrintAgentInput, type PrintRouting, type Printer } from '@/api/print-agent'
import { useI18n } from '@/lib/i18n'

const agentInitial: PrintAgentInput = { name: '' }
const printerInitial = { name: '', windowsPrinterName: '', profile: 'kitchen-label-tspl' as const, printerDpi: 203, labelWidthMm: 58, labelHeightMm: 40, labelGapMm: 2 }

export default function PrintAgentSettings() {
  const { t: translate } = useI18n()
  const t = (key: string) => key === 'printAgentNoPrinters' ? '' : translate(key)
  const client = useQueryClient()
  const [agentForm, setAgentForm] = useState(agentInitial)
  const [printerForms, setPrinterForms] = useState<Record<string, typeof printerInitial>>({})
  const [tokenData, setTokenData] = useState<{ agent: PrintAgent; token: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [routeDraft, setRouteDraft] = useState<PrintRouting>({})
  const [confirmation, setConfirmation] = useState<{ message: string; resolve: (confirmed: boolean) => void } | null>(null)
  const query = useQuery({ queryKey: ['print-agents'], queryFn: getPrintAgents })
  const agents = query.data?.agents ?? []
  const allPrinters = agents.flatMap((agent) => agent.printers)
  const invalidate = () => void client.invalidateQueries({ queryKey: ['print-agents'] })

  useEffect(() => { if (query.data?.routing) setRouteDraft(query.data.routing) }, [query.data?.routing])

  const askConfirmation = (message: string) => new Promise<boolean>((resolve) => setConfirmation({ message, resolve }))
  const createAgent = useMutation({ mutationFn: createPrintAgent, onSuccess: (data) => { setCopied(false); setTokenData({ agent: data, token: data.token }); setAgentForm(agentInitial); invalidate() } })
  const create = useMutation({ mutationFn: createPrinter, onSuccess: invalidate })
  const updateAgent = useMutation({ mutationFn: async (input: { id: string; data: { active: boolean } }) => { if (!await askConfirmation(input.data.active ? t('printAgentConfirmEnable') : t('printAgentConfirmDisable'))) throw new Error('cancelled'); return updatePrintAgent(input) }, onSuccess: invalidate })
  const update = useMutation({ mutationFn: async (input: { agentId: string; printerId: string; data: { active: boolean } }) => { if (!await askConfirmation(input.data.active ? t('printAgentConfirmPrinterEnable') : t('printAgentConfirmPrinterDisable'))) throw new Error('cancelled'); return updatePrinter(input) }, onSuccess: invalidate })
  const test = useMutation({ mutationFn: async (input: { agentId: string; printerId: string }) => { if (!await askConfirmation(t('printAgentConfirmTest'))) throw new Error('cancelled'); return testPrinter(input) }, onSuccess: () => toast.success(t('printAgentTestQueued')), onError: (error) => { if (error instanceof Error && error.message !== 'cancelled') toast.error(t('printAgentTestFailed')) } })
  const saveRouting = useMutation({ mutationFn: updatePrintRouting, onSuccess: invalidate })
  const rotate = useMutation({ mutationFn: async (id: string) => { if (!await askConfirmation(t('printAgentConfirmRotate'))) throw new Error('cancelled'); return rotatePrintAgentToken(id) }, onSuccess: (data) => { setCopied(false); setTokenData({ agent: data, token: data.token }) } })
  const formFor = (id: string) => printerForms[id] ?? printerInitial
  const setFormFor = (id: string, data: typeof printerInitial) => setPrinterForms((current) => ({ ...current, [id]: data }))
  const backendUrl = typeof window === 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin).replace(/\/api\/?$/, '')
  const envText = tokenData ? `BACKEND_URL=${backendUrl}\nAGENT_ID=${tokenData.agent.agentId}\nAGENT_TOKEN=${tokenData.token}` : ''
  const copyConfig = async () => {
    if (!envText || copied) return
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(envText)
      else {
        const textarea = document.createElement('textarea')
        textarea.value = envText; textarea.style.position = 'fixed'; textarea.style.left = '-9999px'; textarea.style.opacity = '0'
        document.body.appendChild(textarea); textarea.focus(); textarea.select(); textarea.setSelectionRange(0, textarea.value.length)
        const copiedByFallback = document.execCommand('copy'); textarea.remove(); if (!copiedByFallback) return
      }
      setCopied(true)
    } catch { setCopied(false) }
  }
  const saveRoute = () => { void toast.promise(saveRouting.mutateAsync(routeDraft), { loading: t('saving'), success: t('updateSuccess'), error: t('saveError') }) }
  const routeSelect = (label: string, key: keyof PrintRouting) => <div className='min-w-0 space-y-2'><Label>{label}</Label><Select value={routeDraft[key] ?? 'none'} onValueChange={(value) => setRouteDraft((current) => ({ ...current, [key]: value === 'none' ? undefined : value }))}><SelectTrigger className='h-8 w-full'><SelectValue placeholder={t('printAgentRouteUnset')} /></SelectTrigger><SelectContent><SelectItem value='none'>{t('printAgentRouteUnset')}</SelectItem>{allPrinters.filter((printer) => printer.active).map((printer) => <SelectItem key={printer._id} value={printer._id}>{printer.name} — {printer.windowsPrinterName}</SelectItem>)}</SelectContent></Select></div>

  return <div className='space-y-3'>
    <AlertDialog open={Boolean(confirmation)} onOpenChange={(open) => { if (!open && confirmation) { confirmation.resolve(false); setConfirmation(null) } }}><AlertDialogContent className='max-w-sm p-4'><AlertDialogHeader><AlertDialogTitle>{t('confirm')}</AlertDialogTitle><AlertDialogDescription>{confirmation?.message}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => { confirmation?.resolve(false); setConfirmation(null) }}>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => { confirmation?.resolve(true); setConfirmation(null) }}>{t('confirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <Dialog open={Boolean(tokenData)} onOpenChange={(open) => { if (!open) { setTokenData(null); setCopied(false) } }}><DialogContent className='max-w-2xl'><DialogHeader><DialogTitle>{t('printAgentTokenTitle')}</DialogTitle></DialogHeader><div className='flex min-w-0 items-start gap-2 rounded bg-muted p-3'><pre className='min-w-0 flex-1 whitespace-pre-wrap break-all text-xs'>{envText}</pre><Button type='button' variant='ghost' size='icon' className='shrink-0' aria-label={t('printAgentCopyConfig')} title={t('printAgentCopyConfig')} onClick={() => void copyConfig()}>{copied ? <Check className='text-green-600' /> : <Copy />}</Button></div></DialogContent></Dialog>
    {agents.length === 0 && <Card><CardHeader><CardTitle>{t('printAgentCreateAgent')}</CardTitle><CardDescription>{t('printAgentCreateDescription')}</CardDescription></CardHeader><CardContent className='flex flex-wrap items-end gap-3'><div className='w-full max-w-sm space-y-2'><Label>{t('printAgentAgentName')}</Label><Input value={agentForm.name} placeholder={t('printAgentAgentNamePlaceholder')} onChange={(event) => setAgentForm({ name: event.target.value })} /></div><Button disabled={createAgent.isPending || !agentForm.name.trim()} onClick={() => createAgent.mutate(agentForm)}>{t('printAgentCreateAgent')}</Button></CardContent></Card>}
    <Card><CardHeader className='pb-3'><CardTitle>{t('printAgentRoutingTitle')}</CardTitle><CardDescription>{t('printAgentRoutingDescription')}</CardDescription></CardHeader><CardContent className='space-y-3'><div className='grid items-end gap-3 md:grid-cols-4'>{routeSelect(t('printAgentKitchenRoute'), 'kitchenPrinterId')}{routeSelect(t('printAgentReceiptRoute'), 'receiptPrinterId')}{routeSelect(t('printAgentFapiaoRoute'), 'fapiaoPrinterId')}<Button className='h-8 w-fit' disabled={saveRouting.isPending} onClick={saveRoute}>{saveRouting.isPending ? t('saving') : t('save')}</Button></div></CardContent></Card>
    <Card><CardHeader><CardTitle>{t('printAgentAgentSection')}</CardTitle></CardHeader><CardContent className='space-y-4'>{query.isLoading ? <p className='text-sm text-muted-foreground'>{t('printAgentLoading')}</p> : agents.length === 0 ? <p className='text-sm text-muted-foreground'>{t('printAgentEmpty')}</p> : agents.map((agent) => {
      const form = formFor(agent._id)
      return <div key={agent._id} className='space-y-3 rounded-lg border-2 border-slate-300 p-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'><div><div className='font-medium'>{agent.name} · {agent.active ? t('printAgentEnabled') : t('printAgentDisabled')}</div><div className='text-xs text-muted-foreground'>Agent ID: {agent.agentId} · {t('printAgentTokenLabel')}: {agent.tokenPrefix}…</div></div><div className='flex gap-2'><Button size='sm' variant='outline' onClick={() => rotate.mutate(agent._id)} disabled={rotate.isPending}>{t('printAgentRotateToken')}</Button><Button size='sm' variant='outline' onClick={() => updateAgent.mutate({ id: agent._id, data: { active: !agent.active } })}>{agent.active ? t('printAgentDisable') : t('printAgentEnable')}</Button></div></div>
        <div className='rounded-md bg-muted/40 p-3'><div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'><div className='space-y-1'><Label className='text-xs'>{t('printAgentName')}</Label><Input className='h-9' placeholder={t('printAgentNamePlaceholder')} value={form.name} onChange={(event) => setFormFor(agent._id, { ...form, name: event.target.value })} /></div><div className='space-y-1'><Label className='text-xs'>{t('printAgentWindowsName')}</Label><Input className='h-9' placeholder={t('printAgentWindowsNamePlaceholder')} value={form.windowsPrinterName} onChange={(event) => setFormFor(agent._id, { ...form, windowsPrinterName: event.target.value })} /></div><div className='space-y-1'><Label className='text-xs'>{t('printAgentProfile')}</Label><Select value={form.profile} onValueChange={(value) => setFormFor(agent._id, { ...form, profile: value as typeof form.profile })}><SelectTrigger className='h-9 w-full'><SelectValue /></SelectTrigger><SelectContent><SelectItem value='kitchen-label-tspl'>{t('printAgentKitchenProfile')}</SelectItem><SelectItem value='receipt-escpos'>{t('printAgentReceiptProfile')}</SelectItem></SelectContent></Select></div><div className='flex items-end'><Button className='w-fit' disabled={create.isPending || !form.name.trim() || !form.windowsPrinterName.trim()} onClick={() => { create.mutate({ agentId: agent._id, data: form }); setFormFor(agent._id, printerInitial) }}>{t('printAgentAddPrinter')}</Button></div></div><div className='mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-4'><div className='space-y-1'><Label className='text-xs'>{t('printAgentDpi')}</Label><Input className='h-9' type='number' value={form.printerDpi} onChange={(event) => setFormFor(agent._id, { ...form, printerDpi: Number(event.target.value) })} /></div><div className='space-y-1'><Label className='text-xs'>{t('printAgentWidth')}</Label><Input className='h-9' type='number' value={form.labelWidthMm} onChange={(event) => setFormFor(agent._id, { ...form, labelWidthMm: Number(event.target.value) })} /></div><div className='space-y-1'><Label className='text-xs'>{t('printAgentHeight')}</Label><Input className='h-9' type='number' value={form.labelHeightMm} onChange={(event) => setFormFor(agent._id, { ...form, labelHeightMm: Number(event.target.value) })} /></div><div className='space-y-1'><Label className='text-xs'>{t('printAgentGap')}</Label><Input className='h-9' type='number' value={form.labelGapMm} onChange={(event) => setFormFor(agent._id, { ...form, labelGapMm: Number(event.target.value) })} /></div></div></div>
        {agent.printers.length > 0 && <div className='space-y-2'><div className='font-medium'>{t('printAgentPrinters')} ({agent.printers.length})</div><div className='max-h-[40vh] space-y-2 overflow-y-auto pr-1'>{agent.printers.map((printer: Printer) => <div key={printer._id} className='flex flex-wrap items-center justify-between gap-3 rounded border px-3 py-2 text-sm'><div><span className='font-medium'>{printer.name}</span> · {printer.windowsPrinterName} · {printer.profile} · {printer.labelWidthMm}×{printer.labelHeightMm}mm</div><div className='flex gap-2'><Button size='sm' variant='outline' disabled={!printer.active || test.isPending} onClick={() => test.mutate({ agentId: agent._id, printerId: printer._id })}>{t('printAgentTestPrint')}</Button><Button size='sm' variant='outline' onClick={() => update.mutate({ agentId: agent._id, printerId: printer._id, data: { active: !printer.active } })}>{printer.active ? t('printAgentDisable') : t('printAgentEnable')}</Button></div></div>)}</div></div>}
      </div>
    })}</CardContent></Card>
  </div>
}
