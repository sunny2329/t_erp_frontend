import { Field } from './Field'
import { Input } from './Input'

function splitDateTime(value) {
  if (!value) return { date: '', time: '' }
  const [date, time = ''] = String(value).split('T')
  return { date, time }
}

// Renders a "YYYY-MM-DDTHH:MM" datetime value as two separate native
// inputs — Date and Time — instead of one combined <input
// type="datetime-local">, so either half can be read/changed on its own.
// Still emits/accepts the same combined string every caller (adapters,
// validation, formatDateTime) already expects.
export function DateTimeField({ label, value, onChange, required, hint, error }) {
  const { date, time } = splitDateTime(value)
  const combine = (d, t) => (d || t ? `${d}${t ? 'T' + t : ''}` : '')

  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <div className="flex gap-2">
        <Input type="date" value={date} onChange={(e) => onChange(combine(e.target.value, time))} className="flex-1" />
        <Input type="time" value={time} onChange={(e) => onChange(combine(date, e.target.value))} className="flex-1" />
      </div>
    </Field>
  )
}
