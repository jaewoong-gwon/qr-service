'use client'

import { TagsPanel } from '@/components/admin/TagsPanel'
import type { ProductTag } from '@/lib/types'

interface Step2Props {
  tags: ProductTag[]
  onChange: (tags: ProductTag[]) => void
}

export function Step2Tags({ tags, onChange }: Step2Props) {
  return (
    <div>
      <p className="text-xs text-brown-muted mb-4">
        태그는 hero 영역에 pill 형태로 표시됩니다. 예: #레진 #한국전통 #키링
      </p>
      <TagsPanel mode="create" tags={tags} onChange={onChange} />
    </div>
  )
}
