let counter = 1000

export function nextId(prefix = 'id') {
  counter += 1
  return `${prefix}-${counter}-${Math.random().toString(36).slice(2, 6)}`
}
