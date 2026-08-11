import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const assetsDir = path.join(rootDir, 'assets')
const srcAssetsDir = path.join(rootDir, 'src', 'assets')
const sourcePath = path.join(assetsDir, 'ingenia.jpeg')
const iconPath = path.join(assetsDir, 'icon.png')
const publicJpegPath = path.join(rootDir, 'public', 'images', 'ingenia.jpeg')
const publicPngPath = path.join(rootDir, 'public', 'images', 'ingenia-club-icon.png')

const iconBackground = '#ffffff'
const size = 1024

await mkdir(path.join(rootDir, 'public', 'images'), { recursive: true })

const icon = await sharp(sourcePath)
  .resize(size, size, {
    fit: 'contain',
    background: iconBackground
  })
  .png()
  .toBuffer()

await writeFile(iconPath, icon)
await writeFile(publicPngPath, icon)
await copyFile(sourcePath, publicJpegPath)

const srcJpegPath = path.join(srcAssetsDir, 'ingenia.jpeg')
try {
  await copyFile(sourcePath, srcJpegPath)
} catch {
  // Ya existe en src/assets si el usuario lo copió manualmente.
}

console.log('Iconos generados desde assets/ingenia.jpeg')
