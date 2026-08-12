const MIN_DIGITS = 10
const MAX_DIGITS = 15

/**
 * Nombre de ventana/pestaña: el navegador reutiliza el mismo destino en cada click.
 * No usar window.open(url, name) solo: Chrome aplica noopener y abre pestañas nuevas.
 */
export const WHATSAPP_WINDOW_NAME = 'udl_whatsapp'

export function soloDigitos(telefono) {
  if (!telefono) return ''
  return String(telefono).replace(/\D/g, '')
}

/**
 * Formato internacional sin + para wa.me / WhatsApp Business API (549...).
 * Quita el 0 inicial del código de área y usa 549 para celulares.
 */
export function normalizarTelefonoAR(telefono) {
  let num = soloDigitos(telefono)
  if (!num) return ''

  if (num.startsWith('549')) return num

  if (num.startsWith('54')) {
    let rest = num.slice(2)
    if (rest.startsWith('0')) rest = rest.slice(1)
    if (rest.startsWith('9')) return '549' + rest.slice(1)

    const match15After54 = rest.match(/^(\d{2,4})15(\d{6,8})$/)
    if (match15After54) return '549' + match15After54[1] + match15After54[2]

    const matchPlainAfter54 = rest.match(/^(\d{2,4})(\d{6,8})$/)
    if (matchPlainAfter54) return '549' + matchPlainAfter54[1] + matchPlainAfter54[2]

    return '54' + rest
  }

  if (num.startsWith('0')) num = num.slice(1)

  const match15 = num.match(/^(\d{2,4})15(\d{6,8})$/)
  if (match15) return '549' + match15[1] + match15[2]

  const matchPlain = num.match(/^(\d{2,4})(\d{6,8})$/)
  if (matchPlain) return '549' + matchPlain[1] + matchPlain[2]

  return num.startsWith('9') ? '549' + num.slice(1) : '549' + num
}

/** Separa código de área y número local desde cualquier formato guardado. */
export function parseTelefonoAR(telefono) {
  if (!telefono) {
    return { area: '', numero: '', e164: '', normalizado: '' }
  }

  let num = soloDigitos(telefono)
  if (num.startsWith('549')) num = num.slice(3)
  else if (num.startsWith('54')) num = num.slice(2)
  if (num.startsWith('0')) num = num.slice(1)
  if (num.startsWith('9')) num = num.slice(1)

  const m = num.match(/^(\d{2,4})15(\d{6,8})$/) || num.match(/^(\d{2,4})(\d{6,8})$/)
  if (m) {
    return {
      area: m[1],
      numero: m[2],
      e164: `+549${m[1]}${m[2]}`,
      normalizado: `549${m[1]}${m[2]}`
    }
  }

  const normalizado = normalizarTelefonoAR(telefono)
  return {
    area: '',
    numero: num,
    e164: normalizado ? `+${normalizado}` : telefono,
    normalizado
  }
}

/** Guarda celular argentino como +549{código área}{número}. */
export function formatTelefonoStorageAR(area, numero) {
  const a = soloDigitos(area)
  const n = soloDigitos(numero)
  if (!a || !n) return ''
  return `+549${a}${n}`
}

export function formatTelefonoDisplay(telefono) {
  const parsed = parseTelefonoAR(telefono)
  return parsed.e164 || telefono || ''
}

export function validarTelefonoAR(telefono) {
  const num = normalizarTelefonoAR(telefono)
  if (!num) return { valido: false, error: 'No hay teléfono registrado.', normalizado: null }
  if (num.length < MIN_DIGITS || num.length > MAX_DIGITS) {
    return {
      valido: false,
      error: `El teléfono debe tener entre ${MIN_DIGITS} y ${MAX_DIGITS} dígitos.`,
      normalizado: null
    }
  }
  if (!num.startsWith('549')) {
    return { valido: false, error: 'El número debe ser un celular argentino (+549).', normalizado: null }
  }
  return { valido: true, error: null, normalizado: num }
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * URL de envío. En escritorio: WhatsApp Web directo (sin pantalla intermedia de wa.me).
 */
export function buildWhatsAppUrl(telefonoNormalizado, mensaje) {
  const text = encodeURIComponent(mensaje)
  const phone = telefonoNormalizado

  if (!isMobileDevice()) {
    return `https://web.whatsapp.com/send?phone=${phone}&text=${text}`
  }

  return `https://wa.me/${phone}?text=${text}`
}

/** @deprecated Usar buildWhatsAppUrl */
export function buildWaMeUrl(telefonoNormalizado, mensaje) {
  return buildWhatsAppUrl(telefonoNormalizado, mensaje)
}

export function getWhatsAppUrlForPhone(telefono, mensaje) {
  const { valido, normalizado } = validarTelefonoAR(telefono)
  if (!valido || !normalizado) return null
  return buildWhatsAppUrl(normalizado, mensaje)
}

/**
 * Click en <a target="nombre"> evita noopener y reutiliza la pestaña nombrada.
 */
function navigateWhatsAppWindow(url) {
  const link = document.createElement('a')
  link.href = url
  link.target = WHATSAPP_WINDOW_NAME
  // Sin rel=noopener: si no, el navegador abre una pestaña nueva en cada click
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Abre o reutiliza la pestaña UDL de WhatsApp.
 * No puede reutilizar una pestaña de WhatsApp que abriste manualmente (límite del navegador).
 */
export function openWhatsApp(telefono, mensaje) {
  const url = getWhatsAppUrlForPhone(telefono, mensaje)
  if (!url) return false

  navigateWhatsAppWindow(url)
  return true
}

export async function copyWhatsAppMessage(mensaje) {
  if (!mensaje?.trim()) return false
  try {
    await navigator.clipboard.writeText(mensaje)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = mensaje
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  }
}
