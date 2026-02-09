import { useState } from 'react';
import { ClipboardIcon, SaveIcon } from './Icons';
import type { Category, LinkType } from '@/lib/types';

interface Props {
  categories: Category[];
  onSave: (url: string, categoryId: string | null) => void;
  type: LinkType;
  placeholder?: string;
}

export function LinkInput({ categories, onSave, placeholder = 'Paste or type a URL...' }: Props) {
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [pasted, setPasted] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setPasted(true);
      setTimeout(() => setPasted(false), 1500);
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
        <div className="flex-1 relative">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder={placeholder}
            className="input-field pr-4"
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>
        <button
          onClick={handlePaste}
          className={`flex items-center justify-center w-[52px] rounded-[14px] border-[1.5px] transition-all duration-200 ${
            pasted
              ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
              : 'bg-[var(--surface)] border-[var(--surface-border)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]'
          }`}
          title="Paste from clipboard"
        >
          <ClipboardIcon size={18} />
        </button>
      </div>
      <div className="flex gap-2">
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="input-field flex-1 cursor-pointer appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
        >
          <option value="">No category</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button onClick={handleSave} className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <SaveIcon size={15} />
          <span>Save</span>
        </button>
      </div>
    </div>
  );
}
