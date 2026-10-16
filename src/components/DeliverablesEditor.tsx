import { useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Deliverable } from '../lib/types';
import { uid } from '../lib/defaults';
import { Icon } from './ui';

interface Props {
  items: Deliverable[];
  onChange: (items: Deliverable[]) => void;
  error?: string;
}

export function DeliverablesEditor({ items, onChange, error }: Props) {
  const [draft, setDraft] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const patch = (id: string, p: Partial<Deliverable>) => onChange(items.map((i) => (i.id === id ? { ...i, ...p } : i)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    onChange(arrayMove(items, from, to));
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    onChange(arrayMove(items, from, to));
  };

  const add = () => {
    const label = draft.trim();
    if (!label) return;
    onChange([...items, { id: uid(), label, checked: true }]);
    setDraft('');
  };

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-caption text-fg-tertiary">
          선택한 항목만 문서에 반영됩니다 · <b className="text-fg-secondary">{checkedCount}</b> / {items.length}개 선택
        </p>
        <div className="flex gap-1">
          <button type="button" className="btn-ghost h-7 px-2 text-caption" onClick={() => onChange(items.map((i) => ({ ...i, checked: true })))}>
            전체 선택
          </button>
          <button type="button" className="btn-ghost h-7 px-2 text-caption" onClick={() => onChange(items.map((i) => ({ ...i, checked: false })))}>
            전체 해제
          </button>
        </div>
      </div>

      <div
        id="f-deliverables"
        tabIndex={-1}
        className={`rounded-md border ${error ? 'border-danger' : 'border-line'} divide-y divide-line overflow-hidden`}
        aria-describedby={error ? 'f-deliverables-error' : undefined}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item, idx) => (
              <Row
                key={item.id}
                item={item}
                index={idx}
                total={items.length}
                onPatch={(p) => patch(item.id, p)}
                onRemove={() => onChange(items.filter((i) => i.id !== item.id))}
                onMove={(d) => move(idx, idx + d)}
              />
            ))}
          </SortableContext>
        </DndContext>
        {!items.length && <p className="px-4 py-6 text-center text-compact text-fg-tertiary">항목이 없습니다. 아래에서 추가해 주세요.</p>}
      </div>
      {error && (
        <p id="f-deliverables-error" className="mt-1.5 text-caption text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-2 mt-3">
        <label htmlFor="f-deliv-new" className="sr-only">
          새 납품 항목
        </label>
        <input
          id="f-deliv-new"
          className="input"
          placeholder="직접 항목 추가 (예: 게시판 기능 구현)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn-secondary h-control flex-none" onClick={add} disabled={!draft.trim()}>
          <Icon name="plus" /> 추가
        </button>
      </div>
    </div>
  );
}

function Row({
  item,
  index,
  total,
  onPatch,
  onRemove,
  onMove,
}: {
  item: Deliverable;
  index: number;
  total: number;
  onPatch: (p: Partial<Deliverable>) => void;
  onRemove: () => void;
  onMove: (delta: number) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const checkId = `deliv-check-${item.id}`;
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 pl-1.5 pr-2 py-1.5 bg-bg-surface ${isDragging ? 'relative z-10 shadow-lg' : ''} ${
        item.checked ? '' : 'bg-bg-default'
      }`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="flex-none w-7 h-8 inline-flex items-center justify-center rounded-sm text-fg-tertiary hover:bg-bg-subtle cursor-grab active:cursor-grabbing touch-none"
        aria-label={`${item.label || '항목'} 순서 변경 (드래그 또는 스페이스 후 방향키)`}
      >
        <Icon name="grip" />
      </button>
      <input
        id={checkId}
        type="checkbox"
        checked={item.checked}
        onChange={(e) => onPatch({ checked: e.target.checked })}
        className="flex-none w-4 h-4 accent-[#2563EB] cursor-pointer"
        aria-label={`${item.label || '항목'} 문서에 포함`}
      />
      <input
        className={`flex-1 min-w-0 h-8 px-2 rounded-sm border border-transparent bg-transparent text-body hover:border-line focus:border-line-focus focus:bg-bg-surface focus:outline-none ${
          item.checked ? 'text-fg-primary' : 'text-fg-tertiary'
        }`}
        value={item.label}
        onChange={(e) => onPatch({ label: e.target.value })}
        aria-label={`납품 항목 ${index + 1} 이름`}
      />
      <div className="flex-none flex">
        <button
          type="button"
          className="w-7 h-8 inline-flex items-center justify-center rounded-sm text-fg-tertiary hover:bg-bg-subtle disabled:opacity-30"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          aria-label="위로 이동"
        >
          <Icon name="up" size={14} />
        </button>
        <button
          type="button"
          className="w-7 h-8 inline-flex items-center justify-center rounded-sm text-fg-tertiary hover:bg-bg-subtle disabled:opacity-30"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          aria-label="아래로 이동"
        >
          <Icon name="down" size={14} />
        </button>
        <button
          type="button"
          className="w-7 h-8 inline-flex items-center justify-center rounded-sm text-fg-tertiary hover:bg-danger-subtle hover:text-danger"
          onClick={onRemove}
          aria-label={`${item.label || '항목'} 삭제`}
        >
          <Icon name="trash" size={14} />
        </button>
      </div>
    </div>
  );
}
