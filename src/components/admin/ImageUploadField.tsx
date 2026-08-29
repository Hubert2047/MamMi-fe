'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Info, Trash2 } from 'lucide-react'
import { uploadImage } from '@/lib/cloudinary'

type Props = {
  label: string
  hint: string
  chooseLabel: string
  removeLabel: string
  value?: string
  onChange: (value: string) => void
  pendingFile?: File | null
  onFileChange: (file: File | null) => void
  onError: (message: string) => void
  className?: string
}

export function ImageUploadField({ label, hint, chooseLabel, removeLabel, value, pendingFile, onChange, onFileChange, onError, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | undefined>(value)
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!pendingFile) {
      setPreview(value)
      setPreviewObjectUrl(null)
    }
  }, [value, pendingFile])
  useEffect(() => () => { if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl) }, [previewObjectUrl])

  function selectImage(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) return onError('Only image files are supported')
    if (file.size > 10 * 1024 * 1024) return onError('Image must be smaller than 10 MB')
    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)
    setPreviewObjectUrl(localPreview)
    onFileChange(file)
  }

  return <div className={`min-w-0 space-y-2 ${className || ''}`}>
    <div className="flex h-3.5 items-center gap-1"><Label>{label}</Label><span tabIndex={0} aria-label={hint} className="group relative inline-flex cursor-default text-muted-foreground"><Info className="h-3.5 w-3.5" /><span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-56 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-center text-xs font-normal text-background shadow-md group-hover:block group-focus:block">{hint}</span></span></div>
    <div className="flex h-8 min-w-0 items-center gap-2 overflow-hidden"><input ref={inputRef} type="file" accept="image/*" onChange={(event) => { selectImage(event.target.files?.[0]); event.currentTarget.value = '' }} className="sr-only" /><Button type="button" className="h-8 w-fit max-w-full px-3 text-sm" variant="outline" onClick={() => inputRef.current?.click()}>{chooseLabel}</Button>{preview && <><img src={preview} alt="" className="h-8 w-8 shrink-0 rounded object-cover" /><Button type="button" size="icon" className="h-8 w-8 shrink-0" variant="destructive" title={removeLabel} aria-label={removeLabel} onClick={() => { setPreview(undefined); setPreviewObjectUrl(null); onFileChange(null); onChange('') }}><Trash2 className="h-4 w-4" /></Button></>}</div>
  </div>
}
