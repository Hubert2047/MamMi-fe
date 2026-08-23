'use client'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import {
  CASH_DENOMINATIONS,
  type CashCounts,
  type CashDenomination,
  calculateCashFromDenominations,
  updateCashCount,
} from '@/lib/cashDenominations'

type Props = {
  counts: CashCounts
  selectedDenomination: CashDenomination
  onSelect: (denomination: CashDenomination) => void
  onChange: (counts: CashCounts) => void
  onClear: () => void
}

export default function CashDenominationInput({ counts, selectedDenomination, onSelect, onChange, onClear }: Props) {
  const { t } = useI18n()
  const changeCount = (denomination: CashDenomination, delta: number) =>
    onChange(updateCashCount(counts, denomination, delta))

  return (
    <div className="rounded-lg border bg-muted/20 p-1.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold">{t('cashDenominations')}</span>
        <span className="text-lg font-bold tabular-nums text-primary">
          {calculateCashFromDenominations(counts).toLocaleString()}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-1.5 gap-y-1.5">
        {CASH_DENOMINATIONS.map((denomination) => (
          <div
            key={denomination}
            className={`flex min-h-10 items-center justify-between gap-0.5 rounded-md border px-1.5 ${
              selectedDenomination === denomination ? 'border-primary bg-primary/10' : 'bg-background'
            }`}>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-1 text-left"
              onClick={() => onSelect(denomination)}>
              <span className="text-sm font-bold tabular-nums">{denomination.toLocaleString()}</span>
              <span className="text-base font-semibold text-muted-foreground tabular-nums">
                ×{counts[denomination] ?? 0}
              </span>
            </button>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="h-6 w-6 p-0 text-xs"
                aria-label={`${t('decreaseCash')} ${denomination}`}
                onClick={() => changeCount(denomination, -1)}>
                -
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="h-6 w-6 p-0 text-xs"
                aria-label={`${t('increaseCash')} ${denomination}`}
                onClick={() => changeCount(denomination, 1)}>
                +
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="truncate text-[11px] text-muted-foreground">
          {t('selectedCashDenomination')}: {selectedDenomination}
        </span>
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={onClear}>
          {t('clearCashDenominations')}
        </Button>
      </div>
    </div>
  )
}
