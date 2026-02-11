import { useState, useRef } from 'react';
import { LinkInput } from './LinkInput';
import { LinkItem } from './LinkItem';
import { addLink, addCategory, deleteCategory, moveCategory, updateCategory, uploadFileToStorage } from '@/lib/store';
import { PlusIcon, FileIcon, UploadIcon, TrashIcon, ArrowLeftSmIcon, ArrowRightSmIcon, ColorPaletteIcon } from './Icons';
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
  const [editingColor, setEditingColor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const docCats = categories.filter(c => c.type === 'Document').sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const docLinks = links.filter(l => l.type === 'Document');

  const handleSave = async (url: string, categoryId: string | null) => {
    await addLink(url, 'Document', 'None', categoryId);
  };

  const processFile = async (file: File) => {
    // 500KB limit
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
  const sortedLinks = [...displayLinks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

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

        <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setSelectedCat(null)}
            className={`pill shrink-0 ${!selectedCat ? 'pill-active' : 'pill-inactive'}`}>
            All ({docLinks.length})
          </button>
          {docCats.map(c => {
            const count = docLinks.filter(l => l.category_id === c.id).length;
            const isActive = selectedCat === c.id;
            return (
              <div key={c.id} className="relative group/pill shrink-0 flex items-center gap-0.5">
                <button onClick={() => moveCategory(c.id, 'left', 'Document', 'None')}
                  className="p-0.5 rounded opacity-0 group-hover/pill:opacity-60 hover:!opacity-100 text-[var(--text-tertiary)] transition-all">
                  <ArrowLeftSmIcon size={10} />
                </button>
                <button onClick={() => setSelectedCat(c.id)}
                  className={`pill ${isActive ? 'pill-active' : 'pill-inactive'}`}
                  style={c.color && !isActive ? { borderColor: c.color + '40', color: c.color } : undefined}>
                  {c.color && <span className="inline-block w-2 h-2 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: c.color }} />}
                  {c.name} ({count})
                </button>
                <button onClick={() => moveCategory(c.id, 'right', 'Document', 'None')}
                  className="p-0.5 rounded opacity-0 group-hover/pill:opacity-60 hover:!opacity-100 text-[var(--text-tertiary)] transition-all">
                  <ArrowRightSmIcon size={10} />
                </button>
                <div className="absolute -top-2 -right-1 flex gap-0.5 opacity-0 group-hover/pill:opacity-100 transition-opacity z-10">
                  <button onClick={() => setEditingColor(editingColor === c.id ? null : c.id)}
                    className="w-4 h-4 rounded-full bg-[var(--surface)] border border-[var(--surface-border)] flex items-center justify-center shadow-sm">
                    <ColorPaletteIcon size={8} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteCategory(c.id); if (selectedCat === c.id) setSelectedCat(null); }}
                    className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm">
                    <TrashIcon size={7} />
                  </button>
                </div>
                {editingColor === c.id && (
                  <div className="absolute top-full left-0 mt-2 p-2 card-sm flex gap-1.5 flex-wrap z-20 w-[180px] animate-scale-in">
                    {PRESET_COLORS.map(cl => (
                      <button key={cl} onClick={() => { updateCategory(c.id, { color: cl }); setEditingColor(null); }}
                        className="w-5 h-5 rounded-full border-2 transition-all hover:scale-110"
                        style={{ backgroundColor: cl, borderColor: c.color === cl ? 'var(--text-primary)' : 'transparent' }} />
                    ))}
                    <button onClick={() => { updateCategory(c.id, { color: undefined }); setEditingColor(null); }}
                      className="text-[9px] font-semibold text-[var(--text-tertiary)] px-1.5 py-0.5 rounded border border-[var(--surface-border)] hover:bg-[var(--surface-hover)]">
                      Reset
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        {sortedLinks.length === 0 && (
          <div className="card p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl gradient-accent-subtle flex items-center justify-center mb-4">
              <FileIcon size={24} className="text-[var(--accent)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">No documents yet</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Upload a file or paste a link above</p>
          </div>
        )}
        {sortedLinks.map(link => {
          const bc = getBreadcrumb(link);
          return (
            <LinkItem key={link.id} link={link} categories={categories}
              breadcrumb={bc.text} breadcrumbColor={bc.color}
              allLinksInList={sortedLinks} showMoveButtons={true} />
          );
        })}
      </div>
    </div>
  );
}
