import { LinkInput } from './LinkInput';
import { LinkItem } from './LinkItem';
import { addLink } from '@/lib/store';
import { GlobeIcon, PlayIcon, FileIcon } from './Icons';
import type { Link, Category } from '@/lib/types';

const SUBTYPE_COLORS: Record<string, string> = {
  YouTube: '#FF0000', Instagram: '#E1306C', AI: '#8B5CF6', Other: '#6B7280', None: '#3B82F6',
};

interface Props { links: Link[]; categories: Category[]; }

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

  const stats = [
    { label: 'Web', count: webCount, icon: GlobeIcon, gradient: 'from-blue-500 to-blue-600' },
    { label: 'Videos', count: videoCount, icon: PlayIcon, gradient: 'from-purple-500 to-indigo-600' },
    { label: 'Docs', count: docCount, icon: FileIcon, gradient: 'from-emerald-500 to-teal-600' },
  ];

  const getBreadcrumb = (link: Link) => {
    const cat = categories.find(c => c.id === link.category_id);
    let section = link.type === 'Web' ? 'Web' : link.type === 'Document' ? 'Docs' : link.subtype;
    const baseColor = link.type === 'Web' ? '#3B82F6' : link.type === 'Document' ? '#10B981' : SUBTYPE_COLORS[link.subtype] || '#6B7280';
    if (cat) {
      return { text: `${section} › ${cat.name}`, color: cat.color || baseColor };
    }
    return { text: section, color: baseColor };
  };

  return (
    <div className="space-y-7">
      <div className="card p-5 animate-slide-up">
        <p className="section-title mb-4">Quick Capture</p>
        <LinkInput categories={categories} onSave={handleSave} />
      </div>

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

      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <p className="section-title mb-4 px-1">Recent</p>
        <div className="space-y-2">
          {recentLinks.length === 0 && (
            <div className="card p-10 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl gradient-accent-subtle flex items-center justify-center mb-4">
                <GlobeIcon size={24} className="text-[var(--accent)]" />
              </div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">No links saved yet</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Start capturing with the input above</p>
            </div>
          )}
          {recentLinks.map(link => {
            const bc = getBreadcrumb(link);
            return (
              <LinkItem key={link.id} link={link} categories={categories}
                breadcrumb={bc.text} breadcrumbColor={bc.color}
                showMoveButtons={false} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
