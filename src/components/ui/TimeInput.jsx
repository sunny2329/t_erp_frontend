import { Input } from './Input'
import { formatTime } from '../../utils/time'

// Drop-in replacement for <Input type="time"> — always 24h (see
// utils/time.js for why a native time input can't guarantee that). Fires
// onChange with the same { target: { value } } shape as a native input
// event, so existing `(e) => set({ startTime: e.target.value })` handlers
// work unchanged. Value/output stay "HH:MM" 24h strings, same as before.
export function TimeInput({ value, onChange, ...props }) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      placeholder="HH:MM"
      maxLength={5}
      value={formatTime(value)}
      onChange={(e) => onChange({ ...e, target: { ...e.target, value: formatTime(e.target.value) } })}
      {...props}
    />
  )
}
