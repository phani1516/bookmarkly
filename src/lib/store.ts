import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
import type { Category, Link, Note, LinkType, LinkSubtype } from './types';

// ─── Storage Keys ───
const LINKS_KEY = 'bookmarkly_links';
const CATEGORIES_KEY = 'bookmarkly_categories';
const NOTES_KEY = 'bookmarkly_notes';
const SYNC_STATUS_KEY = 'bookmarkly_sync_status';

// ─── Cached user ID (avoids network calls) ───
let cachedUserId: string | null = null;

export function setCachedUserId(id: string | null) {
  cachedUserId = id;
}

export function getCachedUserId(): string | null {
  return cachedUserId;
}

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
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage save error:', e);
  }
}

// ─── Listener/Subscription Pattern ───
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function notify() {
  listeners.forEach(fn => {
    try { fn(); } catch (e) { console.error('Listener error:', e); }
  });
}

// ─── Sync Status ───
export type SyncStatusType = 'idle' | 'syncing' | 'success' | 'error';
export interface SyncStatus {
  status: SyncStatusType;
  message: string;
  lastSyncAt: string | null;
}

let syncStatusListeners: Set<(s: SyncStatus) => void> = new Set();
let currentSyncStatus: SyncStatus = { status: 'idle', message: '', lastSyncAt: null };

export function subscribeSyncStatus(fn: (s: SyncStatus) => void): () => void {
  syncStatusListeners.add(fn);
  return () => { syncStatusListeners.delete(fn); };
}

export function getSyncStatus(): SyncStatus {
  return currentSyncStatus;
}

function setSyncStatus(status: SyncStatusType, message: string) {
  currentSyncStatus = {
    status,
    message,
    lastSyncAt: status === 'success' ? new Date().toISOString() : currentSyncStatus.lastSyncAt,
  };
  if (status === 'success' || status === 'error') {
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(currentSyncStatus));
  }
  syncStatusListeners.forEach(fn => fn(currentSyncStatus));
}

// Restore last sync status from localStorage
try {
  const stored = localStorage.getItem(SYNC_STATUS_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    currentSyncStatus = { ...parsed, status: 'idle' };
  }
} catch { /* ignore */ }

// ─── CATEGORIES ───
export function getCategories(): Category[] {
  return loadLocal<Category>(CATEGORIES_KEY).filter(c => !c.is_deleted);
}

export function getAllCategories(): Category[] {
  return loadLocal<Category>(CATEGORIES_KEY);
}

export function addCategory(name: string, type: LinkType, subtype: LinkSubtype = 'None'): Category {
  const now = new Date().toISOString();
  const cat: Category = {
    id: uuidv4(), name, type, subtype,
    created_at: now, updated_at: now, is_deleted: false,
    user_id: cachedUserId || undefined,
  };
  const all = loadLocal<Category>(CATEGORIES_KEY);
  all.push(cat);
  saveLocal(CATEGORIES_KEY, all);
  notify();
  // Fire and forget cloud sync
  syncSingleCategory(cat);
  return cat;
}

export function deleteCategory(id: string) {
  const all = loadLocal<Category>(CATEGORIES_KEY);
  const idx = all.findIndex(c => c.id === id);
  if (idx >= 0) {
    all[idx].is_deleted = true;
    all[idx].updated_at = new Date().toISOString();
    saveLocal(CATEGORIES_KEY, all);
    notify();
    syncSingleCategory(all[idx]);
  }
}

// ─── LINKS ───
export function getLinks(): Link[] {
  return loadLocal<Link>(LINKS_KEY).filter(l => !l.is_deleted);
}

export function getAllLinks(): Link[] {
  return loadLocal<Link>(LINKS_KEY);
}

