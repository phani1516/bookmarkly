import { useState } from 'react';
import { LinkInput } from './LinkInput';
import { LinkItem } from './LinkItem';
import { addLink, addCategory, deleteCategory } from '@/lib/store';
import { PlusIcon, GlobeIcon, TrashIcon } from './Icons';
import type { Link, Category } from '@/lib/types';

interface Props {
  links: Link[];
  categories: Category[];
}

export function WebTab({ links, categories }: Props) {
  const [newCat, setNewCat] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const webCats = categories.filter(c => c.type === 'Web');
  const webLinks = links.filter(l => l.type === 'Web');

  const handleSave = async (url: string, categoryId: string | null) => {
    await addLink(url, 'Web', 'None', categoryId);
  };

  const handleAddCategory = async () => {
    if (!newCat.trim()) return;
    await addCategory(newCat.trim(), 'Web', 'None');
    setNewCat('');
    setShowNewCat(false);
  };

  const displayLinks = selectedCat ? webLinks.filter(l => l.category_id === selectedCat) : webLinks;

  return (
    <div className="space-y-7">
      <div className="card p-5 animate-slide-up">
        <p className="section-title mb-4">Save Web Link</p>
        <LinkInput categories={webCats} onSave={handleSave} type="Web" />
      </div>

      {/* Categories */}
      <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
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
            All ({webLinks.length})
          </button>
          {webCats.map(c => {
            const count = webLinks.filter(l => l.category_id === c.id).length;
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

      {/* Links */}
      <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {displayLinks.length === 0 && (
          <div className="card p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl gradient-accent-subtle flex items-center justify-center mb-4">
              <GlobeIcon size={24} className="text-[var(--accent)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">No web links yet</p>
          </div>
        )}
        {displayLinks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(link => (
          <LinkItem key={link.id} link={link} categories={categories} categoryName={categories.find(c => c.id === link.category_id)?.name} />
        ))}
      </div>
    </div>
  );
}
