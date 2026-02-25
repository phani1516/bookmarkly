import { useState, useRef, useCallback } from 'react';
import { reorderLinks } from '@/lib/store';
import { LinkItem } from './LinkItem';
import type { Link, Category } from '@/lib/types';

const LONG_PRESS_MS = 400;

interface Props {
  links: Link[];
  categories: Category[];
  getBreadcrumb: (link: Link) => { text: string; color: string };
}

export function DraggableLinkList({ links, categories, getBreadcrumb }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartY = useRef(0);
  const orderedRef = useRef<string[]>([]);
  const itemRects = useRef<Map<string, DOMRect>>(new Map());

  // Sort: pinned first (newest pinned first), then newest-to-oldest by created_at
  const sorted = [...links].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const measureRects = useCallback(() => {
    itemRects.current.clear();
    sorted.forEach(l => {
      const el = document.getElementById(`link-item-${l.id}`);
      if (el) itemRects.current.set(l.id, el.getBoundingClientRect());
    });
  }, [sorted]);

  const handleLongPressStart = useCallback((id: string, clientY: number) => {
    longPressTimer.current = setTimeout(() => {
      setDraggingId(id);
      dragStartY.current = clientY;
      setDragY(0);
      measureRects();
      orderedRef.current = sorted.map(l => l.id);
      if (navigator.vibrate) navigator.vibrate(30);
    }, LONG_PRESS_MS);
  }, [sorted, measureRects]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (draggingId) {
      reorderLinks(orderedRef.current);
      setDraggingId(null);
      setDragY(0);
    }
  }, [draggingId]);

  const handleDragMove = useCallback((clientY: number) => {
    if (!draggingId) return;
    const dy = clientY - dragStartY.current;
    setDragY(dy);

    const dragRect = itemRects.current.get(draggingId);
    if (!dragRect) return;
    const dragCenterY = dragRect.top + dragRect.height / 2 + dy;

    const currentOrder = [...orderedRef.current];
    const dragIdx = currentOrder.indexOf(draggingId);
    if (dragIdx < 0) return;

    let swapIdx = dragIdx;
    for (let i = 0; i < currentOrder.length; i++) {
      if (i === dragIdx) continue;
      const rect = itemRects.current.get(currentOrder[i]);
      if (!rect) continue;
      const center = rect.top + rect.height / 2;
      if (dragIdx < i && dragCenterY > center) swapIdx = i;
      if (dragIdx > i && dragCenterY < center) swapIdx = i;
    }

    if (swapIdx !== dragIdx) {
      const item = currentOrder.splice(dragIdx, 1)[0];
      currentOrder.splice(swapIdx, 0, item);
      orderedRef.current = currentOrder;
    }
  }, [draggingId]);

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    // Don't start drag on buttons/links/inputs
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) {
      return;
    }
    handleLongPressStart(id, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingId) {
      e.preventDefault();
      handleDragMove(e.clientY);
    } else if (longPressTimer.current) {
      // Cancel long press if finger moves too much
      const dy = Math.abs(e.clientY - dragStartY.current);
      if (dy > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handlePointerUp = () => {
    handleLongPressEnd();
  };

  return (
    <div
      className="space-y-2"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {sorted.map(link => {
        const bc = getBreadcrumb(link);
        const isDragging = draggingId === link.id;
        return (
          <div
            key={link.id}
            id={`link-item-${link.id}`}
            className={`touch-none ${isDragging ? 'relative z-30' : ''}`}
            style={isDragging ? { transform: `translateY(${dragY}px)`, transition: 'none' } : { transition: 'transform 0.2s ease' }}
            onPointerDown={e => handlePointerDown(link.id, e)}
          >
            <LinkItem
              link={link}
              categories={categories}
              breadcrumb={bc.text}
              breadcrumbColor={bc.color}
              isDragging={isDragging}
            />
          </div>
        );
      })}
    </div>
  );
}
