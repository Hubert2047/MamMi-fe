'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getStores, type StoreOption } from '@/api/store'
import { useAuth } from '@/hooks/auth'

type StoreContextValue = {
  stores: StoreOption[]
  activeStore: StoreOption | null
  activeStoreId: string
  setActiveStoreId: (storeId: string) => void
  isLoading: boolean
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const client = useQueryClient()
  const [activeStoreId, setActiveStoreIdState] = useState('')
  const { data: stores = [], isLoading } = useQuery({ queryKey: ['stores'], queryFn: getStores, enabled: isAuthenticated })

  useEffect(() => {
    if (!stores.length) return
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('activeStoreId') : null
    const next = stores.some((store) => store._id === saved) ? saved! : stores[0]._id
    setActiveStoreIdState(next)
    window.localStorage.setItem('activeStoreId', next)
  }, [stores])

  function setActiveStoreId(storeId: string) {
    if (!stores.some((store) => store._id === storeId)) return
    setActiveStoreIdState(storeId)
    window.localStorage.setItem('activeStoreId', storeId)
    void client.invalidateQueries()
  }

  const value = useMemo(() => ({ stores, activeStore: stores.find((store) => store._id === activeStoreId) || null, activeStoreId, setActiveStoreId, isLoading }), [activeStoreId, isLoading, stores])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStoreContext() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStoreContext must be used inside StoreProvider')
  return context
}
