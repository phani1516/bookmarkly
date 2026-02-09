import { useState } from 'react';
import { LinkInput } from './LinkInput';
import { LinkItem } from './LinkItem';
import { addLink } from '@/lib/store';
import { GlobeIcon, PlayIcon, FileIcon, CheckCircleIcon } from './Icons';
import type { Link, Category } from '@/lib/types';

interface Props {
  links: Link[];
  categories: Category[];
}

export function HomeTab({ links, categories }: Props) {
  const [saveMsg, setSaveMsg] = useState('');

  const handleSave = (url: string, categoryId: string | null) => {
    const cat = categoryId ? categories.find(c => c.id === categoryId) : null;
    const type = cat?.type || 'Web';
    const subtype = cat?.subtype || 'None';
    const link = addLink(url, type, subtype, categoryId);
    if (link) {
      setSaveMsg(`Saved: ${url.length > 40 ? url.slice(0, 40) + '…' : url}`);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const recentLinks = [...links]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);
  const webCount = links.filter(l => l.type === 'Web').length;
  const videoCount = links.filter(l => l.type === 'Video').length;
  const docCount = links.filter(l => l.type === 'Document').length;

  const stats = [
    { label: 'Web', count: webCount, icon: GlobeIcon, gradient: 'from-blue-500 to-blue-600' },
    { label: 'Videos', count: videoCount, icon: PlayIcon, gradient: 'from-purple-500 to-indigo-600' },
    { label: 'Docs', count: docCount, icon: FileIcon, gradient: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div className="space-y-7">
      {/* Quick capture */}
      <div className="card p-5 animate-slide-up">
        <p className="section-title mb-4">Quick Capture</p>
        <LinkInput categories={categories} onSave={handleSave} />

        {/* Save confirmation toast */}
        {saveMsg && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 animate-slide-up">
            <CheckCircleIcon size={14} className="text-green-500 shrink-0" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400 truncate">{saveMsg}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        {stats.map(s => (
          <div key={s.label} className="card p-4 text-center group cursor-default">
            <div className={`mx-auto w-10 h-10 rounded-[12px] bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
              <s.icon size={18} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{s.count}</div>
            <div className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent */}
      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="section-title">Recent ({links.length} total)</p>
        </div>
        <div className="space-y-2">
          {recentLinks.length === 0 && (
            <div className="card p-10 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl gradient-accent-subtle flex items-center justify-center mb-4">
                <GlobeIcon size={24} className="text-[var(--accent)]" />
              </div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">No links saved yet</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Paste a URL above and hit Save</p>
            </div>
          )}
          {recentLinks.map(link => (
            <LinkItem key={link.id} link={link} categories={categories} categoryName={categories.find(c => c.id === link.category_id)?.name} />
          ))}
        </div>
      </div>
    </div>
  );
}
