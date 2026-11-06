import { describe, expect, it } from 'vitest'
import { MAX_LOGO_BYTES } from './configFormSchema'
import { readLogoFile } from './readLogoFile'

describe('readLogoFile', () => {
  it('returns a data URL for a small image', async () => {
    const url = await readLogoFile(new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], 'logo.svg', { type: 'image/svg+xml' }))
    expect(url).toMatch(/^data:image\/svg\+xml;base64,/)
  })

  it('rejects non-images and files over the size limit', async () => {
    await expect(readLogoFile(new File(['hi'], 'a.txt', { type: 'text/plain' }))).rejects.toThrow(/PNG, JPEG/)
    const big = new File([new Uint8Array(MAX_LOGO_BYTES + 1)], 'big.png', { type: 'image/png' })
    await expect(readLogoFile(big)).rejects.toThrow(/smaller than 200 KB/)
  })
})
