'use client'

import { useEffect, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/auth'
import { useStoreContext } from '@/lib/store-context'
import { createRealtimeSocket, realtimeClientTypeForPath, realtimeEventsForClient } from '@/lib/realtime'

export default function RealtimeProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth()
  const { activeStoreId } = useStoreContext()
  const queryClient = useQueryClient()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthenticated || !token || !activeStoreId) return
    const clientType = realtimeClientTypeForPath(pathname)
    const socket = createRealtimeSocket(token, activeStoreId, clientType)
    const refreshCatalog = () => {
      void queryClient.invalidateQueries({ queryKey: ['items'] })
      void queryClient.invalidateQueries({ queryKey: ['store-items'] })
      void queryClient.invalidateQueries({ queryKey: ['store-addons'] })
      void queryClient.invalidateQueries({ queryKey: ['discounts'] })
      void queryClient.invalidateQueries({ queryKey: ['inventory-items'], refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: ['inventory-stock'], refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: ['expense-units'], refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: ['expense-units-all'], refetchType: 'all' })
    }
    const refreshOrders = () => void queryClient.invalidateQueries({ queryKey: ['orders'] })
    const refreshClosings = () => {
      void queryClient.invalidateQueries({ queryKey: ['daily-closing-history'] })
      void queryClient.invalidateQueries({ queryKey: ['daily-closing-summary'] })
    }
    const listeners: Record<string, () => void> = {
      'catalog.item.updated': refreshCatalog,
      'catalog.store-item.price.updated': refreshCatalog,
      'catalog.store-item.availability.updated': refreshCatalog,
      'catalog.store-addon.updated': refreshCatalog,
      'catalog.store-addon.availability.updated': refreshCatalog,
      'catalog.discount.updated': refreshCatalog,
      'catalog.changed': refreshCatalog,
      'inventory.item.updated': refreshCatalog,
      'inventory.unit.updated': refreshCatalog,
      'order.created': refreshOrders,
      'order.updated': refreshOrders,
      'order.cancelled': refreshOrders,
      'order.payment.updated': refreshOrders,
      'closing.created': refreshClosings,
      'closing.voided': refreshClosings,
    }
    for (const event of realtimeEventsForClient(clientType)) socket.on(event, listeners[event])
    socket.on('connect_error', (error) => console.warn('[realtime] connection error', error.message))
    return () => {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [activeStoreId, isAuthenticated, pathname, queryClient, token])

  return <>{children}</>
}
