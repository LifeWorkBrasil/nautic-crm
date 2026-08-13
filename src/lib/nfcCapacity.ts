// Adaptado de curalabs3d-nfc-hub/frontend/src/utils/nfcCapacity.js — cada tag aqui aponta pra
// um único destino (a página pública da embarcação), então a lógica de múltiplos links do
// projeto original (mainLink/sacLink/restrictedLink) não se aplica.

export const NFC_MODELS = {
  NTAG213: { label: 'NTAG213', usableBytes: 137 },
  NTAG215: { label: 'NTAG215', usableBytes: 496 },
  NTAG216: { label: 'NTAG216', usableBytes: 872 },
  CUSTOM: { label: 'Personalizado', usableBytes: null },
} as const

export type ModeloNfc = keyof typeof NFC_MODELS

const NDEF_RECORD_OVERHEAD_BYTES = 7

const URI_ABBREVIATIONS = [
  { prefix: 'https://www.', savedChars: 12 },
  { prefix: 'http://www.', savedChars: 11 },
  { prefix: 'https://', savedChars: 8 },
  { prefix: 'http://', savedChars: 7 },
]

function utf8ByteLength(str: string): number {
  return new TextEncoder().encode(str).length
}

export function computeUrlNdefBytes(url: string): number {
  if (!url) return 0
  let remaining = url
  for (const abbr of URI_ABBREVIATIONS) {
    if (url.startsWith(abbr.prefix)) {
      remaining = url.slice(abbr.prefix.length)
      break
    }
  }
  return utf8ByteLength(remaining) + 1 + NDEF_RECORD_OVERHEAD_BYTES
}

export function getModelCapacity(model: ModeloNfc, customCapacityBytes: number | null): number {
  if (model === 'CUSTOM') return customCapacityBytes ?? 0
  return NFC_MODELS[model].usableBytes ?? NFC_MODELS.NTAG213.usableBytes
}
