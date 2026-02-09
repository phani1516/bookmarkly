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
import type { Tab } from '@/lib/types';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'web', label: 'Web', icon: '🌐' },
  { id: 'videos', label: 'Videos', icon: '🎬' },
  { id: 'documents', label: 'Docs', icon: '📄' },
  { id: 'notes', label: 'Notes', icon: '📝' },
];

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { links, categories, notes } = useStore();
  const { theme, toggleTheme } = useTheme();
  const { user, signInWithGoogle, signInWithEmail, signOut } = useAuth();

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeTab links={links} categories={categories} />;
      case 'web': return <WebTab links={links} categories={categories} />;
      case 'videos': return <VideosTab links={links} categories={categories} />;
      case 'documents': return <DocumentsTab links={links} categories={categories} />;
      case 'notes': return <NotesTab notes={notes} />;
    }
  };

  const tabTitle = activeTab === 'home' ? 'MindCache' : activeTab === 'web' ? 'Web Links' : activeTab === 'videos' ? 'Videos' : activeTab === 'documents' ? 'Documents' : 'Notes';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200 dark:border-white/10">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 transition"
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gray-700 dark:text-gray-300">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{tabTitle}</h1>
          <div className="w-10" /> {/* spacer */}
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        toggleTheme={toggleTheme}
        user={user}
        onSignInGoogle={signInWithGoogle}
        onSignInEmail={signInWithEmail}
        onSignOut={signOut}
      />

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {renderTab()}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/10">
        <div className="max-w-lg mx-auto flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-2 transition ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'}`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
