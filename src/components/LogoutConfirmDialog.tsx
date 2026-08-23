'use client'

import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

type Props = {
  children: ReactNode
  onConfirm: () => void | Promise<void>
}

export default function LogoutConfirmDialog({ children, onConfirm }: Props) {
  const { t } = useI18n()
  return <AlertDialog>
    <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{t('logout')}</AlertDialogTitle>
        <AlertDialogDescription>{t('confirmLogout')}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
        <AlertDialogAction onClick={() => void onConfirm()}>{t('confirm')}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
}
