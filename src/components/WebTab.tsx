import { useState } from 'react';
import { LinkInput } from './LinkInput';
import { DraggableLinkList } from './DraggableLinkList';
import { DraggableCategories } from './DraggableCategories';
import { addLink, addCategory } from '@/lib/store';
import { PlusIcon, GlobeIcon, ColorPaletteIcon } from './Icons';
import type { Link, Category } from '@/lib/types';

const PRESET_COLORS = ['#6C5CE7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4', '#F97316', '#6B7280'];

interface Props { links: Link[]; categories: Category[]; }

export function WebTab({ links, categories }: Props) {
  const [newCat, setNewCat] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [newCatColor, setNewCatColor] = useState('');

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

  const linkCountByCategory: Record<string, number> = {};
  webCats.forEach(c => { linkCountByCategory[c.id] = webLinks.filter(l => l.category_id === c.id).length; });

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

        <div className="mb-5">
          <DraggableCategories
            categories={webCats}
            allLinkCount={webLinks.length}
            linkCountByCategory={linkCountByCategory}
            selectedCat={selectedCat}
            onSelectCat={setSelectedCat}
            type="Web"
            subtype="None"
          />
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {displayLinks.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl gradient-accent-subtle flex items-center justify-center mb-4">
              <GlobeIcon size={24} className="text-[var(--accent)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">No web links yet</p>
          </div>
        ) : (
          <DraggableLinkList links={displayLinks} categories={categories} getBreadcrumb={getBreadcrumb} />
        )}
      </div>
    </div>
  );
}
