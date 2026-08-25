/** Formato compacto para stats móviles (ej: $7,8M). */
export function formatCompactMoney(value, { currency = true } = {}) {
  const n = Number(value) || 0
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  const prefix = currency ? '$' : ''

  if (abs >= 1_000_000) {
    const millions = Math.round((abs / 1_000_000) * 10) / 10
    const text = Number.isInteger(millions)
      ? String(millions)
      : millions.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    return `${sign}${prefix}${text}M`
  }

  return `${sign}${prefix}${abs.toLocaleString('es-AR')}`
}

export function formatMoney(value) {
  const n = Number(value) || 0
  return `$${n.toLocaleString('es-AR')}`
}
