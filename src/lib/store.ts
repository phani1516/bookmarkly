import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
import type { Category, Link, Note, LinkType, LinkSubtype } from './types';

// ─── Constants ───
const LINKS_KEY = 'bookmarkly_links';
const CATEGORIES_KEY = 'bookmarkly_categories';
const NOTES_KEY = 'bookmarkly_notes';

// ─── Listener Pattern ───
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function notify() {
  listeners.forEach(fn => { try { fn(); } catch (e) { console.error('[Store] Listener error:', e); } });
}

// ─── Sync Status ───
export interface SyncStatus {
  lastSync: string | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  message: string;
}

let syncStatus: SyncStatus = { lastSync: null, status: 'idle', message: '' };

export function getSyncStatus(): SyncStatus { return syncStatus; }

function setSyncStatus(s: SyncStatus) {
  syncStatus = s;
  notify();
}

// ─── User ID Cache ───
let cachedUserId: string | null = null;

function getUserId(): string | null {
  return cachedUserId;
}

// Listen for auth changes
supabase.auth.onAuthStateChange((_event, session) => {
  const prevUserId = cachedUserId;
  cachedUserId = session?.user?.id ?? null;

  // User just signed in - pull data from cloud
  if (cachedUserId && !prevUserId) {
    console.log('[Store] User signed in, pulling from cloud...');
    setTimeout(() => {
      pullFromCloud().then(() => {
        console.log('[Store] Initial pull complete');
      }).catch(e => {
        console.error('[Store] Initial pull failed:', e);
      });
    }, 500);
  }

  // User signed out - clear local data so next user gets clean slate
  if (!cachedUserId && prevUserId) {
    console.log('[Store] User signed out, clearing local cache');
    localStorage.removeItem(LINKS_KEY);
    localStorage.removeItem(CATEGORIES_KEY);
    localStorage.removeItem(NOTES_KEY);
    notify();
  }
});

// Initialize user ID from existing session
supabase.auth.getSession().then(({ data }) => {
  cachedUserId = data.session?.user?.id ?? null;
});

// ─── Local Storage Helpers ───
function loadLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveLocal<T>(key: string, data: T[]) {
  try {
    // Strip file_data before saving to avoid quota issues
    if (key === LINKS_KEY) {
      const cleaned = (data as unknown as Link[]).map(l => ({ ...l, file_data: undefined }));
      localStorage.setItem(key, JSON.stringify(cleaned));
    } else {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.error(`[Store] localStorage save failed for ${key}:`, e);
  }
}

// ─── Supabase Write Helpers ───
async function upsertCategory(cat: Category, userId: string): Promise<boolean> {
  const { error } = await supabase.from('categories').upsert({
    id: cat.id,
    name: cat.name,
    type: cat.type,
    subtype: cat.subtype,
    created_at: cat.created_at,
    updated_at: cat.updated_at,
    is_deleted: cat.is_deleted,
    user_id: userId,
  }, { onConflict: 'id' });

  if (error) {
    console.error('[Store] Category upsert failed:', error.message, error.hint, error.details);
    return false;
  }
  return true;
}

async function upsertLink(link: Link, userId: string): Promise<boolean> {
  const { error } = await supabase.from('links').upsert({
    id: link.id,
    url: link.url,
    name: link.name || '',
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
  }, { onConflict: 'id' });

  if (error) {
    console.error('[Store] Link upsert failed:', error.message, error.hint, error.details);
    return false;
  }
  return true;
}

async function upsertNote(note: Note, userId: string): Promise<boolean> {
  const { error } = await supabase.from('notes').upsert({
    id: note.id,
    title: note.title,
    body: note.body,
    created_at: note.created_at,
    updated_at: note.updated_at,
    is_deleted: note.is_deleted,
    user_id: userId,
  }, { onConflict: 'id' });

  if (error) {
    console.error('[Store] Note upsert failed:', error.message, error.hint, error.details);
    return false;
  }
  return true;
}

// ─── CATEGORIES ───
export function getCategories(): Category[] {
  return loadLocal<Category>(CATEGORIES_KEY).filter(c => !c.is_deleted);
}

export async function addCategory(name: string, type: LinkType, subtype: LinkSubtype = 'None'): Promise<Category> {
  const now = new Date().toISOString();
  const userId = getUserId();

  const cat: Category = {
    id: uuidv4(), name, type, subtype,
    created_at: now, updated_at: now,
    is_deleted: false,
    user_id: userId || undefined,
  };

  // Save locally
  const all = loadLocal<Category>(CATEGORIES_KEY);
  all.push(cat);
  saveLocal(CATEGORIES_KEY, all);
  notify();

  // Sync to cloud
  if (userId) {
    const ok = await upsertCategory(cat, userId);
    if (!ok) {
      setSyncStatus({ ...syncStatus, status: 'error', message: 'Failed to save category to cloud' });
    }
  }

  return cat;
}

export async function deleteCategory(id: string) {
  const all = loadLocal<Category>(CATEGORIES_KEY);
  const idx = all.findIndex(c => c.id === id);
  if (idx < 0) return;

  all[idx].is_deleted = true;
  all[idx].updated_at = new Date().toISOString();
  saveLocal(CATEGORIES_KEY, all);
  notify();

  const userId = getUserId();
  if (userId) {
    await upsertCategory(all[idx], userId);
  }
}

// ─── LINKS ───
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
  _fileData?: string,
  fileUrl?: string,
): Promise<Link> {
  const now = new Date().toISOString();
  const userId = getUserId();

  const link: Link = {
    id: uuidv4(), url, name: name || '', type, subtype,
    category_id: categoryId,
    created_at: now, updated_at: now,
    is_deleted: false,
    file_name: fileName,
    file_url: fileUrl,
    notes: '',
    user_id: userId || undefined,
  };

  // Save locally
  const all = loadLocal<Link>(LINKS_KEY);
  all.push(link);
  saveLocal(LINKS_KEY, all);
  notify();

  // Sync to cloud
  if (userId) {
    const ok = await upsertLink(link, userId);
    if (!ok) {
      setSyncStatus({ ...syncStatus, status: 'error', message: 'Failed to save link to cloud' });
    }
  }

  return link;
}

