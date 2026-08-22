'use client'

import { io, type Socket } from 'socket.io-client'

export type RealtimeClientType = 'pos' | 'admin' | 'customer' | 'order'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

export const createRealtimeSocket = (token: string, storeId: string, clientType: RealtimeClientType = 'pos', orderId?: string): Socket => io(API_BASE_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  auth: { token, storeId, clientType, orderId },
})

export const realtimeClientTypeForPath = (pathname: string): RealtimeClientType => {
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/pos')) return 'pos'
  return 'customer'
}

export const realtimeEventsForClient = (clientType: RealtimeClientType): string[] => {
  if (clientType === 'admin') return [
    'catalog.item.updated', 'catalog.store-item.price.updated', 'catalog.store-item.availability.updated', 'catalog.store-addon.updated', 'catalog.discount.updated', 'catalog.changed',
    'order.created', 'order.updated', 'order.cancelled', 'order.payment.updated', 'closing.created', 'closing.voided',
  ]
  if (clientType === 'customer') return ['catalog.item.updated', 'catalog.store-item.price.updated', 'catalog.store-item.availability.updated', 'catalog.store-addon.updated', 'catalog.discount.updated', 'catalog.changed']
  if (clientType === 'order') return ['catalog.item.updated', 'catalog.store-item.price.updated', 'catalog.store-item.availability.updated', 'catalog.store-addon.updated', 'catalog.discount.updated', 'order.updated', 'order.cancelled', 'order.payment.updated']
  return ['catalog.item.updated', 'catalog.store-item.price.updated', 'catalog.store-item.availability.updated', 'catalog.store-addon.updated', 'catalog.discount.updated', 'catalog.changed', 'order.created', 'order.updated', 'order.cancelled', 'order.payment.updated']
}
