import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

type Props = {
    currentValue: string
    onChange: (newValue: string) => void
    resetKey?: string | number
    large?: boolean
    columns?: 3 | 4
}
export default function NumPad({ currentValue, onChange, resetKey, large = false, columns = 3 }: Props) {
    const [isFirst, setIsFirst] = useState(true)
    useEffect(() => setIsFirst(true), [resetKey])
    const numbers = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['0', '00', 'clear'],
    ]

    function onChangeNumber(num: string) {
        let value = currentValue
        if (num === 'clear') {
            value = Math.floor(Number(value) / 10).toString()
        } else {
            if (isFirst) {
                value = num
                setIsFirst(false)
            } else {
                value = `${value}${num}`
            }
        }
        onChange(value)
    }

    return (
        <div className={`grid shrink-0 ${columns === 4 ? 'grid-cols-4' : 'grid-cols-3'} rounded border border-[#ccc] ${large ? columns === 4 ? 'w-56 gap-2 p-2' : 'w-44 gap-2 p-2' : 'w-36 gap-1 p-1'}`}>
            {numbers.flat().map((num, idx) => (
                <Button
                    key={idx}
                    size='lg'
                    className={`${large ? columns === 4 ? 'h-12 text-xl' : 'h-12 text-lg' : 'h-8 text-xs'} ${
                        num === 'clear' ? 'bg-red-500 text-white' : num === 'enter' ? 'bg-green-500 text-white' : ''
                    }`}
                    onClick={() => onChangeNumber(num)}>
                    {num === 'clear' ? 'C' : num}
                </Button>
            ))}
        </div>
    )
}
