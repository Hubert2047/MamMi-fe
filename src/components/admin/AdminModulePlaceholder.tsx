import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminModulePlaceholder({ title, description }: { title: string; description: string }) {
  return <div className="p-6 md:p-8"><div className="mb-6"><h1 className="text-3xl font-bold">{title}</h1></div><Card><CardHeader><CardTitle>Phân hệ đang được hoàn thiện</CardTitle></CardHeader><CardContent className="text-muted-foreground">{description}</CardContent></Card></div>
}
