import { useState } from 'react';
import type { Category, LinkType } from '@/lib/types';

interface Props {
  categories: Category[];
  onSave: (url: string, categoryId: string | null) => void;
  type: LinkType;
  placeholder?: string;
}

export function LinkInput({ categories, onSave, placeholder = 'Paste or type URL...' }: Props) {
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch {
      // Clipboard API may be blocked
    }
  };

  const handleSave = () => {
    if (!url.trim()) return;
    onSave(url.trim(), categoryId || null);
    setUrl('');
    setCategoryId('');
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 rounded-xl bg-white/60 dark:bg-white/10 backdrop-blur border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <button
          onClick={handlePaste}
          className="px-4 py-3 rounded-xl bg-white/60 dark:bg-white/10 backdrop-blur border border-gray-200 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-white/20 transition text-sm font-medium"
          title="Paste from clipboard"
        >
          📋
        </button>
      </div>
      <div className="flex gap-2">
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl bg-white/60 dark:bg-white/10 backdrop-blur border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
        >
          <option value="">No category</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition shadow-lg shadow-blue-500/25"
        >
          Save
        </button>
      </div>
    </div>
  );
}
