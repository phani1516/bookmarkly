import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/hooks/useStore';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { HomeTab } from '@/components/HomeTab';
import { WebTab } from '@/components/WebTab';
import { VideosTab } from '@/components/VideosTab';
import { DocumentsTab } from '@/components/DocumentsTab';
import { NotesTab } from '@/components/NotesTab';
import { Community } from '@/components/Community';
import { SearchResults } from '@/components/SearchResults';
import { Sidebar } from '@/components/Sidebar';
import { AuthModal } from '@/components/AuthModal';
import { ProfileModal } from '@/components/ProfileModal';
import { HomeIcon, GlobeIcon, PlayIcon, FileIcon, NoteIcon, MenuIcon, BookmarkIcon, UsersIcon, SearchIcon, CloseIcon } from '@/components/Icons';
import type { Tab, Note } from '@/lib/types';

const tabs: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'web', label: 'Web', Icon: GlobeIcon },
  { id: 'videos', label: 'Videos', Icon: PlayIcon },
  { id: 'documents', label: 'Docs', Icon: FileIcon },
  { id: 'notes', label: 'Notes', Icon: NoteIcon },
];

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { links, categories, notes, syncStatus } = useStore();

  // Auto-focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const handleCloseSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleCloseSearch();
  };

  const handleSelectNoteFromSearch = (_note: Note) => {
    handleCloseSearch();
    setActiveTab('notes');
    setCommunityOpen(false);
    // NotesTab will show the note list — user can tap the note from there
  };
  const { theme, toggleTheme } = useTheme();
  const {
    user, displayName,
    signInWithGoogle, signInWithEmail, signUpWithEmail,
    sendPasswordReset, updateDisplayName,
    signOut, validatePassword,
  } = useAuth();

  const renderContent = () => {
    if (searchOpen) {
      return <SearchResults query={searchQuery} links={links} categories={categories} notes={notes} onSelectNote={handleSelectNoteFromSearch} />;
    }
    if (communityOpen) {
      return <Community onBack={() => setCommunityOpen(false)} displayName={displayName} isSignedIn={!!user} />;
    }
    switch (activeTab) {
      case 'home': return <HomeTab links={links} categories={categories} />;
      case 'web': return <WebTab links={links} categories={categories} />;
      case 'videos': return <VideosTab links={links} categories={categories} />;
      case 'documents': return <DocumentsTab links={links} categories={categories} />;
      case 'notes': return <NotesTab notes={notes} />;
    }
  };

  const tabTitles: Record<Tab, string> = {
    home: 'Bookmarkly', web: 'Web Links', videos: 'Videos', documents: 'Documents', notes: 'Notes',
  };

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--surface-border)]"
        style={{ background: theme === 'dark' ? 'rgba(10,10,15,0.85)' : 'rgba(248,249,252,0.85)', backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3.5">
          <button onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-[12px] bg-[var(--surface)] border border-[var(--surface-border)] hover:bg-[var(--surface-hover)] transition-all active:scale-95"
            aria-label="Open menu">
            <MenuIcon size={18} className="text-[var(--text-primary)]" />
          </button>

          {/* Center: Title or Search Input */}
          {searchOpen ? (
            <div className="flex-1 mx-3 relative animate-fade-in">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search bookmarks and notes…"
                className="w-full py-2 px-4 pr-9 rounded-[12px] bg-[var(--surface)] border border-[var(--surface-border)] text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] transition-all"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">
                  <CloseIcon size={14} />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              {(activeTab === 'home' && !communityOpen) && (
                <div className="w-7 h-7 rounded-[8px] gradient-accent flex items-center justify-center shadow-sm shadow-[var(--accent-glow)]">
                  <BookmarkIcon size={14} className="text-white" />
                </div>
              )}
              <h1 className="logo-text text-lg text-[var(--text-primary)]">
                {communityOpen ? 'Community' : tabTitles[activeTab]}
              </h1>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {/* Search toggle */}
            <button onClick={() => searchOpen ? handleCloseSearch() : setSearchOpen(true)}
              className={`flex items-center justify-center w-10 h-10 rounded-[12px] border transition-all active:scale-95 ${
                searchOpen
                  ? 'gradient-accent text-white border-transparent shadow-md shadow-[var(--accent-glow)]'
                  : 'bg-[var(--surface)] border-[var(--surface-border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
              }`}
              aria-label={searchOpen ? 'Close search' : 'Search'}>
              {searchOpen ? <CloseIcon size={17} /> : <SearchIcon size={17} />}
            </button>

            {/* Community */}
            <button onClick={() => { setCommunityOpen(!communityOpen); if (searchOpen) handleCloseSearch(); }}
              className={`flex items-center justify-center w-10 h-10 rounded-[12px] border transition-all active:scale-95 ${
                communityOpen
                  ? 'gradient-accent text-white border-transparent shadow-md shadow-[var(--accent-glow)]'
                  : 'bg-[var(--surface)] border-[var(--surface-border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
              }`}
              aria-label="Community">
              <UsersIcon size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen} onClose={() => setSidebarOpen(false)}
        theme={theme} toggleTheme={toggleTheme}
        user={user} displayName={displayName} syncStatus={syncStatus}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onSignOut={signOut}
        onOpenCommunity={() => { setCommunityOpen(true); setSidebarOpen(false); }}
      />

      {/* Auth Modal */}
      <AuthModal
        open={authOpen} onClose={() => setAuthOpen(false)}
        onSignInGoogle={signInWithGoogle}
        onSignInEmail={async (e, p) => { await signInWithEmail(e, p); }}
        onSignUpEmail={async (e, p, n) => { await signUpWithEmail(e, p, n); }}
        onForgotPassword={sendPasswordReset}
        validatePassword={validatePassword}
      />

      {/* Profile Modal */}
      <ProfileModal
        open={profileOpen} onClose={() => setProfileOpen(false)}
        user={user} displayName={displayName} onUpdateName={updateDisplayName}
      />

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-28">
        {renderContent()}
      </main>

      {/* Bottom navigation */}
      {!communityOpen && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--surface-border)]"
          style={{ background: theme === 'dark' ? 'rgba(10,10,15,0.92)' : 'rgba(248,249,252,0.92)', backdropFilter: 'blur(20px) saturate(180%)' }}>
          <div className="max-w-lg mx-auto flex">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setCommunityOpen(false); }}
                  className="flex-1 flex flex-col items-center py-2.5 pb-3 transition-all duration-200 relative">
                  {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full gradient-accent" />}
                  <div className={`p-1.5 rounded-[10px] transition-all duration-200 ${isActive ? 'bg-[var(--accent)]/10' : ''}`}>
                    <tab.Icon size={20}
                      className={`transition-colors duration-200 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}
                      strokeWidth={isActive ? 2.2 : 1.6} />
                  </div>
                  <span className={`text-[10px] font-semibold mt-0.5 tracking-wide transition-colors duration-200 ${
                    isActive ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                  }`}>{tab.label}</span>
                </button>
              );
            })}
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      )}
    </div>
  );
}