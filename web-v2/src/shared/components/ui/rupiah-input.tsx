import { useEffect, useState } from 'react'

import { formatNumber } from '@/shared/utils/currency'
import { cn } from '@/shared/utils'
import { Input } from './input'

interface RupiahInputProps {
  value: number
  onChange: (value: number) => void
  id?: string
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function RupiahInput({ value, onChange, className, ...props }: RupiahInputProps) {
  const [display, setDisplay] = useState(() => (value > 0 ? formatNumber(value) : ''))

  useEffect(() => {
    setDisplay(value > 0 ? formatNumber(value) : '')
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\./g, '').replace(/[^\d]/g, '')
    const num = parseInt(digits, 10) || 0
    setDisplay(num > 0 ? formatNumber(num) : '')
    onChange(num)
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
        Rp
      </span>
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        className={cn('pl-9', className)}
      />
    </div>
  )
}
