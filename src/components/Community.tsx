import { useState, useEffect, useCallback } from 'react';
import { getCommunityPosts, addCommunityPost, deleteCommunityPost, getUserId } from '@/lib/store';
import { ChevronLeftIcon, LinkExternalIcon, TrashIcon, ShareIcon } from './Icons';
import type { CommunityPost } from '@/lib/types';

interface Props {
  onBack: () => void;
  displayName: string;
  isSignedIn: boolean;
}

export function Community({ onBack, displayName, isSignedIn }: Props) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const data = await getCommunityPosts();
    setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handlePost = async () => {
    if (!url.trim()) { setError('Please enter a URL'); return; }
    if (!isSignedIn) { setError('Sign in to share links'); return; }
    setError('');
    setPosting(true);
    const post = await addCommunityPost(url.trim(), note.trim(), displayName || 'Anonymous');
    if (post) {
      setPosts(prev => [post, ...prev]);
      setUrl(''); setNote('');
    } else {
      setError('Failed to post. Try again.');
    }
    setPosting(false);
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteCommunityPost(id);
    if (ok) setPosts(prev => prev.filter(p => p.id !== id));
  };

  const currentUserId = getUserId();

  const timeAgo = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">
          <ChevronLeftIcon size={18} />
        </button>
        <h2 className="logo-text text-lg text-[var(--text-primary)]">Community</h2>
      </div>

      {/* Share input */}
      <div className="card p-5 space-y-3 animate-slide-up">
        <p className="section-title">Share a Link</p>
        <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste a URL to share…" className="input-field" />
        <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 280))} placeholder="Add a note (optional, 280 chars max)…" rows={2} className="input-field resize-none" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-tertiary)]">{note.length}/280</span>
          <button onClick={handlePost} disabled={posting || !isSignedIn} className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2 disabled:opacity-50">
            <ShareIcon size={14} /> {posting ? 'Sharing…' : 'Share'}
          </button>
        </div>
        {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
        {!isSignedIn && <p className="text-[10px] text-[var(--text-tertiary)]">Sign in to share links with the community</p>}
      </div>

      {/* Posts */}
      <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <p className="section-title px-1">Shared Links</p>
        {loading && <p className="text-sm text-[var(--text-tertiary)] text-center py-8">Loading…</p>}
        {!loading && posts.length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-sm font-medium text-[var(--text-secondary)]">No shared links yet</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Be the first to share!</p>
          </div>
        )}
        {posts.map(post => (
          <div key={post.id} className="card-sm p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <a href={post.url} target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--accent)] hover:opacity-80 transition break-all flex items-center gap-1.5">
                {post.url.length > 60 ? post.url.slice(0, 60) + '…' : post.url}
                <LinkExternalIcon size={10} className="shrink-0 opacity-60" />
              </a>
              {currentUserId === post.user_id && (
                <button onClick={() => handleDelete(post.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-500 transition shrink-0">
                  <TrashIcon size={12} />
                </button>
              )}
            </div>
            {post.note && <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{post.note}</p>}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-[var(--accent)]">{post.author_name}</span>
              <span className="text-[10px] text-[var(--text-tertiary)]">· {timeAgo(post.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}