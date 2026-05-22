'use client'

import { useRef } from 'react'
import QRCode from 'react-qr-code'

interface QrDisplayProps {
  slug: string
  productName: string
}

export function QrDisplay({ slug, productName }: QrDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const qrValue = `${process.env.NEXT_PUBLIC_BASE_URL}/r/${slug}`

  const handleDownload = () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const size = 256

    canvas.width = size
    canvas.height = size

    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#F5EFE0'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `${productName}-qr.png`
      link.click()
    }
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white border border-gold/40 rounded-xl">
      <div ref={containerRef} className="p-3 bg-cream rounded-lg">
        <QRCode value={qrValue} size={200} fgColor="#3D2B1F" bgColor="#F5EFE0" />
      </div>
      <button
        onClick={handleDownload}
        className="px-5 py-2 bg-gold text-cream font-bold rounded-lg text-sm hover:bg-gold/90 transition-colors"
      >
        PNG 다운로드
      </button>
    </div>
  )
}
