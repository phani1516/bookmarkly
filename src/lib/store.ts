import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
import type { Category, Link, Note, LinkType, LinkSubtype } from './types';

const LINKS_KEY = 'mindcache_links';
const CATEGORIES_KEY = 'mindcache_categories';
const NOTES_KEY = 'mindcache_notes';

// ─── Local Storage Helpers ───
function loadLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Listeners ───
type Listener = () => void;
const listeners: Set<Listener> = new Set();
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
function notify() {
  listeners.forEach(fn => fn());
}

// ─── Auth helpers ───
async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ─── Categories ───
export function getCategories(): Category[] {
  return loadLocal<Category>(CATEGORIES_KEY).filter(c => !c.is_deleted);
}

export function getAllCategoriesIncDeleted(): Category[] {
  return loadLocal<Category>(CATEGORIES_KEY);
}

export async function addCategory(name: string, type: LinkType, subtype: LinkSubtype = 'None'): Promise<Category> {
  const now = new Date().toISOString();
  const cat: Category = {
    id: uuidv4(),
    name,
    type,
    subtype,
    created_at: now,
    updated_at: now,
    is_deleted: false,
  };
  const all = loadLocal<Category>(CATEGORIES_KEY);
  all.push(cat);
  saveLocal(CATEGORIES_KEY, all);
  notify();
  await syncCategoryToSupabase(cat);
  return cat;
}

export async function deleteCategory(id: string) {
  const all = loadLocal<Category>(CATEGORIES_KEY);
  const idx = all.findIndex(c => c.id === id);
  if (idx >= 0) {
    all[idx].is_deleted = true;
    all[idx].updated_at = new Date().toISOString();
    saveLocal(CATEGORIES_KEY, all);
    notify();
    await syncCategoryToSupabase(all[idx]);
  }
}

async function syncCategoryToSupabase(cat: Category) {
  const userId = await getUserId();
  if (!userId) return;
  try {
    await supabase.from('categories').upsert({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      subtype: cat.subtype,
      created_at: cat.created_at,
      updated_at: cat.updated_at,
      is_deleted: cat.is_deleted,
      user_id: userId,
    });
  } catch (e) {
    console.error('Sync category error', e);
  }
}

// ─── Links ───
export function getLinks(): Link[] {
  return loadLocal<Link>(LINKS_KEY).filter(l => !l.is_deleted);
}

export function getAllLinksIncDeleted(): Link[] {
  return loadLocal<Link>(LINKS_KEY);
}

export async function addLink(url: string, type: LinkType, subtype: LinkSubtype, categoryId: string | null, name?: string, fileName?: string, fileData?: string): Promise<Link> {
  const now = new Date().toISOString();
  const link: Link = {
    id: uuidv4(),
    url,
    name: name || '',
    type,
    subtype,
    category_id: categoryId,
    created_at: now,
    updated_at: now,
    is_deleted: false,
    file_name: fileName,
    file_data: fileData,
    notes: '',
  };
  const all = loadLocal<Link>(LINKS_KEY);
  all.push(link);
  saveLocal(LINKS_KEY, all);
  notify();
  await syncLinkToSupabase(link);
  return link;
}

export async function updateLink(id: string, updates: Partial<Pick<Link, 'url' | 'name' | 'category_id' | 'notes'>>) {
  const all = loadLocal<Link>(LINKS_KEY);
  const idx = all.findIndex(l => l.id === id);
  if (idx >= 0) {
    if (updates.url !== undefined) all[idx].url = updates.url;
    if (updates.name !== undefined) all[idx].name = updates.name;
    if (updates.category_id !== undefined) all[idx].category_id = updates.category_id;
    if (updates.notes !== undefined) all[idx].notes = updates.notes;
    all[idx].updated_at = new Date().toISOString();
    saveLocal(LINKS_KEY, all);
    notify();
    await syncLinkToSupabase(all[idx]);
  }
}

export async function deleteLink(id: string) {
  const all = loadLocal<Link>(LINKS_KEY);
  const idx = all.findIndex(l => l.id === id);
  if (idx >= 0) {
    all[idx].is_deleted = true;
    all[idx].updated_at = new Date().toISOString();
    saveLocal(LINKS_KEY, all);
    notify();
    await syncLinkToSupabase(all[idx]);
  }
}

