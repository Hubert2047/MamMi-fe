'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/auth'
import Loading from '@/components/Loading'

export default function HomePage() {
  const router = useRouter()
  const { hydrated, isAuthenticated, user } = useAuth()
  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin'
  const isStoreAdmin = user?.role === 'Admin'
  useEffect(() => { if (hydrated) router.replace(isAuthenticated ? (isStoreAdmin ? '/admin/store-pricing' : isAdmin ? '/admin' : '/pos') : '/login') }, [hydrated, isAuthenticated, isAdmin, isStoreAdmin, router])
  return <Loading />
}