export function addLink(
  url: string,
  type: LinkType,
  subtype: LinkSubtype,
  categoryId: string | null,
  name?: string,
  fileName?: string,
  fileData?: string,
  fileUrl?: string,
): Link {
  const now = new Date().toISOString();
  const link: Link = {
    id: uuidv4(), url, name: name || '', type, subtype,
    category_id: categoryId,
    created_at: now, updated_at: now, is_deleted: false,
    file_name: fileName, file_data: fileData, file_url: fileUrl,
    notes: '', user_id: cachedUserId || undefined,
  };
  const all = loadLocal<Link>(LINKS_KEY);
  all.push(link);
  saveLocal(LINKS_KEY, all);
  notify();
  syncSingleLink(link);
  return link;
}

export function updateLink(id: string, updates: Partial<Pick<Link, 'url' | 'name' | 'category_id' | 'notes'>>) {
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
    syncSingleLink(all[idx]);
  }
}

export function deleteLink(id: string) {
  const all = loadLocal<Link>(LINKS_KEY);
  const idx = all.findIndex(l => l.id === id);
  if (idx >= 0) {
    all[idx].is_deleted = true;
    all[idx].updated_at = new Date().toISOString();
    saveLocal(LINKS_KEY, all);
    notify();
    syncSingleLink(all[idx]);
  }
}

// ─── NOTES ───
export function getNotes(): Note[] {
  return loadLocal<Note>(NOTES_KEY).filter(n => !n.is_deleted);
}

export function getAllNotes(): Note[] {
  return loadLocal<Note>(NOTES_KEY);
}

export function addNote(title: string, body: string = ''): Note {
  const now = new Date().toISOString();
  const note: Note = {
    id: uuidv4(), title, body,
    created_at: now, updated_at: now, is_deleted: false,
    user_id: cachedUserId || undefined,
  };
  const all = loadLocal<Note>(NOTES_KEY);
  all.push(note);
  saveLocal(NOTES_KEY, all);
  notify();
  syncSingleNote(note);
  return note;
}

export function updateNote(id: string, updates: Partial<Pick<Note, 'title' | 'body'>>) {
  const all = loadLocal<Note>(NOTES_KEY);
  const idx = all.findIndex(n => n.id === id);
  if (idx >= 0) {
    if (updates.title !== undefined) all[idx].title = updates.title;
    if (updates.body !== undefined) all[idx].body = updates.body;
    all[idx].updated_at = new Date().toISOString();
    saveLocal(NOTES_KEY, all);
    notify();
    syncSingleNote(all[idx]);
  }
}

export function deleteNote(id: string) {
  const all = loadLocal<Note>(NOTES_KEY);
  const idx = all.findIndex(n => n.id === id);
  if (idx >= 0) {
    all[idx].is_deleted = true;
    all[idx].updated_at = new Date().toISOString();
    saveLocal(NOTES_KEY, all);
    notify();
    syncSingleNote(all[idx]);
  }
}

