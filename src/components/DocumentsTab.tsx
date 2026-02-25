import { useState, useRef } from 'react';
import { LinkInput } from './LinkInput';
import { DraggableLinkList } from './DraggableLinkList';
import { DraggableCategories } from './DraggableCategories';
import { addLink, addCategory, uploadFileToStorage } from '@/lib/store';
import { PlusIcon, FileIcon, UploadIcon, ColorPaletteIcon } from './Icons';
import type { Link, Category } from '@/lib/types';

const PRESET_COLORS = ['#6C5CE7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4', '#F97316', '#6B7280'];

interface Props { links: Link[]; categories: Category[]; }

export function DocumentsTab({ links, categories }: Props) {
  const [newCat, setNewCat] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [newCatColor, setNewCatColor] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const docCats = categories.filter(c => c.type === 'Document').sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const docLinks = links.filter(l => l.type === 'Document');

  const handleSave = async (url: string, categoryId: string | null) => {
    await addLink(url, 'Document', 'None', categoryId);
  };

  const processFile = async (file: File) => {
    const MAX_KB = 500;
    if (file.size > MAX_KB * 1024) {
      setUploadStatus(`✗ File must be under ${MAX_KB}KB. This file is ${Math.round(file.size / 1024)}KB.`);
      setTimeout(() => setUploadStatus(''), 5000);
      return;
    }

    setUploading(true);
    setUploadStatus(`Uploading ${file.name}…`);

    try {
      const cloudResult = await uploadFileToStorage(file);
      if (cloudResult) {
        await addLink(cloudResult.url, 'Document', 'None', null, file.name, file.name, undefined, cloudResult.url);
        setUploadStatus(`✓ Uploaded "${file.name}" to cloud`);
      } else {
        const placeholderUrl = `local-file://${file.name}`;
        await addLink(placeholderUrl, 'Document', 'None', null, file.name, file.name);
        setUploadStatus(`✓ Saved "${file.name}" locally (sign in to upload to cloud)`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setUploadStatus(`✗ ${msg}`);
    }

    setUploading(false);
    setTimeout(() => setUploadStatus(''), 5000);
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
    await addCategory(newCat.trim(), 'Document', 'None', newCatColor || undefined);
    setNewCat(''); setShowNewCat(false); setNewCatColor('');
  };

  const displayLinks = selectedCat ? docLinks.filter(l => l.category_id === selectedCat) : docLinks;

  const linkCountByCategory: Record<string, number> = {};
  docCats.forEach(c => { linkCountByCategory[c.id] = docLinks.filter(l => l.category_id === c.id).length; });

  const getBreadcrumb = (link: Link) => {
    const cat = categories.find(c => c.id === link.category_id);
    if (!cat) return { text: 'Documents', color: '#10B981' };
    return { text: `Docs › ${cat.name}`, color: cat.color || '#10B981' };
  };

  return (
    <div className="space-y-7">
      <div className="card p-5 animate-slide-up">
        <p className="section-title mb-4">Upload Document</p>
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative py-8 rounded-[16px] border-2 border-dashed transition-all duration-200 flex flex-col items-center gap-3 cursor-pointer ${
            isDragging ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--surface-border)] hover:border-[var(--accent)]/50'
          }`}>
          <div className="w-12 h-12 rounded-[14px] gradient-accent-subtle flex items-center justify-center">
            <UploadIcon size={22} className="text-[var(--accent)]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              {uploading ? 'Uploading…' : 'Tap to upload or drag & drop'}
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Max file size: 500KB · PDF, DOC, images, etc.</p>
          </div>
        </div>

        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-50">
          <UploadIcon size={16} className="text-white" />
          {uploading ? 'Uploading…' : 'Upload File'}
        </button>

        <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.png,.jpg,.jpeg,.gif,.webp,.svg,.zip,.rar" />

        {uploadStatus && (
          <p className={`text-xs font-medium mt-3 text-center ${
            uploadStatus.includes('✓') ? 'text-green-500' : uploadStatus.includes('✗') ? 'text-red-500' : 'text-[var(--accent)]'
          }`}>{uploadStatus}</p>
        )}
      </div>

      <div className="card p-5 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <p className="section-title mb-4">Or Save Document Link</p>
        <LinkInput categories={docCats} onSave={handleSave} placeholder="Paste document URL…" />
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
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
            categories={docCats}
            allLinkCount={docLinks.length}
            linkCountByCategory={linkCountByCategory}
            selectedCat={selectedCat}
            onSelectCat={setSelectedCat}
            type="Document"
            subtype="None"
            activeColor="#10B981"
          />
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
        {displayLinks.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl gradient-accent-subtle flex items-center justify-center mb-4">
              <FileIcon size={24} className="text-[var(--accent)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">No documents yet</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Upload a file or paste a link above</p>
          </div>
        ) : (
          <DraggableLinkList links={displayLinks} categories={categories} getBreadcrumb={getBreadcrumb} />
        )}
      </div>
    </div>
  );
}
