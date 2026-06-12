'use client'

import { useEffect, useState } from 'react'
import { NoticePanel } from '@/components/admin/NoticePanel'
import type { NoticeFormData } from '@/components/admin/NoticePanel'
import type { NoticeGroup } from '@/lib/types'

type NoticeGroupFull = NoticeGroup & { id: string; name: string }

interface Step4Props {
  noticeData: NoticeFormData | null
  onChange: (data: NoticeFormData | null) => void
}

export function Step4Notice({ noticeData, onChange }: Step4Props) {
  const [groups, setGroups] = useState<NoticeGroupFull[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch('/api/notice-groups')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setGroups(data)
      })
      .finally(() => setFetching(false))
  }, [])

  return (
    <div>
      <p className="text-xs text-brown-muted mb-4">
        구매 전 확인사항을 그룹으로 관리합니다. 여러 제품이 같은 그룹을 공유할 수 있습니다.
      </p>
      {fetching ? (
        <p className="text-sm text-brown-muted">불러오는 중...</p>
      ) : (
        <NoticePanel mode="create" noticeData={noticeData} groups={groups} onChange={onChange} />
      )}
    </div>
  )
}
