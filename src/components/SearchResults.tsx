import { useMemo } from 'react';
import { LinkItem } from './LinkItem';
import { deleteNote } from '@/lib/store';
import { GlobeIcon, PlayIcon, FileIcon, NoteIcon, TrashIcon, SearchIcon } from './Icons';
import type { Link, Category, Note } from '@/lib/types';

const SUBTYPE_COLORS: Record<string, string> = {
  YouTube: '#FF0000', Instagram: '#E1306C', AI: '#8B5CF6', Other: '#6B7280', None: '#3B82F6',
};

interface Props {
  query: string;
  links: Link[];
  categories: Category[];
  notes: Note[];
  onSelectNote: (note: Note) => void;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function SearchResults({ query, links, categories, notes, onSelectNote }: Props) {
  const trimmedQuery = query.trim().toLowerCase();

  const { webLinks, videoLinks, docLinks, matchedNotes } = useMemo(() => {
    if (!trimmedQuery) return { webLinks: [], videoLinks: [], docLinks: [], matchedNotes: [] };

    const matchLink = (l: Link) =>
      l.url.toLowerCase().includes(trimmedQuery) ||
      l.name.toLowerCase().includes(trimmedQuery) ||
      (l.notes || '').toLowerCase().includes(trimmedQuery) ||
      (l.file_name || '').toLowerCase().includes(trimmedQuery);

    const matchNote = (n: Note) =>
      n.title.toLowerCase().includes(trimmedQuery) ||
      n.body.replace(/<[^>]*>/g, '').toLowerCase().includes(trimmedQuery);

    const matched = links.filter(matchLink);

    return {
      webLinks: matched.filter(l => l.type === 'Web'),
      videoLinks: matched.filter(l => l.type === 'Video'),
      docLinks: matched.filter(l => l.type === 'Document'),
      matchedNotes: notes.filter(matchNote),
    };
  }, [trimmedQuery, links, notes]);

  const totalResults = webLinks.length + videoLinks.length + docLinks.length + matchedNotes.length;

  // No query yet
  if (!trimmedQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl gradient-accent-subtle flex items-center justify-center mb-5">
          <SearchIcon size={28} className="text-[var(--accent)]" />
        </div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">Search your bookmarks</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1.5">Find links and notes across all tabs</p>
      </div>
    );
  }

  // No results
  if (totalResults === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)] flex items-center justify-center mb-5">
          <SearchIcon size={28} className="text-[var(--text-tertiary)]" />
        </div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">No results found</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1.5">
          Try a different search term
        </p>
      </div>
    );
  }

  const getBreadcrumb = (link: Link) => {
    const cat = categories.find(c => c.id === link.category_id);
    if (link.type === 'Web') {
      if (!cat) return { text: 'Web', color: '#3B82F6' };
      return { text: `Web › ${cat.name}`, color: cat.color || '#3B82F6' };
    }
    if (link.type === 'Document') {
      if (!cat) return { text: 'Documents', color: '#10B981' };
      return { text: `Docs › ${cat.name}`, color: cat.color || '#10B981' };
    }
    // Video
    const baseColor = SUBTYPE_COLORS[link.subtype] || '#6B7280';
    if (!cat) return { text: link.subtype, color: baseColor };
    return { text: `${link.subtype} › ${cat.name}`, color: cat.color || baseColor };
  };

  return (
    <div className="space-y-7 animate-slide-up">
      {/* Results summary */}
      <div className="flex items-center gap-2 px-1">
        <p className="text-xs font-medium text-[var(--text-tertiary)]">
          <span className="text-[var(--text-primary)] font-semibold">{totalResults}</span> result{totalResults !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Web Links */}
      {webLinks.length > 0 && (
        <ResultSection icon={GlobeIcon} title="Web Links" count={webLinks.length} color="#3B82F6">
          {webLinks.map(link => {
            const bc = getBreadcrumb(link);
            return <LinkItem key={link.id} link={link} categories={categories} breadcrumb={bc.text} breadcrumbColor={bc.color} />;
          })}
        </ResultSection>
      )}

      {/* Video Links */}
      {videoLinks.length > 0 && (
        <ResultSection icon={PlayIcon} title="Videos" count={videoLinks.length} color="#8B5CF6">
          {videoLinks.map(link => {
            const bc = getBreadcrumb(link);
            return <LinkItem key={link.id} link={link} categories={categories} breadcrumb={bc.text} breadcrumbColor={bc.color} />;
          })}
        </ResultSection>
      )}

      {/* Document Links */}
      {docLinks.length > 0 && (
        <ResultSection icon={FileIcon} title="Documents" count={docLinks.length} color="#10B981">
          {docLinks.map(link => {
            const bc = getBreadcrumb(link);
            return <LinkItem key={link.id} link={link} categories={categories} breadcrumb={bc.text} breadcrumbColor={bc.color} />;
          })}
        </ResultSection>
      )}

      {/* Notes */}
      {matchedNotes.length > 0 && (
        <ResultSection icon={NoteIcon} title="Notes" count={matchedNotes.length} color="var(--accent)">
          {matchedNotes.map(note => {
            const preview = note.body
              ? note.body.replace(/<[^>]*>/g, '').slice(0, 120) || 'Empty note'
              : 'Empty note';
            return (
              <div key={note.id} className="group card-sm p-4 cursor-pointer" onClick={() => onSelectNote(note)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
                      {highlightMatch(note.title, query)}
                    </h4>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1.5 line-clamp-2 leading-relaxed">
                      {highlightMatch(preview, query)}
                    </p>
                    <p className="text-[10px] font-medium text-[var(--text-tertiary)] mt-2">
                      {new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                    className="p-2 rounded-xl hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </ResultSection>
      )}
    </div>
  );
}

function ResultSection({ icon: Icon, title, count, color, children }: {
  icon: React.FC<{ size?: number; className?: string }>;
  title: string;
  count: number;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3 px-1">
        <div className="w-6 h-6 rounded-[8px] flex items-center justify-center" style={{ backgroundColor: color + '18' }}>
          <Icon size={13} className="text-current" style={{ color } as React.CSSProperties} />
        </div>
        <p className="section-title" style={{ color }}>{title}</p>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: color + '15', color }}>
          {count}
        </span>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}