// ─── File Upload to Supabase Storage ───
export async function uploadFileToStorage(file: File): Promise<{ url: string; path: string } | null> {
  if (!cachedUserId) return null;

  const ext = file.name.split('.').pop() || 'bin';
  const filePath = `${cachedUserId}/${uuidv4()}.${ext}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

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

// ══════════════════════════════════════════════
// CLOUD SYNC — Individual item sync
// ══════════════════════════════════════════════

// Debounce queue for batching
let syncQueue: Array<{ table: string; data: Record<string, unknown> }> = [];
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function enqueueSyncItem(table: string, data: Record<string, unknown>) {
  if (!cachedUserId) return;
  // Replace existing item in queue if same id
  const existingIdx = syncQueue.findIndex(q => q.table === table && q.data.id === data.id);
  if (existingIdx >= 0) {
    syncQueue[existingIdx] = { table, data };
  } else {
    syncQueue.push({ table, data });
  }
  
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(flushSyncQueue, 500); // Batch within 500ms
}

async function flushSyncQueue() {
  if (!cachedUserId || syncQueue.length === 0) return;
  
  const batch = [...syncQueue];
  syncQueue = [];
  
  // Group by table
  const grouped: Record<string, Record<string, unknown>[]> = {};
  for (const item of batch) {
    if (!grouped[item.table]) grouped[item.table] = [];
    grouped[item.table].push({ ...item.data, user_id: cachedUserId });
  }

  for (const [table, rows] of Object.entries(grouped)) {
    try {
      const { error } = await supabase
        .from(table)
        .upsert(rows, { onConflict: 'id' });
      
      if (error) {
        console.warn(`Sync ${table} error:`, error.message, error.details);
        // Re-queue failed items
        for (const row of rows) {
          syncQueue.push({ table, data: row });
        }
      }
    } catch (e) {
      console.warn(`Sync ${table} network error:`, e);
      for (const row of rows) {
        syncQueue.push({ table, data: row });
      }
    }
  }
}

function syncSingleCategory(cat: Category) {
  if (!cachedUserId) return;
  enqueueSyncItem('categories', {
    id: cat.id,
    name: cat.name,
    type: cat.type,
    subtype: cat.subtype,
    created_at: cat.created_at,
    updated_at: cat.updated_at,
    is_deleted: cat.is_deleted,
    user_id: cachedUserId,
  });
}

function syncSingleLink(link: Link) {
  if (!cachedUserId) return;
  // Don't sync file_data (data URLs are too large for db)
  const url = link.file_url || link.url;
  enqueueSyncItem('links', {
    id: link.id,
    url: url.startsWith('data:') ? '' : url, // Don't store data URLs in cloud
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
    user_id: cachedUserId,
  });
}

function syncSingleNote(note: Note) {
  if (!cachedUserId) return;
  enqueueSyncItem('notes', {
    id: note.id,
    title: note.title,
    body: note.body,
    created_at: note.created_at,
    updated_at: note.updated_at,
    is_deleted: note.is_deleted,
    user_id: cachedUserId,
  });
}

// ══════════════════════════════════════════════
// FULL SYNC — Pull from cloud + merge + push
// ══════════════════════════════════════════════

export async function fullSync(): Promise<{ success: boolean; error?: string }> {
  if (!cachedUserId) return { success: false, error: 'Not signed in' };

  setSyncStatus('syncing', 'Pulling data from cloud…');

  try {
    // 1. Pull all remote data in parallel
    const [catResult, linkResult, noteResult] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', cachedUserId),
      supabase.from('links').select('*').eq('user_id', cachedUserId),
      supabase.from('notes').select('*').eq('user_id', cachedUserId),
    ]);

    if (catResult.error) throw new Error(`Categories: ${catResult.error.message}`);
    if (linkResult.error) throw new Error(`Links: ${linkResult.error.message}`);
    if (noteResult.error) throw new Error(`Notes: ${noteResult.error.message}`);

    const remoteCats = (catResult.data || []) as Category[];
    const remoteLinks = (linkResult.data || []) as Link[];
    const remoteNotes = (noteResult.data || []) as Note[];

    // 2. Merge with local data
    const localCats = loadLocal<Category>(CATEGORIES_KEY);
    const localLinks = loadLocal<Link>(LINKS_KEY);
    const localNotes = loadLocal<Note>(NOTES_KEY);

    const mergedCats = mergeArrays(localCats, remoteCats);
    const mergedLinks = mergeArrays(localLinks, remoteLinks);
    const mergedNotes = mergeArrays(localNotes, remoteNotes);

    // 3. Save merged data locally
    saveLocal(CATEGORIES_KEY, mergedCats);
    saveLocal(LINKS_KEY, mergedLinks);
    saveLocal(NOTES_KEY, mergedNotes);
    notify();

    // 4. Push local-only items to cloud (items that exist locally but not remotely)
    setSyncStatus('syncing', 'Pushing local data to cloud…');

    const remoteIdsCats = new Set(remoteCats.map(c => c.id));
    const remoteIdsLinks = new Set(remoteLinks.map(l => l.id));
    const remoteIdsNotes = new Set(remoteNotes.map(n => n.id));

    const localOnlyCats = mergedCats.filter(c => !remoteIdsCats.has(c.id));
    const localOnlyLinks = mergedLinks.filter(l => !remoteIdsLinks.has(l.id));
    const localOnlyNotes = mergedNotes.filter(n => !remoteIdsNotes.has(n.id));

    // Also push items where local is newer
    const updatedCats = mergedCats.filter(c => {
      const remote = remoteCats.find(r => r.id === c.id);
      return remote && new Date(c.updated_at) > new Date(remote.updated_at);
    });
    const updatedLinks = mergedLinks.filter(l => {
      const remote = remoteLinks.find(r => r.id === l.id);
      return remote && new Date(l.updated_at) > new Date(remote.updated_at);
    });
    const updatedNotes = mergedNotes.filter(n => {
      const remote = remoteNotes.find(r => r.id === n.id);
      return remote && new Date(n.updated_at) > new Date(remote.updated_at);
    });

    const catsToSync = [...localOnlyCats, ...updatedCats];
    const linksToSync = [...localOnlyLinks, ...updatedLinks];
    const notesToSync = [...localOnlyNotes, ...updatedNotes];

    // Batch upsert
    if (catsToSync.length > 0) {
      const { error } = await supabase.from('categories').upsert(
        catsToSync.map(c => ({
          id: c.id, name: c.name, type: c.type, subtype: c.subtype,
          created_at: c.created_at, updated_at: c.updated_at,
          is_deleted: c.is_deleted, user_id: cachedUserId!,
        })),
        { onConflict: 'id' }
      );
      if (error) console.warn('Push categories error:', error.message);
    }

    if (linksToSync.length > 0) {
      const { error } = await supabase.from('links').upsert(
        linksToSync.map(l => ({
          id: l.id, url: l.url.startsWith('data:') ? '' : (l.file_url || l.url),
          name: l.name || '', type: l.type, subtype: l.subtype,
          category_id: l.category_id, created_at: l.created_at,
          updated_at: l.updated_at, is_deleted: l.is_deleted,
          file_name: l.file_name || null, file_url: l.file_url || null,
          notes: l.notes || '', user_id: cachedUserId!,
        })),
        { onConflict: 'id' }
      );
      if (error) console.warn('Push links error:', error.message);
    }

    if (notesToSync.length > 0) {
      const { error } = await supabase.from('notes').upsert(
        notesToSync.map(n => ({
          id: n.id, title: n.title, body: n.body,
          created_at: n.created_at, updated_at: n.updated_at,
          is_deleted: n.is_deleted, user_id: cachedUserId!,
        })),
        { onConflict: 'id' }
      );
      if (error) console.warn('Push notes error:', error.message);
    }

    const totalSynced = catsToSync.length + linksToSync.length + notesToSync.length;
    setSyncStatus('success', 
      totalSynced > 0 
        ? `Synced ${totalSynced} item${totalSynced > 1 ? 's' : ''}` 
        : 'Everything is up to date'
    );
    return { success: true };

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Full sync error:', e);
    setSyncStatus('error', msg);
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

// ─── Auto-sync on login ───
export async function onUserLogin(userId: string) {
  cachedUserId = userId;
  // Tag all existing local items with user_id
  const allCats = loadLocal<Category>(CATEGORIES_KEY);
  const allLinks = loadLocal<Link>(LINKS_KEY);
  const allNotes = loadLocal<Note>(NOTES_KEY);
  
  let changed = false;
  for (const c of allCats) {
    if (!c.user_id) { c.user_id = userId; changed = true; }
  }
  for (const l of allLinks) {
    if (!l.user_id) { l.user_id = userId; changed = true; }
  }
  for (const n of allNotes) {
    if (!n.user_id) { n.user_id = userId; changed = true; }
  }
  
  if (changed) {
    saveLocal(CATEGORIES_KEY, allCats);
    saveLocal(LINKS_KEY, allLinks);
    saveLocal(NOTES_KEY, allNotes);
    notify();
  }
  
  // Perform full sync
  await fullSync();
}

export function onUserLogout() {
  cachedUserId = null;
  // Don't clear local data — user can still use app offline
}
