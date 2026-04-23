import { useState, useRef, useEffect } from 'react';
import { updateCategory, deleteCategory } from '@/lib/store';
import { TrashIcon, ColorPaletteIcon, PinIcon, PinFilledIcon, ChevronRightIcon } from './Icons';
import type { Category, LinkType, LinkSubtype } from '@/lib/types';

const PRESET_COLORS = ['#6C5CE7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4', '#F97316', '#6B7280'];

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
  selectedCat, onSelectCat, type: _type, subtype: _subtype, activeColor,
}: Props) {
  const [editingColor, setEditingColor] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [contextCatId, setContextCatId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const accentColor = activeColor || 'var(--accent)';

  // Sort: pinned first, then by position
  const sorted = [...categories].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return (a.position ?? 0) - (b.position ?? 0);
  });

  // Check if container overflows (desktop "show more")
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const check = () => setIsOverflowing(el.scrollWidth > el.clientWidth + 10);
    check();
    const obs = new ResizeObserver(check);
    obs.observe(el);
    return () => obs.disconnect();
  }, [categories, expanded]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextCatId) return;
    const handleClick = () => setContextCatId(null);
    const t = setTimeout(() => document.addEventListener('click', handleClick), 50);
    return () => { clearTimeout(t); document.removeEventListener('click', handleClick); };
  }, [contextCatId]);

  // Close color picker on outside click
  useEffect(() => {
    if (!editingColor) return;
    const handleClick = () => setEditingColor(null);
    const t = setTimeout(() => document.addEventListener('click', handleClick), 50);
    return () => { clearTimeout(t); document.removeEventListener('click', handleClick); };
  }, [editingColor]);

  const handleTouchStart = (id: string) => {
    longPressTimer.current = setTimeout(() => {
      setContextCatId(id);
      if (navigator.vibrate) navigator.vibrate(30);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTogglePin = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat) {
      await updateCategory(id, { is_pinned: !cat.is_pinned });
    }
    setContextCatId(null);
  };

  const handleDeleteCat = async (id: string) => {
    await deleteCategory(id);
    if (selectedCat === id) onSelectCat(null);
    setContextCatId(null);
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`flex gap-2 pb-2 ${expanded ? 'flex-wrap' : 'overflow-x-auto scrollbar-hide'}`}
        style={expanded ? {} : { scrollbarWidth: 'none' }}
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
          const showContext = contextCatId === c.id;

          return (
            <div
              key={c.id}
              className="relative shrink-0"
              onTouchStart={() => handleTouchStart(c.id)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              onContextMenu={e => { e.preventDefault(); setContextCatId(c.id); }}
            >
              <button
                onClick={() => onSelectCat(c.id)}
                className={`pill flex items-center gap-1.5 ${isActive ? '' : 'pill-inactive'}`}
                style={isActive
                  ? { backgroundColor: catColor, color: 'white', boxShadow: `0 2px 12px ${catColor}40` }
                  : { borderColor: catColor + '40', color: catColor }}
              >
                {c.is_pinned && <PinFilledIcon size={10} className={isActive ? 'text-white' : ''} />}
                {c.color && !c.is_pinned && <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: catColor }} />}
                {c.name} ({count})
              </button>

              {/* Context menu (long-press on mobile, right-click on desktop) */}
              {showContext && (
                <div
                  className="absolute top-full left-0 mt-1.5 z-50 animate-scale-in"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="rounded-[14px] border border-[var(--surface-border)] shadow-lg overflow-hidden"
                    style={{ background: 'var(--bg-primary)', minWidth: '150px' }}>
                    <button
                      onClick={() => handleTogglePin(c.id)}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition"
                    >
                      {c.is_pinned ? <PinFilledIcon size={12} className="text-[var(--accent)]" /> : <PinIcon size={12} />}
                      {c.is_pinned ? 'Unpin' : 'Pin to top'}
                    </button>
                    <button
                      onClick={() => { setEditingColor(c.id); setContextCatId(null); }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition"
                    >
                      <ColorPaletteIcon size={12} />
                      Change color
                    </button>
                    <div className="h-px bg-[var(--surface-border)]" />
                    <button
                      onClick={() => handleDeleteCat(c.id)}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-red-500 hover:bg-red-500/5 transition"
                    >
                      <TrashIcon size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Color picker dropdown */}
              {editingColor === c.id && (
                <div
                  className="absolute top-full left-0 mt-1.5 p-3 z-50 rounded-[14px] border border-[var(--surface-border)] shadow-lg animate-scale-in"
                  style={{ background: 'var(--bg-primary)', width: '200px' }}
                  onClick={e => e.stopPropagation()}
                >
                  <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Pick a color</p>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map(cl => (
                      <button key={cl} onClick={() => { updateCategory(c.id, { color: cl }); setEditingColor(null); }}
                        className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110 active:scale-95"
                        style={{ backgroundColor: cl, borderColor: c.color === cl ? 'var(--text-primary)' : 'transparent' }} />
                    ))}
                  </div>
                  <button onClick={() => { updateCategory(c.id, { color: undefined }); setEditingColor(null); }}
                    className="mt-2 text-[10px] font-semibold text-[var(--text-tertiary)] px-2 py-1 rounded border border-[var(--surface-border)] hover:bg-[var(--surface-hover)] transition">
                    Reset color
                  </button>
                </div>
              )}

              {/* Desktop hover actions */}
              <div className="absolute -top-2 -right-1 hidden sm:flex gap-0.5 opacity-0 group-hover/catpill:opacity-100 transition-opacity z-10"
                style={{ display: 'none' }}>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop "Show More" button */}
      {isOverflowing && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="absolute right-0 top-0 h-[38px] px-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-r-full transition-all hover:opacity-100 opacity-80"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, var(--bg-primary) 40%)',
            color: accentColor,
            paddingLeft: '28px',
          }}
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

      {/* Hint text */}
      {categories.length > 0 && (
        <p className="text-[9px] text-[var(--text-tertiary)] mt-1 px-0.5 opacity-60">
          Long-press a category for options
        </p>
      )}
    </div>
  );
}
