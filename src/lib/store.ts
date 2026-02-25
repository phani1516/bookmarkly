import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
import type { Category, Link, Note, LinkType, LinkSubtype, CommunityPost } from './types';

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
function setSyncStatus(s: SyncStatus) { syncStatus = s; notify(); }

// ─── User ID Cache ───
let cachedUserId: string | null = null;
export function getUserId(): string | null { return cachedUserId; }

supabase.auth.onAuthStateChange((_event, session) => {
  const prevUserId = cachedUserId;
  cachedUserId = session?.user?.id ?? null;
  if (cachedUserId && !prevUserId) {
    setTimeout(() => { pullFromCloud().catch(console.error); }, 500);
  }
  if (!cachedUserId && prevUserId) {
    localStorage.removeItem(LINKS_KEY);
    localStorage.removeItem(CATEGORIES_KEY);
    localStorage.removeItem(NOTES_KEY);
    notify();
  }
});

supabase.auth.getSession().then(({ data }) => {
  cachedUserId = data.session?.user?.id ?? null;
});

// ─── Local Storage ───
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
    if (key === LINKS_KEY) {
      const cleaned = (data as unknown as Link[]).map(l => ({ ...l, file_data: undefined }));
      localStorage.setItem(key, JSON.stringify(cleaned));
    } else {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) { console.error(`[Store] localStorage failed for ${key}:`, e); }
}

// ─── Supabase Upserts ───
async function upsertCategory(cat: Category, userId: string): Promise<boolean> {
  const { error } = await supabase.from('categories').upsert({
    id: cat.id, name: cat.name, type: cat.type, subtype: cat.subtype,
    color: cat.color || null, position: cat.position ?? 0,
    is_pinned: cat.is_pinned ?? false,
    created_at: cat.created_at, updated_at: cat.updated_at,
    is_deleted: cat.is_deleted, user_id: userId,
  }, { onConflict: 'id' });
  if (error) { console.error('[Store] Cat upsert fail:', error.message); return false; }
  return true;
}

async function upsertLink(link: Link, userId: string): Promise<boolean> {
  const { error } = await supabase.from('links').upsert({
    id: link.id, url: link.url, name: link.name || '', type: link.type,
    subtype: link.subtype, category_id: link.category_id,
    position: link.position ?? 0, is_pinned: link.is_pinned ?? false,
    created_at: link.created_at, updated_at: link.updated_at,
    is_deleted: link.is_deleted, file_name: link.file_name || null,
    file_url: link.file_url || null, notes: link.notes || '',
    user_id: userId,
  }, { onConflict: 'id' });
  if (error) { console.error('[Store] Link upsert fail:', error.message); return false; }
  return true;
}

async function upsertNote(note: Note, userId: string): Promise<boolean> {
  const { error } = await supabase.from('notes').upsert({
    id: note.id, title: note.title, body: note.body,
    created_at: note.created_at, updated_at: note.updated_at,
    is_deleted: note.is_deleted, user_id: userId,
  }, { onConflict: 'id' });
  if (error) { console.error('[Store] Note upsert fail:', error.message); return false; }
  return true;
}

// ─── CATEGORIES ───
export function getCategories(): Category[] {
  return loadLocal<Category>(CATEGORIES_KEY)
    .filter(c => !c.is_deleted)
    .map(c => ({ ...c, is_pinned: c.is_pinned ?? false }));
}

export async function addCategory(name: string, type: LinkType, subtype: LinkSubtype = 'None', color?: string): Promise<Category> {
  const now = new Date().toISOString();
  const userId = getUserId();
  const existing = getCategories().filter(c => c.type === type && c.subtype === subtype);
  const maxPos = existing.length > 0 ? Math.max(...existing.map(c => c.position ?? 0)) : -1;

  const cat: Category = {
    id: uuidv4(), name, type, subtype, color: color || undefined,
    position: maxPos + 1, is_pinned: false,
    created_at: now, updated_at: now, is_deleted: false,
    user_id: userId || undefined,
  };
  const all = loadLocal<Category>(CATEGORIES_KEY);
  all.push(cat);
  saveLocal(CATEGORIES_KEY, all);
  notify();
  if (userId) { await upsertCategory(cat, userId); }
  return cat;
}

