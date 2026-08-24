'use client'

import { useState } from 'react'
import Image from 'next/image'
import axios from 'axios'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { signIn } from 'next-auth/react'
import { useI18n } from '@/lib/i18n'
import { getLoginStores } from '@/api/auth'

export default function LoginPage() {
    const { t } = useI18n()
    const [account, setAccount] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<{ account?: string; password?: string }>({})
    const [loginStores, setLoginStores] = useState<{ _id: string; name: string }[]>([])
    const [selectedStoreId, setSelectedStoreId] = useState('')
    const [selectingStore, setSelectingStore] = useState(false)

    const validate = () => {
        const nextErrors: typeof errors = {}
        if (!account.trim()) nextErrors.account = t('requiredAccount')
        if (!password) nextErrors.password = t('requiredPassword')
        setErrors(nextErrors)
        return Object.keys(nextErrors).length === 0
    }

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!validate()) return
        setLoading(true)
        let storeIdForLogin = selectedStoreId
        try {
            if (selectingStore && !selectedStoreId) {
                setErrors({ account: t('requiredStoreSelection') })
                return
            }
            if (!selectingStore) {
                const options = await getLoginStores({ account, password })
                const stores = options.data.data || []
                const role = options.data.role
                if (role !== 'SuperAdmin' && stores.length > 1) {
                    setLoginStores(stores)
                    setSelectedStoreId(stores[0]._id)
                    setSelectingStore(true)
                    return
                }
                if (role !== 'SuperAdmin' && !stores[0]?._id) throw new Error('No store assigned')
                if (stores[0]?._id) {
                    storeIdForLogin = stores[0]._id
                    setSelectedStoreId(stores[0]._id)
                    window.localStorage.setItem('activeStoreId', stores[0]._id)
                }
            }
            const result = await signIn('credentials', {
                account,
                password,
                ...(storeIdForLogin ? { storeId: storeIdForLogin } : {}),
                callbackUrl: '/',
                redirect: false,
            })
            if (result?.error) throw new Error('Invalid credentials')
            window.location.href = result?.url || '/'
        } catch (error: unknown) {
            const backendMessage = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : null
            toast.error(backendMessage || (error instanceof Error && error.message !== 'Invalid credentials' ? error.message : t('invalidCredentials')))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='min-h-svh flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden'>
            <div className='pointer-events-none absolute inset-0'>
                <div className='absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl' />
                <div className='absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl' />
            </div>
            <div className='relative z-10 flex -translate-y-12 flex-col items-center gap-2 w-full max-w-sm'>
                <div className='flex items-center justify-center'>
                    <Image src='/logo.png' alt='漫迷' width={176} height={128} className='h-28 w-auto object-contain' priority />
                </div>
                <Card className='w-full rounded-2xl border border-slate-200 shadow-sm bg-white'>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-lg font-bold text-slate-900'>{t('login')}</CardTitle>
                        <CardDescription className='text-sm text-slate-500'>{t('loginDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} noValidate className='flex flex-col gap-4'>
                            <div className='flex flex-col gap-1.5'>
                                <Label htmlFor='account' className='text-sm text-slate-700'>{t('account')}</Label>
                                <Input
                                    id='account'
                                    placeholder={t('accountPlaceholder')}
                                    autoComplete='username'
                                    value={account}
                                    onChange={(event) => {
                                        setAccount(event.target.value)
                                        if (errors.account) setErrors((previous) => ({ ...previous, account: undefined }))
                                    }}
                                    className={`!bg-white !text-slate-900 ${errors.account ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                                />
                                {errors.account && <p className='text-xs text-red-500'>{errors.account}</p>}
                            </div>
                            <div className='flex flex-col gap-1.5'>
                                <Label htmlFor='password' className='text-sm text-slate-700'>{t('password')}</Label>
                                <div className='relative'>
                                    <Input
                                        id='password'
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder='••••••••'
                                        autoComplete='current-password'
                                        value={password}
                                        onChange={(event) => {
                                            setPassword(event.target.value)
                                            if (errors.password) setErrors((previous) => ({ ...previous, password: undefined }))
                                        }}
                                        className={`!bg-white !text-slate-900 pr-10 ${errors.password ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                                    />
                                    <Button
                                        variant='ghost'
                                        size='icon-sm'
                                        type='button'
                                        onClick={() => setShowPassword((value) => !value)}
                                        aria-label={t('password')}
                                        className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700'>
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </Button>
                                </div>
                                {errors.password && <p className='text-xs text-red-500'>{errors.password}</p>}
                            </div>
                            {selectingStore && <div className='flex flex-col gap-1.5'><Label htmlFor='login-store' className='text-sm text-slate-700'>{t('loginStore')}</Label><Select value={selectedStoreId} onValueChange={setSelectedStoreId}><SelectTrigger id='login-store' className='!bg-white !text-slate-900'><SelectValue placeholder={t('selectStore')} /></SelectTrigger><SelectContent>{loginStores.map((store) => <SelectItem key={store._id} value={store._id}>{store.name}</SelectItem>)}</SelectContent></Select></div>}
                            <Button type='submit' disabled={loading} className='mt-1 w-full h-10 bg-primary hover:bg-primary/90 font-semibold tracking-wide gap-2 transition-colors'>
                                {loading && <Loader2 size={15} className='animate-spin' />}
                                {loading ? t('loginLoading') : t('loginSubmit')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <p className='text-xs text-slate-400'>© {new Date().getFullYear()} POS System. All rights reserved.</p>
            </div>
        </div>
    )
}
