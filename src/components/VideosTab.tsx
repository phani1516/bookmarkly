import { useState } from 'react';
import { LinkInput } from './LinkInput';
import { LinkItem } from './LinkItem';
import { addLink, addCategory, deleteCategory } from '@/lib/store';
import { PlusIcon, PlayIcon, TrashIcon } from './Icons';
import type { Link, Category, VideoSubtab } from '@/lib/types';

interface Props {
  links: Link[];
  categories: Category[];
}

const subtabs: { id: VideoSubtab; label: string }[] = [
  { id: 'YouTube', label: 'YouTube' },
  { id: 'Instagram', label: 'Instagram' },
  { id: 'AI', label: 'AI' },
  { id: 'Other', label: 'Other' },
];

export function VideosTab({ links, categories }: Props) {
  const [activeSubtab, setActiveSubtab] = useState<VideoSubtab>('YouTube');
  const [newCat, setNewCat] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const filteredCats = categories.filter(c => c.type === 'Video' && c.subtype === activeSubtab);
  const filteredLinks = links.filter(l => l.type === 'Video' && l.subtype === activeSubtab);

  const handleSave = async (url: string, categoryId: string | null) => {
    await addLink(url, 'Video', activeSubtab, categoryId);
  };

  const handleAddCategory = async () => {
    if (!newCat.trim()) return;
    await addCategory(newCat.trim(), 'Video', activeSubtab);
    setNewCat('');
    setShowNewCat(false);
  };

  const displayLinks = selectedCat ? filteredLinks.filter(l => l.category_id === selectedCat) : filteredLinks;

  return (
    <div className="space-y-7">
      <div className="p-1 rounded-[16px] bg-[var(--surface)] border border-[var(--surface-border)] flex gap-1 animate-slide-up">
        {subtabs.map(st => (
          <button key={st.id} onClick={() => { setActiveSubtab(st.id); setSelectedCat(null); }}
            className={`flex-1 py-2.5 rounded-[12px] text-xs font-semibold transition-all duration-200 ${
              activeSubtab === st.id
                ? 'gradient-accent text-white shadow-md'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}>
            {st.label}
          </button>
        ))}
      </div>

      <div className="card p-5 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <p className="section-title mb-4">Save {activeSubtab} Link</p>
        <LinkInput categories={filteredCats} onSave={handleSave} placeholder={`Paste ${activeSubtab} URL…`} />
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="section-title">Categories</p>
          <button onClick={() => setShowNewCat(!showNewCat)} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:opacity-80 transition">
            <PlusIcon size={13} />
            New
          </button>
        </div>

        {showNewCat && (
          <div className="flex gap-2 mb-3 animate-scale-in">
            <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Category name" className="input-field flex-1"
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
            <button onClick={handleAddCategory} className="btn-primary text-sm py-3 px-5">Add</button>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-5">
          <button onClick={() => setSelectedCat(null)}
            className={`pill ${!selectedCat ? 'pill-active' : 'pill-inactive'}`}>
            All ({filteredLinks.length})
          </button>
          {filteredCats.map(c => {
            const count = filteredLinks.filter(l => l.category_id === c.id).length;
            return (
              <div key={c.id} className="relative group/pill">
                <button onClick={() => setSelectedCat(c.id)}
                  className={`pill ${selectedCat === c.id ? 'pill-active' : 'pill-inactive'}`}>
                  {c.name} ({count})
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteCategory(c.id); if (selectedCat === c.id) setSelectedCat(null); }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/pill:opacity-100 transition-opacity shadow-md">
                  <TrashIcon size={9} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        {displayLinks.length === 0 && (
          <div className="card p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl gradient-accent-subtle flex items-center justify-center mb-4">
              <PlayIcon size={24} className="text-[var(--accent)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">No {activeSubtab} links yet</p>
          </div>
        )}
        {displayLinks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(link => (
          <LinkItem key={link.id} link={link} categories={categories} categoryName={categories.find(c => c.id === link.category_id)?.name} />
        ))}
      </div>
    </div>
  );
}
