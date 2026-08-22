'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StoreMenuPage from '../store-menu/page'
import StoreAddonsPage from '../store-addons/page'
import { useI18n } from '@/lib/i18n'
import { StorePricingEmbeddedProvider } from './store-pricing-context'

export default function StorePricingPage() {
  const { t } = useI18n()
  return <StorePricingEmbeddedProvider><Tabs defaultValue="products" className="h-full min-h-0"><div className="pt-6"><TabsList><TabsTrigger value="products">{t('products')}</TabsTrigger><TabsTrigger value="addons">{t('addons')}</TabsTrigger></TabsList></div><TabsContent className="mt-0 min-h-0 flex-1 overflow-hidden" value="products"><StoreMenuPage /></TabsContent><TabsContent className="mt-0 min-h-0 flex-1 overflow-hidden" value="addons"><StoreAddonsPage /></TabsContent></Tabs></StorePricingEmbeddedProvider>
}
