#!/usr/bin/env node
/**
 * Verifica env del perfil mobile antes de build nativo.
 * Uso: node scripts/check-mobile-env.js [railway|local]
 *   railway → .env.railway (HTTPS)
 *   local   → .env.android (Docker / emulador 10.0.2.2)
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const profile = (process.argv[2] || 'railway').toLowerCase()
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []

function readApiUrl(envFile) {
  const envPath = join(root, envFile)
  if (!existsSync(envPath)) {
    errors.push(`Falta ${envFile}`)
    return null
  }
  const content = readFileSync(envPath, 'utf8')
  const match = content.match(/^VITE_API_URL=(.+)$/m)
  return match?.[1]?.trim() || ''
}

if (profile === 'local' || profile === 'docker' || profile === 'android') {
  const url = readApiUrl('.env.android')
  if (url === '') {
    errors.push('.env.android: VITE_API_URL no puede estar vacío (ej. http://10.0.2.2:5055/api)')
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    errors.push('.env.android: VITE_API_URL debe ser una URL http(s)')
  } else if (!url.endsWith('/api')) {
    errors.push('.env.android: VITE_API_URL debe terminar en /api')
  } else if (url.includes('10.0.2.2') || url.includes('localhost') || /^http:\/\/\d+\.\d+\.\d+\.\d+/.test(url)) {
    // emulador, loopback o IP LAN — ok
  } else if (url.startsWith('https://') && url.includes('railway')) {
    errors.push('.env.android apunta a Railway; para ese perfil usá npm run cap:android (railway)')
  }

  if (!errors.length) {
    console.log(`OK: perfil Docker/local (.env.android → ${url})`)
  }
} else if (profile === 'railway') {
  const url = readApiUrl('.env.railway')
  if (!url) {
    errors.push('.env.railway: VITE_API_URL no puede estar vacío')
  } else if (!url.startsWith('https://')) {
    errors.push('.env.railway: VITE_API_URL debe ser HTTPS (Railway)')
  } else if (!url.endsWith('/api')) {
    errors.push('.env.railway: VITE_API_URL debe terminar en /api')
  }

  if (!errors.length) {
    console.log('OK: perfil Railway (.env.railway)')
  }
} else {
  errors.push(`Perfil desconocido: ${profile} (usá railway | local)`)
}

if (errors.length) {
  console.error('check-mobile-env:\n' + errors.map((e) => '  - ' + e).join('\n'))
  process.exit(1)
}
