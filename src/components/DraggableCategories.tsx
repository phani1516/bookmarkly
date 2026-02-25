import { useState, useRef, useCallback, useEffect } from 'react';
import { reorderCategories, updateCategory, deleteCategory } from '@/lib/store';
import { TrashIcon, ColorPaletteIcon, PinIcon, PinFilledIcon, ChevronRightIcon } from './Icons';
import type { Category, LinkType, LinkSubtype } from '@/lib/types';

const PRESET_COLORS = ['#6C5CE7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4', '#F97316', '#6B7280'];
const LONG_PRESS_MS = 400;

interface Props {
  categories: Category[];
  allLinkCount: number;
  linkCountByCategory: Record<string, number>;
  selectedCat: string | null;
  onSelectCat: (id: string | null) => void;
  type: LinkType;
  subtype: LinkSubtype;
  activeColor?: string;
}

export function DraggableCategories({
  categories, allLinkCount, linkCountByCategory,
  selectedCat, onSelectCat, type, subtype, activeColor,
}: Props) {
  const [editingColor, setEditingColor] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartX = useRef(0);
  const dragOffsetX = useRef(0);
  const itemRects = useRef<Map<string, DOMRect>>(new Map());
  const orderedRef = useRef<string[]>([]);
  const [dragX, setDragX] = useState(0);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const accentColor = activeColor || 'var(--accent)';

  // Sort: pinned first, then by position
  const sorted = [...categories].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return (a.position ?? 0) - (b.position ?? 0);
  });

  // Check if container overflows
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const check = () => setIsOverflowing(el.scrollWidth > el.clientWidth + 10);
    check();
    const obs = new ResizeObserver(check);
    obs.observe(el);
    return () => obs.disconnect();
  }, [categories]);

  const measureRects = useCallback(() => {
    itemRects.current.clear();
    sorted.forEach(c => {
      const el = document.getElementById(`cat-pill-${c.id}`);
      if (el) itemRects.current.set(c.id, el.getBoundingClientRect());
    });
  }, [sorted]);

  const handleLongPressStart = useCallback((id: string, clientX: number) => {
    longPressTimer.current = setTimeout(() => {
      setDraggingId(id);
      dragStartX.current = clientX;
      dragOffsetX.current = 0;
      setDragX(0);
      measureRects();
      orderedRef.current = sorted.map(c => c.id);
      if (navigator.vibrate) navigator.vibrate(30);
    }, LONG_PRESS_MS);
  }, [sorted, measureRects]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (draggingId) {
      reorderCategories(orderedRef.current, type, subtype);
      setDraggingId(null);
      setDragX(0);
    }
  }, [draggingId, type, subtype]);

  const handleDragMove = useCallback((clientX: number) => {
    if (!draggingId) return;
    const dx = clientX - dragStartX.current;
    dragOffsetX.current = dx;
    setDragX(dx);

    const dragRect = itemRects.current.get(draggingId);
    if (!dragRect) return;
    const dragCenterX = dragRect.left + dragRect.width / 2 + dx;

    const currentOrder = [...orderedRef.current];
    const dragIdx = currentOrder.indexOf(draggingId);
    if (dragIdx < 0) return;

    let swapIdx = dragIdx;
    for (let i = 0; i < currentOrder.length; i++) {
      if (i === dragIdx) continue;
      const rect = itemRects.current.get(currentOrder[i]);
      if (!rect) continue;
      const center = rect.left + rect.width / 2;
      if (dragIdx < i && dragCenterX > center) swapIdx = i;
      if (dragIdx > i && dragCenterX < center) swapIdx = i;
    }

    if (swapIdx !== dragIdx) {
      const item = currentOrder.splice(dragIdx, 1)[0];
      currentOrder.splice(swapIdx, 0, item);
      orderedRef.current = currentOrder;
    }
  }, [draggingId]);

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.preventDefault();
    handleLongPressStart(id, e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingId) {
      e.preventDefault();
      handleDragMove(e.clientX);
    } else if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerUp = () => {
    handleLongPressEnd();
  };

  const handleTogglePin = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cat = categories.find(c => c.id === id);
    if (cat) {
      await updateCategory(id, { is_pinned: !cat.is_pinned });
    }
  };

  const handleDeleteCat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteCategory(id);
    if (selectedCat === id) onSelectCat(null);
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`flex gap-2 pb-2 ${expanded ? 'flex-wrap' : 'overflow-x-auto scrollbar-hide'}`}
        style={expanded ? {} : { scrollbarWidth: 'none' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* All button */}
        <button
          onClick={() => onSelectCat(null)}
          className={`pill shrink-0 ${!selectedCat ? '' : 'pill-inactive'}`}
          style={!selectedCat ? { backgroundColor: accentColor, color: 'white', boxShadow: `0 2px 12px ${accentColor}40` } : undefined}
        >
          All ({allLinkCount})
        </button>

        {/* Category pills */}
        {sorted.map(c => {
          const count = linkCountByCategory[c.id] || 0;
          const isActive = selectedCat === c.id;
          const catColor = c.color || accentColor;
          const isDragging = draggingId === c.id;

          return (
            <div
              key={c.id}
              id={`cat-pill-${c.id}`}
              className={`relative group/pill shrink-0 flex items-center touch-none select-none ${isDragging ? 'z-30 opacity-80' : ''}`}
              style={isDragging ? { transform: `translateX(${dragX}px)`, transition: 'none' } : { transition: 'transform 0.2s ease' }}
              onPointerDown={e => handlePointerDown(c.id, e)}
            >
              <button
                onClick={() => { if (!draggingId) onSelectCat(c.id); }}
                className={`pill flex items-center gap-1.5 ${isActive ? '' : 'pill-inactive'} ${isDragging ? 'shadow-lg scale-105' : ''}`}
                style={isActive
                  ? { backgroundColor: catColor, color: 'white', boxShadow: `0 2px 12px ${catColor}40` }
                  : { borderColor: catColor + '40', color: catColor }}
              >
                {c.is_pinned && <PinFilledIcon size={10} className={isActive ? 'text-white' : ''} />}
                {c.color && !c.is_pinned && <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: catColor }} />}
                {c.name} ({count})
              </button>

              {/* Hover actions */}
              <div className="absolute -top-2 -right-1 flex gap-0.5 opacity-0 group-hover/pill:opacity-100 transition-opacity z-10">
                <button onClick={e => handleTogglePin(c.id, e)}
                  className="w-4 h-4 rounded-full bg-[var(--surface)] border border-[var(--surface-border)] flex items-center justify-center shadow-sm"
                  title={c.is_pinned ? 'Unpin' : 'Pin'}>
                  {c.is_pinned ? <PinFilledIcon size={7} className="text-[var(--accent)]" /> : <PinIcon size={7} />}
                </button>
                <button onClick={() => setEditingColor(editingColor === c.id ? null : c.id)}
                  className="w-4 h-4 rounded-full bg-[var(--surface)] border border-[var(--surface-border)] flex items-center justify-center shadow-sm">
                  <ColorPaletteIcon size={8} />
                </button>
                <button onClick={e => handleDeleteCat(c.id, e)}
                  className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm">
                  <TrashIcon size={7} />
                </button>
              </div>

              {/* Color picker dropdown */}
              {editingColor === c.id && (
                <div className="absolute top-full left-0 mt-2 p-2 card-sm flex gap-1.5 flex-wrap z-20 w-[180px] animate-scale-in">
                  {PRESET_COLORS.map(cl => (
                    <button key={cl} onClick={() => { updateCategory(c.id, { color: cl }); setEditingColor(null); }}
                      className="w-5 h-5 rounded-full border-2 transition-all hover:scale-110"
                      style={{ backgroundColor: cl, borderColor: c.color === cl ? 'var(--text-primary)' : 'transparent' }} />
                  ))}
                  <button onClick={() => { updateCategory(c.id, { color: undefined }); setEditingColor(null); }}
                    className="text-[9px] font-semibold text-[var(--text-tertiary)] px-1.5 py-0.5 rounded border border-[var(--surface-border)] hover:bg-[var(--surface-hover)]">
                    Reset
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop "Show More" button */}
      {isOverflowing && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="absolute right-0 top-0 h-[38px] px-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-r-full transition-all"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, var(--bg-primary) 30%)',
            color: accentColor,
            paddingLeft: '24px',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = accentColor; }}
        >
          More <ChevronRightIcon size={10} />
        </button>
      )}
      {expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-1 text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-80"
          style={{ color: accentColor }}
        >
          Show Less
        </button>
      )}
    </div>
  );
}
