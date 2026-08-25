'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { enrollPosDevice } from '@/api/pos-device'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'

const labels = { vi: { title: 'Đăng ký máy POS', description: 'Nhập mã một lần do Admin tạo cho iPad này.', code: 'Mã đăng ký', submit: 'Đăng ký thiết bị', success: 'Thiết bị đã được đăng ký' }, en: { title: 'Register POS device', description: 'Enter the one-time code created by an administrator for this iPad.', code: 'Enrollment code', submit: 'Register device', success: 'Device registered' }, 'zh-TW': { title: '註冊 POS 裝置', description: '輸入管理員為此 iPad 建立的一次性代碼。', code: '註冊代碼', submit: '註冊裝置', success: '裝置已註冊' } } as const

export default function PosDeviceEnrollment() {
    const { locale } = useI18n(); const t = labels[locale]; const router = useRouter(); const [code, setCode] = useState(''); const [loading, setLoading] = useState(false)
    const submit = async (event: React.FormEvent) => { event.preventDefault(); setLoading(true); try { const session = await enrollPosDevice(code); window.localStorage.setItem('activeStoreId', session.storeId); toast.success(t.success); router.replace('/pos') } catch (error) { toast.error(isAxiosError(error) ? error.response?.data?.message || t.description : t.description) } finally { setLoading(false) } }
    return <main className='flex min-h-svh items-center justify-center bg-muted/30 p-4'><Card className='w-full max-w-sm'><CardHeader><CardTitle>{t.title}</CardTitle><CardDescription>{t.description}</CardDescription></CardHeader><CardContent><form className='space-y-4' onSubmit={submit}><Input value={code} onChange={(event) => setCode(event.target.value)} placeholder={t.code} autoCapitalize='none' autoCorrect='off' required /><Button className='w-full' disabled={loading}>{t.submit}</Button></form></CardContent></Card></main>
}
