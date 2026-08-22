'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getDailyClosings, voidDailyClosing, type IDailyClosing } from '@/api/daily-closing'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/hooks/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export default function DailyClosingHistory() {
  const { t } = useI18n()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<IDailyClosing | null>(null)
  const [reason, setReason] = useState('')
  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin'
  const history = useQuery({ queryKey: ['daily-closing-history'], queryFn: () => getDailyClosings(3650) })
  const voidMutation = useMutation({
    mutationFn: voidDailyClosing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-closing-history'] })
      queryClient.invalidateQueries({ queryKey: ['daily-closing-summary'] })
      setSelected(null)
      setReason('')
      toast.success(t('voidSuccess'))
    },
    onError: () => toast.error(t('voidFailure')),
  })

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6"><h1 className="text-3xl font-bold">{t('closingHistoryTitle')}</h1></div>
      <Card>
        <CardHeader><CardTitle>{t('closingHistoryTitle')}</CardTitle></CardHeader>
        <CardContent>
          {history.isLoading ? <p>{t('loading')}</p> : history.data?.length ? (
            <Table>
              <TableHeader><TableRow>
                <TableHead>{t('closingPeriod')}</TableHead>
                <TableHead>{t('closingStatus')}</TableHead>
                <TableHead>{t('closingSystemAmount')}</TableHead>
                <TableHead>{t('closingActualAmount')}</TableHead>
                <TableHead>{t('closingDifference')}</TableHead>
                <TableHead>{t('closingAction')}</TableHead>
              </TableRow></TableHeader>
              <TableBody>{history.data.map((closing) => (
                <TableRow key={closing._id}>
                  <TableCell>{formatDate(closing.periodStart ?? closing.createdAt)} → {formatDate(closing.periodEnd ?? closing.createdAt)}</TableCell>
                  <TableCell>{closing.status === 'voided' ? t('closingVoided') : t('closingConfirmed')}</TableCell>
                  <TableCell>{closing.systemAmount.toLocaleString()}</TableCell>
                  <TableCell>{closing.actualTotal.toLocaleString()}</TableCell>
                  <TableCell>{(closing.difference ?? closing.actualTotal - closing.systemAmount).toLocaleString()}</TableCell>
                  <TableCell>{isAdmin && closing.status === 'confirmed' && history.data[0]?._id === closing._id ? (
                    <Button variant="destructive" size="sm" onClick={() => setSelected(closing)}>{t('voidClosing')}</Button>
                  ) : null}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          ) : <p className="text-muted-foreground">{t('noClosings')}</p>}
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('voidClosingTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('voidClosingDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t('voidReasonPlaceholder')} />
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction disabled={!reason.trim() || voidMutation.isPending} onClick={(event) => { event.preventDefault(); if (selected) voidMutation.mutate({ id: selected._id, reason }) }}>{t('voidClosing')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
