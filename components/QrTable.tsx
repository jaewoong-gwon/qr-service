// components/QrTable.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import { QrDisplay } from '@/components/QrDisplay'
import type { QrCodeWithProduct } from '@/lib/types'

interface QrTableProps {
  items: QrCodeWithProduct[]
}

export function QrTable({ items }: QrTableProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
  const router = useRouter()

  const [downloadItem, setDownloadItem] = useState<QrCodeWithProduct | null>(null)

  async function handleDelete(item: QrCodeWithProduct) {
    const productName = item.products?.name ?? item.slug
    if (!confirm(`"${productName}" QR 코드를 삭제하시겠습니까?`)) return
    const res = await fetch(`/api/qr/${item.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    } else {
      alert('삭제에 실패했습니다. 다시 시도해 주세요.')
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-cream border border-dashed border-gold/40 rounded-xl py-12 text-center">
        <p className="text-base text-brown-muted">생성된 QR 코드가 없습니다.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-cream border border-gold/40 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gold/20 bg-cream-bg">
              <th className="text-left text-xs font-bold tracking-[2px] text-gold px-4 py-2.5 w-16 uppercase">
                QR
              </th>
              <th className="text-left text-xs font-bold tracking-[2px] text-gold px-4 py-2.5 uppercase">
                제품명
              </th>
              <th className="text-left text-xs font-bold tracking-[2px] text-gold px-4 py-2.5 whitespace-nowrap uppercase">
                생성일
              </th>
              <th className="text-right text-xs font-bold tracking-[2px] text-gold px-4 py-2.5 uppercase">
                작업
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-gold/10 last:border-0 hover:bg-cream-bg/50 transition-colors"
              >
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => setDownloadItem(item)}
                    aria-label={`${item.products?.name ?? item.slug} QR 코드 다운로드`}
                    className="w-12 h-12 p-1.5 bg-cream border border-gold/30 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
                    title="클릭하여 다운로드"
                  >
                    <QRCode value={`${baseUrl}/r/${item.slug}`} size={36} fgColor="#3D2B1F" bgColor="#F5EFE0" />
                  </button>
                </td>

                <td className="px-4 py-2.5">
                  <p className="text-base font-semibold text-brown-dark">
                    {item.products?.name ?? '-'}
                  </p>
                  {item.products?.subtitle && (
                    <p className="text-sm text-brown-muted mt-0.5">{item.products.subtitle}</p>
                  )}
                </td>

                <td className="px-4 py-2.5 text-base text-brown-light whitespace-nowrap">
                  {new Date(item.created_at).toLocaleDateString('ko-KR')}
                </td>

                <td className="px-4 py-2.5">
                  <div className="flex gap-2 justify-end">
                    <Link
                      href={`/r/${item.slug}`}
                      target="_blank"
                      className="text-sm px-3.5 py-1.5 rounded bg-cream-bg text-brown-light border border-gold/30 hover:bg-gold/10 transition-colors whitespace-nowrap"
                    >
                      미리보기
                    </Link>
                    <Link
                      href={`/admin/qr/${item.id}/edit`}
                      className="text-sm px-3.5 py-1.5 rounded bg-gold/10 text-brown-dark border border-gold/30 hover:bg-gold/20 transition-colors whitespace-nowrap font-medium"
                    >
                      수정
                    </Link>
                    <button
                      onClick={() => setDownloadItem(item)}
                      className="text-sm px-3.5 py-1.5 rounded bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 transition-colors whitespace-nowrap"
                    >
                      다운로드
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-sm px-3.5 py-1.5 rounded bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors whitespace-nowrap"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {downloadItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setDownloadItem(null)}
        >
          <div
            className="bg-cream border border-gold rounded-xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-brown-dark self-start">
              {downloadItem.products?.name ?? downloadItem.slug}
            </h2>
            <QrDisplay
              slug={downloadItem.slug}
              productName={downloadItem.products?.name ?? ''}
            />
            <button
              onClick={() => setDownloadItem(null)}
              className="w-full px-4 py-2 text-sm rounded-lg border border-gold/40 text-brown-light hover:bg-gold/10 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  )
}
