import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

type Props = {
    currentValue: string
    onChange: (newValue: string) => void
    resetKey?: string | number
}
export default function NumPad({ currentValue, onChange, resetKey }: Props) {
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
        <div className='grid w-36 shrink-0 grid-cols-3 gap-1 rounded border border-[#ccc] p-1'>
            {numbers.flat().map((num, idx) => (
                <Button
                    key={idx}
                    size='lg'
                    className={`h-8 text-xs ${
                        num === 'clear' ? 'bg-red-500 text-white' : num === 'enter' ? 'bg-green-500 text-white' : ''
                    }`}
                    onClick={() => onChangeNumber(num)}>
                    {num === 'clear' ? 'C' : num}
                </Button>
            ))}
        </div>
    )
}
