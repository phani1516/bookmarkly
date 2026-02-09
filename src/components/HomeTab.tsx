import { LinkInput } from './LinkInput';
import { LinkItem } from './LinkItem';
import { addLink } from '@/lib/store';
import type { Link, Category } from '@/lib/types';

interface Props {
  links: Link[];
  categories: Category[];
}

export function HomeTab({ links, categories }: Props) {
  const handleSave = async (url: string, categoryId: string | null) => {
    const cat = categoryId ? categories.find(c => c.id === categoryId) : null;
    const type = cat?.type || 'Web';
    const subtype = cat?.subtype || 'None';
    await addLink(url, type, subtype, categoryId);
  };

  const recentLinks = [...links].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);
  const webCount = links.filter(l => l.type === 'Web').length;
  const videoCount = links.filter(l => l.type === 'Video').length;
  const docCount = links.filter(l => l.type === 'Document').length;

  return (
    <div className="space-y-6">
      {/* Quick capture */}
      <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 shadow-lg">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Quick Capture</h3>
        <LinkInput categories={categories} onSave={handleSave} type="Web" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Web', count: webCount, emoji: '🌐' },
          { label: 'Videos', count: videoCount, emoji: '🎬' },
          { label: 'Docs', count: docCount, emoji: '📄' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-lg border border-gray-200 dark:border-white/10 text-center">
            <div className="text-2xl mb-1">{s.emoji}</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{s.count}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent links */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Recent</h3>
        <div className="space-y-2">
          {recentLinks.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No links saved yet. Start capturing!</p>
          )}
          {recentLinks.map(link => (
            <LinkItem
              key={link.id}
              link={link}
              categories={categories}
              categoryName={categories.find(c => c.id === link.category_id)?.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