export async function updateLink(id: string, updates: Partial<Pick<Link, 'url' | 'name' | 'category_id' | 'notes'>>) {
  const all = loadLocal<Link>(LINKS_KEY);
  const idx = all.findIndex(l => l.id === id);
  if (idx < 0) return;

  if (updates.url !== undefined) all[idx].url = updates.url;
  if (updates.name !== undefined) all[idx].name = updates.name;
  if (updates.category_id !== undefined) all[idx].category_id = updates.category_id;
  if (updates.notes !== undefined) all[idx].notes = updates.notes;
  all[idx].updated_at = new Date().toISOString();
  saveLocal(LINKS_KEY, all);
  notify();

  const userId = getUserId();
  if (userId) {
    await upsertLink(all[idx], userId);
  }
}

export async function deleteLink(id: string) {
  const all = loadLocal<Link>(LINKS_KEY);
  const idx = all.findIndex(l => l.id === id);
  if (idx < 0) return;

  all[idx].is_deleted = true;
  all[idx].updated_at = new Date().toISOString();
  saveLocal(LINKS_KEY, all);
  notify();

  const userId = getUserId();
  if (userId) {
    await upsertLink(all[idx], userId);
  }
}

// ─── NOTES ───
export function getNotes(): Note[] {
  return loadLocal<Note>(NOTES_KEY).filter(n => !n.is_deleted);
}

export async function addNote(title: string, body: string = ''): Promise<Note> {
  const now = new Date().toISOString();
  const userId = getUserId();

  const note: Note = {
    id: uuidv4(), title, body,
    created_at: now, updated_at: now,
    is_deleted: false,
    user_id: userId || undefined,
  };

  const all = loadLocal<Note>(NOTES_KEY);
  all.push(note);
  saveLocal(NOTES_KEY, all);
  notify();

  if (userId) {
    await upsertNote(note, userId);
  }

  return note;
}

export async function updateNote(id: string, updates: Partial<Pick<Note, 'title' | 'body'>>) {
  const all = loadLocal<Note>(NOTES_KEY);
  const idx = all.findIndex(n => n.id === id);
  if (idx < 0) return;

  if (updates.title !== undefined) all[idx].title = updates.title;
  if (updates.body !== undefined) all[idx].body = updates.body;
  all[idx].updated_at = new Date().toISOString();
  saveLocal(NOTES_KEY, all);
  notify();

  const userId = getUserId();
  if (userId) {
    await upsertNote(all[idx], userId);
  }
}

export async function deleteNote(id: string) {
  const all = loadLocal<Note>(NOTES_KEY);
  const idx = all.findIndex(n => n.id === id);
  if (idx < 0) return;

  all[idx].is_deleted = true;
  all[idx].updated_at = new Date().toISOString();
  saveLocal(NOTES_KEY, all);
  notify();

  const userId = getUserId();
  if (userId) {
    await upsertNote(all[idx], userId);
  }
}