export async function updateCategory(id: string, updates: Partial<Pick<Category, 'name' | 'color' | 'position' | 'is_pinned'>>) {
  const all = loadLocal<Category>(CATEGORIES_KEY);
  const idx = all.findIndex(c => c.id === id);
  if (idx < 0) return;
  if (updates.name !== undefined) all[idx].name = updates.name;
  if (updates.color !== undefined) all[idx].color = updates.color;
  if (updates.position !== undefined) all[idx].position = updates.position;
  if (updates.is_pinned !== undefined) all[idx].is_pinned = updates.is_pinned;
  all[idx].updated_at = new Date().toISOString();
  saveLocal(CATEGORIES_KEY, all);
  notify();
  const userId = getUserId();
  if (userId) { await upsertCategory(all[idx], userId); }
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
  if (userId) { await upsertCategory(all[idx], userId); }
}

export async function reorderCategories(orderedIds: string[], _type: LinkType, _subtype: LinkSubtype) {
  const all = loadLocal<Category>(CATEGORIES_KEY);
  const userId = getUserId();
  const toUpdate: Category[] = [];
  orderedIds.forEach((id, index) => {
    const ai = all.findIndex(c => c.id === id);
    if (ai >= 0) {
      all[ai].position = index;
      all[ai].updated_at = new Date().toISOString();
      toUpdate.push(all[ai]);
    }
  });
  saveLocal(CATEGORIES_KEY, all);
  notify();
  if (userId) {
    for (const cat of toUpdate) {
      await upsertCategory(cat, userId);
    }
  }
}

// ─── LINKS ───
export function getLinks(): Link[] {
  return loadLocal<Link>(LINKS_KEY)
    .filter(l => !l.is_deleted)
    .map(l => ({ ...l, is_pinned: l.is_pinned ?? false }));
}

export async function addLink(
  url: string, type: LinkType, subtype: LinkSubtype,
  categoryId: string | null, name?: string, fileName?: string,
  _fileData?: string, fileUrl?: string,
): Promise<Link> {
  const now = new Date().toISOString();
  const userId = getUserId();

  const link: Link = {
    id: uuidv4(), url, name: name || '', type, subtype,
    category_id: categoryId, position: 0, is_pinned: false,
    created_at: now, updated_at: now, is_deleted: false,
    file_name: fileName, file_url: fileUrl, notes: '',
    user_id: userId || undefined,
  };
  const all = loadLocal<Link>(LINKS_KEY);
  all.push(link);
  saveLocal(LINKS_KEY, all);
  notify();
  if (userId) { await upsertLink(link, userId); }
  return link;
}

export async function updateLink(id: string, updates: Partial<Pick<Link, 'url' | 'name' | 'category_id' | 'notes' | 'position' | 'is_pinned'>>) {
  const all = loadLocal<Link>(LINKS_KEY);
  const idx = all.findIndex(l => l.id === id);
  if (idx < 0) return;
  if (updates.url !== undefined) all[idx].url = updates.url;
  if (updates.name !== undefined) all[idx].name = updates.name;
  if (updates.category_id !== undefined) all[idx].category_id = updates.category_id;
  if (updates.notes !== undefined) all[idx].notes = updates.notes;
  if (updates.position !== undefined) all[idx].position = updates.position;
  if (updates.is_pinned !== undefined) all[idx].is_pinned = updates.is_pinned;
  all[idx].updated_at = new Date().toISOString();
  saveLocal(LINKS_KEY, all);
  notify();
  const userId = getUserId();
  if (userId) { await upsertLink(all[idx], userId); }
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
  if (userId) { await upsertLink(all[idx], userId); }
}

