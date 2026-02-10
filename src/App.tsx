import { useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { HomeTab } from '@/components/HomeTab';
import { WebTab } from '@/components/WebTab';
import { VideosTab } from '@/components/VideosTab';
import { DocumentsTab } from '@/components/DocumentsTab';
import { NotesTab } from '@/components/NotesTab';
import { Sidebar } from '@/components/Sidebar';
import { AuthModal } from '@/components/AuthModal';
import { ProfileModal } from '@/components/ProfileModal';
import { HomeIcon, GlobeIcon, PlayIcon, FileIcon, NoteIcon, MenuIcon, BookmarkIcon } from '@/components/Icons';
import type { Tab } from '@/lib/types';

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
  const { links, categories, notes } = useStore();
  const { theme, toggleTheme } = useTheme();
  const {
    user, displayName,
    signInWithGoogle, signInWithEmail, signUpWithEmail,
    sendPasswordReset, updateDisplayName,
    signOut, validatePassword,
  } = useAuth();

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeTab links={links} categories={categories} />;
      case 'web': return <WebTab links={links} categories={categories} />;
      case 'videos': return <VideosTab links={links} categories={categories} />;
      case 'documents': return <DocumentsTab links={links} categories={categories} />;
      case 'notes': return <NotesTab notes={notes} />;
    }
  };

  const tabTitles: Record<Tab, string> = {
    home: 'Bookmarkly',
    web: 'Web Links',
    videos: 'Videos',
    documents: 'Documents',
    notes: 'Notes',
  };

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--surface-border)]"
        style={{ background: theme === 'dark' ? 'rgba(10,10,15,0.85)' : 'rgba(248,249,252,0.85)', backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3.5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-[12px] bg-[var(--surface)] border border-[var(--surface-border)] hover:bg-[var(--surface-hover)] transition-all active:scale-95"
            aria-label="Open menu"
          >
            <MenuIcon size={18} className="text-[var(--text-primary)]" />
          </button>

          <div className="flex items-center gap-2.5">
            {activeTab === 'home' && (
              <div className="w-7 h-7 rounded-[8px] gradient-accent flex items-center justify-center shadow-sm shadow-[var(--accent-glow)]">
                <BookmarkIcon size={14} className="text-white" />
              </div>
            )}
            <h1 className="logo-text text-lg text-[var(--text-primary)]">
              {tabTitles[activeTab]}
            </h1>
          </div>

          <div className="w-10" />
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        toggleTheme={toggleTheme}
        user={user}
        displayName={displayName}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onSignOut={signOut}
      />

      {/* Auth Modal */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSignInGoogle={signInWithGoogle}
        onSignInEmail={async (e, p) => { await signInWithEmail(e, p); }}
        onSignUpEmail={async (e, p, n) => { await signUpWithEmail(e, p, n); }}
        onForgotPassword={sendPasswordReset}
        validatePassword={validatePassword}
      />

      {/* Profile Modal */}
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        displayName={displayName}
        onUpdateName={updateDisplayName}
      />

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-28">
        {renderTab()}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--surface-border)]"
        style={{ background: theme === 'dark' ? 'rgba(10,10,15,0.92)' : 'rgba(248,249,252,0.92)', backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="max-w-lg mx-auto flex">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center py-2.5 pb-3 transition-all duration-200 relative"
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full gradient-accent" />
                )}
                <div className={`p-1.5 rounded-[10px] transition-all duration-200 ${isActive ? 'bg-[var(--accent)]/10' : ''}`}>
                  <tab.Icon
                    size={20}
                    className={`transition-colors duration-200 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}
                    strokeWidth={isActive ? 2.2 : 1.6}
                  />
                </div>
                <span className={`text-[10px] font-semibold mt-0.5 tracking-wide transition-colors duration-200 ${
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
