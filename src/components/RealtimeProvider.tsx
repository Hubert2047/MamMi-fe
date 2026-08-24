'use client'

import { useEffect, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/auth'
import { useStoreContext } from '@/lib/store-context'
import { createRealtimeSocket, realtimeClientTypeForPath, realtimeEventsForClient } from '@/lib/realtime'

let sharedOrderAlertAudio: HTMLAudioElement | null = null

const getOrderAlertAudio = () => {
  if (typeof window === 'undefined') return
  sharedOrderAlertAudio ??= new Audio('/order-alert.mp3')
  sharedOrderAlertAudio.preload = 'auto'
  return sharedOrderAlertAudio
}

const unlockAudio = () => {
  const audio = getOrderAlertAudio()
  if (!audio) return
  audio.muted = true
  void audio.play().then(() => {
    audio.pause()
    audio.currentTime = 0
    audio.muted = false
  }).catch(() => {
    audio.muted = false
  })
}

const playOrderAlert = () => {
  const audio = getOrderAlertAudio()
  if (!audio) return
  audio.currentTime = 0
  void audio.play().catch(() => undefined)
}

const notifyOrderCreated = () => {
  playOrderAlert()
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(document.title)
  }
}

export default function RealtimeProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth()
  const { activeStoreId } = useStoreContext()
  const queryClient = useQueryClient()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'default') return
    const requestPermission = () => { unlockAudio(); void Notification.requestPermission() }
    window.addEventListener('pointerdown', requestPermission, { once: true })
    return () => window.removeEventListener('pointerdown', requestPermission)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('pointerdown', unlockAudio, { once: true })
    return () => window.removeEventListener('pointerdown', unlockAudio)
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !token || !activeStoreId) return
    const clientType = realtimeClientTypeForPath(pathname)
    const socket = createRealtimeSocket(token, activeStoreId, clientType)
    const refreshCatalog = () => {
      void queryClient.invalidateQueries({ queryKey: ['items'], refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: ['store-items'], refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: ['store-addons'], refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: ['discounts'], refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: ['inventory-items'], refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: ['inventory-stock'], refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: ['expense-units'], refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: ['expense-units-all'], refetchType: 'all' })
    }
    const refreshOrders = () => void queryClient.invalidateQueries({ queryKey: ['orders'] })
    const handleOrderCreated = (payload?: { source?: string }) => {
      refreshOrders()
      if (clientType !== 'pos' || payload?.source === 'pos') return
      notifyOrderCreated()
    }
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
      'order.created': handleOrderCreated,
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
