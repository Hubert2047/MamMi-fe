'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Package, Tags, Percent, Users, ReceiptText, WalletCards, ClipboardList, CalendarCheck, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/auth'
import { useI18n } from '@/lib/i18n'

const links = [
  { href: '/admin/products', icon: Package },
  { href: '/admin/categories', icon: Tags },
  { href: '/admin/addons', icon: WalletCards },
  { href: '/admin/discounts', icon: Percent },
  { href: '/admin/store-pricing', icon: ClipboardList },
  { href: '/admin/employees', icon: Users },
  { href: '/admin/expenses', icon: ReceiptText },
  { href: '/admin/revenues', icon: WalletCards },
  { href: '/admin/orders', icon: ClipboardList },
  { href: '/admin/daily-closing', icon: CalendarCheck },
]

const linkMessageKeys = {
  '/admin/products': 'products',
  '/admin/store-pricing': 'storePricing',
  '/admin/categories': 'categories',
  '/admin/addons': 'addons',
  '/admin/discounts': 'discounts',
  '/admin/employees': 'employees',
  '/admin/expenses': 'expenses',
  '/admin/revenues': 'revenues',
  '/admin/orders': 'orders',
  '/admin/daily-closing': 'dailyClosing',
} as const

const settingsLabels = { vi: '\u0043\u00e0i \u0111\u1eb7t', en: 'Settings', 'zh-TW': '\u8a2d\u5b9a' } as const

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { t, locale } = useI18n()

  async function logout() {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <aside className="flex h-svh w-64 shrink-0 flex-col border-r bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Image src="/logo.png" alt="Mam Mi" width={56} height={56} className="size-14 rounded-lg object-contain" priority />
        <div className="min-w-0">
          <div className="truncate text-lg font-bold tracking-tight">{t('admin')}</div>
          <div className="mt-1 text-xs text-muted-foreground">{user?.role} · {t('mainStore')}</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map(({ href, icon: Icon }) => (
          <Link key={href} href={href} className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            pathname === href || pathname.startsWith(`${href}/`) ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : '',
          )}>
            <Icon className="size-4" />
            {t(linkMessageKeys[href as keyof typeof linkMessageKeys] || 'products')}
          </Link>
        ))}
        <Link href="/admin/settings" className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground', pathname.startsWith('/admin/settings') ? 'bg-primary text-primary-foreground hover:bg-primary/90' : '')}>
          <Settings className="size-4" />
          {settingsLabels[locale]}
        </Link>
      </nav>
      <div className="border-t p-3">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={logout}>
          <LogOut className="size-4" />
          {t('logout')}
        </Button>
        <Button variant="outline" className="mt-2 w-full" onClick={() => router.push('/pos')}>
          {t('backToPos')}
        </Button>
      </div>
    </aside>
  )
}
