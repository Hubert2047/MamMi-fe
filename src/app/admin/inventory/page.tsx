'use client'
import dynamic from 'next/dynamic'
const InventoryPanel = dynamic(() => import('@/components/inventory/InventoryPanel'), { ssr: false })
export default function InventoryPage() { return <InventoryPanel /> }
