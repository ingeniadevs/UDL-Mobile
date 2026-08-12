/**
 * Fechas de reserva = día de calendario (sin corrimiento UTC↔Argentina).
 */

/** Partes { y, mo, d } del día civil elegido o devuelto por la API. */
export function getCalendarDateParts(input) {
  if (input == null || input === '') return null

  if (typeof input === 'string') {
    const m = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return { y: +m[1], mo: +m[2], d: +m[3] }
  }

  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return null

  // Medianoche UTC (JSON "yyyy-MM-dd" o "…T00:00:00.000Z"): no usar getDate() local
  if (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  ) {
    const localMidnight = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    if (d.getTime() !== localMidnight.getTime()) {
      return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate() }
    }
  }

  return { y: d.getFullYear(), mo: d.getMonth() + 1, d: d.getDate() }
}

/** yyyy-MM-dd para la API. */
export function formatDateOnlyForApi(date) {
  const p = getCalendarDateParts(date)
  if (!p) return null
  return `${p.y}-${String(p.mo).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`
}

/** Garantiza string yyyy-MM-dd en POST (nunca ISO con hora). */
export function normalizeReservaFechaForApi(fecha) {
  if (fecha == null || fecha === '') return null
  if (typeof fecha === 'string') {
    const m = fecha.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[1]}-${m[2]}-${m[3]}`
  }
  return formatDateOnlyForApi(fecha)
}

/** Date local a medianoche del día civil (para Calendar / comparaciones). */
export function toLocalCalendarDate(input) {
  const p = getCalendarDateParts(input)
  if (!p) return null
  return new Date(p.y, p.mo - 1, p.d)
}

/** Inicio del día civil local de hoy. */
export function startOfTodayLocal() {
  return toLocalCalendarDate(new Date())
}

/** Muestra dd/MM/yyyy sin corrimiento. */
export function formatCalendarDateFromApi(isoOrDate) {
  const p = getCalendarDateParts(isoOrDate)
  if (!p) return '—'
  return `${String(p.d).padStart(2, '0')}/${String(p.mo).padStart(2, '0')}/${p.y}`
}

/** La API devuelve fecha como "yyyy-MM-dd". */
export function isApiDateString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
}

export function isSameLocalCalendarDay(a, b) {
  const pa = getCalendarDateParts(a)
  const pb = getCalendarDateParts(b)
  if (!pa || !pb) return false
  return pa.y === pb.y && pa.mo === pb.mo && pa.d === pb.d
}

/** Edad en años completos desde fecha de nacimiento (día civil, sin corrimiento UTC). */
export function calcularEdadDesdeFechaNacimiento(fechaNacimiento) {
  const nac = getCalendarDateParts(fechaNacimiento)
  if (!nac) return 0
  const hoy = new Date()
  let edad = hoy.getFullYear() - nac.y
  const mesActual = hoy.getMonth() + 1
  const diaActual = hoy.getDate()
  if (mesActual < nac.mo || (mesActual === nac.mo && diaActual < nac.d)) {
    edad--
  }
  return edad
}

/** Categoría deportiva = año de nacimiento (ej. "1998"). */
export function obtenerCategoriaDesdeFechaNacimiento(fechaNacimiento) {
  const p = getCalendarDateParts(fechaNacimiento)
  return p ? String(p.y) : null
}
