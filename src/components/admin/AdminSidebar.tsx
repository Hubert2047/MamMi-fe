'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Package, Tags, Percent, Users, ReceiptText, WalletCards, ClipboardList, CalendarCheck, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/auth'
import { useI18n } from '@/lib/i18n'

const links = [
  { href: '/admin/products', label: 'Sản phẩm', icon: Package },
  { href: '/admin/categories', label: 'Danh mục', icon: Tags },
  { href: '/admin/addons', label: 'Topping / Addon', icon: WalletCards },
  { href: '/admin/discounts', label: 'Khuyến mãi', icon: Percent },
  { href: '/admin/employees', label: 'Nhân viên', icon: Users },
  { href: '/admin/expenses', label: 'Chi phí', icon: ReceiptText },
  { href: '/admin/revenues', label: 'Doanh thu khác', icon: WalletCards },
  { href: '/admin/orders', label: 'Đơn hàng', icon: ClipboardList },
  { href: '/admin/daily-closing', label: 'Kết sổ', icon: CalendarCheck },
]

links.push({ href: '/admin/settings', label: 'Settings', icon: Settings })

const linkMessageKeys = {
  '/admin/products': 'products',
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
      <div className="border-b px-5 py-5">
        <div className="text-lg font-bold tracking-tight">{t('admin')}</div>
        <div className="mt-1 text-xs text-muted-foreground">{user?.role}</div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`)) ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : '',
          )}>
            <Icon className="size-4" />
            {href === '/admin/settings' ? settingsLabels[locale] : t(linkMessageKeys[href as keyof typeof linkMessageKeys] || 'products')}
          </Link>
        ))}
      </nav>
      <div className="border-t p-3">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={logout}>
          <LogOut className="size-4" />
          Đăng xuất
        </Button>
        <Button variant="outline" className="mt-2 w-full" onClick={() => router.push('/pos')}>
          Về màn hình bán hàng
        </Button>
      </div>
    </aside>
  )
}
