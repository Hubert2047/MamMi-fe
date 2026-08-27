import api from '@/api/axios'

type UploadSignature = { cloudName: string; apiKey: string; folder: string; publicId: string; timestamp: number; signature: string }
export type UploadedImage = { url: string; publicId: string }

export const uploadImage = async (file: File): Promise<UploadedImage> => {
  if (!file.type.startsWith('image/')) throw new Error('Only image files are supported')
  if (file.size > 10 * 1024 * 1024) throw new Error('Image must be smaller than 10 MB')
  const signatureResponse = await api.post<{ success: boolean; data: UploadSignature }>('uploads/cloudinary/signature')
  const { cloudName, apiKey, folder, publicId, timestamp, signature } = signatureResponse.data.data
  const body = new FormData()
  body.append('file', file)
  body.append('api_key', apiKey)
  body.append('folder', folder)
  body.append('public_id', publicId)
  body.append('timestamp', String(timestamp))
  body.append('signature', signature)
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body })
  if (!response.ok) throw new Error('Cloudinary upload failed')
  const result = await response.json() as { secure_url?: string; public_id?: string }
  if (!result.secure_url || !result.public_id) throw new Error('Cloudinary did not return image details')
  return { url: result.secure_url, publicId: result.public_id }
}
