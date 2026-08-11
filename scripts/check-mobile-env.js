#!/usr/bin/env node
/**
 * Verifica .env.railway antes de build Android/iOS nativo.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env.railway')
const errors = []

if (!existsSync(envPath)) {
  errors.push('Falta .env.railway con VITE_API_URL apuntando a Railway')
} else {
  const content = readFileSync(envPath, 'utf8')
  const match = content.match(/^VITE_API_URL=(.+)$/m)
  const url = match?.[1]?.trim()
  if (!url) {
    errors.push('.env.railway: VITE_API_URL no puede estar vacío')
  } else if (!url.startsWith('https://')) {
    errors.push('.env.railway: VITE_API_URL debe ser HTTPS (Railway)')
  } else if (!url.endsWith('/api')) {
    errors.push('.env.railway: VITE_API_URL debe terminar en /api')
  }
}

if (errors.length) {
  console.error('check-mobile-env:\n' + errors.map((e) => '  - ' + e).join('\n'))
  process.exit(1)
}

console.log('OK: API Railway configurada (.env.railway)')
