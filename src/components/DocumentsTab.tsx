import { useState, useRef } from 'react';
import { LinkInput } from './LinkInput';
import { LinkItem } from './LinkItem';
import { addLink, addCategory } from '@/lib/store';
import type { Link, Category } from '@/lib/types';

interface Props {
  links: Link[];
  categories: Category[];
}

export function DocumentsTab({ links, categories }: Props) {
  const [newCat, setNewCat] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const docCats = categories.filter(c => c.type === 'Document');
  const docLinks = links.filter(l => l.type === 'Document');

  const handleSave = async (url: string, categoryId: string | null) => {
    await addLink(url, 'Document', 'None', categoryId);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Store file name and a data URL for local reference
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await addLink(dataUrl, 'Document', 'None', null, file.name, file.name, dataUrl);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddCategory = async () => {
    if (!newCat.trim()) return;
    await addCategory(newCat.trim(), 'Document', 'None');
    setNewCat('');
    setShowNewCat(false);
  };

  const displayLinks = selectedCat
    ? docLinks.filter(l => l.category_id === selectedCat)
    : docLinks;

  return (
    <div className="space-y-6">
      {/* File upload */}
      <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 shadow-lg space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Upload Document</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-8 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/20 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 transition text-sm font-medium"
        >
          📁 Tap to upload a file
        </button>
        <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
      </div>

      {/* URL input */}
      <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 shadow-lg">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Or Save Document Link</h3>
        <LinkInput categories={docCats} onSave={handleSave} type="Document" placeholder="Paste document URL..." />
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
            All ({docLinks.length})
          </button>
          {docCats.map(c => {
            const count = docLinks.filter(l => l.category_id === c.id).length;
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
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No documents yet</p>
        )}
        {displayLinks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(link => (
          <LinkItem key={link.id} link={link} categories={categories} categoryName={categories.find(c => c.id === link.category_id)?.name} />
        ))}
      </div>
    </div>
  );
}
