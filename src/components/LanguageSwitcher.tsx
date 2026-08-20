'use client'

import { useI18n, type Locale } from '@/lib/i18n'

const labels: Record<Locale, string> = { vi: 'VI', en: 'EN', 'zh-TW': '繁中' }
export default function LanguageSwitcher() { const { locale, setLocale, t } = useI18n(); return <label className="flex items-center gap-2 text-xs text-muted-foreground"><span>{t('language')}</span><select aria-label={t('language')} className="h-8 rounded-md border bg-background px-2 text-xs" value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label> }
