import type { ReactNode } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

/* ================================================================
   Types — derived from useSortable to stay in sync with dnd-kit
   ================================================================ */

export type DragHandleProps = Pick<
  ReturnType<typeof useSortable>,
  "attributes" | "listeners" | "setActivatorNodeRef"
>

type SortableListProps<T extends { id: string }> = {
  items: T[]
  onReorder: (oldIndex: number, newIndex: number) => void
  children: (
    item: T,
    index: number,
    dragHandleProps: DragHandleProps
  ) => ReactNode
}

/* ================================================================
   SortableRow — single row wrapper using useSortable
   ================================================================ */

function SortableRow({
  id,
  children,
}: {
  id: string
  children: (dragHandleProps: DragHandleProps) => ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: "relative" as const,
    cursor: isDragging ? "grabbing" : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners, setActivatorNodeRef })}
    </div>
  )
}

/* ================================================================
   SortableList — DnD context + sortable context
   ================================================================ */

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  children,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    onReorder(oldIndex, newIndex)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item, index) => (
          <SortableRow key={item.id} id={item.id}>
            {(dragHandleProps) => children(item, index, dragHandleProps)}
          </SortableRow>
        ))}
      </SortableContext>
    </DndContext>
  )
}
