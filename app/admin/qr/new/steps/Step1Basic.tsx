'use client'

import type { Store } from '@/lib/types'

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const labelClass = 'block text-sm font-bold text-brown-dark mb-1.5'
const hintClass = 'text-[11px] text-brown-muted font-normal'

export interface BasicData {
  name: string
  subtitle: string
  idusUrl: string
  storeId: string
}

interface Step1Props {
  data: BasicData
  stores: Store[]
  onChange: (data: BasicData) => void
}

export function Step1Basic({ data, stores, onChange }: Step1Props) {
  function set(field: keyof BasicData, value: string) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="step1-store" className={labelClass}>
          매장 <span className="text-gold">*</span>
        </label>
        {stores.length === 0 ? (
          <p className="text-sm text-red-400 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
            매장이 없습니다.{' '}
            <a href="/admin/stores" className="underline font-semibold">
              매장 관리
            </a>
            에서 먼저 등록해주세요.
          </p>
        ) : (
          <select
            id="step1-store"
            value={data.storeId}
            onChange={(e) => set('storeId', e.target.value)}
            className={inputClass}
            required
          >
            <option value="">매장을 선택하세요</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label htmlFor="step1-name" className={labelClass}>
          제품명 <span className="text-gold">*</span>
        </label>
        <input
          id="step1-name"
          value={data.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="레진 갓 키링"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label htmlFor="step1-subtitle" className={labelClass}>
          한 줄 카피 <span className={hintClass}>(선택 · 상단에 표시)</span>
        </label>
        <input
          id="step1-subtitle"
          value={data.subtitle}
          onChange={(e) => set('subtitle', e.target.value)}
          placeholder="전통의 아름다움을 일상 속에"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="step1-idus-url" className={labelClass}>
          아이디어스 구매 링크 <span className={hintClass}>(권장)</span>
        </label>
        <input
          id="step1-idus-url"
          type="url"
          value={data.idusUrl}
          onChange={(e) => set('idusUrl', e.target.value)}
          placeholder="https://www.idus.com/v2/product/..."
          className={inputClass}
        />
        <p className={`mt-1.5 ${hintClass}`}>없으면 CTA 버튼이 노출되지 않습니다.</p>
      </div>
    </div>
  )
}
