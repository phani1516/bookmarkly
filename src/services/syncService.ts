// src/services/dataService.ts
import { supabase } from '../lib/supabase';

// ============ CATEGORIES ============

export const fetchCategories = async (userId: string) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
  return data || [];
};

export const upsertCategory = async (category: {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  user_id: string;
}) => {
  const { data, error } = await supabase
    .from('categories')
    .upsert(
      {
        id: category.id,
        name: category.name,
        type: category.type,
        subtype: category.subtype || 'None',
        user_id: category.user_id,
        updated_at: new Date().toISOString(),
        is_deleted: false,
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting category:', error);
    throw error;
  }
  return data;
};

export const deleteCategory = async (categoryId: string) => {
  // Soft delete
  const { error } = await supabase
    .from('categories')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', categoryId);

  if (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// ============ LINKS ============

export const fetchLinks = async (userId: string) => {
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching links:', error);
    throw error;
  }
  return data || [];
};

export const upsertLink = async (link: {
  id: string;
  url: string;
  name?: string;
  type: string;
  subtype?: string;
  category_id?: string | null;
  user_id: string;
  file_name?: string | null;
  file_url?: string | null;
  notes?: string;
}) => {
  const { data, error } = await supabase
    .from('links')
    .upsert(
      {
        id: link.id,
        url: link.url,
        name: link.name || '',
        type: link.type,
        subtype: link.subtype || 'None',
        category_id: link.category_id || null,
        user_id: link.user_id,
        file_name: link.file_name || null,
        file_url: link.file_url || null,
        notes: link.notes || '',
        updated_at: new Date().toISOString(),
        is_deleted: false,
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting link:', error);
    throw error;
  }
  return data;
};

export const deleteLink = async (linkId: string) => {
  const { error } = await supabase
    .from('links')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', linkId);

  if (error) {
    console.error('Error deleting link:', error);
    throw error;
  }
};

// ============ NOTES ============

export const fetchNotes = async (userId: string) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
  return data || [];
};

export const upsertNote = async (note: {
  id: string;
  title: string;
  body?: string;
  user_id: string;
}) => {
  const { data, error } = await supabase
    .from('notes')
    .upsert(
      {
        id: note.id,
        title: note.title,
        body: note.body || '',
        user_id: note.user_id,
        updated_at: new Date().toISOString(),
        is_deleted: false,
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting note:', error);
    throw error;
  }
  return data;
};

export const deleteNote = async (noteId: string) => {
  const { error } = await supabase
    .from('notes')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', noteId);

  if (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};