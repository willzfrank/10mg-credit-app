import { MAX_LOGO_BYTES } from './configFormSchema'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']

export function readLogoFile(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Promise.reject(new Error('Logo must be a PNG, JPEG, WebP, GIF or SVG image'))
  }
  if (file.size > MAX_LOGO_BYTES) {
    return Promise.reject(new Error(`Logo must be smaller than ${MAX_LOGO_BYTES / 1024} KB`))
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read that file'))
    reader.readAsDataURL(file)
  })
}
