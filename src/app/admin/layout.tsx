'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { useAuth } from '@/hooks/auth'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { hydrated, isAuthenticated, user } = useAuth()
  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin'

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) router.replace('/login')
    else if (user && !isAdmin) router.replace('/unauthorized')
  }, [hydrated, isAdmin, isAuthenticated, pathname, router, user])

  if (!hydrated || !isAuthenticated || !user || !isAdmin) {
    return <div className="min-h-svh bg-background" />
  }

  return <div className="flex min-h-svh bg-muted/30"><AdminSidebar /><main className="admin-content min-w-0 flex-1 overflow-y-auto [&>div]:!pt-0 [&>div]:!px-4 [&>div]:!pb-4 [&>div]:md:!px-6 [&>div]:md:!pb-6">{children}</main></div>
}