// ─── File Upload ───
export async function uploadFileToStorage(file: File): Promise<{ url: string; path: string } | null> {
  const userId = getUserId();
  if (!userId) return null;

  const ext = file.name.split('.').pop() || 'bin';
  const filePath = `${userId}/${uuidv4()}.${ext}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('[Upload] Error:', uploadError.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, path: filePath };
  } catch (e) {
    console.error('[Upload] Network error:', e);
    return null;
  }
}

// ─── PULL FROM CLOUD (the key function) ───
// This replaces local data with whatever is in Supabase for this user
export async function pullFromCloud(): Promise<SyncStatus> {
  const userId = getUserId();
  if (!userId) {
    const s: SyncStatus = { lastSync: null, status: 'error', message: 'Not signed in' };
    setSyncStatus(s);
    return s;
  }

  setSyncStatus({ ...syncStatus, status: 'syncing', message: 'Syncing...' });

  try {
    // Pull ALL data from Supabase for this user
    const [catRes, linkRes, noteRes] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', userId),
      supabase.from('links').select('*').eq('user_id', userId),
      supabase.from('notes').select('*').eq('user_id', userId),
    ]);

    if (catRes.error) throw new Error(`Categories: ${catRes.error.message}`);
    if (linkRes.error) throw new Error(`Links: ${linkRes.error.message}`);
    if (noteRes.error) throw new Error(`Notes: ${noteRes.error.message}`);

    const remoteCats = (catRes.data || []) as Category[];
    const remoteLinks = (linkRes.data || []) as Link[];
    const remoteNotes = (noteRes.data || []) as Note[];

    // Get local data
    const localCats = loadLocal<Category>(CATEGORIES_KEY);
    const localLinks = loadLocal<Link>(LINKS_KEY);
    const localNotes = loadLocal<Note>(NOTES_KEY);

    // Find local items that don't exist in cloud yet (need to push up)
    const remoteIdsCat = new Set(remoteCats.map(c => c.id));
    const remoteIdsLink = new Set(remoteLinks.map(l => l.id));
    const remoteIdsNote = new Set(remoteNotes.map(n => n.id));

    const localOnlyCats = localCats.filter(c => !remoteIdsCat.has(c.id));
    const localOnlyLinks = localLinks.filter(l => !remoteIdsLink.has(l.id));
    const localOnlyNotes = localNotes.filter(n => !remoteIdsNote.has(n.id));

    // Push local-only items to cloud
    let pushCount = 0;
    const pushErrors: string[] = [];

    for (const cat of localOnlyCats) {
      const ok = await upsertCategory(cat, userId);
      if (ok) pushCount++; else pushErrors.push(`Category: ${cat.name}`);
    }
    for (const link of localOnlyLinks) {
      const ok = await upsertLink(link, userId);
      if (ok) pushCount++; else pushErrors.push(`Link: ${link.url.substring(0, 30)}`);
    }
    for (const note of localOnlyNotes) {
      const ok = await upsertNote(note, userId);
      if (ok) pushCount++; else pushErrors.push(`Note: ${note.title}`);
    }

    // Merge: start with remote data, then add any local-only items
    const mergedCats = [...remoteCats, ...localOnlyCats];
    const mergedLinks = [...remoteLinks, ...localOnlyLinks];
    const mergedNotes = [...remoteNotes, ...localOnlyNotes];

    // Save merged result to localStorage
    saveLocal(CATEGORIES_KEY, mergedCats);
    saveLocal(LINKS_KEY, mergedLinks);
    saveLocal(NOTES_KEY, mergedNotes);

    notify();

    const totalItems = remoteCats.filter(c => !c.is_deleted).length +
                       remoteLinks.filter(l => !l.is_deleted).length +
                       remoteNotes.filter(n => !n.is_deleted).length;

    let msg = `Synced! ${totalItems} items from cloud`;
    if (pushCount > 0) msg += `, ${pushCount} pushed up`;
    if (pushErrors.length > 0) msg += ` (${pushErrors.length} failed)`;

    const s: SyncStatus = {
      lastSync: new Date().toISOString(),
      status: pushErrors.length > 0 ? 'error' : 'success',
      message: msg,
    };
    setSyncStatus(s);
    return s;

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[Store] Pull from cloud failed:', msg);
    const s: SyncStatus = {
      lastSync: syncStatus.lastSync,
      status: 'error',
      message: `Sync failed: ${msg}`,
    };
    setSyncStatus(s);
    return s;
  }
}

// Alias
export const fullSync = pullFromCloud;