export async function reorderLinks(orderedIds: string[]) {
  const all = loadLocal<Link>(LINKS_KEY);
  const userId = getUserId();
  const toUpdate: Link[] = [];
  orderedIds.forEach((id, index) => {
    const ai = all.findIndex(l => l.id === id);
    if (ai >= 0) {
      all[ai].position = index;
      all[ai].updated_at = new Date().toISOString();
      toUpdate.push(all[ai]);
    }
  });
  saveLocal(LINKS_KEY, all);
  notify();
  if (userId) {
    for (const link of toUpdate) {
      await upsertLink(link, userId);
    }
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
    created_at: now, updated_at: now, is_deleted: false,
    user_id: userId || undefined,
  };
  const all = loadLocal<Note>(NOTES_KEY);
  all.push(note);
  saveLocal(NOTES_KEY, all);
  notify();
  if (userId) { await upsertNote(note, userId); }
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
  if (userId) { await upsertNote(all[idx], userId); }
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
  if (userId) { await upsertNote(all[idx], userId); }
}

// ─── File Upload (500KB limit) ───
export async function uploadFileToStorage(file: File): Promise<{ url: string; path: string } | null> {
  const MAX_SIZE = 500 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error(`File must be under 500KB. This file is ${Math.round(file.size / 1024)}KB.`);
  }
  const userId = getUserId();
  if (!userId) return null;
  const ext = file.name.split('.').pop() || 'bin';
  const filePath = `${userId}/${uuidv4()}.${ext}`;
  try {
    const { error: uploadError } = await supabase.storage
      .from('documents').upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (uploadError) { console.error('[Upload]', uploadError.message); return null; }
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
    return { url: urlData.publicUrl, path: filePath };
  } catch (e) { console.error('[Upload] Network:', e); return null; }
}

// ─── Export to CSV ───
export function exportToCSV(): { categories: string; links: string } {
  const cats = getCategories();
  const lnks = getLinks().filter(l => l.type !== 'Document');

  const catHeader = 'id,name,type,subtype,color,position,is_pinned,created_at,updated_at';
  const catRows = cats.map(c =>
    `"${c.id}","${esc(c.name)}","${c.type}","${c.subtype}","${c.color || ''}","${c.position}","${c.is_pinned}","${c.created_at}","${c.updated_at}"`
  );

  const linkHeader = 'id,url,name,type,subtype,category_id,position,is_pinned,notes,created_at,updated_at';
  const linkRows = lnks.map(l =>
    `"${l.id}","${esc(l.url)}","${esc(l.name)}","${l.type}","${l.subtype}","${l.category_id || ''}","${l.position}","${l.is_pinned}","${esc(l.notes || '')}","${l.created_at}","${l.updated_at}"`
  );

  return {
    categories: [catHeader, ...catRows].join('\n'),
    links: [linkHeader, ...linkRows].join('\n'),
  };
}

