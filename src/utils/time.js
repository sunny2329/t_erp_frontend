// Formats a 24-hour HH:MM value progressively as the user types digits.
// Native <input type="time"> renders 12h/24h based on the browser's UI
// language, not anything a page can control (the common `lang="en-GB"`
// trick does not actually affect it in current Chrome) — so time fields use
// this plain-text mask instead, guaranteeing 24h everywhere regardless of
// the user's browser/OS locale.
export function formatTime(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 4)
  let hh = digits.slice(0, 2)
  let mm = digits.slice(2, 4)
  if (hh.length === 2) hh = String(Math.min(23, parseInt(hh, 10))).padStart(2, '0')
  if (mm.length === 2) mm = String(Math.min(59, parseInt(mm, 10))).padStart(2, '0')
  return mm ? `${hh}:${mm}` : hh
}
