'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { BarChart3, Package, Tags, Percent, Users, ReceiptText, WalletCards, ClipboardList, CalendarCheck, Settings, LogOut, Store, Printer, QrCode, MonitorSmartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/auth'
import { useI18n } from '@/lib/i18n'
import { useStoreContext } from '@/lib/store-context'
import LogoutConfirmDialog from '@/components/LogoutConfirmDialog'

const commonLinks = [
  { href: '/admin/categories', icon: Tags, key: 'categories' },
  { href: '/admin/products', icon: Package, key: 'products' },
  { href: '/admin/addons', icon: WalletCards, key: 'addons' },
  { href: '/admin/promotions', icon: Percent, key: 'promotions' },
  { href: '/admin/accounts', icon: Users, key: 'userAccounts' },
  { href: '/admin/units', icon: Package, key: 'units' },
] as const

const storeLinks = [
  { href: '/admin/store-pricing', icon: ClipboardList, key: 'storePricing' },
  { href: '/admin/employees', icon: Users, key: 'employees' },
  { href: '/admin/expenses', icon: ReceiptText, key: 'expenses' },
  { href: '/admin/inventory', icon: Package, key: 'inventory' },
  { href: '/admin/revenues', icon: WalletCards, key: 'revenues' },
  { href: '/admin/orders', icon: ClipboardList, key: 'orders' },
  { href: '/admin/daily-closing', icon: CalendarCheck, key: 'dailyClosing' },
  { href: '/admin/print-agents', icon: Printer, key: 'printAgents' },
  { href: '/admin/tables', icon: QrCode, key: 'tables' },
  { href: '/admin/pos-devices', icon: MonitorSmartphone, key: 'posDevices' },
] as const

export default function AdminSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { t, locale } = useI18n()
  const { stores, activeStore, activeStoreId, setActiveStoreId, isLoading } = useStoreContext()
  const isSuperAdmin = user?.role === 'SuperAdmin'

  async function logout() { await signOut({ callbackUrl: '/login' }) }
  const linkClass = (href: string) => cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground', pathname === href || pathname.startsWith(`${href}/`) ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : '')
  const settingsLink = <Link href="/admin/settings" className={linkClass('/admin/settings')}><Settings className="size-4" />{({ vi: 'Cài đặt', en: 'Settings', 'zh-TW': '設定' } as const)[locale]}</Link>

  return <aside className="flex h-svh w-72 shrink-0 flex-col border-r bg-card">
    <div className="flex items-center gap-2 border-b px-3 py-2"><Image src="/logo.png" alt="Mam Mi" width={56} height={56} className="size-14 rounded-lg object-contain" priority /><div className="min-w-0"><div className="truncate text-lg font-bold tracking-tight">{t('admin')}</div><div className="mt-1 truncate text-xs text-muted-foreground">{user?.role}{!isSuperAdmin && activeStore?.name ? ` · ${activeStore.name}` : ''}</div></div></div>
    {stores.length > 1 && <div className="border-b p-3"><div className="flex items-center gap-2"><div className="flex shrink-0 items-center gap-2 text-xs font-medium text-muted-foreground"><Store className="size-4" />{t('switchStore')}</div><Select value={activeStoreId} onValueChange={setActiveStoreId} disabled={isLoading || !stores.length}><SelectTrigger className="min-w-0 flex-1"><SelectValue placeholder={activeStore?.name || t('store')} /></SelectTrigger><SelectContent>{stores.map((store) => <SelectItem key={store._id} value={store._id}>{store.name}</SelectItem>)}</SelectContent></Select></div></div>}
    <nav className="flex-1 space-y-4 overflow-y-auto p-3">
      {isSuperAdmin ? <><section><div className="mb-1 px-3 text-xs font-bold uppercase tracking-wide text-foreground">{t('overview')}</div><Link href="/admin/overview" className={linkClass('/admin/overview')}><BarChart3 className="size-4" />{t('overview')}</Link></section><section><div className="mb-1 px-3 text-xs font-bold uppercase tracking-wide text-foreground">{t('commonConfig')}</div>{commonLinks.map(({ href, icon: Icon, key }) => <Link key={href} href={href} className={linkClass(href)}><Icon className="size-4" />{t(key)}</Link>)}</section><section><div className="px-3 text-xs font-bold uppercase tracking-wide text-foreground">{t('currentStoreGroup')} · {activeStore?.name || t('store')}</div>{storeLinks.map(({ href, icon: Icon, key }) => <Link key={href} href={href} className={linkClass(href)}><Icon className="size-4" />{t(key)}</Link>)}</section>{settingsLink}</> : <>{storeLinks.map(({ href, icon: Icon, key }) => <Link key={href} href={href} className={linkClass(href)}><Icon className="size-4" />{t(key)}</Link>)}{settingsLink}</>}
    </nav>
    <div className="border-t p-3"><LogoutConfirmDialog onConfirm={logout}><Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground"><LogOut className="size-4" />{t('logout')}</Button></LogoutConfirmDialog></div>
  </aside>
}
