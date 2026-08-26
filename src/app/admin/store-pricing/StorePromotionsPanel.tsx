'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { getPromotions, updateStorePromotion } from '@/api/promotion'
import { useI18n } from '@/lib/i18n'
import { useStorePricingEmbedded } from './store-pricing-context'

export default function StorePromotionsPanel() {
  const { t, locale } = useI18n()
  const embedded = useStorePricingEmbedded()
  const client = useQueryClient()
  const { data: promotions = [], isLoading } = useQuery({ queryKey: ['promotions', locale], queryFn: getPromotions })
  const update = useMutation({ mutationFn: updateStorePromotion, onSuccess: () => void client.invalidateQueries({ queryKey: ['promotions'] }) })
  const assigned = promotions.filter((promotion) => promotion.assigned)
  return <div className={embedded ? 'px-1 pb-6' : 'p-6 md:p-8'}><Card><CardHeader><CardTitle>{t('promotions')}</CardTitle></CardHeader><CardContent className='space-y-3'>{isLoading ? <p>{t('loading')}</p> : assigned.length === 0 ? <p className='text-sm text-muted-foreground'>{t('emptyPromotions')}</p> : assigned.map((promotion) => <div className='flex items-center justify-between rounded-lg border p-3' key={promotion._id}><div><p className='font-medium'>{promotion.names[locale] || promotion.name}</p><p className='text-xs text-muted-foreground'>{promotion.mode === 'automatic' ? t('automatic') : t('manual')}</p></div><label className='flex items-center gap-2 text-sm'><Checkbox checked={promotion.enabled} disabled={update.isPending} onCheckedChange={(enabled) => update.mutate({ id: promotion._id, enabled: enabled === true })} />{promotion.enabled ? t('active') : t('hidden')}</label></div>)}</CardContent></Card></div>
}
