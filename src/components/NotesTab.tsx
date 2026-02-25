import { useState, useEffect, useRef, useCallback } from 'react';
import { addNote, updateNote, deleteNote } from '@/lib/store';
import { PlusIcon, ChevronLeftIcon, TrashIcon, NoteIcon, EditIcon } from './Icons';
import type { Note } from '@/lib/types';

interface Props {
  notes: Note[];
}

// ─── WYSIWYG Editor Component ───
function RichTextEditor({ initialContent, onChange }: { initialContent: string; onChange: (html: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialContent) {
      editorRef.current.innerHTML = initialContent || '';
    }
  }, [initialContent]);

  const handleInput = () => {
    if (!isComposing.current && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Enter inside lists - browser handles bullet continuation natively with contentEditable + execCommand lists
    if (e.key === 'Tab') {
      e.preventDefault();
      execCmd('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
    // Keyboard shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'b': e.preventDefault(); execCmd('bold'); break;
        case 'i': e.preventDefault(); execCmd('italic'); break;
        case 'u': e.preventDefault(); execCmd('underline'); break;
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex gap-1 flex-wrap p-1.5 rounded-[14px] bg-[var(--surface)] border border-[var(--surface-border)] sticky top-0 z-10">
        <ToolButton label="B" extra="font-bold" onClick={() => execCmd('bold')} />
        <ToolButton label="I" extra="italic" onClick={() => execCmd('italic')} />
        <ToolButton label="U" extra="underline" onClick={() => execCmd('underline')} />
        <ToolButton label="S" extra="line-through" onClick={() => execCmd('strikeThrough')} />
        <div className="w-px h-6 bg-[var(--surface-border)] mx-0.5 self-center" />
        <ToolButton label="• List" extra="" onClick={() => execCmd('insertUnorderedList')} />
        <ToolButton label="1. List" extra="" onClick={() => execCmd('insertOrderedList')} />
        <div className="w-px h-6 bg-[var(--surface-border)] mx-0.5 self-center" />
        <ToolButton label="H1" extra="text-[10px]" onClick={() => execCmd('formatBlock', 'h2')} />
        <ToolButton label="H2" extra="text-[10px]" onClick={() => execCmd('formatBlock', 'h3')} />
        <ToolButton label="¶" extra="" onClick={() => execCmd('formatBlock', 'p')} />
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[320px] p-4 rounded-[14px] bg-[var(--surface)] border border-[var(--surface-border)] text-sm text-[var(--text-primary)] leading-relaxed outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] transition-all prose-editor"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => { isComposing.current = false; handleInput(); }}
        suppressContentEditableWarning
        data-placeholder="Start writing…"
      />
    </div>
  );
}

function ToolButton({ label, extra, onClick }: { label: string; extra: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`px-2.5 py-1.5 rounded-[10px] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition active:scale-95 ${extra}`}
    >
      {label}
    </button>
  );
}

// ─── View mode renderer ───
function NoteViewer({ html }: { html: string }) {
  if (!html || html === '<br>' || html.trim() === '') {
    return <p className="text-sm text-[var(--text-tertiary)] italic">Empty note</p>;
  }
  return (
    <div
      className="prose-editor text-sm text-[var(--text-primary)] leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── Main NotesTab ───
export function NotesTab({ notes }: Props) {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
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
    setSelectedNote(note);
    setTitle(note.title);
    setBody(note.body);
    setIsEditing(true);
  };

  const handleSelectNote = (note: Note) => {
    if (selectedNote && isEditing) {
      updateNote(selectedNote.id, { title, body });
    }
    setSelectedNote(note);
    setTitle(note.title);
    setBody(note.body);
    setIsEditing(false);
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    if (selectedNote?.id === id) {
      setSelectedNote(null);
      setTitle('');
      setBody('');
      setIsEditing(false);
    }
  };

  const handleBack = () => {
    if (isEditing && selectedNote) {
      updateNote(selectedNote.id, { title, body });
    }
    setSelectedNote(null);
    setIsEditing(false);
  };

  const doAutosave = useCallback(() => {
    if (selectedNote && isEditing) {
      updateNote(selectedNote.id, { title, body });
    }
  }, [selectedNote, isEditing, title, body]);

  useEffect(() => {
    if (!isEditing) return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(doAutosave, 1000);
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
    };
  }, [title, body, doAutosave, isEditing]);

  const sortedNotes = [...notes].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  // ─── View / Edit Mode for a selected note ───
  if (selectedNote) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <button onClick={handleBack}
            className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
            <ChevronLeftIcon size={16} />
            Back
          </button>
          <div className="flex items-center gap-2">
            {isEditing && (
              <span className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Auto-saving
              </span>
            )}
            <button
              onClick={() => {
                if (isEditing) {
                  doAutosave();
                  setIsEditing(false);
                } else {
                  setIsEditing(true);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all ${
                isEditing
                  ? 'bg-green-500/10 text-green-600 border border-green-500/30'
                  : 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30'
              }`}
            >
              <EditIcon size={12} />
              {isEditing ? 'Done' : 'Edit'}
            </button>
          </div>
        </div>

        {isEditing ? (
          <>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Note title"
              className="input-field text-lg font-semibold"
              style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
            />
            <RichTextEditor initialContent={body} onChange={setBody} />
          </>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
              {title || 'Untitled'}
            </h2>
            <p className="text-[10px] font-medium text-[var(--text-tertiary)]">
              Last edited {new Date(selectedNote.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="card p-5">
              <NoteViewer html={body} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Notes List ───
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
        {sortedNotes.map(note => {
          const preview = note.body
            ? note.body.replace(/<[^>]*>/g, '').slice(0, 120) || 'Empty note'
            : 'Empty note';
          return (
            <div key={note.id} className="group card-sm p-4 cursor-pointer" onClick={() => handleSelectNote(note)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
                    {note.title}
                  </h4>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1.5 line-clamp-2 leading-relaxed">{preview}</p>
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
          );
        })}
      </div>
    </div>
  );
}
