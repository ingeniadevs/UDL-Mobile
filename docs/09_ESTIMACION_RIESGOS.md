# Estimación de esfuerzo y riesgos

## Estimación (1 dev familiarizado con el proyecto)

| Fase | Duración | Entregable |
|------|----------|------------|
| Infra Capacitor + capa platform | 1–2 sem | Repo UDL-Mobile (**hecho**) |
| MVP Portal Socio + QA dispositivo | 4–6 sem | Beta TestFlight / Play Internal |
| Push + backend tokens | 1–2 sem | Notificaciones operativas |
| Admin móvil (opcional) | 4–8 sem | `VITE_ENABLE_ADMIN=true` |
| Tiendas (assets, legal, revisión) | 2–3 sem | Producción |
| **Total MVP socio** | **~8–12 semanas** | |
| **Total con admin móvil** | **~14–20 semanas** | |

## Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| MercadoPago deep link mal configurado | Alto | Probar `udlclub://callback` en dispositivo; coordinar URLs con backend |
| PrimeVue DataTable en admin móvil | Medio | MVP solo socio; admin en tablet o fase posterior |
| CORS / URL API en producción | Alto | `VITE_API_URL` HTTPS; certificado válido |
| Sesión JWT expirada sin refresh | Medio | Igual que web: re-login; valorar refresh token futuro |
| Push sin endpoint backend | Medio | Implementar `POST /notificaciones/dispositivos` |
| Divergencia web/móvil | Medio | Script `sync-from-web.ps1` + checklist paridad |
| Rechazo tiendas (pagos externos) | Medio | Documentar MP como checkout externo |
| iOS build sin Mac | Alto | CI macOS (GitHub Actions, Codemagic) |

## Costos recurrentes

- Google Play: USD 25 (único)
- Apple Developer: USD 99/año
- Firebase: tier gratuito habitual para push
- Hosting API: sin cambio respecto a web
