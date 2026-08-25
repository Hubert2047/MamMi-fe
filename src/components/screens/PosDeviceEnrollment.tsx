'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { enrollPosDevice } from '@/api/pos-device'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'

const labels = { vi: { title: 'Đăng ký máy POS', description: 'Nhập mã một lần do Admin tạo cho iPad này.', code: 'Mã đăng ký', submit: 'Đăng ký thiết bị', success: 'Thiết bị đã được đăng ký' }, en: { title: 'Register POS device', description: 'Enter the one-time code created by an administrator for this iPad.', code: 'Enrollment code', submit: 'Register device', success: 'Device registered' }, 'zh-TW': { title: '註冊 POS 裝置', description: '輸入管理員為此 iPad 建立的一次性代碼。', code: '註冊代碼', submit: '註冊裝置', success: '裝置已註冊' } } as const

export default function PosDeviceEnrollment() {
    const { locale, t: translate } = useI18n(); const t = labels[locale]; const router = useRouter(); const [code, setCode] = useState(''); const [loading, setLoading] = useState(false)
    const submit = async (event: React.FormEvent) => { event.preventDefault(); setLoading(true); try { const session = await enrollPosDevice(code); window.localStorage.setItem('activeStoreId', session.storeId); window.sessionStorage.setItem('pos-device-enrolled', 'true'); toast.success(t.success); await new Promise((resolve) => window.setTimeout(resolve, 180)); router.replace('/pos') } catch (error) { toast.error(isAxiosError(error) ? error.response?.data?.message || t.description : t.description) } finally { setLoading(false) } }
    return <main className='auth-screen fixed inset-0 flex h-dvh w-full touch-none items-center justify-center overflow-hidden overscroll-none bg-muted/30 p-4'><div className='relative z-10 flex w-full max-w-sm -translate-y-12 flex-col items-center gap-2'><Image src='/logo.png' alt='POS' width={176} height={128} className='h-28 w-auto object-contain' priority /><Card className='w-full'><CardHeader><CardTitle>{t.title}</CardTitle><CardDescription>{t.description}</CardDescription></CardHeader><CardContent><form className='space-y-4' onSubmit={submit}><Input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={t.code} inputMode='numeric' pattern='[0-9]{6}' maxLength={6} autoComplete='one-time-code' autoCapitalize='none' autoCorrect='off' required /><Button className='h-10 w-full' disabled={loading || code.length !== 6}>{t.submit}</Button><Button asChild type='button' variant='ghost' className='h-auto self-end p-0 text-sm font-normal text-primary hover:bg-transparent hover:text-primary/80'><Link href='/login'>{translate('backToLogin')}</Link></Button></form></CardContent></Card></div></main>
}
