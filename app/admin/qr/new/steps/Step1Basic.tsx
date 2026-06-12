'use client'

const inputClass =
  'w-full bg-white border border-gold/40 rounded-lg px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const labelClass = 'block text-sm font-bold text-brown-dark mb-1.5'
const hintClass = 'text-[11px] text-brown-muted font-normal'

export interface BasicData {
  name: string
  driveUrl: string
  subtitle: string
  summary: string
  idusUrl: string
}

interface Step1Props {
  data: BasicData
  onChange: (data: BasicData) => void
}

export function Step1Basic({ data, onChange }: Step1Props) {
  function set(field: keyof BasicData, value: string) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>
          Google Drive 폴더 URL <span className="text-gold">*</span>
        </label>
        <input
          type="url"
          value={data.driveUrl}
          onChange={(e) => set('driveUrl', e.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
          className={inputClass}
          required
        />
        <p className={`mt-1.5 ${hintClass}`}>사진이 저장된 공개 Google Drive 폴더 주소를 입력하세요.</p>
      </div>
      <div>
        <label className={labelClass}>
          제품명 <span className="text-gold">*</span>
        </label>
        <input
          value={data.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="레진 갓 키링"
          className={inputClass}
          required
        />
      </div>
      <div>
        <label className={labelClass}>
          한 줄 카피 <span className={hintClass}>(선택 · 제품명 위에 표시)</span>
        </label>
        <input
          value={data.subtitle}
          onChange={(e) => set('subtitle', e.target.value)}
          placeholder="전통의 아름다움을 일상 속에"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>
          요약 <span className={hintClass}>(선택 · hero 하단)</span>
        </label>
        <textarea
          value={data.summary}
          onChange={(e) => set('summary', e.target.value)}
          rows={2}
          placeholder="제품에 대한 짧은 요약 문장"
          className={`${inputClass} resize-none`}
        />
      </div>
      <div>
        <label className={labelClass}>
          아이디어스 구매 링크 <span className={hintClass}>(권장)</span>
        </label>
        <input
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
