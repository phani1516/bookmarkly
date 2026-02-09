import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
import type { Category, Link, Note, LinkType, LinkSubtype } from './types';

const LINKS_KEY = 'bookmarkly_links';
const CATEGORIES_KEY = 'bookmarkly_categories';
const NOTES_KEY = 'bookmarkly_notes';

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

// ─── Listener/Subscription Pattern ───
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function notify() {
  listeners.forEach(fn => fn());
}

// ─── Auth Helper ───
async function getUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

// ─── Categories ───
export function getCategories(): Category[] {
  return loadLocal<Category>(CATEGORIES_KEY).filter(c => !c.is_deleted);
}

export async function addCategory(name: string, type: LinkType, subtype: LinkSubtype = 'None'): Promise<Category> {
  const now = new Date().toISOString();
  const userId = await getUserId();
  const cat: Category = {
    id: uuidv4(), name, type, subtype,
    created_at: now, updated_at: now, is_deleted: false,
    user_id: userId || undefined,
  };
  const all = loadLocal<Category>(CATEGORIES_KEY);
  all.push(cat);
  saveLocal(CATEGORIES_KEY, all);
  notify();
  syncCategoryToCloud(cat);
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
    syncCategoryToCloud(all[idx]);
  }
}

async function syncCategoryToCloud(cat: Category) {
  const userId = await getUserId();
  if (!userId) return;
  try {
    const { error } = await supabase.from('categories').upsert({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      subtype: cat.subtype,
      created_at: cat.created_at,
      updated_at: cat.updated_at,
      is_deleted: cat.is_deleted,
      user_id: userId,
    });
    if (error) console.warn('Sync category error:', error.message);
  } catch (e) {
    console.warn('Sync category network error:', e);
  }
}

// ─── Links ───
export function getLinks(): Link[] {
  return loadLocal<Link>(LINKS_KEY).filter(l => !l.is_deleted);
}

export async function addLink(
  url: string,
  type: LinkType,
  subtype: LinkSubtype,
  categoryId: string | null,
  name?: string,
  fileName?: string,
  fileData?: string,
  fileUrl?: string,
): Promise<Link> {
  const now = new Date().toISOString();
  const userId = await getUserId();
  const link: Link = {
    id: uuidv4(), url, name: name || '', type, subtype,
    category_id: categoryId,
    created_at: now, updated_at: now, is_deleted: false,
    file_name: fileName, file_data: fileData, file_url: fileUrl,
    notes: '', user_id: userId || undefined,
  };
  const all = loadLocal<Link>(LINKS_KEY);
  all.push(link);
  saveLocal(LINKS_KEY, all);
  notify();
  syncLinkToCloud(link);
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
    syncLinkToCloud(all[idx]);
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
    syncLinkToCloud(all[idx]);
  }
}

async function syncLinkToCloud(link: Link) {
  const userId = await getUserId();
  if (!userId) return;
  try {
    const { error } = await supabase.from('links').upsert({
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
      file_url: link.file_url || null,
      notes: link.notes || '',
      user_id: userId,
    });
    if (error) console.warn('Sync link error:', error.message);
  } catch (e) {
    console.warn('Sync link network error:', e);
  }
}

// ─── Notes ───
export function getNotes(): Note[] {
  return loadLocal<Note>(NOTES_KEY).filter(n => !n.is_deleted);
}

export async function addNote(title: string, body: string = ''): Promise<Note> {
  const now = new Date().toISOString();
  const userId = await getUserId();
  const note: Note = {
    id: uuidv4(), title, body,
    created_at: now, updated_at: now, is_deleted: false,
    user_id: userId || undefined,
  };
  const all = loadLocal<Note>(NOTES_KEY);
  all.push(note);
  saveLocal(NOTES_KEY, all);
  notify();
  syncNoteToCloud(note);
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
    syncNoteToCloud(all[idx]);
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
    syncNoteToCloud(all[idx]);
  }
}

async function syncNoteToCloud(note: Note) {
  const userId = await getUserId();
  if (!userId) return;
  try {
    const { error } = await supabase.from('notes').upsert({
      id: note.id,
      title: note.title,
      body: note.body,
      created_at: note.created_at,
      updated_at: note.updated_at,
      is_deleted: note.is_deleted,
      user_id: userId,
    });
    if (error) console.warn('Sync note error:', error.message);
  } catch (e) {
    console.warn('Sync note network error:', e);
  }
}

// ─── File Upload to Supabase Storage ───
export async function uploadFileToStorage(file: File): Promise<{ url: string; path: string } | null> {
  const userId = await getUserId();
  if (!userId) return null;
  
  const ext = file.name.split('.').pop() || 'bin';
  const filePath = `${userId}/${uuidv4()}.${ext}`;
  
  try {
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Upload error:', uploadError.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, path: filePath };
  } catch (e) {
    console.warn('Upload network error:', e);
    return null;
  }
}

// ─── Full Sync (Pull + Push) ───
export async function pullFromSupabase(): Promise<{ success: boolean; error?: string }> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  try {
    // Pull categories
    const { data: remoteCats, error: catErr } = await supabase
      .from('categories').select('*').eq('user_id', userId);
    if (catErr) throw new Error(`Categories: ${catErr.message}`);

    // Pull links
    const { data: remoteLinks, error: linkErr } = await supabase
      .from('links').select('*').eq('user_id', userId);
    if (linkErr) throw new Error(`Links: ${linkErr.message}`);

    // Pull notes
    const { data: remoteNotes, error: noteErr } = await supabase
      .from('notes').select('*').eq('user_id', userId);
    if (noteErr) throw new Error(`Notes: ${noteErr.message}`);

    // Merge with local data (remote wins on conflict via updated_at)
    const localCats = loadLocal<Category>(CATEGORIES_KEY);
    const mergedCats = mergeArrays(localCats, (remoteCats || []) as Category[]);
    saveLocal(CATEGORIES_KEY, mergedCats);

    const localLinks = loadLocal<Link>(LINKS_KEY);
    const mergedLinks = mergeArrays(localLinks, (remoteLinks || []) as Link[]);
    saveLocal(LINKS_KEY, mergedLinks);

    const localNotes = loadLocal<Note>(NOTES_KEY);
    const mergedNotes = mergeArrays(localNotes, (remoteNotes || []) as Note[]);
    saveLocal(NOTES_KEY, mergedNotes);

    notify();

    // Push all local-only items back to cloud
    for (const cat of mergedCats) {
      await syncCategoryToCloud({ ...cat, user_id: userId });
    }
    for (const link of mergedLinks) {
      await syncLinkToCloud({ ...link, user_id: userId });
    }
    for (const note of mergedNotes) {
      await syncNoteToCloud({ ...note, user_id: userId });
    }

    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Sync pull error:', e);
    return { success: false, error: msg };
  }
}

function mergeArrays<T extends { id: string; updated_at: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of local) map.set(item.id, item);
  for (const item of remote) {
    const existing = map.get(item.id);
    if (!existing || new Date(item.updated_at) >= new Date(existing.updated_at)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}
