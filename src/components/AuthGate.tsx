'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import { getPosDeviceSession } from '@/api/pos-device'

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [deviceAuthorized, setDeviceAuthorized] = useState(false)

  useEffect(() => {
    if (pathname !== '/pos') return
    void getPosDeviceSession().then((session) => { window.localStorage.setItem('activeStoreId', session.storeId); setDeviceAuthorized(true) }).catch(() => router.replace('/pos/enroll'))
  }, [pathname, router])

  if (pathname === '/pos' && !deviceAuthorized) {
    return <Loading />
  }

  return <>{children}</>
}
