'use client'

import PrintAgentSettings from '@/components/admin/PrintAgentSettings'
import { useI18n } from '@/lib/i18n'

export default function PrintAgentsPage() {
  const { t } = useI18n()
  return <div className='print-agent-page p-6 md:p-8 [&_input.h-9]:h-8 [&_[data-slot=select-trigger].h-9]:h-8'><div className='mb-3'><h1 className='text-3xl font-bold tracking-tight'>{t('printAgentAgentSection')}</h1></div><PrintAgentSettings /></div>
}
