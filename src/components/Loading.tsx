'use client'

import { useI18n } from '@/lib/i18n'

function Loading() {
    const { t } = useI18n()

    return (
        <div className='fixed inset-0 z-[99999] flex items-center justify-center bg-background/95 backdrop-blur-sm'>
            <div className='flex flex-col items-center gap-4'>
                <div className='relative flex h-16 w-16 items-center justify-center'>
                    <div className='absolute inset-0 rounded-full border-4 border-primary/15' />
                    <div className='absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-primary/50' />
                    <div className='h-3 w-3 rounded-full bg-primary' />
                </div>
                <div className='flex items-center gap-1.5 text-sm font-medium text-muted-foreground'>
                    <span>{t('loading')}</span>
                    <span className='animate-[loading-dot_1.4s_ease-in-out_infinite]'>.</span>
                    <span className='animate-[loading-dot_1.4s_0.2s_ease-in-out_infinite]'>.</span>
                    <span className='animate-[loading-dot_1.4s_0.4s_ease-in-out_infinite]'>.</span>
                </div>
            </div>
        </div>
    )
}

export default Loading
