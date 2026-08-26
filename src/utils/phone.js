// Formats a US phone number progressively as XXX-XXX-XXXX. Works on both
// raw typed input (partial digit counts) and fully stored values — extra
// digits beyond 10 are dropped rather than rejected, since some legacy
// records carry a leading country-code 1.
export function formatPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 10)
  if (digits.length < 4) return digits
  if (digits.length < 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}
