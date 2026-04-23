import { useState } from 'react';
import { LinkInput } from './LinkInput';
import { DraggableLinkList } from './DraggableLinkList';
import { DraggableCategories } from './DraggableCategories';
import { addLink, addCategory } from '@/lib/store';
import { PlusIcon, ColorPaletteIcon, YouTubeIcon, InstagramIcon, AIIcon, OtherIcon } from './Icons';
import type { Link, Category, VideoSubtab } from '@/lib/types';

const PRESET_COLORS = ['#6C5CE7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4', '#F97316', '#6B7280'];

const subtabs: { id: VideoSubtab; label: string; color: string; Icon: React.FC<{size?: number}> }[] = [
  { id: 'YouTube', label: 'YouTube', color: '#FF0000', Icon: YouTubeIcon },
  { id: 'Instagram', label: 'Instagram', color: '#E1306C', Icon: InstagramIcon },
  { id: 'AI', label: 'AI', color: '#8B5CF6', Icon: AIIcon },
  { id: 'Other', label: 'Other', color: '#6B7280', Icon: OtherIcon },
];

interface Props { links: Link[]; categories: Category[]; }

export function VideosTab({ links, categories }: Props) {
  const [activeSubtab, setActiveSubtab] = useState<VideoSubtab>('YouTube');
  const [newCat, setNewCat] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [newCatColor, setNewCatColor] = useState('');

  const currentSub = subtabs.find(s => s.id === activeSubtab)!;
  const filteredCats = categories.filter(c => c.type === 'Video' && c.subtype === activeSubtab)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const filteredLinks = links.filter(l => l.type === 'Video' && l.subtype === activeSubtab);

  const handleSave = async (url: string, categoryId: string | null) => {
    await addLink(url, 'Video', activeSubtab, categoryId);
  };

  const handleAddCategory = async () => {
    if (!newCat.trim()) return;
    await addCategory(newCat.trim(), 'Video', activeSubtab, newCatColor || undefined);
    setNewCat(''); setShowNewCat(false); setNewCatColor('');
  };

  const displayLinks = selectedCat ? filteredLinks.filter(l => l.category_id === selectedCat) : filteredLinks;

  const linkCountByCategory: Record<string, number> = {};
  filteredCats.forEach(c => { linkCountByCategory[c.id] = filteredLinks.filter(l => l.category_id === c.id).length; });

  const getBreadcrumb = (link: Link) => {
    const cat = categories.find(c => c.id === link.category_id);
    if (!cat) return { text: activeSubtab, color: currentSub.color };
    return { text: `${activeSubtab} › ${cat.name}`, color: cat.color || currentSub.color };
  };

  return (
    <div className="space-y-7">
      {/* Sub-tabs with brand icons */}
      <div className="p-1 rounded-[16px] bg-[var(--surface)] border border-[var(--surface-border)] flex gap-1 animate-slide-up">
        {subtabs.map(st => (
          <button key={st.id} onClick={() => { setActiveSubtab(st.id); setSelectedCat(null); }}
            className={`flex-1 py-2.5 rounded-[12px] text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeSubtab === st.id
                ? 'text-white shadow-md'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
            style={activeSubtab === st.id ? { backgroundColor: st.color } : undefined}>
            <st.Icon size={14} />
            <span className="hidden sm:inline">{st.label}</span>
          </button>
        ))}
      </div>

      <div className="card p-5 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <p className="section-title mb-4 flex items-center gap-2">
          <currentSub.Icon size={14} />
          Save {activeSubtab} Link
        </p>
        <LinkInput categories={filteredCats} onSave={handleSave} placeholder={`Paste ${activeSubtab} URL…`} />
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="section-title">Categories</p>
          <button onClick={() => setShowNewCat(!showNewCat)} className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-80 transition"
            style={{ color: currentSub.color }}>
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
            categories={filteredCats}
            allLinkCount={filteredLinks.length}
            linkCountByCategory={linkCountByCategory}
            selectedCat={selectedCat}
            onSelectCat={setSelectedCat}
            type="Video"
            subtype={activeSubtab}
            activeColor={currentSub.color}
          />
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
        {displayLinks.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: currentSub.color + '15' }}>
              <currentSub.Icon size={24} />
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">No {activeSubtab} links yet</p>
          </div>
        ) : (
          <DraggableLinkList links={displayLinks} categories={categories} getBreadcrumb={getBreadcrumb} />
        )}
      </div>
    </div>
  );
}
