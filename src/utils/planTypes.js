export const PLAN_TYPES = [
  { label: 'Individual', value: 'Individual' },
  { label: 'Familiar', value: 'Familiar' },
  { label: 'Jubilado', value: 'Jubilado' },
  { label: 'Personalizado', value: 'Personalizado' }
]

export function getPlanTypeSeverity(tipoPlan) {
  const severityMap = {
    Individual: 'info',
    Familiar: 'success',
    Jubilado: 'warning',
    Personalizado: 'secondary'
  }
  return severityMap[tipoPlan] || 'info'
}
