import { useState, useRef } from 'react';
import { LinkInput } from './LinkInput';
import { LinkItem } from './LinkItem';
import { addLink, addCategory, deleteCategory } from '@/lib/store';
import { PlusIcon, FileIcon, UploadIcon, TrashIcon } from './Icons';
import type { Link, Category } from '@/lib/types';

interface Props {
  links: Link[];
  categories: Category[];
}

export function DocumentsTab({ links, categories }: Props) {
  const [newCat, setNewCat] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const docCats = categories.filter(c => c.type === 'Document');
  const docLinks = links.filter(l => l.type === 'Document');

  const handleSave = async (url: string, categoryId: string | null) => {
    await addLink(url, 'Document', 'None', categoryId);
  };

  const processFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await addLink(dataUrl, 'Document', 'None', null, file.name, file.name, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const handleAddCategory = async () => {
    if (!newCat.trim()) return;
    await addCategory(newCat.trim(), 'Document', 'None');
    setNewCat('');
    setShowNewCat(false);
  };

  const displayLinks = selectedCat ? docLinks.filter(l => l.category_id === selectedCat) : docLinks;

  return (
    <div className="space-y-7">
      {/* File upload */}
      <div className="card p-5 animate-slide-up">
        <p className="section-title mb-4">Upload Document</p>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative py-10 rounded-[16px] border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center gap-3 ${
            isDragging
              ? 'border-[var(--accent)] bg-[var(--accent)]/5'
              : 'border-[var(--surface-border)] hover:border-[var(--accent)] hover:bg-[var(--surface)]'
          }`}
        >
          <div className="w-12 h-12 rounded-[14px] gradient-accent-subtle flex items-center justify-center">
            <UploadIcon size={22} className="text-[var(--accent)]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--text-secondary)]">Tap to upload or drag & drop</p>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">PDF, DOC, XLS, and more</p>
          </div>
        </div>
        <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
      </div>

      {/* URL input */}
      <div className="card p-5 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <p className="section-title mb-4">Or Save Document Link</p>
        <LinkInput categories={docCats} onSave={handleSave} type="Document" placeholder="Paste document URL…" />
      </div>

      {/* Categories */}
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
            All ({docLinks.length})
          </button>
          {docCats.map(c => {
            const count = docLinks.filter(l => l.category_id === c.id).length;
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
      <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        {displayLinks.length === 0 && (
          <div className="card p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl gradient-accent-subtle flex items-center justify-center mb-4">
              <FileIcon size={24} className="text-[var(--accent)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">No documents yet</p>
          </div>
        )}
        {displayLinks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(link => (
          <LinkItem key={link.id} link={link} categories={categories} categoryName={categories.find(c => c.id === link.category_id)?.name} />
        ))}
      </div>
    </div>
  );
}
