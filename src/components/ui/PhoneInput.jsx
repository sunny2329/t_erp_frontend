import { Input } from './Input'
import { formatPhone } from '../../utils/phone'

// Drop-in replacement for <Input> on phone fields — formats as-you-type to
// XXX-XXX-XXXX. Fires onChange with the same { target: { value } } shape as
// a native input event, so existing `(e) => set({ phone: e.target.value })`
// handlers work unchanged.
export function PhoneInput({ value, onChange, ...props }) {
  return (
    <Input
      type="tel"
      inputMode="tel"
      placeholder="123-456-7890"
      maxLength={12}
      value={formatPhone(value)}
      onChange={(e) => onChange({ ...e, target: { ...e.target, value: formatPhone(e.target.value) } })}
      {...props}
    />
  )
}
