import { useState } from 'react';
import type { Link, Category } from '@/lib/types';
import { updateLink, deleteLink } from '@/lib/store';
import { EditIcon, TrashIcon, LinkExternalIcon, ChevronLeftIcon, NotepadIcon } from './Icons';

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
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isLocalFile = link.url.startsWith('local-file://') || link.url.startsWith('data:');
  const displayText = link.name || link.file_name || (isLocalFile ? link.url.replace('local-file://', '') : link.url);
  const truncated = displayText.length > 55 ? displayText.slice(0, 55) + '…' : displayText;

  const handleSave = async () => {
    await updateLink(link.id, { name, url, category_id: catId || null, notes });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    await deleteLink(link.id);
  };

  const relevantCats = categories.filter(c => c.type === link.type && (link.type !== 'Video' || c.subtype === link.subtype));

  if (editing) {
    return (
      <div className="card-sm p-4 space-y-3 animate-scale-in">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => setEditing(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">
            <ChevronLeftIcon size={16} />
          </button>
          <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Edit Link</span>
        </div>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Display name" className="input-field" />
        {!isLocalFile && (
          <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="URL" className="input-field" />
        )}
        <select value={catId} onChange={e => setCatId(e.target.value)} className="input-field cursor-pointer">
          <option value="">No category</option>
          {relevantCats.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <div>
          <button onClick={() => setShowNotes(!showNotes)} className="flex items-center gap-1.5 text-xs text-[var(--accent)] font-medium mb-2 hover:opacity-80 transition">
            <NotepadIcon size={13} />
            {showNotes ? 'Hide notes' : 'Add notes'}
          </button>
          {showNotes && (
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes about this link…" rows={3} className="input-field resize-none" />
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={handleSave} className="btn-primary text-sm py-3 flex-1">Save Changes</button>
          <button onClick={() => setEditing(false)} className="btn-secondary text-sm py-3 px-5">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-sm p-3.5 animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {isLocalFile ? (
            <span className="text-sm font-medium text-[var(--text-primary)] break-all leading-snug line-clamp-2">
              📄 {truncated}
            </span>
          ) : (
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition break-all leading-snug">
              <span className="line-clamp-2">{truncated}</span>
              <LinkExternalIcon size={11} className="flex-shrink-0 opacity-40" />
            </a>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-medium text-[var(--text-tertiary)]">
              {new Date(link.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            {categoryName && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full gradient-accent-subtle text-[var(--accent)]">
                {categoryName}
              </span>
            )}
            {link.notes && <NotepadIcon size={11} className="text-[var(--text-tertiary)]" />}
          </div>
        </div>
        <div className="flex gap-0.5">
          <button onClick={() => setEditing(true)} className="p-2 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition">
            <EditIcon size={14} />
          </button>
          <button onClick={handleDelete}
            className={`p-2 rounded-xl transition ${
              confirmDelete
                ? 'bg-red-500/15 text-red-500'
                : 'hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-500'
            }`}
            title={confirmDelete ? 'Click again to confirm' : 'Delete'}
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
