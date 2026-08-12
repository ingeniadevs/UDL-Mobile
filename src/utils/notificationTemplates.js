export const PLANTILLA_DEFAULTS = {
  Vencimiento:
    'Hola {Nombre}.\n\nTe recordamos que tu cuota vence el día {FechaVencimiento}.\n\nImporte: ${Monto}\n\nMuchas gracias.',
  Reserva:
    'Hola {Nombre}.\n\nTe recordamos que tu reserva de {Espacio} está programada para el {Fecha} a las {Hora}.\n\nTe esperamos.',
  Pedido:
    'Hola {Nombre}.\n\nTu pedido #{NumeroPedido} ha sido actualizado.\n\nEstado actual: {Estado}\n\nMuchas gracias.'
}

export const PLANTILLA_META = {
  Vencimiento: {
    label: 'Vencimiento de pago',
    icon: 'pi-dollar',
    color: 'venc',
    description: 'Recordatorios de cuotas por vencer o vencidas',
    variables: ['Nombre', 'Apellido', 'NumeroSocio', 'FechaVencimiento', 'Monto']
  },
  Reserva: {
    label: 'Reserva próxima',
    icon: 'pi-calendar',
    color: 'res',
    description: 'Aviso antes del horario de la reserva',
    variables: ['Nombre', 'Apellido', 'Espacio', 'Fecha', 'Hora']
  },
  Pedido: {
    label: 'Estado de pedido',
    icon: 'pi-shopping-cart',
    color: 'ped',
    description: 'Cuando cambia el estado de un pedido',
    variables: ['Nombre', 'Apellido', 'NumeroPedido', 'Estado']
  }
}

const PREVIEW_SAMPLES = {
  Nombre: 'Juan',
  Apellido: 'Pérez',
  NumeroSocio: '1042',
  FechaVencimiento: '15/06/2026',
  Monto: '12.500,00',
  Fecha: '15/06/2026',
  Hora: '18:30',
  Espacio: 'Cancha de Tenis',
  NumeroPedido: 'A1B2C3D4',
  Estado: 'En preparación'
}

export function renderPlantillaPreview(contenido) {
  if (!contenido) return ''
  let out = contenido
  for (const [key, value] of Object.entries(PREVIEW_SAMPLES)) {
    out = out.replace(new RegExp(`\\{${key}\\}`, 'gi'), value)
  }
  return out.replace(/\{[A-Za-z]+\}/g, '')
}
