export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
export const randomId = (prefix = 'id') => `${prefix}_${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`
export const cx = (...classes) => classes.flat().filter(Boolean).join(' ')
