import { useState, useEffect, useCallback } from 'react';
import { subscribe, getLinks, getCategories, getNotes } from '@/lib/store';
import type { Link, Category, Note } from '@/lib/types';

export function useStore() {
  const [links, setLinks] = useState<Link[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const refresh = useCallback(() => {
    setLinks(getLinks());
    setCategories(getCategories());
    setNotes(getNotes());
  }, []);

  useEffect(() => {
    refresh();
    const unsub = subscribe(refresh);
    return unsub;
  }, [refresh]);

  return { links, categories, notes, refresh };
}