async function syncLinkToSupabase(link: Link) {
  const userId = await getUserId();
  if (!userId) return;
  try {
    await supabase.from('links').upsert({
      id: link.id,
      url: link.url,
      name: link.name,
      type: link.type,
      subtype: link.subtype,
      category_id: link.category_id,
      created_at: link.created_at,
      updated_at: link.updated_at,
      is_deleted: link.is_deleted,
      file_name: link.file_name || null,
      notes: link.notes || '',
      user_id: userId,
    });
  } catch (e) {
    console.error('Sync link error', e);
  }
}

// ─── Notes ───
export function getNotes(): Note[] {
  return loadLocal<Note>(NOTES_KEY).filter(n => !n.is_deleted);
}

export async function addNote(title: string, body: string = ''): Promise<Note> {
  const now = new Date().toISOString();
  const note: Note = {
    id: uuidv4(),
    title,
    body,
    created_at: now,
    updated_at: now,
    is_deleted: false,
  };
  const all = loadLocal<Note>(NOTES_KEY);
  all.push(note);
  saveLocal(NOTES_KEY, all);
  notify();
  await syncNoteToSupabase(note);
  return note;
}

export async function updateNote(id: string, updates: Partial<Pick<Note, 'title' | 'body'>>) {
  const all = loadLocal<Note>(NOTES_KEY);
  const idx = all.findIndex(n => n.id === id);
  if (idx >= 0) {
    if (updates.title !== undefined) all[idx].title = updates.title;
    if (updates.body !== undefined) all[idx].body = updates.body;
    all[idx].updated_at = new Date().toISOString();
    saveLocal(NOTES_KEY, all);
    notify();
    await syncNoteToSupabase(all[idx]);
  }
}

export async function deleteNote(id: string) {
  const all = loadLocal<Note>(NOTES_KEY);
  const idx = all.findIndex(n => n.id === id);
  if (idx >= 0) {
    all[idx].is_deleted = true;
    all[idx].updated_at = new Date().toISOString();
    saveLocal(NOTES_KEY, all);
    notify();
    await syncNoteToSupabase(all[idx]);
  }
}

async function syncNoteToSupabase(note: Note) {
  const userId = await getUserId();
  if (!userId) return;
  try {
    await supabase.from('notes').upsert({
      id: note.id,
      title: note.title,
      body: note.body,
      created_at: note.created_at,
      updated_at: note.updated_at,
      is_deleted: note.is_deleted,
      user_id: userId,
    });
  } catch (e) {
    console.error('Sync note error', e);
  }
}

// ─── Full sync from Supabase ───
export async function pullFromSupabase(): Promise<{ success: boolean; error?: string }> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  try {
    // Pull categories
    const { data: remoteCats, error: catErr } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);
    if (catErr) throw catErr;

    // Pull links
    const { data: remoteLinks, error: linkErr } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', userId);
    if (linkErr) throw linkErr;

    // Pull notes
    const { data: remoteNotes, error: noteErr } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId);

    // Merge categories
    const localCats = loadLocal<Category>(CATEGORIES_KEY);
    const mergedCats = mergeArrays(localCats, (remoteCats || []) as Category[]);
    saveLocal(CATEGORIES_KEY, mergedCats);

    // Merge links
    const localLinks = loadLocal<Link>(LINKS_KEY);
    const mergedLinks = mergeArrays(localLinks, (remoteLinks || []) as Link[]);
    saveLocal(LINKS_KEY, mergedLinks);

    // Merge notes
    if (!noteErr && remoteNotes) {
      const localNotes = loadLocal<Note>(NOTES_KEY);
      const mergedNotes = mergeArrays(localNotes, remoteNotes as Note[]);
      saveLocal(NOTES_KEY, mergedNotes);
    }

    notify();

    // Push any local-only items back
    const finalCats = loadLocal<Category>(CATEGORIES_KEY);
    for (const cat of finalCats) {
      await syncCategoryToSupabase(cat);
    }
    const finalLinks = loadLocal<Link>(LINKS_KEY);
    for (const link of finalLinks) {
      await syncLinkToSupabase(link);
    }
    const finalNotes = loadLocal<Note>(NOTES_KEY);
    for (const note of finalNotes) {
      await syncNoteToSupabase(note);
    }

    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Pull error', e);
    return { success: false, error: msg };
  }
}

function mergeArrays<T extends { id: string; updated_at: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of local) {
    map.set(item.id, item);
  }
  for (const item of remote) {
    const existing = map.get(item.id);
    if (!existing || new Date(item.updated_at) > new Date(existing.updated_at)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}
