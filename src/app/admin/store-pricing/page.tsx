'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StoreMenuPanel from '@/components/admin/StoreMenuPanel'
import StoreAddonsPanel from '@/components/admin/StoreAddonsPanel'
import { useI18n } from '@/lib/i18n'
import { StorePricingEmbeddedProvider } from './store-pricing-context'
import StorePromotionsPanel from './StorePromotionsPanel'

export default function StorePricingPage() {
  const { t } = useI18n()
  return <StorePricingEmbeddedProvider><Tabs defaultValue="products" className="h-full min-h-0"><div className="pt-6"><TabsList><TabsTrigger value="products">{t('products')}</TabsTrigger><TabsTrigger value="addons">{t('addons')}</TabsTrigger><TabsTrigger value="promotions">{t('promotions')}</TabsTrigger></TabsList></div><TabsContent className="mt-0 min-h-0 flex-1 overflow-hidden" value="products"><StoreMenuPanel /></TabsContent><TabsContent className="mt-0 min-h-0 flex-1 overflow-hidden" value="addons"><StoreAddonsPanel /></TabsContent><TabsContent className="mt-0 min-h-0 flex-1 overflow-auto" value="promotions"><StorePromotionsPanel /></TabsContent></Tabs></StorePricingEmbeddedProvider>
}
