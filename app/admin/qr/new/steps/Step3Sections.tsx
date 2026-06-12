'use client'

import { SectionsPanel } from '@/components/admin/SectionsPanel'
import type { ProductSection } from '@/lib/types'

interface Step3Props {
  sections: ProductSection[]
  onChange: (sections: ProductSection[]) => void
}

export function Step3Sections({ sections, onChange }: Step3Props) {
  return (
    <div>
      <p className="text-xs text-brown-muted mb-4">
        섹션은 랜딩 페이지 본문에 순서대로 표시됩니다. closing 타입은 중앙 정렬 + 금색 따옴표로 표시됩니다.
      </p>
      <SectionsPanel mode="create" sections={sections} onChange={onChange} />
    </div>
  )
}
