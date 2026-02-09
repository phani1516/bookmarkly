import { useState, useEffect, useRef, useCallback } from 'react';
import { addNote, updateNote, deleteNote } from '@/lib/store';
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
    // Save current note before switching
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

  // Autosave
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

  // Toolbar actions for the contentEditable-like textarea
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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { doAutosave(); setEditingNote(null); }}
            className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15 transition text-sm"
          >
            ← Back
          </button>
          <span className="text-xs text-gray-400 dark:text-gray-500">Auto-saving</span>
        </div>

        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Note title"
          className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-white/10 backdrop-blur border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        {/* Formatting toolbar */}
        <div className="flex gap-1 flex-wrap">
          {[
            { tag: 'bold', label: 'B', style: 'font-bold' },
            { tag: 'italic', label: 'I', style: 'italic' },
            { tag: 'underline', label: 'U', style: 'underline' },
            { tag: 'strike', label: 'S', style: 'line-through' },
            { tag: 'bullet', label: '•', style: '' },
            { tag: 'number', label: '1.', style: '' },
          ].map(f => (
            <button
              key={f.tag}
              onClick={() => applyFormat(f.tag)}
              className={`px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15 transition text-sm ${f.style}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <textarea
          id="note-body"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Start writing..."
          rows={15}
          className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-white/10 backdrop-blur border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none leading-relaxed"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</h3>
        <button onClick={() => setShowNew(!showNew)} className="text-xs text-blue-500 dark:text-blue-400 font-medium">+ New Note</button>
      </div>

      {showNew && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Note title"
            className="flex-1 px-3 py-2 rounded-xl bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            onKeyDown={e => e.key === 'Enter' && handleNewNote()}
          />
          <button onClick={handleNewNote} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition">Create</button>
        </div>
      )}

      <div className="space-y-2">
        {sortedNotes.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No notes yet. Create one!</p>
        )}
        {sortedNotes.map(note => (
          <div
            key={note.id}
            className="group p-4 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur border border-gray-100 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/10 transition cursor-pointer"
            onClick={() => handleSelectNote(note)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{note.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{note.body || 'Empty note'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(note.updated_at).toLocaleDateString()}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleDeleteNote(note.id); }}
                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
