export function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function randomId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
