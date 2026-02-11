import { useState, useEffect, useRef, useCallback } from 'react';
import { addNote, updateNote, deleteNote } from '@/lib/store';
import { PlusIcon, ChevronLeftIcon, TrashIcon, NoteIcon } from './Icons';
import type { Note } from '@/lib/types';

interface Props {
  notes: Note[];
}

export function NotesTab({ notes }: Props) {
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNewNote = async () => {
    if (!newTitle.trim()) return;
    const note = await addNote(newTitle.trim());
    setNewTitle('');
    setShowNew(false);
    setEditingNote(note);
    setTitle(note.title);
    setBody(note.body);
  };

  const handleSelectNote = (note: Note) => {
    if (editingNote) {
      updateNote(editingNote.id, { title, body });
    }
    setEditingNote(note);
    setTitle(note.title);
    setBody(note.body);
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    if (editingNote?.id === id) {
      setEditingNote(null);
      setTitle('');
      setBody('');
    }
  };

  const doAutosave = useCallback(() => {
    if (editingNote) {
      updateNote(editingNote.id, { title, body });
    }
  }, [editingNote, title, body]);

  useEffect(() => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(doAutosave, 1000);
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
    };
  }, [title, body, doAutosave]);

  const applyFormat = (tag: string) => {
    const textarea = document.getElementById('note-body') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.slice(start, end);

    let wrapped = '';
    switch (tag) {
      case 'bold': wrapped = `**${selected}**`; break;
      case 'italic': wrapped = `_${selected}_`; break;
      case 'underline': wrapped = `__${selected}__`; break;
      case 'strike': wrapped = `~~${selected}~~`; break;
      case 'bullet': wrapped = `\n• ${selected}`; break;
      case 'number': wrapped = `\n1. ${selected}`; break;
      default: wrapped = selected;
    }

    const newBody = body.slice(0, start) + wrapped + body.slice(end);
    setBody(newBody);
  };

  const sortedNotes = [...notes].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  if (editingNote) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <button onClick={() => { doAutosave(); setEditingNote(null); }}
            className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
            <ChevronLeftIcon size={16} />
            Back
          </button>
          <span className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Auto-saving
          </span>
        </div>

        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title"
          className="input-field text-lg font-semibold" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }} />

        {/* Formatting toolbar */}
        <div className="flex gap-1.5 flex-wrap p-1.5 rounded-[14px] bg-[var(--surface)] border border-[var(--surface-border)]">
          {[
            { tag: 'bold', label: 'B', extra: 'font-bold' },
            { tag: 'italic', label: 'I', extra: 'italic' },
            { tag: 'underline', label: 'U', extra: 'underline' },
            { tag: 'strike', label: 'S', extra: 'line-through' },
            { tag: 'bullet', label: '•', extra: 'text-base' },
            { tag: 'number', label: '1.', extra: '' },
          ].map(f => (
            <button key={f.tag} onClick={() => applyFormat(f.tag)}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition ${f.extra}`}>
              {f.label}
            </button>
          ))}
        </div>

        <textarea id="note-body" value={body} onChange={e => setBody(e.target.value)}
          placeholder="Start writing…" rows={16}
          className="input-field resize-none leading-relaxed" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1 animate-slide-up">
        <p className="section-title">Notes</p>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:opacity-80 transition">
          <PlusIcon size={13} />
          New Note
        </button>
      </div>

      {showNew && (
        <div className="flex gap-2 animate-scale-in">
          <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Note title" className="input-field flex-1"
            onKeyDown={e => e.key === 'Enter' && handleNewNote()} />
          <button onClick={handleNewNote} className="btn-primary text-sm py-3 px-5">Create</button>
        </div>
      )}

      <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        {sortedNotes.length === 0 && (
          <div className="card p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl gradient-accent-subtle flex items-center justify-center mb-4">
              <NoteIcon size={24} className="text-[var(--accent)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">No notes yet</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Create your first note above</p>
          </div>
        )}
        {sortedNotes.map(note => (
          <div key={note.id} className="group card-sm p-4 cursor-pointer" onClick={() => handleSelectNote(note)}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
                  {note.title}
                </h4>
                <p className="text-xs text-[var(--text-tertiary)] mt-1.5 line-clamp-2 leading-relaxed">{note.body || 'Empty note'}</p>
                <p className="text-[10px] font-medium text-[var(--text-tertiary)] mt-2">
                  {new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button onClick={e => { e.stopPropagation(); handleDeleteNote(note.id); }}
                className="p-2 rounded-xl hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <TrashIcon size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
