'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useI18n } from '@/lib/i18n'

export default function SettingsPage() {
  const { locale } = useI18n()
  return <div className='p-6 md:p-8'><div className='mb-6'><h1 className='text-3xl font-bold'>Cài đặt</h1></div><Card className='max-w-xl'><CardHeader><CardTitle>Ngôn ngữ hiển thị</CardTitle><CardDescription>Ngôn ngữ được áp dụng chung cho POS và trang quản trị.</CardDescription></CardHeader><CardContent className='flex items-center justify-between'><LanguageSwitcher /><span className='text-sm text-muted-foreground'>Hiện tại: {locale}</span></CardContent></Card></div>
}