function esc(s: string): string {
  return s.replace(/"/g, '""').replace(/\n/g, '\\n');
}

// ─── Import from CSV ───
export async function importFromCSV(csvText: string, fileType: 'categories' | 'links'): Promise<{ success: boolean; message: string }> {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return { success: false, message: 'CSV file is empty or has no data rows' };

  const header = lines[0].toLowerCase();

  if (fileType === 'categories') {
    if (!header.includes('id') || !header.includes('name') || !header.includes('type') || !header.includes('subtype')) {
      return { success: false, message: 'Invalid categories CSV. Required columns: id, name, type, subtype' };
    }
    const cols = parseCSVHeader(lines[0]);
    const now = new Date().toISOString();
    const userId = getUserId();
    let count = 0;

    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVRow(lines[i]);
      if (vals.length < cols.length) continue;
      const row = mapRow(cols, vals);
      const cat: Category = {
        id: row.id || uuidv4(),
        name: row.name || 'Imported',
        type: (row.type as LinkType) || 'Web',
        subtype: (row.subtype as LinkSubtype) || 'None',
        color: row.color || undefined,
        position: parseInt(row.position || '0') || 0,
        is_pinned: row.is_pinned === 'true',
        created_at: row.created_at || now,
        updated_at: now,
        is_deleted: false,
        user_id: userId || undefined,
      };
      const all = loadLocal<Category>(CATEGORIES_KEY);
      const existing = all.findIndex(c => c.id === cat.id);
      if (existing >= 0) { all[existing] = cat; } else { all.push(cat); }
      saveLocal(CATEGORIES_KEY, all);
      if (userId) await upsertCategory(cat, userId);
      count++;
    }
    notify();
    return { success: true, message: `Imported ${count} categories` };
  }

  if (fileType === 'links') {
    if (!header.includes('id') || !header.includes('url') || !header.includes('type')) {
      return { success: false, message: 'Invalid links CSV. Required columns: id, url, type' };
    }
    const cols = parseCSVHeader(lines[0]);
    const now = new Date().toISOString();
    const userId = getUserId();
    let count = 0;

    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVRow(lines[i]);
      if (vals.length < cols.length) continue;
      const row = mapRow(cols, vals);
      const link: Link = {
        id: row.id || uuidv4(),
        url: row.url || '',
        name: row.name || '',
        type: (row.type as LinkType) || 'Web',
        subtype: (row.subtype as LinkSubtype) || 'None',
        category_id: row.category_id || null,
        position: parseInt(row.position || '0') || 0,
        is_pinned: row.is_pinned === 'true',
        notes: (row.notes || '').replace(/\\n/g, '\n'),
        created_at: row.created_at || now,
        updated_at: now,
        is_deleted: false,
        user_id: userId || undefined,
      };
      if (!link.url) continue;
      const all = loadLocal<Link>(LINKS_KEY);
      const existing = all.findIndex(l => l.id === link.id);
      if (existing >= 0) { all[existing] = link; } else { all.push(link); }
      saveLocal(LINKS_KEY, all);
      if (userId) await upsertLink(link, userId);
      count++;
    }
    notify();
    return { success: true, message: `Imported ${count} links` };
  }

  return { success: false, message: 'Unknown file type' };
}

function parseCSVHeader(line: string): string[] {
  return line.split(',').map(s => s.trim().replace(/^"|"$/g, '').toLowerCase());
}

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function mapRow(cols: string[], vals: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  cols.forEach((col, i) => { obj[col] = (vals[i] || '').replace(/^"|"$/g, ''); });
  return obj;
}

// ─── Delete All User Data ───
export async function deleteAllUserData(): Promise<{ success: boolean; message: string }> {
  const userId = getUserId();
  if (!userId) return { success: false, message: 'Not signed in' };

  try {
    await supabase.from('links').delete().eq('user_id', userId);
    await supabase.from('categories').delete().eq('user_id', userId);
    await supabase.from('notes').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);

    try {
      await supabase.rpc('delete_user_account', { target_user_id: userId });
    } catch {
      console.warn('[Store] delete_user_account RPC not available');
    }

    await supabase.auth.signOut();
    localStorage.removeItem(LINKS_KEY);
    localStorage.removeItem(CATEGORIES_KEY);
    localStorage.removeItem(NOTES_KEY);
    localStorage.removeItem('bookmarkly_profile');
    localStorage.removeItem('bookmarkly_theme');
    notify();
    return { success: true, message: 'Account deleted' };
  } catch (e) {
    console.error('[Store] Delete account error:', e);
    return { success: false, message: 'Failed to delete account' };
  }
}

// ─── Community Posts ───
export async function getCommunityPosts(): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) { console.error('[Community]', error.message); return []; }
  return (data || []) as CommunityPost[];
}

