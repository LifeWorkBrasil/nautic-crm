import QRCode from 'qrcode'

export async function gerarQrCodeDataUrl(texto: string): Promise<string> {
  return QRCode.toDataURL(texto, { width: 300, margin: 1 })
}
