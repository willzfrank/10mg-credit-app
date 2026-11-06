import { useState, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'

type Props = Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: number | undefined
  onValueChange: (value: number | undefined) => void
}

/** Groups the integer part with commas: "1234567.5" -> "1,234,567.5". Keeps a trailing dot while typing. */
function group(raw: string): string {
  const [int, dec] = raw.split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return dec === undefined ? grouped : `${grouped}.${dec}`
}

function sanitize(input: string): string {
  const cleaned = input.replace(/[^\d.]/g, '')
  const [int, ...rest] = cleaned.split('.')
  return rest.length ? `${int}.${rest.join('')}` : int
}

/** Text input that shows thousands separators while typing but reports a plain number. */
export function AmountInput({ value, onValueChange, ...props }: Props) {
  const [text, setText] = useState(() => (value === undefined || Number.isNaN(value) ? '' : group(String(value))))
  const [lastValue, setLastValue] = useState(value)

  // Sync when the form sets the value externally (e.g. "Pay full balance" or reset).
  if (value !== lastValue) {
    setLastValue(value)
    const current = text === '' ? undefined : Number(text.replace(/,/g, ''))
    if (value !== current) setText(value === undefined || Number.isNaN(value) ? '' : group(String(value)))
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const raw = sanitize(e.target.value)
        setText(group(raw))
        const num = raw === '' || raw === '.' ? undefined : Number(raw)
        setLastValue(num)
        onValueChange(num)
      }}
    />
  )
}
