import { useState, useEffect, useCallback } from 'react';
import { subscribe, getLinks, getCategories, getNotes, getSyncStatus } from '@/lib/store';
import type { Link, Category, Note } from '@/lib/types';
import type { SyncStatus } from '@/lib/store';

export function useStore() {
  const [links, setLinks] = useState<Link[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());

  const refresh = useCallback(() => {
    setLinks(getLinks());
    setCategories(getCategories());
    setNotes(getNotes());
    setSyncStatus(getSyncStatus());
  }, []);

  useEffect(() => {
    refresh();
    const unsub = subscribe(refresh);
    return unsub;
  }, [refresh]);

  return { links, categories, notes, syncStatus, refresh };
}