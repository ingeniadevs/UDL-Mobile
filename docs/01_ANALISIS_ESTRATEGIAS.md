# Análisis de estrategias móviles — UDL

## Contexto del proyecto actual

| Capa | Tecnología |
|------|------------|
| Backend | .NET 8 Web API (JWT, PostgreSQL) |
| Frontend | Vue 3 + Vite + Pinia + PrimeVue 3 |
| ~48 archivos fuente | views (admin + socio), services monolíticos, 1 store auth |

## Comparativa de las 5 opciones

### 1. Capacitor + Vue.js ✅ **RECOMENDADA**

| Criterio | Evaluación |
|----------|------------|
| Reutilización Vue | **Muy alta** (60–85 % según módulo) |
| API .NET 8 | Sin cambios; REST + JWT |
| Una base de código | Sí (WebView + plugins nativos) |
| Experiencia nativa | Buena con plugins + ajustes UI |
| Compatibilidad web | Máxima: mismo código en `UDL-Frontend` y `UDL-Mobile` |
| Curva de aprendizaje | Baja para el equipo actual |
| Tiempo estimado MVP socio | **6–10 semanas** |
| Riesgo principal | UX de tablas admin en pantallas pequeñas |

### 2. Ionic + Vue.js

Ionic **usa Capacitor** como runtime nativo. La diferencia es el sistema de componentes (`ion-*`) en lugar de PrimeVue.

| Pros | Contras |
|------|---------|
| UI móvil más “nativa” out of the box | **Reescritura masiva** de ~30 vistas con PrimeVue |
| Navegación/tab bar integrada | Dos design systems si mantienes web con PrimeVue |

**Veredicto:** Solo si aceptas migrar UI a Ionic y mantener lógica en composables/services. Coste **+40–60 %** vs Capacitor puro. Puede ser **fase 2** del shell (tab bar) sin reemplazar PrimeVue de inmediato.

### 3. .NET MAUI

| Pros | Contras |
|------|---------|
| Mismo ecosistema que el backend | **0 %** reutilización Vue |
| UI nativa XAML | Duplicación de toda la lógica de negocio en C# |
| | Dos equipos o doble mantenimiento |

**Veredicto:** Descartada para maximizar reutilización.

### 4. Flutter

| Pros | Contras |
|------|---------|
| Excelente rendimiento UI | Reescritura completa en Dart |
| Una base iOS/Android | API compartida sí, frontend no |

**Veredicto:** Descartada salvo que abandonen Vue en todos los canales.

### 5. React Native

Misma situación que Flutter respecto a Vue: **reescritura total** del frontend. No aporta ventaja frente a Capacitor con stack actual.

---

## Decisión: Capacitor + Vue.js 3

Este repositorio (`UDL-Mobile`) implementa esa estrategia con:

- Código Vue copiado desde `UDL-Frontend` (referencia)
- Capa `src/platform/` para JWT seguro, cámara, push, MercadoPago
- Proyectos nativos: `android/`, `ios/`

Ionic queda como **evolución opcional** del shell de navegación, no como requisito del MVP.
