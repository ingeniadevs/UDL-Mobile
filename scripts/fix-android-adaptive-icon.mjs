import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

/**
 * Capacitor Assets regenera adaptive icons con fondo blanco + inset 16.7%,
 * lo que produce un anillo claro alrededor del ícono en el launcher.
 * Este script deja fondo negro sólido sin inset.
 */
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const resDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res')

const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`

const colorXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#000000</color>
</resources>
`

const densities = {
  ldpi: 81,
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
}

await mkdir(path.join(resDir, 'values'), { recursive: true })
await mkdir(path.join(resDir, 'mipmap-anydpi-v26'), { recursive: true })

await writeFile(path.join(resDir, 'values', 'ic_launcher_background.xml'), colorXml)
await writeFile(path.join(resDir, 'mipmap-anydpi-v26', 'ic_launcher.xml'), adaptiveXml)
await writeFile(path.join(resDir, 'mipmap-anydpi-v26', 'ic_launcher_round.xml'), adaptiveXml)

for (const [density, size] of Object.entries(densities)) {
  const dir = path.join(resDir, `mipmap-${density}`)
  await mkdir(dir, { recursive: true })
  const black = await sharp({
    create: { width: size, height: size, channels: 3, background: '#000000' },
  })
    .png()
    .toBuffer()
  await writeFile(path.join(dir, 'ic_launcher_background.png'), black)
}

console.log('Adaptive icon: fondo negro sólido (sin anillo / inset)')
