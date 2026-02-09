import { useState } from 'react';
import { LinkInput } from './LinkInput';
import { LinkItem } from './LinkItem';
import { addLink, addCategory } from '@/lib/store';
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

  const displayLinks = selectedCat
    ? webLinks.filter(l => l.category_id === selectedCat)
    : webLinks;

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 shadow-lg">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Save Web Link</h3>
        <LinkInput categories={webCats} onSave={handleSave} type="Web" />
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categories</h3>
          <button onClick={() => setShowNewCat(!showNewCat)} className="text-xs text-blue-500 dark:text-blue-400 font-medium">+ New</button>
        </div>

        {showNewCat && (
          <div className="flex gap-2 mb-3">
            <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Category name" className="flex-1 px-3 py-2 rounded-xl bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
            <button onClick={handleAddCategory} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition">Add</button>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedCat(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${!selectedCat ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15'}`}
          >
            All ({webLinks.length})
          </button>
          {webCats.map(c => {
            const count = webLinks.filter(l => l.category_id === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${selectedCat === c.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15'}`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Links */}
      <div className="space-y-2">
        {displayLinks.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No web links yet</p>
        )}
        {displayLinks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(link => (
          <LinkItem key={link.id} link={link} categories={categories} categoryName={categories.find(c => c.id === link.category_id)?.name} />
        ))}
      </div>
    </div>
  );
}