export async function addCommunityPost(url: string, note: string, authorName: string): Promise<CommunityPost | null> {
  const userId = getUserId();
  if (!userId) return null;
  const post: CommunityPost = {
    id: uuidv4(), url, note, author_name: authorName,
    user_id: userId, created_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('community_posts').insert(post);
  if (error) { console.error('[Community] Insert fail:', error.message); return null; }
  return post;
}

export async function deleteCommunityPost(id: string): Promise<boolean> {
  const { error } = await supabase.from('community_posts').delete().eq('id', id);
  if (error) { console.error('[Community] Delete fail:', error.message); return false; }
  return true;
}

// ─── Pull From Cloud ───
export async function pullFromCloud(): Promise<SyncStatus> {
  const userId = getUserId();
  if (!userId) {
    const s: SyncStatus = { lastSync: null, status: 'error', message: 'Not signed in' };
    setSyncStatus(s);
    return s;
  }
  setSyncStatus({ ...syncStatus, status: 'syncing', message: 'Syncing...' });
  try {
    const [catRes, linkRes, noteRes] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', userId),
      supabase.from('links').select('*').eq('user_id', userId),
      supabase.from('notes').select('*').eq('user_id', userId),
    ]);
    if (catRes.error) throw new Error(`Categories: ${catRes.error.message}`);
    if (linkRes.error) throw new Error(`Links: ${linkRes.error.message}`);
    if (noteRes.error) throw new Error(`Notes: ${noteRes.error.message}`);

    const remoteCats = (catRes.data || []).map((c: Record<string, unknown>) => ({ ...c, is_pinned: (c.is_pinned as boolean) ?? false })) as Category[];
    const remoteLinks = (linkRes.data || []).map((l: Record<string, unknown>) => ({ ...l, is_pinned: (l.is_pinned as boolean) ?? false })) as Link[];
    const remoteNotes = (noteRes.data || []) as Note[];

    const localCats = loadLocal<Category>(CATEGORIES_KEY);
    const localLinks = loadLocal<Link>(LINKS_KEY);
    const localNotes = loadLocal<Note>(NOTES_KEY);

    const remoteIdsCat = new Set(remoteCats.map(c => c.id));
    const remoteIdsLink = new Set(remoteLinks.map(l => l.id));
    const remoteIdsNote = new Set(remoteNotes.map(n => n.id));

    const localOnlyCats = localCats.filter(c => !remoteIdsCat.has(c.id));
    const localOnlyLinks = localLinks.filter(l => !remoteIdsLink.has(l.id));
    const localOnlyNotes = localNotes.filter(n => !remoteIdsNote.has(n.id));

    let pushCount = 0;
    for (const cat of localOnlyCats) { if (await upsertCategory(cat, userId)) pushCount++; }
    for (const link of localOnlyLinks) { if (await upsertLink(link, userId)) pushCount++; }
    for (const note of localOnlyNotes) { if (await upsertNote(note, userId)) pushCount++; }

    saveLocal(CATEGORIES_KEY, [...remoteCats, ...localOnlyCats]);
    saveLocal(LINKS_KEY, [...remoteLinks, ...localOnlyLinks]);
    saveLocal(NOTES_KEY, [...remoteNotes, ...localOnlyNotes]);
    notify();

    const total = remoteCats.filter(c => !c.is_deleted).length +
      remoteLinks.filter(l => !l.is_deleted).length +
      remoteNotes.filter(n => !n.is_deleted).length;

    let msg = `Synced! ${total} items`;
    if (pushCount > 0) msg += `, ${pushCount} pushed`;

    const s: SyncStatus = { lastSync: new Date().toISOString(), status: 'success', message: msg };
    setSyncStatus(s);
    return s;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const s: SyncStatus = { lastSync: syncStatus.lastSync, status: 'error', message: `Sync failed: ${msg}` };
    setSyncStatus(s);
    return s;
  }
}

export const fullSync = pullFromCloud;
