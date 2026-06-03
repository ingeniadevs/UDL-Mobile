import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result
      resolve(String(dataUrl).split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function shareBlob(blob, filename, mimeType = 'application/octet-stream') {
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    return
  }

  const base64 = await blobToBase64(blob)
  const written = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache
  })
  await Share.share({
    title: filename,
    url: written.uri,
    dialogTitle: 'Compartir archivo'
  })
}

export async function shareDataUrl(dataUrl, filename) {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  await shareBlob(blob, filename, blob.type)
}

export async function savePdfDocument(jsPdfDoc, filename) {
  if (!Capacitor.isNativePlatform()) {
    jsPdfDoc.save(filename)
    return
  }
  const blob = jsPdfDoc.output('blob')
  await shareBlob(blob, filename, 'application/pdf')
}

export async function downloadTextFile(content, filename, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType })
  await shareBlob(blob, filename, mimeType)
}

export function printHtmlContent(html) {
  if (Capacitor.isNativePlatform()) {
    return false
  }
  const ventana = window.open('', '_blank')
  if (!ventana) return false
  ventana.document.write(html)
  ventana.document.close()
  ventana.focus()
  ventana.print()
  ventana.close()
  return true
}
