import { useState } from 'react';
import type { Link, Category } from '@/lib/types';
import { updateLink, deleteLink } from '@/lib/store';

interface Props {
  link: Link;
  categories: Category[];
  categoryName?: string;
}

export function LinkItem({ link, categories, categoryName }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(link.name || '');
  const [url, setUrl] = useState(link.url);
  const [catId, setCatId] = useState(link.category_id || '');
  const [notes, setNotes] = useState(link.notes || '');
  const [showNotes, setShowNotes] = useState(false);

  const displayText = link.name || link.url;
  const truncated = displayText.length > 60 ? displayText.slice(0, 60) + '...' : displayText;

  const handleSave = async () => {
    await updateLink(link.id, { name, url, category_id: catId || null, notes });
    setEditing(false);
  };

  const handleDelete = async () => {
    await deleteLink(link.id);
  };

  const relevantCats = categories.filter(c => c.type === link.type && (link.type !== 'Video' || c.subtype === link.subtype));

  if (editing) {
    return (
      <div className="p-4 rounded-xl bg-white/70 dark:bg-white/10 backdrop-blur border border-gray-200 dark:border-white/15 space-y-3">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Display name"
          className="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="URL"
          className="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={catId}
          onChange={e => setCatId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">No category</option>
          {relevantCats.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div>
          <button onClick={() => setShowNotes(!showNotes)} className="text-xs text-blue-500 dark:text-blue-400 mb-1">
            {showNotes ? '▾ Hide notes' : '▸ Add notes'}
          </button>
          {showNotes && (
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes about this link..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition">Save</button>
          <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="group p-3 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur border border-gray-100 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/10 transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all">
            {truncated}
          </a>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(link.created_at).toLocaleDateString()}</span>
            {categoryName && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{categoryName}</span>
            )}
            {link.notes && <span className="text-xs text-gray-400">📝</span>}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs">✏️</button>
          <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 text-xs">🗑️</button>
        </div>
      </div>
    </div>
  );
}
