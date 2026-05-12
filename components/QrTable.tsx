'use client'

import QRCode from 'react-qr-code'
import type { QrCode } from '@/lib/types'

interface QrTableProps {
  items: QrCode[]
}

export function QrTable({ items }: QrTableProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  if (items.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        생성된 QR 코드가 없습니다.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-3 font-medium">제품명</th>
            <th className="text-left p-3 font-medium">Slug</th>
            <th className="text-left p-3 font-medium">생성일</th>
            <th className="text-left p-3 font-medium">QR</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{item.product_name}</td>
              <td className="p-3 font-mono">{item.slug}</td>
              <td className="p-3 text-gray-500">
                {new Date(item.created_at).toLocaleDateString('ko-KR')}
              </td>
              <td className="p-3">
                <QRCode value={`${baseUrl}/r/${item.slug}`} size={64} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
