export function camelize(value) {
  if (Array.isArray(value)) return value.map(camelize)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
      camelize(item),
    ]),
  )
}

export function unwrap(response) {
  return camelize(response?.data?.data)
}

export function items(response) {
  const data = unwrap(response)
  return Array.isArray(data) ? data : data?.items || []
}

export function toSnakeCase(value) {
  if (Array.isArray(value)) return value.map(toSnakeCase)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
      toSnakeCase(item),
    ]),
  )
}
