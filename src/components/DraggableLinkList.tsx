import { LinkItem } from './LinkItem';
import type { Link, Category } from '@/lib/types';

interface Props {
  links: Link[];
  categories: Category[];
  getBreadcrumb: (link: Link) => { text: string; color: string };
}

export function DraggableLinkList({ links, categories, getBreadcrumb }: Props) {
  // Sort: pinned first, then newest-to-oldest by created_at
  const sorted = [...links].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-2">
      {sorted.map(link => {
        const bc = getBreadcrumb(link);
        return (
          <div key={link.id} className="animate-slide-up">
            <LinkItem
              link={link}
              categories={categories}
              breadcrumb={bc.text}
              breadcrumbColor={bc.color}
            />
          </div>
        );
      })}
    </div>
  );
}
