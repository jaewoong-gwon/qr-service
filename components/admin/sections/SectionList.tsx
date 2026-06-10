'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { SectionCard } from './SectionCard'
import { NewSectionCard } from './NewSectionCard'
import { SectionTypeSelector } from './SectionTypeSelector'
import type { ProductSection, SectionType } from '@/lib/types'

interface SectionListProps {
  initialSections: ProductSection[]
  productId: string
}

export function SectionList({ initialSections, productId }: SectionListProps) {
  const [sections, setSections] = useState(initialSections)
  const [addingType, setAddingType] = useState<SectionType | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sections.findIndex((s) => s.id === active.id)
    const newIndex = sections.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(sections, oldIndex, newIndex).map((s, i) => ({ ...s, display_order: i }))
    setSections(reordered)

    try {
      const res = await fetch(`/api/products/${productId}/sections/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: reordered.map((s) => ({ id: s.id, display_order: s.display_order })) }),
      })
      if (!res.ok) throw new Error()
    } catch {
      const res = await fetch(`/api/products/${productId}/sections`)
      if (res.ok) setSections(await res.json())
    }
  }

  function handleSectionSaved(updated: ProductSection) {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    setExpandedId(null)
  }

  function handleSectionDeleted(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id))
  }

  function handleNewSectionSaved(section: ProductSection) {
    setSections((prev) => [...prev, section])
    setAddingType(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              productId={productId}
              isExpanded={expandedId === section.id}
              onToggle={() => setExpandedId(expandedId === section.id ? null : section.id)}
              onSave={handleSectionSaved}
              onDelete={handleSectionDeleted}
            />
          ))}
        </SortableContext>
      </DndContext>

      {addingType !== null && (
        <NewSectionCard
          sectionType={addingType}
          productId={productId}
          displayOrder={sections.length}
          onSave={handleNewSectionSaved}
          onCancel={() => setAddingType(null)}
        />
      )}

      {addingType === null && (
        <SectionTypeSelector onSelect={setAddingType} />
      )}
    </div>
  )
}
