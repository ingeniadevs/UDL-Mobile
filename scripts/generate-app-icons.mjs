import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const assetsDir = path.join(rootDir, 'assets')
const srcAssetsDir = path.join(rootDir, 'src', 'assets')

const sourceCandidates = [
  path.join(assetsDir, 'foco-ingenia.png'),
  path.join(assetsDir, 'foco ingenia.png'),
]

async function resolveSource() {
  for (const candidate of sourceCandidates) {
    try {
      await sharp(candidate).metadata()
      return candidate
    } catch {
      /* try next */
    }
  }
  throw new Error('No se encontró assets/foco-ingenia.png')
}

const sourcePath = await resolveSource()
const iconPath = path.join(assetsDir, 'icon.png')
const splashPath = path.join(assetsDir, 'splash.png')
const publicPngPath = path.join(rootDir, 'public', 'images', 'foco-ingenia.png')
const publicLegacyPngPath = path.join(rootDir, 'public', 'images', 'ingenia-club-icon.png')
const srcPngPath = path.join(srcAssetsDir, 'foco-ingenia.png')
const assetsPngPath = path.join(assetsDir, 'foco-ingenia.png')

const iconBackground = { r: 0, g: 0, b: 0, alpha: 1 }
const size = 1024

await mkdir(path.join(rootDir, 'public', 'images'), { recursive: true })
await mkdir(srcAssetsDir, { recursive: true })

/** Recorta al foco (quita padding transparente) y conserva alpha. */
async function cropTransparentPng(inputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let minX = info.width
  let minY = info.height
  let maxX = 0
  let maxY = 0

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const a = data[(y * info.width + x) * 4 + 3]
      if (a > 10) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  const pad = 8
  minX = Math.max(0, minX - pad)
  minY = Math.max(0, minY - pad)
  maxX = Math.min(info.width - 1, maxX + pad)
  maxY = Math.min(info.height - 1, maxY + pad)

  return sharp(inputPath)
    .extract({
      left: minX,
      top: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    })
    .png()
    .toBuffer()
}

const transparentFoco = await cropTransparentPng(sourcePath)

// Login / web: solo el foco con transparencia (sin fondo)
await writeFile(assetsPngPath, transparentFoco)
await writeFile(srcPngPath, transparentFoco)
await writeFile(publicPngPath, transparentFoco)

// Launcher / splash: foco más chico para que entre en la máscara circular (~66% safe zone)
const launcherScale = 0.56
const resizedFoco = await sharp(transparentFoco)
  .resize(Math.round(size * launcherScale), Math.round(size * launcherScale), {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer()

const icon = await sharp({
  create: {
    width: size,
    height: size,
    channels: 4,
    background: iconBackground,
  },
})
  .composite([{ input: resizedFoco, gravity: 'centre' }])
  .png()
  .toBuffer()

await writeFile(iconPath, icon)
await writeFile(splashPath, icon)
await writeFile(publicLegacyPngPath, icon)

console.log('Iconos generados: foco transparente (login) + negro (launcher)')
console.log('Nota: tras `npx capacitor-assets generate`, revisar que ic_launcher.xml use @color/ic_launcher_background sin inset.')
