import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { ensureCameraPermission } from './permissions'

/**
 * Selecciona imagen: cámara o galería en nativo; input file en web.
 */
export async function pickImage(options = {}) {
  const { source = 'prompt', quality = 85 } = options

  if (!Capacitor.isNativePlatform()) {
    return pickImageFromFileInput()
  }

  await ensureCameraPermission()

  let cameraSource = CameraSource.Prompt
  if (source === 'camera') cameraSource = CameraSource.Camera
  if (source === 'gallery') cameraSource = CameraSource.Photos

  const photo = await Camera.getPhoto({
    quality,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: cameraSource
  })

  const response = await fetch(photo.webPath)
  const blob = await response.blob()
  const extension = photo.format || 'jpeg'
  const fileName = `udl-${Date.now()}.${extension}`
  return new File([blob], fileName, { type: `image/${extension}` })
}

function pickImageFromFileInput() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) resolve(file)
      else reject(new Error('No se seleccionó imagen'))
    }
    input.click()
  })
}
