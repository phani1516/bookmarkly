import { useState } from 'react';
import { LinkInput } from './LinkInput';
import { LinkItem } from './LinkItem';
import { addLink, addCategory, deleteCategory, moveCategory, updateCategory } from '@/lib/store';
import { PlusIcon, GlobeIcon, TrashIcon, ArrowLeftSmIcon, ArrowRightSmIcon, ColorPaletteIcon } from './Icons';
import type { Link, Category } from '@/lib/types';

const PRESET_COLORS = ['#6C5CE7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4', '#F97316', '#6B7280'];

interface Props { links: Link[]; categories: Category[]; }

export function WebTab({ links, categories }: Props) {
  const [newCat, setNewCat] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [newCatColor, setNewCatColor] = useState('');
  const [editingColor, setEditingColor] = useState<string | null>(null);

  const webCats = categories.filter(c => c.type === 'Web').sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const webLinks = links.filter(l => l.type === 'Web');

  const handleSave = async (url: string, categoryId: string | null) => {
    await addLink(url, 'Web', 'None', categoryId);
  };

  const handleAddCategory = async () => {
    if (!newCat.trim()) return;
    await addCategory(newCat.trim(), 'Web', 'None', newCatColor || undefined);
    setNewCat(''); setShowNewCat(false); setNewCatColor('');
  };

  const displayLinks = selectedCat ? webLinks.filter(l => l.category_id === selectedCat) : webLinks;
  const sortedLinks = [...displayLinks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const getBreadcrumb = (link: Link) => {
    const cat = categories.find(c => c.id === link.category_id);
    if (!cat) return { text: 'Web', color: '#3B82F6' };
    return { text: `Web › ${cat.name}`, color: cat.color || '#3B82F6' };
  };

  return (
    <div className="space-y-7">
      <div className="card p-5 animate-slide-up">
        <p className="section-title mb-4">Save Web Link</p>
        <LinkInput categories={webCats} onSave={handleSave} />
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="section-title">Categories</p>
          <button onClick={() => setShowNewCat(!showNewCat)} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:opacity-80 transition">
            <PlusIcon size={13} /> New
          </button>
        </div>

        {showNewCat && (
          <div className="card-sm p-4 mb-3 space-y-3 animate-scale-in">
            <div className="flex gap-2">
              <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Category name" className="input-field flex-1"
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
              <button onClick={handleAddCategory} className="btn-primary text-sm py-3 px-5">Add</button>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 flex items-center gap-1">
                <ColorPaletteIcon size={11} /> Color (optional)
              </p>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setNewCatColor(newCatColor === c ? '' : c)}
                    className="w-6 h-6 rounded-full transition-all border-2"
                    style={{ backgroundColor: c, borderColor: newCatColor === c ? 'var(--text-primary)' : 'transparent', transform: newCatColor === c ? 'scale(1.2)' : 'scale(1)' }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Swipeable categories */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setSelectedCat(null)}
            className={`pill shrink-0 ${!selectedCat ? 'pill-active' : 'pill-inactive'}`}>
            All ({webLinks.length})
          </button>
          {webCats.map(c => {
            const count = webLinks.filter(l => l.category_id === c.id).length;
            const isActive = selectedCat === c.id;
            return (
              <div key={c.id} className="relative group/pill shrink-0 flex items-center gap-0.5">
                <button onClick={() => moveCategory(c.id, 'left', 'Web', 'None')}
                  className="p-0.5 rounded opacity-0 group-hover/pill:opacity-60 hover:!opacity-100 text-[var(--text-tertiary)] transition-all">
                  <ArrowLeftSmIcon size={10} />
                </button>
                <button onClick={() => setSelectedCat(c.id)}
                  className={`pill ${isActive ? 'pill-active' : 'pill-inactive'}`}
                  style={c.color && !isActive ? { borderColor: c.color + '40', color: c.color } : undefined}>
                  {c.color && <span className="inline-block w-2 h-2 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: c.color }} />}
                  {c.name} ({count})
                </button>
                <button onClick={() => moveCategory(c.id, 'right', 'Web', 'None')}
                  className="p-0.5 rounded opacity-0 group-hover/pill:opacity-60 hover:!opacity-100 text-[var(--text-tertiary)] transition-all">
                  <ArrowRightSmIcon size={10} />
                </button>
                {/* Hover actions */}
                <div className="absolute -top-2 -right-1 flex gap-0.5 opacity-0 group-hover/pill:opacity-100 transition-opacity z-10">
                  <button onClick={() => setEditingColor(editingColor === c.id ? null : c.id)}
                    className="w-4 h-4 rounded-full bg-[var(--surface)] border border-[var(--surface-border)] flex items-center justify-center shadow-sm">
                    <ColorPaletteIcon size={8} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteCategory(c.id); if (selectedCat === c.id) setSelectedCat(null); }}
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
      </div>

      <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {sortedLinks.length === 0 && (
          <div className="card p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl gradient-accent-subtle flex items-center justify-center mb-4">
              <GlobeIcon size={24} className="text-[var(--accent)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">No web links yet</p>
          </div>
        )}
        {sortedLinks.map(link => {
          const bc = getBreadcrumb(link);
          return (
            <LinkItem key={link.id} link={link} categories={categories}
              breadcrumb={bc.text} breadcrumbColor={bc.color}
              allLinksInList={sortedLinks} showMoveButtons={true} />
          );
        })}
      </div>
    </div>
  );
}
