'use client'

import { useState} from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { signIn } from 'next-auth/react'
export default function LoginPage() {
    const router = useRouter()

    const [account, setAccount] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<{ account?: string; password?: string }>({})

    const validate = () => {
        const errs: typeof errors = {}
        if (!account.trim()) errs.account = 'Vui lòng nhập tài khoản'
        if (!password) errs.password = 'Vui lòng nhập mật khẩu'
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!validate()) return
        setLoading(true)
        try {
            const result = await signIn('credentials', { account, password, redirect: false })
            if (!result || result.error) throw new Error('Invalid credentials')
            router.replace('/pos')
        } catch {
            toast.error('Sai tài khoản hoặc mật khẩu')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='min-h-svh flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden'>
            {/* Background blobs */}
            <div className='pointer-events-none absolute inset-0'>
                <div className='absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-200/40 blur-3xl' />
                <div className='absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-200/30 blur-3xl' />
            </div>

            <div className='relative z-10 flex flex-col items-center gap-6 w-full max-w-sm'>
                {/* Brand */}
                <div className='flex items-center gap-2.5'>
                    <div className='w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-200'>
                        <ShieldCheck size={22} strokeWidth={1.5} />
                    </div>
                    <span className='text-xl font-bold tracking-tight text-slate-900'>POS System</span>
                </div>

                {/* Card */}
                <Card className='w-full rounded-2xl border border-slate-200 shadow-sm bg-white'>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-lg font-bold text-slate-900'>Đăng nhập</CardTitle>
                        <CardDescription className='text-sm text-slate-500'>
                            Nhập thông tin tài khoản của bạn để tiếp tục
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} noValidate className='flex flex-col gap-4'>
                            {/* Account */}
                            <div className='flex flex-col gap-1.5'>
                                <Label htmlFor='account' className='text-sm text-slate-700'>
                                    Tài khoản
                                </Label>
                                <Input
                                    id='account'
                                    placeholder='Tên tài khoản'
                                    autoComplete='username'
                                    value={account}
                                    onChange={(e) => {
                                        setAccount(e.target.value)
                                        if (errors.account) setErrors((prev) => ({ ...prev, account: undefined }))
                                    }}
                                    className={`!bg-white !text-slate-900 ${errors.account ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                                />
                                {errors.account && <p className='text-xs text-red-500'>{errors.account}</p>}
                            </div>

                            {/* Password */}
                            <div className='flex flex-col gap-1.5'>
                                <Label htmlFor='password' className='text-sm text-slate-700'>
                                    Mật khẩu
                                </Label>
                                <div className='relative'>
                                    <Input
                                        id='password'
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder='••••••••'
                                        autoComplete='current-password'
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value)
                                            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                                        }}
                                        className={`!bg-white !text-slate-900 pr-10 ${errors.password ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                                    />
                                    <Button
                                        variant='ghost'
                                        size='icon-sm'
                                        type='button'
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700'>
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </Button>
                                </div>
                                {errors.password && <p className='text-xs text-red-500'>{errors.password}</p>}
                            </div>

                            <Button
                                type='submit'
                                disabled={loading}
                                className='mt-1 w-full h-10 bg-indigo-500 hover:bg-indigo-400 font-semibold tracking-wide gap-2 transition-colors'>
                                {loading && <Loader2 size={15} className='animate-spin' />}
                                {loading ? 'Đang xử lý…' : 'Đăng nhập'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className='text-xs text-slate-400'>© {new Date().getFullYear()} POS System. All rights reserved.</p>
            </div>
        </div>
    )
}
