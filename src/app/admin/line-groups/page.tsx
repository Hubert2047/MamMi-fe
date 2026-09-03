'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useI18n } from '@/lib/i18n'
import { useStoreContext } from '@/lib/store-context'
import { useTablePageSize } from '@/hooks/use-table-page-size'
import { deleteLineGroup, getLineGroups, updateLineGroup, type LineGroup } from '@/api/line-group'

const groupStoreId = (group: LineGroup) => typeof group.storeId === 'string' ? group.storeId : (group.storeId as { _id?: string } | null | undefined)?._id ?? ''

export default function LineGroupsPage() {
    const { t } = useI18n()
    const { stores } = useStoreContext()
    const client = useQueryClient()
    const { containerRef, pageSize } = useTablePageSize(38, 100, undefined, false)
    const [tab, setTab] = useState<'configured' | 'pending'>('configured')
    const [page, setPage] = useState(1)
    const [editing, setEditing] = useState<LineGroup | null>(null)
    const [form, setForm] = useState({ name: '', storeId: '' })
    const groupsQuery = useQuery({ queryKey: ['line-groups'], queryFn: getLineGroups })
    const groups = groupsQuery.data ?? []
    const configuredCount = groups.filter((group) => Boolean(groupStoreId(group))).length
    const pendingCount = groups.length - configuredCount
    const filteredGroups = useMemo(
        () => groups.filter((group) => (tab === 'configured' ? Boolean(groupStoreId(group)) : !groupStoreId(group))),
        [groups, tab],
    )
    const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize))
    const currentPage = Math.min(page, totalPages)
    const visibleGroups = filteredGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    useEffect(() => setPage((current) => Math.min(current, totalPages)), [totalPages])
    useEffect(() => setPage(1), [tab])

    const save = useMutation({
        mutationFn: updateLineGroup,
        onSuccess: () => {
            void client.invalidateQueries({ queryKey: ['line-groups'] })
            setEditing(null)
            toast.success(t('lineGroupUpdated'))
        },
        onError: (error: any) =>
            toast.error(
                error?.response?.data?.code === 'LINE_GROUP_IN_USE'
                    ? t('lineGroupInUse')
                    : error?.response?.data?.code === 'LINE_GROUP_NAME_EXISTS'
                        ? t('lineGroupNameExists')
                        : t('lineGroupSaveError'),
            ),
    })
    const remove = useMutation({
        mutationFn: deleteLineGroup,
        onSuccess: () => {
            void client.invalidateQueries({ queryKey: ['line-groups'] })
            toast.success(t('lineGroupDeleted'))
        },
        onError: (error: any) =>
            toast.error(
                error?.response?.data?.code === 'LINE_GROUP_IN_USE' ? t('lineGroupInUse') : t('lineGroupDeleteError'),
            ),
    })

    const openEdit = (group: LineGroup) => {
        setEditing(group)
        setForm({ name: group.name, storeId: groupStoreId(group) || '' })
    }

    const renderTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className='h-8 whitespace-nowrap px-2 py-1 text-xs'>{t('lineGroupName')}</TableHead>
                    <TableHead className='h-8 whitespace-nowrap px-2 py-1 text-xs'>{t('store')}</TableHead>
                    <TableHead className='h-8 whitespace-nowrap px-2 py-1 text-xs'>
                        {t('lineGroupUsageStatus')}
                    </TableHead>
                    <TableHead className='h-8 whitespace-nowrap px-2 py-1 text-right text-xs'>{t('actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {visibleGroups.map((group) => (
                    <TableRow key={group._id}>
                        <TableCell className='whitespace-nowrap px-2 py-2 font-medium'>{group.name}</TableCell>
                        <TableCell className='whitespace-nowrap px-2 py-2'>
                            {stores.find((store) => store._id === groupStoreId(group))?.name || t('lineGroupUnassigned')}
                        </TableCell>
                        <TableCell className='whitespace-nowrap px-2 py-2'>
                            {t(group.usageStatus === 'assigned' ? 'lineGroupUsageAssigned' : 'lineGroupUsageAvailable')}
                        </TableCell>
                        <TableCell className='px-2 py-2'>
                            <div className='flex justify-end gap-2 whitespace-nowrap'>
                                <Button
                                    size='sm'
                                    variant='outline'
                                    disabled={group.usageStatus === 'assigned'}
                                    onClick={() => openEdit(group)}>
                                    <Pencil className='size-4' />
                                    {t('edit')}
                                </Button>
                                <Button
                                    size='sm'
                                    variant='destructive'
                                    disabled={group.usageStatus === 'assigned' || remove.isPending}
                                    onClick={() => remove.mutate(group._id)}>
                                    <Trash2 className='size-4' />
                                    {t('delete')}
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )

    return (
        <div className='flex h-full min-h-0 flex-col overflow-hidden p-6 md:p-8'>
            <div className='mb-6 flex shrink-0 items-center justify-between gap-3'>
                <h1 className='text-3xl font-bold'>{t('lineGroups')}</h1>
                <Button
                    size='sm'
                    variant='outline'
                    disabled={groupsQuery.isFetching}
                    onClick={() => void groupsQuery.refetch()}>
                    <RefreshCw className={groupsQuery.isFetching ? 'size-4 animate-spin' : 'size-4'} />
                    {t('lineGroupsRefresh')}
                </Button>
            </div>
            <Tabs
                value={tab}
                onValueChange={(value) => setTab(value as 'configured' | 'pending')}
                className='min-h-0 flex-1 overflow-hidden'>
                <TabsList className='shrink-0'>
                    <TabsTrigger value='configured' className='gap-2'>
                        {t('lineGroupConfiguredTab')}
                        <Badge variant='secondary'>{configuredCount}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value='pending' className='gap-2'>
                        {t('lineGroupPendingTab')}
                        <Badge variant={pendingCount ? 'destructive' : 'secondary'}>{pendingCount}</Badge>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value={tab} className='flex min-h-0 w-full flex-1'>
                    <Card
                        ref={containerRef}
                        className='flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden border border-foreground/10 ring-0 [&>div:last-child]:flex-1 [&>div:last-child]:min-h-0 [&>div:last-child]:overflow-hidden [&>div:last-child>div]:h-full [&>div:last-child>div]:!max-h-none'>
                        <CardHeader className='shrink-0'>
                            <div className='flex items-center justify-end gap-2'>
                                <span className='mr-2 text-xs text-muted-foreground'>
                                    {t('lineGroupTotal')}: {filteredGroups.length}
                                </span>
                                <span className='text-xs text-muted-foreground'>
                                    {currentPage}/{totalPages}
                                </span>
                                <Button
                                    size='sm'
                                    variant='outline'
                                    disabled={currentPage === 1}
                                    onClick={() => setPage((current) => current - 1)}>
                                    ‹
                                </Button>
                                <Button
                                    size='sm'
                                    variant='outline'
                                    disabled={currentPage === totalPages}
                                    onClick={() => setPage((current) => current + 1)}>
                                    ›
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className='min-h-0'>
                            <div className='h-full overflow-hidden'>
                                {groupsQuery.isLoading ? (
                                    <p className='text-sm text-muted-foreground'>{t('loading')}</p>
                                ) : visibleGroups.length ? (
                                    renderTable()
                                ) : (
                                    <p className='text-sm text-muted-foreground'>
                                        {tab === 'pending' ? t('lineGroupPendingEmpty') : t('lineGroupConfiguredEmpty')}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('lineGroupEdit')}</DialogTitle>
                    </DialogHeader>
                    <div className='space-y-3'>
                        <div>
                            <Label>{t('lineGroupName')}</Label>
                            <Input
                                value={form.name}
                                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                            />
                        </div>
                        <div>
                            <Label>{t('store')}</Label>
                            <select
                                className='flex h-9 w-full items-center rounded-md border bg-background px-3 py-2 text-sm'
                                value={form.storeId}
                                onChange={(event) => setForm((current) => ({ ...current, storeId: event.target.value }))}>
                                <option value=''>{t('lineGroupUnassigned')}</option>
                                {stores.map((store) => (
                                    <option key={store._id} value={store._id}>
                                        {store.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setEditing(null)}>
                            {t('cancel')}
                        </Button>
                        <Button
                            disabled={!form.name.trim() || save.isPending}
                            onClick={() =>
                                save.mutate({
                                    id: editing!._id,
                                    data: { name: form.name.trim(), storeId: form.storeId || null },
                                })
                            }>
                            {t('save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
