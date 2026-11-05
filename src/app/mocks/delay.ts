export const delay = (ms = 50) => new Promise<void>((resolve) => setTimeout(resolve, ms))
